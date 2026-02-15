# api/db.py
from pathlib import Path
from typing import List, Optional
from unittest import result
from dotenv import load_dotenv
from os import getenv
from datetime import date, datetime
from sqlalchemy import Date, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship


# 1️⃣  .env-Datei laden – am besten ganz oben
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)          # lädt Variablen aus <projektroot>/.env

# 2️⃣  SQLAlchemy + AsyncPG einrichten
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer #, UniqueConstraint

# → jetzt ist DATABASE_URL sicher gesetzt
DATABASE_URL = getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("❌  Umgebungsvariable DATABASE_URL fehlt!")

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

# 3️⃣  Basisklasse + Modell
class Base(DeclarativeBase):
    pass

class Tournament(Base):
    __tablename__ = "tournaments"
    # __table_args__ = (
    #     UniqueConstraint("datum", "ort", "geschlecht", name="uq_tournament"),
    # )

    id:           Mapped[int]  = mapped_column(Integer, primary_key=True)
    start_datum:  Mapped[str]  = mapped_column((Date))
    end_datum:    Mapped[str]  = mapped_column((Date))
    ort:          Mapped[str]  = mapped_column(String(100))
    geschlecht:   Mapped[str]  = mapped_column(String(10))
    kategorie:    Mapped[str]  = mapped_column(String(80))
    veranstalter: Mapped[str]  = mapped_column(String(20))


class Ranking(Base):
    __tablename__ = "rankings"

    id         : Mapped[int]  = mapped_column(Integer, primary_key=True)
    platz      : Mapped[str]  = mapped_column((String(120)))
    spieler    : Mapped[str]  = mapped_column(String(120))
    verein     : Mapped[str]  = mapped_column(String(120))
    punkte     : Mapped[str]  = mapped_column(String(120))
    geschlecht : Mapped[str]  = mapped_column(String(10))
    saison     : Mapped[int]  = mapped_column(Integer, default=2026)   # optional

class Player(Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    external_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(50))
    last_name: Mapped[str] = mapped_column(String(50))
    gender: Mapped[str] = mapped_column(String(50))
    club: Mapped[str] = mapped_column(String(100), nullable=True)
    license_number: Mapped[str] = mapped_column(String(20), nullable=True)

    rankings: Mapped[list["RankingClean"]] = relationship(back_populates="player", cascade="all, delete-orphan")
    results: Mapped[list["Result"]] = relationship(back_populates="player", cascade="all, delete-orphan")
class RankingClean(Base):
    __tablename__ = "rankings_clean"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id"), nullable=False)
    external_id: Mapped[int] = mapped_column(Integer)
    year: Mapped[str]
    association: Mapped[str] = mapped_column(String(50))
    date: Mapped[str]= mapped_column((Date))
    rank: Mapped[str] = mapped_column(String(120))
    points: Mapped[str]=mapped_column(String(50))

    player: Mapped[Player] = relationship(back_populates="rankings")  
class Result(Base):
    __tablename__ = "results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id"), nullable=False)
    external_id: Mapped[int] = mapped_column(Integer)

    turnier_id:Mapped[str] = mapped_column(String(100))
    date: Mapped[str]= mapped_column((Date))
    partner: Mapped[str] = mapped_column(String(100))
    tournament_name: Mapped[str] = mapped_column(String(200))
    location: Mapped[str] = mapped_column(String(100))
    rank: Mapped[str] = mapped_column(String(50))
    points: Mapped[str]= mapped_column(String(100))
    association: Mapped[str] = mapped_column(String(50))

    player: Mapped[Player] = relationship(back_populates="results")

class TournamentVVB(Base):
    __tablename__ = "tournaments_vvb"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    external_id: Mapped[str] = mapped_column(String, nullable=False, unique=True)


    # Grundinformationen
    name: Mapped[str] = mapped_column(String(200), nullable=False)           # Turniername
    kategorie: Mapped[Optional[str]] = mapped_column(String(50))
    starttermin: Mapped[Optional[date]] = mapped_column(Date)
    zulassungstermin: Mapped[Optional[date]] = mapped_column(Date)
    ort: Mapped[Optional[str]] = mapped_column(String(100))
    gender: Mapped[Optional[str]] = mapped_column(String(20))                # "M", "F" o.ä.
    anmeldung_url: Mapped[Optional[str]] = mapped_column(String(255))
    meldeschluss: Mapped[Optional[date]] = mapped_column(Date)
    ausrichter: Mapped[Optional[str]] = mapped_column(String(100))
    altersklasse: Mapped[Optional[str]] = mapped_column(String(50))

    # Zahlenangaben
    gemeldete_mannschaften: Mapped[Optional[int]] = mapped_column(Integer)
    anzahl_teams_hauptfeld: Mapped[Optional[int]] = mapped_column(Integer)
    anzahl_teams_qualifikation: Mapped[Optional[int]] = mapped_column(Integer)
    zulassungsreihenfolge: Mapped[Optional[str]] = mapped_column(Text)
    preisgeld: Mapped[Optional[str]] = mapped_column(Text)            
    startgeld: Mapped[Optional[str]] = mapped_column(Text)
    kaution: Mapped[Optional[str]] = mapped_column(Text)

    # Weitere Informationen
    oeffentliche_informationen: Mapped[Optional[str]] = mapped_column(Text)
    kontakt: Mapped[Optional[str]] = mapped_column(String(255))
    turnierhierarchie: Mapped[Optional[str]] = mapped_column(String(100))
    turniermodus: Mapped[Optional[str]] = mapped_column(String(100))
    start_hauptfeld: Mapped[Optional[date]] = mapped_column(Date)
    start_endspiele: Mapped[Optional[date]] = mapped_column(Date)
    ort_technical_meeting: Mapped[Optional[str]] = mapped_column(String(100))
    termin_technical_meeting: Mapped[Optional[datetime]] = mapped_column(DateTime)
    anzahl_spielfelder_hauptfeld: Mapped[Optional[int]] = mapped_column(Integer)
    verpflegungshinweise: Mapped[Optional[str]] = mapped_column(Text)
    links: Mapped[Optional[str]] = mapped_column(Text)
    anmerkungen: Mapped[Optional[str]] = mapped_column(Text)
    einschreibetermin: Mapped[Optional[datetime]] = mapped_column(DateTime)
    wildcards_hauptfeld: Mapped[Optional[int]] = mapped_column(Integer)
    courts_hauptfeld: Mapped[Optional[int]] = mapped_column(Integer)
    sachpreise: Mapped[Optional[str]] = mapped_column(Text)
    anmerkungen: Mapped[Optional[str]] = mapped_column(Text)


    
    # Beziehungen zu abhängigen Tabellen
    teams: Mapped[list["TournamentTeam"]] = relationship(
        back_populates="tournament", cascade="all, delete-orphan"
    )

    matches: Mapped[list["TournamentMatch"]] = relationship(
        back_populates="tournament", cascade="all, delete-orphan"
    )

class TournamentTeam(Base):
    __tablename__ = "tournament_teams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    tournament_id: Mapped[int] = mapped_column(ForeignKey("tournaments_vvb.id"))


    tournament: Mapped["TournamentVVB"] = relationship(back_populates="teams")

    mannschafts_id: Mapped[Optional[int]] = mapped_column(Integer, unique=False) 
    
    # Anmeldung
    mannschaftsname: Mapped[str] = mapped_column(String(100))
    verein: Mapped[Optional[str]] = mapped_column(String(100))
    anmeldedatum: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[Optional[str]] = mapped_column(String(50))  
    doppelmeldung: Mapped[Optional[str]] = mapped_column(String(400))
    is_placeholder: Mapped[Optional[bool]]
    #Zulassung
    zulassung_reihenfolge: Mapped[Optional[int]]= mapped_column(Integer)
    punkte_zulassung: Mapped[Optional[str]] = mapped_column(String(100))
    dvv_punkte_zulassung: Mapped[Optional[int]]= mapped_column(Integer)
    lv_punkte_zulassung: Mapped[Optional[int]]= mapped_column(Integer)

    #Setzung
    setzung_reihenfolge: Mapped[Optional[int]]= mapped_column(Integer)
    punkte_setzung: Mapped[Optional[str]] = mapped_column(String(100))
    #Platzierungen
    platzierung: Mapped[Optional[int]] = mapped_column(Integer)
    punkte: Mapped[Optional[str]] = mapped_column(String(100))
    punkte_pro_spieler: Mapped[Optional[str]] = mapped_column(String(200))  # z. B. "Spieler1: 100, Spieler2: 90"

    # Optional Beziehungen zu Spielern
    # players: Mapped[List["Player"]] = relationship(...)
    matches_as_team1: Mapped[list["TournamentMatch"]] = relationship(
        foreign_keys="TournamentMatch.team1_id", back_populates="team1"
    )
    matches_as_team2: Mapped[list["TournamentMatch"]] = relationship(
        foreign_keys="TournamentMatch.team2_id", back_populates="team2"
    )
    wins: Mapped[list["TournamentMatch"]] = relationship(
        foreign_keys="TournamentMatch.winner_id", back_populates="winner"
    )


class TournamentMatch(Base):
    __tablename__ = "tournament_matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Bezug zum Turnier
    tournament_id: Mapped[int] = mapped_column(ForeignKey("tournaments_vvb.id"))
    tournament: Mapped["TournamentVVB"] = relationship(back_populates="matches")

    # Teams
    team1_id: Mapped[int] = mapped_column(ForeignKey("tournament_teams.id"))
    team2_id: Mapped[int] = mapped_column(ForeignKey("tournament_teams.id"))

    team1: Mapped["TournamentTeam"] = relationship(
        foreign_keys=[team1_id], back_populates="matches_as_team1"
    )
    team2: Mapped["TournamentTeam"] = relationship(
        foreign_keys=[team2_id], back_populates="matches_as_team2"
    )

    # Ergebnis
    score: Mapped[str] = mapped_column(String(50), nullable=True)  # z.B. "21-18, 19-21, 15-13"
    winner_id: Mapped[int | None] = mapped_column(ForeignKey("tournament_teams.id"), nullable=True)

    winner: Mapped["TournamentTeam"] = relationship(
        foreign_keys=[winner_id], back_populates="wins"
    )

    # Metadaten
    round: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "Vorrunde", "Halbfinale", ...
    court: Mapped[str | None] = mapped_column(String(20), nullable=True)  # Platznummer
    start_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class TournamentGBT(Base):
    __tablename__ = "tournaments_gbt"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    external_id: Mapped[str] = mapped_column(String, nullable=False, unique=True)


    # Grundinformationen
    name: Mapped[str] = mapped_column(String(200), nullable=False)   
    datum_von: Mapped[Optional[date]] = mapped_column(Date)        
    datum_bis: Mapped[Optional[date]] = mapped_column(Date)        
    gender: Mapped[Optional[str]] = mapped_column(String(20))        
    typ: Mapped[Optional[str]] = mapped_column(String(100))
    ort: Mapped[Optional[str]] = mapped_column(String(100))
    ausrichter: Mapped[Optional[str]] = mapped_column(String(100))
    gelaende: Mapped[Optional[str]] = mapped_column(String(100))
    ranglisteneingang: Mapped[Optional[date]] = mapped_column(Date)        
    meldeschluss: Mapped[Optional[str]] = mapped_column(String(50))
    ummeldeschluss: Mapped[Optional[str]] = mapped_column(String(50))
    abmeldeschluss: Mapped[Optional[str]] = mapped_column(String(50))

    # Zahlenangaben
    gemeldete_mannschaften: Mapped[Optional[int]] = mapped_column(Integer)
    anzahl_teams_hauptfeld: Mapped[Optional[int]] = mapped_column(Integer)
    anzahl_teams_qualifikation: Mapped[Optional[int]] = mapped_column(Integer)
    anzahl_teams_hauptfeld_aus_qualifikation: Mapped[Optional[int]] = mapped_column(Integer)
    zulassungsreihenfolge: Mapped[Optional[str]] = mapped_column(Text)
    preisgeld: Mapped[Optional[str]] = mapped_column(Text)            
    startgeld: Mapped[Optional[str]] = mapped_column(Text)
    kaution: Mapped[Optional[str]] = mapped_column(Text)

    #Infos
    sportorganisatorische_leitung: Mapped[Optional[str]] = mapped_column(String(100))
    teilnehmer: Mapped[Optional[str]] = mapped_column(String(100))
    preisgeld_infos: Mapped[Optional[str]] = mapped_column(String(100))
    ausrichter: Mapped[Optional[str]] = mapped_column(String(100))
    startgeld_infos: Mapped[Optional[str]] = mapped_column(String(100))
    kaution_infos: Mapped[Optional[str]] = mapped_column(String(100))
    uebernachtung: Mapped[Optional[str]] = mapped_column(String(100))
    physio: Mapped[Optional[str]] = mapped_column(String(100))
    livestream: Mapped[Optional[str]] = mapped_column(String(100))
    einschreibung: Mapped[Optional[str]] = mapped_column(String(100))
    trikots: Mapped[Optional[str]] = mapped_column(String(100))
    spielort: Mapped[Optional[str]] = mapped_column(String(100))
    akkreditierungen: Mapped[Optional[str]] = mapped_column(String(100))
    autoanreise: Mapped[Optional[str]] = mapped_column(String(100))
    parkmöglichkeiten: Mapped[Optional[str]] = mapped_column(String(100))
    bahnanreise: Mapped[Optional[str]] = mapped_column(String(100))
    trainingsmöglichkeiten: Mapped[Optional[str]] = mapped_column(String(100))
    tickets: Mapped[Optional[str]] = mapped_column(String(100))
    zeitplan: Mapped[Optional[str]] = mapped_column(String(100))

     
    # Beziehungen zu abhängigen Tabellen
    teams: Mapped[list["TournamentTeam"]] = relationship(
        back_populates="tournament", cascade="all, delete-orphan"
    )

    matches: Mapped[list["TournamentMatch"]] = relationship(
        back_populates="tournament", cascade="all, delete-orphan"
    )