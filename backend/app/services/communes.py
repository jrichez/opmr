import json
from typing import Optional
from sqlalchemy.orm import Session

from geoalchemy2.functions import (
    ST_AsGeoJSON,
    ST_DWithin,
    ST_Transform,
    ST_SetSRID,
    ST_MakePoint,
)

from app.models.communes import Commune
from app.services.scoring import compute_score

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
    """Nombre total de communes."""
    return db.query(Commune).count()


def get_communes_sample(db: Session, limit: int = 10):
    """Petit échantillon pour debug."""
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
    limit: Optional[int] = None,  # <= plus de limite par défaut

    # filtres excluants
    littoral: Optional[bool] = None,
    montagne: Optional[bool] = None,
    prix_min: Optional[float] = None,
    prix_max: Optional[float] = None,
    densite: Optional[str] = None,

    # filtre distance personnalisée
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    rayon_km: Optional[float] = None,

    # pondérations du score
    w_sante: int = 1,
    w_mag: int = 1,
    w_asso: int = 1,
    w_temp: int = 1,
    w_sun: int = 1,
):
    """
    Retourne les communes en GeoJSON, avec filtres combinables
    et score global dynamique.
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
        Commune.temp_scaled,
        Commune.sun_scaled,
        Commune.littoral_flag,
        Commune.montagne_flag,
        ST_AsGeoJSON(Commune.geometry).label("geometry"),
    )

    # 🌊 Littoral
    if littoral is not None:
        query = query.filter(Commune.littoral_flag == int(littoral))

    # 🏔️ Montagne
    if montagne is not None:
        query = query.filter(Commune.montagne_flag == int(montagne))

    # 💶 Prix m²
    if prix_min is not None:
        query = query.filter(Commune.Prixm2Moyen >= prix_min)
    if prix_max is not None:
        query = query.filter(Commune.Prixm2Moyen <= prix_max)

    # 🏘️ Densité
    if densite is not None:
        densite_db = DENSITE_MAPPING.get(densite.lower())
        if densite_db:
            query = query.filter(Commune.densite_cat == densite_db)
        else:
            query = query.filter(False)  # rien

    # 🎯 Distance personnalisée
    if lat is not None and lon is not None and rayon_km is not None:
        point_l93 = ST_Transform(
            ST_SetSRID(
                ST_MakePoint(lon, lat),
                4326,
            ),
            2154,
        )
        query = query.filter(
            ST_DWithin(
                Commune.geom_l93,
                point_l93,
                rayon_km * 1000,
            )
        )

    # Exécution (sans limite si limit=None)
    if limit is not None:
        rows = query.limit(limit).all()
    else:
        rows = query.all()

    # Construction GeoJSON
    features = []
    for r in rows:
        properties = {
            "score_sante": r.score_sante,
            "mag_scaled": r.mag_scaled,
            "asso_scaled": r.asso_scaled,
            "temp_scaled": r.temp_scaled,
            "sun_scaled": r.sun_scaled,
        }
        weights = {
            "score_sante": w_sante,
            "mag_scaled": w_mag,
            "asso_scaled": w_asso,
            "temp_scaled": w_temp,
            "sun_scaled": w_sun,
        }
        score_global = compute_score(properties, weights)

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
                    "score_global": score_global,
                    "mag_scaled": r.mag_scaled,
                    "asso_scaled": r.asso_scaled,
                    "temp_scaled": r.temp_scaled,
                    "sun_scaled": r.sun_scaled,
                    "littoral": bool(r.littoral_flag),
                    "montagne": bool(r.montagne_flag),
                },
            }
        )

    return {"type": "FeatureCollection", "features": features}
