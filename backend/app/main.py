# -*- coding: utf-8 -*-
"""
Created on Mon Dec 22 15:28:48 2025

@author: riche
"""

from fastapi import FastAPI
from app.routes import communes
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Retraite API",
    version="1.0",
    description="Backend du projet retraite"
)

app.include_router(communes.router)

@app.get("/ping")
def ping():
    return {"message": "pong"}

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

