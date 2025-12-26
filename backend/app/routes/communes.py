from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.services.communes import (
    get_communes_count,
    get_communes_sample,
    get_communes_geojson,
)

router = APIRouter(
    prefix="/communes",
    tags=["Communes"]
)


# ============================================================
# 🔢 Endpoint de test : nombre total de communes
# ============================================================

@router.get("/count")
def count_communes(db: Session = Depends(get_db)):
    """
    GET /communes/count

    Vérifie :
    - connexion DB
    - mapping ORM
    """
    total = get_communes_count(db)
    return {"total_communes": total}


# ============================================================
# 🧪 Endpoint de test : échantillon de communes (sans géométrie)
# ============================================================

@router.get("/sample")
def sample_communes(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    GET /communes/sample?limit=10

    Retourne un échantillon de communes pour inspection.
    """
    rows = get_communes_sample(db, limit)

    return [
        {
            "insee": r.INSEE_COM,
            "nom": r.libgeo,
            "departement": r.code_departement,
            "prix_m2": r.Prixm2Moyen,
            "densite": r.densite_cat,
            "score_sante": r.score_sante,
        }
        for r in rows
    ]


# ============================================================
# 🗺️ Endpoint principal : GeoJSON + filtres + score dynamique
# ============================================================

@router.get("/geojson")
def communes_geojson(
    # pagination / sécurité
    limit: int = 500,

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

    db: Session = Depends(get_db),
):
    """
    GET /communes/geojson

    Endpoint principal pour la carte interactive.

    🔹 Filtres :
    - littoral (true / false)
    - montagne (true / false)
    - prix_min / prix_max
    - densite (village, bourg, ville, grande_ville)
    - distance personnalisée (lat, lon, rayon_km)

    🔹 Scoring :
    - pondérations dynamiques envoyées par l'utilisateur
    """

    return get_communes_geojson(
        db=db,
        limit=limit,
        littoral=littoral,
        montagne=montagne,
        prix_min=prix_min,
        prix_max=prix_max,
        densite=densite,
        lat=lat,
        lon=lon,
        rayon_km=rayon_km,
        w_sante=w_sante,
        w_mag=w_mag,
        w_asso=w_asso,
        w_temp=w_temp,
        w_sun=w_sun,
    )
