from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.communes import (
    get_communes_count,
    get_communes_sample,
    get_communes_geojson,
)

router = APIRouter()


@router.get("/communes/count")
def communes_count(db: Session = Depends(get_db)):
    """
    Retourne le nombre total de communes.
    """
    return {"count": get_communes_count(db)}


@router.get("/communes/sample")
def communes_sample(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Retourne un petit échantillon de communes (pour debug).
    """
    rows = get_communes_sample(db, limit=limit)
    return {"items": [dict(r._mapping) for r in rows]}


@router.get("/communes/geojson")
def communes_geojson(
    db: Session = Depends(get_db),
    limit: Optional[int] = Query(None, ge=1),
    mer: Optional[bool] = Query(None, description="Cherche proximité avec la mer"),
    montagne: Optional[bool] = Query(
        None, description="Cherche proximité avec la montagne"
    ),
    rayon_km: Optional[float] = Query(
        None, ge=0, le=200, description="Rayon en km autour de la mer / montagne"
    ),
    densite: Optional[str] = Query(
        None,
        description="Village / Bourg / Ville / Grande ville",
    ),
    prix_max: Optional[float] = Query(
        None, ge=0, description="Prix au m² maximal (déduit du budget/surface)"
    ),
    sun_pref: Optional[float] = Query(
        None,
        description="Préférence d'ensoleillement en heures/an",
    ),
    w_sante: int = Query(1, ge=1, le=3),
    w_mag: int = Query(1, ge=1, le=3),
    w_asso: int = Query(1, ge=1, le=3),
):
    """
    Retourne les communes sous forme GeoJSON avec filtres et score global.
    """
    data = get_communes_geojson(
        db=db,
        limit=limit,
        mer=mer,
        montagne=montagne,
        rayon_km=rayon_km,
        prix_max=prix_max,
        densite=densite,
        sun_pref=sun_pref,
        w_sante=w_sante,
        w_mag=w_mag,
        w_asso=w_asso,
    )
    return data
