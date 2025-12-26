# -*- coding: utf-8 -*-
"""
Created on Mon Dec 22 15:30:15 2025

@author: riche
"""

from pydantic_settings import BaseSettings

class Settings(BaseSettings):

    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "retraite"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"

    class Config:
        env_file = ".env"

settings = Settings()
