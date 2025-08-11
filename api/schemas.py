# api/schemas.py
from datetime import date
from pydantic import BaseModel

class TournamentSchema(BaseModel):
    id: int
    start_datum: date
    end_datum: date
    ort: str
    geschlecht: str
    kategorie: str
    veranstalter: str

    class Config:
        orm_mode = True      # erlaubt FastAPI, ORM‑Objekte direkt zu serialisieren

class RankingSchema(BaseModel):
    platz: str
    spieler: str
    verein: str
    punkte: str
    geschlecht: str
    saison: int