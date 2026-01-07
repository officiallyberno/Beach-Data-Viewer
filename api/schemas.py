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


from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class TournamentTeamSchema(BaseModel):
    id: int
    mannschaftsname: str
    mannschafts_id: Optional[int]
    verein: Optional[str]
    anmeldedatum: Optional[date]
    status: Optional[str]
    doppelmeldung: Optional[str]
    punkte_zulassung: Optional[int]
    punkte: Optional[int]
    platzierung: Optional[int]
    punkte_pro_spieler: Optional[str]

    class Config:
        orm_mode = True


class TournamentTeamListSchema(BaseModel):
    id: int
    name: str
    teams: List[TournamentTeamSchema] = []

    class Config:
        orm_mode = True
