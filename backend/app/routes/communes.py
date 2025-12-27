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

    # limite de sécurité (peut rester None = valeur par défaut du service)
    limit: Optional[int] = Query(None, ge=1),

    # ✅ Emplacement mer / montagne (booléens)
    littoral: Optional[bool] = Query(
        None, description="Cherche proximité avec la mer (distance_mer_km <= rayon_km)"
        # le front envoie ?littoral=1
    ),
    montagne: Optional[bool] = Query(
        None, description="Cherche proximité avec la montagne (distance_montagne_km <= rayon_km)"
        # le front envoie ?montagne=1
    ),

    # ✅ Rayon en km (pour mer/montagne ou lieu précis)
    rayon_km: Optional[float] = Query(
        None, ge=0, le=200, description="Rayon en km pour les filtres de distance"
    ),

    # ✅ Lieu précis (utilisé quand emplacement = 'lieu')
    lat: Optional[float] = Query(
        None, description="Latitude du lieu précis (WGS84)"
    ),
    lon: Optional[float] = Query(
        None, description="Longitude du lieu précis (WGS84)"
    ),

    # ✅ Densité (village/bourg/ville/grande_ville, minuscule côté API)
    densite: Optional[str] = Query(
        None,
        description="Densité normalisée : village / bourg / ville / grande_ville",
    ),

    # ✅ Prix au m² max (calculé à partir du budget/surface côté front)
    prix_max: Optional[float] = Query(
        None, ge=0, description="Prix au m² maximal (déduit du budget/surface)"
    ),

    # ✅ Pondérations (x1/x2/x3) envoyées par le front
    w_sante: int = Query(1, ge=1, le=3),
    w_mag: int = Query(1, ge=1, le=3),
    w_asso: int = Query(1, ge=1, le=3),
):
    """
    Retourne les communes sous forme GeoJSON avec filtres et score global.
    Les noms des paramètres sont alignés avec :
      - le frontend (LeafletMap)
      - le service app.services.communes.get_communes_geojson
    """

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
        # w_temp et w_sun gardent leurs valeurs par défaut dans le service
    )

    return data
