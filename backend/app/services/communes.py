import json
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session
from geoalchemy2.functions import ST_AsGeoJSON

from app.models.communes import Commune

# ============================================================
# 🏘️ Mapping densité (API → base)
# ============================================================

DENSITE_MAPPING = {
    "village": "Village",
    "bourg": "Bourg",
    "ville": "Ville",
    "grande ville": "Grande Ville",
    "grande_ville": "Grande Ville",
}


def get_communes_count(db: Session) -> int:
    """
    Retourne le nombre total de communes.
    """
    return db.query(Commune).count()


def get_communes_sample(db: Session, limit: int = 10):
    """
    Retourne un échantillon de communes (sans géométrie),
    utile pour tests et debug.
    """
    return (
        db.query(
            Commune.INSEE_COM,
            Commune.libgeo,
            Commune.code_departement,
            Commune.Prixm2Moyen,
            Commune.densite_cat,
            Commune.score_sante,
        )
        .limit(limit)
        .all()
    )


# ============================================================
# 🗺️ Service principal : GeoJSON + filtres + score dynamique
# ============================================================

def get_communes_geojson(
    db: Session,
    limit: Optional[int] = None,
    # filtres emplacement
    mer: Optional[bool] = None,
    montagne: Optional[bool] = None,
    rayon_km: Optional[float] = None,
    # filtre prix au m² (déjà calculé côté frontend via surface/budget)
    prix_max: Optional[float] = None,
    # filtre densité
    densite: Optional[str] = None,
    # préférence utilisateur en heures d'ensoleillement
    sun_pref: Optional[float] = None,
    # pondérations dynamiques (hors ensoleillement)
    w_sante: int = 1,
    w_mag: int = 1,
    w_asso: int = 1,
):
    """
    Retourne les communes sous forme GeoJSON,
    avec filtres combinables et score global dynamique.

    - mer/montagne + rayon_km → distance_mer_km / distance_montagne_km
    - prix_max → filtre sur Prixm2Moyen
    - densite → filtre sur densite_cat
    - sun_pref (heures/an) → influe le score d'ensoleillement
    """

    # --------------------------------------------------------
    # 🔎 Requête de base
    # --------------------------------------------------------
    query = db.query(
        Commune.INSEE_COM,
        Commune.libgeo,
        Commune.code_departement,
        Commune.Prixm2Moyen,
        Commune.densite_cat,
        Commune.score_sante,
        Commune.mag_scaled,
        Commune.asso_scaled,
        Commune.sun_scaled,
        Commune.ensoleillement_moyen_h,
        Commune.littoral_flag,
        Commune.montagne_flag,
        Commune.distance_mer_km,
        Commune.distance_montagne_km,
        ST_AsGeoJSON(Commune.geometry).label("geometry"),
    )

    # --------------------------------------------------------
    # 🗺️ Filtres emplacement (Mer / Montagne + rayon_km)
    # --------------------------------------------------------
    # On utilise les colonnes distance_mer_km et distance_montagne_km
    # Si aucun rayon n'est fourni, on n'applique pas ce type de filtre
    if rayon_km is not None and rayon_km >= 0:
        if mer:
            query = query.filter(Commune.distance_mer_km <= rayon_km)
        if montagne:
            query = query.filter(Commune.distance_montagne_km <= rayon_km)

    # --------------------------------------------------------
    # 💶 Filtre prix au m² max
    # --------------------------------------------------------
    if prix_max is not None:
        query = query.filter(Commune.Prixm2Moyen <= prix_max)

    # --------------------------------------------------------
    # 🏘️ Filtre densité
    # --------------------------------------------------------
    if densite is not None:
        densite_db = DENSITE_MAPPING.get(densite.lower())
        if densite_db:
            query = query.filter(Commune.densite_cat == densite_db)
        else:
            # densité invalide -> aucun résultat
            query = query.filter(False)

    # --------------------------------------------------------
    # ⏱️ Optionnel : limiter le nombre de communes
    # --------------------------------------------------------
    if limit is not None and limit > 0:
        rows = query.limit(limit).all()
    else:
        rows = query.all()

    # --------------------------------------------------------
    # 🌞 Préparation pour le score d'ensoleillement
    #    On récupère le min/max dans la base
    # --------------------------------------------------------
    min_sun, max_sun = db.query(
        func.min(Commune.ensoleillement_moyen_h),
        func.max(Commune.ensoleillement_moyen_h),
    ).one()

    sun_range = None
    if min_sun is not None and max_sun is not None and max_sun > min_sun:
        sun_range = (float(min_sun), float(max_sun))

    # pondération fixe max pour l'ensoleillement
    W_SUN = 3

    # --------------------------------------------------------
    # 🧮 Construction du GeoJSON + score global
    # --------------------------------------------------------
    features = []

    for r in rows:
        # ----------------------------
        # 🌞 Score d'ensoleillement
        # ----------------------------
        sun_scaled = float(r.sun_scaled) if r.sun_scaled is not None else 0.0

        if sun_pref is not None and sun_range is not None:
            min_db, max_db = sun_range
            # normalisation de la préférence utilisateur 0-1
            user_target = (float(sun_pref) - min_db) / (max_db - min_db)
            user_target = max(0.0, min(1.0, user_target))

            # plus la commune est proche de la préférence, meilleur est le score
            score_sun = 1.0 - abs(sun_scaled - user_target)
            score_sun = max(0.0, min(1.0, score_sun))
        else:
            # fallback : on prend directement le sun_scaled
            score_sun = sun_scaled

        # ----------------------------
        # ⚕️ Santé / 🛒 Magasins / 🤝 Asso
        # ----------------------------
        score_sante = float(r.score_sante) if r.score_sante is not None else None
        mag_scaled = float(r.mag_scaled) if r.mag_scaled is not None else None
        asso_scaled = float(r.asso_scaled) if r.asso_scaled is not None else None

        total_num = 0.0
        total_den = 0.0

        if score_sante is not None:
            total_num += score_sante * w_sante
            total_den += w_sante

        if mag_scaled is not None:
            total_num += mag_scaled * w_mag
            total_den += w_mag

        if asso_scaled is not None:
            total_num += asso_scaled * w_asso
            total_den += w_asso

        # Intégration de l'ensoleillement avec poids max
        total_num += score_sun * W_SUN
        total_den += W_SUN

        score_global = None
        if total_den > 0:
            score_global = round(total_num / total_den, 3)

        # ----------------------------
        # 🧩 Construction de la feature GeoJSON
        # ----------------------------
        features.append(
            {
                "type": "Feature",
                "geometry": json.loads(r.geometry) if r.geometry else None,
                "properties": {
                    "insee": r.INSEE_COM,
                    "nom": r.libgeo,
                    "departement": r.code_departement,
                    "prix_m2": r.Prixm2Moyen,
                    "densite": r.densite_cat,
                    "score_sante": r.score_sante,
                    "mag_scaled": r.mag_scaled,
                    "asso_scaled": r.asso_scaled,
                    "sun_scaled": r.sun_scaled,
                    "ensoleillement_h": r.ensoleillement_moyen_h,
                    "distance_mer_km": r.distance_mer_km,
                    "distance_montagne_km": r.distance_montagne_km,
                    "littoral_flag": r.littoral_flag,
                    "montagne_flag": r.montagne_flag,
                    "score_global": score_global,
                },
            }
        )

    return {
        "type": "FeatureCollection",
        "features": features,
    }
