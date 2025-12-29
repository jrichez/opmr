# app/services/communes.py
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


DENSITE_MAPPING = {
    "village": "Village",
    "bourg": "Bourg",
    "ville": "Ville",
    "grande_ville": "Grande Ville",
}


def get_communes_count(db: Session) -> int:
    return db.query(Commune).count()


def get_communes_sample(db: Session, limit: int = 10):
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


def get_communes_geojson(
    db: Session,
    limit: int = 5000,
    littoral: Optional[bool] = None,
    montagne: Optional[bool] = None,
    prix_min: Optional[float] = None,
    prix_max: Optional[float] = None,
    densite: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    rayon_km: Optional[float] = None,
    w_sante: int = 1,
    w_mag: int = 1,
    w_asso: int = 1,
    w_temp: int = 1,

    # 🌞 poids fixe (toujours important)
    w_sun: int = 3,

    # 🌞 slider utilisateur, valeur interne 0 → 1 (0.5 = "moyenne")
    sun_preference: float = 0.5,
):
    """
    Retourne le GeoJSON des communes filtrées + score sur 20
    avec prise en compte de la préférence soleil utilisateur.
    """

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
        Commune.distance_mer_km,
        Commune.distance_montagne_km,
        ST_AsGeoJSON(Commune.geometry).label("geometry"),
    )

    # 🌊 Littoral
    if littoral:
        query = query.filter(
            Commune.distance_mer_km <= (rayon_km if rayon_km is not None else 10)
        )

    # 🏔️ Montagne
    if montagne:
        query = query.filter(
            Commune.distance_montagne_km <= (rayon_km if rayon_km is not None else 10)
        )

    # 💶 Prix immobilier
    if prix_min is not None:
        query = query.filter(Commune.Prixm2Moyen >= prix_min)
    if prix_max is not None:
        query = query.filter(Commune.Prixm2Moyen <= prix_max)

    # 🏘️ Densité
    if densite is not None:
        densite_db = DENSITE_MAPPING.get(densite.lower())
        query = query.filter(Commune.densite_cat == densite_db) if densite_db else query.filter(False)

    # 📍 Filtre géographique
    if lat is not None and lon is not None and rayon_km is not None:
        point_l93 = ST_Transform(ST_SetSRID(ST_MakePoint(lon, lat), 4326), 2154)
        query = query.filter(
            ST_DWithin(Commune.geom_l93, point_l93, rayon_km * 1000)
        )

    rows = query.limit(limit).all()

    features = []

    for r in rows:
        # valeurs normalisées de la BDD
        props = {
            "score_sante": r.score_sante,
            "mag_scaled": r.mag_scaled,
            "asso_scaled": r.asso_scaled,
            "temp_scaled": r.temp_scaled,
            "sun_scaled": r.sun_scaled,
        }

        # ⚙️ Pondérations + préférence soleil
        # (on ne touche pas aux poids existants)
        preferences = {
            "w_sante": w_sante,
            "w_mag": w_mag,
            "w_asso": w_asso,
            "w_sun": w_sun,                     # poids fixe
            "sun_preference": sun_preference,   # 🔥 préférence utilisateur
        }

        # 🔥 Calcul du score sur 20
        score_sur_20 = compute_score(props, preferences)

        features.append({
            "type": "Feature",
            "geometry": json.loads(r.geometry) if r.geometry else None,
            "properties": {
                "insee": r.INSEE_COM,
                "nom": r.libgeo,
                "score_global": score_sur_20,  # NOTE → sur 20
                "prix_m2": r.Prixm2Moyen,
                "densite": r.densite_cat,
                "score_sante": r.score_sante,
                "mag_scaled": r.mag_scaled,
                "asso_scaled": r.asso_scaled,
                "temp_scaled": r.temp_scaled,
                "sun_scaled": r.sun_scaled,             # valeur BDD
                "sun_preference": sun_preference,       # valeur utilisateur
                "littoral": bool(r.littoral_flag),
                "montagne": bool(r.montagne_flag),
                "distance_mer_km": r.distance_mer_km,
                "distance_montagne_km": r.distance_montagne_km,
            },
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }
