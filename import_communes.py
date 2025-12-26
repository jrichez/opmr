# -*- coding: utf-8 -*-
"""
Created on Sun Dec 21 18:09:57 2025

@author: riche
"""

import geopandas as gpd
from sqlalchemy import create_engine

print("📍 Lecture du fichier GeoPackage")
gdf = gpd.read_file(r"C:\Users\riche\OneDrive\Bureau\Projets\oùpassermaretraite\communes.gpkg")
print("OK, lignes :", len(gdf))

engine = create_engine("postgresql://postgres:postgres@localhost:5432/retraite")

print("📍 Import vers PostGIS…")
gdf.to_postgis(
    name="communes",
    con=engine,
    if_exists="replace",
    index=False
)

print("🚀 Import terminé !")
