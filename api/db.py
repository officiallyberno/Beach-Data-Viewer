# api/db.py
from pathlib import Path
from dotenv import load_dotenv
from os import getenv
from datetime import date
from sqlalchemy import Date

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
    saison     : Mapped[int]  = mapped_column(Integer, default=2025)   # optional

