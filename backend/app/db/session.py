# -*- coding: utf-8 -*-
"""
Created on Mon Dec 22 15:32:21 2025

@author: riche
"""

from app.db.database import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
