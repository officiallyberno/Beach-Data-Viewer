# api/schemas.py
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, field_validator


# ---------------------------------------------------------------------------
# Ranking (alte Tabelle – wird noch von /rankings genutzt)
# ---------------------------------------------------------------------------

class RankingSchema(BaseModel):
    id: int
    platz: str
    spieler: str
    verein: str
    punkte: str
    geschlecht: str
    saison: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Player
# ---------------------------------------------------------------------------

class PlayerSchema(BaseModel):
    id: int
    external_id: int
    first_name: str
    last_name: str
    gender: str
    club: Optional[str] = None
    license_number: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# RankingClean  (neue Ranglisten-Tabelle)
# ---------------------------------------------------------------------------

class RankingCleanSchema(BaseModel):
    id: int
    external_id: int
    year: str
    association: str
    date: date
    rank: str
    points: str

    model_config = {"from_attributes": True}


class PlayerWithRankingsSchema(PlayerSchema):
    rankings: List[RankingCleanSchema] = []


# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------

class ResultSchema(BaseModel):
    id: int
    turnier_id: Optional[str] = None
    date: date
    partner: str
    tournament_name: str
    location: str
    rank: str
    points: str
    association: str

    model_config = {"from_attributes": True}


class PlayerWithResultsSchema(PlayerSchema):
    results: List[ResultSchema] = []


# ---------------------------------------------------------------------------
# TournamentTeam
# ---------------------------------------------------------------------------

class TournamentTeamSchema(BaseModel):
    id: int
    external_mannschafts_id: Optional[int] = None
    mannschaftsname: str
    verein: Optional[str] = None
    anmeldedatum: Optional[datetime] = None
    status: Optional[str] = None
    doppelmeldung: Optional[str] = None
    is_placeholder: Optional[bool] = None

    # Zulassung
    zulassung_reihenfolge: Optional[int] = None
    punkte_zulassung: Optional[str] = None
    dvv_punkte_zulassung: Optional[int] = None
    lv_punkte_zulassung: Optional[int] = None

    # Setzung
    setzung_reihenfolge: Optional[int] = None
    punkte_setzung: Optional[str] = None

    # Platzierung
    platzierung: Optional[int] = None
    punkte: Optional[str] = None
    punkte_pro_spieler: Optional[str] = None

    # Spielernamen
    name_1: Optional[str] = None
    vorname_1: Optional[str] = None
    dvv_nummer_1: Optional[int] = None
    name_2: Optional[str] = None
    vorname_2: Optional[str] = None
    dvv_nummer_2: Optional[int] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# TournamentVVB  (Basis – für Listen)
# ---------------------------------------------------------------------------

class TournamentVVBSchema(BaseModel):
    id: int
    external_id: str
    name: str
    quelle: str
    kategorie: Optional[str] = None
    datum_von: Optional[date] = None
    datum_bis: Optional[date] = None
    ort: Optional[str] = None
    gender: Optional[str] = None
    ausrichter: Optional[str] = None
    altersklasse: Optional[str] = None
    meldeschluss: Optional[date] = None
    ummeldeschluss: Optional[str] = None
    abmeldeschluss: Optional[str] = None
    zulassungstermin: Optional[date] = None
    anmeldung_url: Optional[str] = None
    gemeldete_mannschaften: Optional[int] = None
    anzahl_teams_hauptfeld: Optional[int] = None
    anzahl_teams_qualifikation: Optional[int] = None
    ranglisteneingang: Optional[date] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# TournamentVVB  (Detail – für Einzelansicht, inkl. alle Felder)
# ---------------------------------------------------------------------------

class TournamentVVBDetailSchema(TournamentVVBSchema):
    anzahl_teams_hauptfeld_aus_qualifikation: Optional[int] = None
    zulassungsreihenfolge: Optional[str] = None
    preisgeld: Optional[str] = None
    startgeld: Optional[str] = None
    kaution: Optional[str] = None
    oeffentliche_informationen: Optional[str] = None
    kontakt: Optional[str] = None
    turnierhierarchie: Optional[str] = None
    turniermodus: Optional[str] = None
    start_hauptfeld: Optional[date] = None
    start_endspiele: Optional[date] = None
    ort_technical_meeting: Optional[str] = None
    termin_technical_meeting: Optional[datetime] = None
    anzahl_spielfelder_hauptfeld: Optional[int] = None
    verpflegungshinweise: Optional[str] = None
    links: Optional[str] = None
    anmerkungen: Optional[str] = None
    einschreibetermin: Optional[datetime] = None
    wildcards_hauptfeld: Optional[int] = None
    courts_hauptfeld: Optional[int] = None
    sachpreise: Optional[str] = None

    # GBT-Felder
    sportorganisatorische_leitung: Optional[str] = None
    teilnehmer: Optional[str] = None
    preisgeld_infos: Optional[str] = None
    ausrichter_infos: Optional[str] = None
    startgeld_infos: Optional[str] = None
    kaution_infos: Optional[str] = None
    uebernachtung: Optional[str] = None
    physio: Optional[str] = None
    livestream: Optional[str] = None
    einschreibung: Optional[str] = None
    trikots: Optional[str] = None
    spielort: Optional[str] = None
    akkreditierungen: Optional[str] = None
    autoanreise: Optional[str] = None
    parkmöglichkeiten: Optional[str] = None
    bahnanreise: Optional[str] = None
    trainingsmöglichkeiten: Optional[str] = None
    tickets: Optional[str] = None
    zeitplan: Optional[str] = None


# ---------------------------------------------------------------------------
# TournamentVVB  (mit Teams – für /vvb/teams)
# ---------------------------------------------------------------------------

class TournamentTeamListSchema(BaseModel):
    id: int
    name: str
    datum_von: Optional[date] = None
    ort: Optional[str] = None
    teams: List[TournamentTeamSchema] = []

    model_config = {"from_attributes": True}