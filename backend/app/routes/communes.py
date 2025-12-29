# backend/app/routes/communes.py

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
def communes_count(
    db: Session = Depends(get_db),
    prix_max: Optional[float] = None,
    densite: Optional[str] = None,
    littoral: Optional[bool] = None,
    montagne: Optional[bool] = None,
):
    return get_communes_count(
        db=db,
        prix_max=prix_max,
        densite=densite,
        littoral=littoral,
        montagne=montagne,
    )


@router.get("/communes/sample")
def communes_sample(
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=500),
    prix_max: Optional[float] = None,
    densite: Optional[str] = None,
    littoral: Optional[bool] = None,
    montagne: Optional[bool] = None,
):
    return get_communes_sample(
        db=db,
        limit=limit,
        prix_max=prix_max,
        densite=densite,
        littoral=littoral,
        montagne=montagne,
    )


@router.get("/communes/geojson")
def communes_geojson(
    db: Session = Depends(get_db),
    limit: Optional[int] = Query(None, ge=1),

    littoral: Optional[bool] = None,
    montagne: Optional[bool] = None,
    rayon_km: Optional[float] = Query(None, ge=0, le=200),
    lat: Optional[float] = None,
    lon: Optional[float] = None,

    densite: Optional[str] = None,
    prix_max: Optional[float] = Query(None, ge=0),

    w_sante: int = Query(1, ge=1, le=3),
    w_mag: int = Query(1, ge=1, le=3),
    w_asso: int = Query(1, ge=1, le=3),

    # 🌞 Préférence utilisateur (0 = peu, 0.5 = moyen, 1 = beaucoup)
    sun_preference: float = Query(0.5, ge=0.0, le=1.0),
):
    data = get_communes_geojson(
        db=db,
        limit=limit or 5000,
        littoral=littoral,
        montagne=montagne,
        prix_max=prix_max,
        densite=densite,
        lat=lat,
        lon=lon,
        rayon_km=rayon_km,

        w_sante=w_sante,
        w_mag=w_mag,
        w_asso=w_asso,

        # 🌞 Envoi au service + scoring
        sun_preference=sun_preference,
    )

    return data