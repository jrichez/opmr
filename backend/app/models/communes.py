# -*- coding: utf-8 -*-
"""
Created on Tue Dec 23 13:27:06 2025

@author: riche
"""

from sqlalchemy import Column, String, Integer, Float
from sqlalchemy.ext.declarative import declarative_base
from geoalchemy2 import Geometry

Base = declarative_base()


class Commune(Base):
    """
    Modèle ORM strictement aligné avec la table PostGIS 'communes'.
    Chaque colonne correspond EXACTEMENT à la base.
    """

    __tablename__ = "communes"

    # ============================
    # Identité
    # ============================

    INSEE_COM = Column(String, primary_key=True)
    libgeo = Column(String)
    code_departement = Column(String)

    # ============================
    # Général / risques
    # ============================

    nb_catnat = Column(Integer)

    # ============================
    # Immobilier / densité
    # ============================

    Prixm2Moyen = Column(Float)
    Densite = Column(String)
    densite_raw = Column(String)
    densite_cat = Column(String)

    # ============================
    # Santé
    # ============================

    tps_SU_SMUR = Column(Float)
    score_sante = Column(Float)

    # ⚠️ nom SQL avec espaces
    apl_medecins = Column(
        "APL aux médecins généralistes",
        Float
    )

    # ============================
    # Climat
    # ============================

    temp_moyenne = Column(Float)
    ensoleillement_moyen_h = Column(Float)

    temp_raw = Column(Float)
    sun_raw = Column(Float)

    temp_scaled = Column(Float)
    sun_scaled = Column(Float)

    # ============================
    # Vie locale
    # ============================

    # ⚠️ nom SQL avec espaces
    nombre_magasins = Column(
        "Nombre de Magasins",
        Float
    )

    nb_associations = Column(Float)

    mag_raw = Column(Float)
    asso_raw = Column(Float)

    mag_w = Column(Float)
    asso_w = Column(Float)

    mag_scaled = Column(Float)
    asso_scaled = Column(Float)

    # ============================
    # Mer / montagne
    # ============================

    littoral_flag = Column(Integer)
    distance_mer_km = Column(Float)
    closest_sea_name = Column(String)

    montagne_flag = Column(Integer)
    distance_montagne_km = Column(Float)
    closest_mont_name = Column(String)

    # ============================
    # Coordonnées simples
    # ============================

    lon = Column(Float)
    lat = Column(Float)

    # ============================
    # Géométries PostGIS
    # ============================

    # Géométrie WGS84 pour affichage carte
    geometry = Column(
        Geometry(
            geometry_type="MULTIPOLYGON",
            srid=4326
        )
    )

    # Géométrie Lambert-93 pour calculs
    geom_l93 = Column(
        Geometry(
            geometry_type="MULTIPOLYGON",
            srid=2154
        )
    )
