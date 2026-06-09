# api/main.py
from datetime import date
from typing import Annotated, List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from api.db import (
    Player,
    Ranking,
    RankingClean,
    Result,
    SessionLocal,
    TournamentMatch,
    TournamentTeam,
    TournamentVVB,
)
from api.schemas import (
    PlayerSchema,
    PlayerWithRankingsSchema,
    PlayerWithResultsSchema,
    RankingCleanSchema,
    RankingSchema,
    ResultSchema,
    TournamentTeamListSchema,
    TournamentTeamSchema,
    TournamentVVBDetailSchema,
    TournamentVVBSchema,
)

app = FastAPI(title="Beach Volleyball API")


# ---------------------------------------------------------------------------
# DB-Dependency
# ---------------------------------------------------------------------------

async def get_db():
    async with SessionLocal() as session:
        yield session


# ===========================================================================
# RANKINGS (alte Tabelle)
# ===========================================================================

@app.get("/rankings", response_model=list[RankingSchema])
async def list_rankings(
    gender: Annotated[Optional[str], Query(alias="gender")] = None,
    q: Annotated[Optional[str], Query(alias="q")] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Ranking)
    if q:
        stmt = stmt.where(
            or_(
                Ranking.spieler.ilike(f"%{q}%"),
                Ranking.verein.ilike(f"%{q}%"),
            )
        )
    if gender:
        stmt = stmt.where(Ranking.geschlecht == gender)
    stmt = stmt.order_by(Ranking.platz.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


# ===========================================================================
# RANKINGS CLEAN  /rank/{association}/{year}
# ===========================================================================

@app.get("/rank/{association}/{year}", response_model=list[RankingCleanSchema])
async def get_ranking(
    association: str,
    year: str,
    gender: Annotated[Optional[str], Query()] = None,
    q: Annotated[Optional[str], Query()] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(RankingClean)
        .join(Player)
        .options(selectinload(RankingClean.player))
        .where(RankingClean.association == association)
        .where(RankingClean.year == year)
    )
    if q:
        stmt = stmt.where(
            or_(
                Player.first_name.ilike(f"%{q}%"),
                Player.last_name.ilike(f"%{q}%"),
                Player.club.ilike(f"%{q}%"),
            )
        )
    if gender:
        stmt = stmt.where(Player.gender == gender)
    stmt = stmt.order_by(RankingClean.rank.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


# ===========================================================================
# PLAYERS
# ===========================================================================

@app.get("/players", response_model=list[PlayerSchema])
async def list_players(
    q: Annotated[Optional[str], Query()] = None,
    gender: Annotated[Optional[str], Query()] = None,
    db: AsyncSession = Depends(get_db),
):
    """Spielerliste mit optionalem Suche- und Gender-Filter."""
    stmt = select(Player)
    if q:
        stmt = stmt.where(
            or_(
                Player.first_name.ilike(f"%{q}%"),
                Player.last_name.ilike(f"%{q}%"),
                Player.club.ilike(f"%{q}%"),
            )
        )
    if gender:
        stmt = stmt.where(Player.gender == gender)
    stmt = stmt.order_by(Player.last_name.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


@app.get("/players/{external_id}", response_model=PlayerSchema)
async def get_player(external_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Player).where(Player.external_id == external_id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Spieler nicht gefunden")
    return player


@app.get("/players/{external_id}/rankings", response_model=list[RankingCleanSchema])
async def get_player_rankings(external_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RankingClean)
        .where(RankingClean.external_id == external_id)
        .order_by(RankingClean.date.desc())
    )
    return result.scalars().all()


@app.get("/players/{external_id}/results", response_model=list[ResultSchema])
async def get_player_results(external_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Result)
        .where(Result.external_id == external_id)
        .order_by(Result.date.desc())
    )
    return result.scalars().all()


@app.get("/players/{external_id}/profile", response_model=PlayerWithRankingsSchema)
async def get_player_profile(external_id: int, db: AsyncSession = Depends(get_db)):
    """Spieler inkl. aller Ranglistenplätze – für die Profilseite."""
    result = await db.execute(
        select(Player)
        .options(selectinload(Player.rankings))
        .where(Player.external_id == external_id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Spieler nicht gefunden")
    return player


# ===========================================================================
# TURNIERE – Landesverband (LV_DVV)
# ===========================================================================

@app.get("/landesverband", response_model=list[TournamentVVBSchema])
async def list_lv_tournaments(db: AsyncSession = Depends(get_db)):
    stmt = select(TournamentVVB).where(TournamentVVB.quelle == "LV_DVV")
    result = await db.execute(stmt)
    return result.scalars().all()


@app.get("/landesverband/{tournament_id}", response_model=TournamentVVBDetailSchema)
async def get_lv_tournament(tournament_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(TournamentVVB)
        .where(TournamentVVB.quelle == "LV_DVV")
        .where(TournamentVVB.id == tournament_id)
    )
    result = await db.execute(stmt)
    tournament = result.scalar_one_or_none()
    if not tournament:
        raise HTTPException(status_code=404, detail="Turnier nicht gefunden")
    return tournament


# ===========================================================================
# TURNIERE – DVV
# ===========================================================================

@app.get("/dvv", response_model=list[TournamentVVBSchema])
async def list_dvv_tournaments(db: AsyncSession = Depends(get_db)):
    stmt = select(TournamentVVB).where(TournamentVVB.quelle == "DVV Turniere")
    result = await db.execute(stmt)
    return result.scalars().all()


@app.get("/dvv/{tournament_id}", response_model=TournamentVVBDetailSchema)
async def get_dvv_tournament(tournament_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(TournamentVVB)
        .where(TournamentVVB.quelle == "DVV Turniere")
        .where(TournamentVVB.id == tournament_id)
    )
    result = await db.execute(stmt)
    tournament = result.scalar_one_or_none()
    if not tournament:
        raise HTTPException(status_code=404, detail="Turnier nicht gefunden")
    return tournament


@app.get("/dvv/{tournament_id}/teams", response_model=list[TournamentTeamSchema])
async def get_dvv_tournament_teams(tournament_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TournamentVVB).where(TournamentVVB.id == tournament_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Turnier nicht gefunden")
    result = await db.execute(
        select(TournamentTeam)
        .where(TournamentTeam.tournament_id == tournament_id)
        .order_by(TournamentTeam.zulassung_reihenfolge.asc())
    )
    return result.scalars().all()


# ===========================================================================
# TURNIERE – VVB
# ===========================================================================

@app.get("/vvb", response_model=list[TournamentVVBSchema])
async def list_vvb_tournaments(
    kategorie: Annotated[Optional[str], Query(alias="cat")] = None,
    verband: Annotated[Optional[str], Query(alias="org")] = None,
    geschlecht: Annotated[Optional[str], Query(alias="gender")] = None,
    future: Annotated[bool, Query(alias="onlyFuture")] = False,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TournamentVVB).where(TournamentVVB.quelle == "VVB")
    conds = []
    if kategorie:
        conds.append(TournamentVVB.kategorie.ilike(f"%{kategorie}%"))
    if verband:
        conds.append(TournamentVVB.ausrichter.ilike(f"%{verband}%"))
    if geschlecht:
        conds.append(TournamentVVB.gender.ilike(f"%{geschlecht}%"))
    if future:
        conds.append(TournamentVVB.datum_von >= date.today())
    if conds:
        stmt = stmt.where(and_(*conds))
    stmt = stmt.order_by(TournamentVVB.datum_von.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


@app.get("/vvb/teams", response_model=list[TournamentTeamListSchema])
async def list_vvb_tournaments_with_teams(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(TournamentVVB)
        .where(TournamentVVB.quelle == "VVB")
        .options(joinedload(TournamentVVB.teams))
    )
    result = await db.execute(stmt)
    return result.unique().scalars().all()


@app.get("/vvb/{tournament_id}", response_model=TournamentVVBDetailSchema)
async def get_vvb_tournament(tournament_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(TournamentVVB)
        .where(TournamentVVB.quelle == "VVB")
        .where(TournamentVVB.id == tournament_id)
    )
    result = await db.execute(stmt)
    tournament = result.scalar_one_or_none()
    if not tournament:
        raise HTTPException(status_code=404, detail="Turnier nicht gefunden")
    return tournament


@app.get("/vvb/{tournament_id}/teams", response_model=list[TournamentTeamSchema])
async def get_vvb_tournament_teams(tournament_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TournamentVVB).where(TournamentVVB.id == tournament_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Turnier nicht gefunden")
    result = await db.execute(
        select(TournamentTeam)
        .where(TournamentTeam.tournament_id == tournament_id)
        .order_by(TournamentTeam.zulassung_reihenfolge.asc())
    )
    return result.scalars().all()


# ===========================================================================
# ALLE TURNIERE – generischer Endpunkt (für Suche / Kalender)
# ===========================================================================

@app.get("/tournaments", response_model=list[TournamentVVBSchema])
async def list_all_tournaments(
    q: Annotated[Optional[str], Query()] = None,
    gender: Annotated[Optional[str], Query()] = None,
    quelle: Annotated[Optional[str], Query()] = None,
    from_date: Annotated[Optional[date], Query(alias="from")] = None,
    to_date: Annotated[Optional[date], Query(alias="to")] = None,
    db: AsyncSession = Depends(get_db),
):
    """Kombinierter Endpunkt: sucht über alle Quellen hinweg."""
    stmt = select(TournamentVVB)
    conds = []
    if q:
        conds.append(
            or_(
                TournamentVVB.name.ilike(f"%{q}%"),
                TournamentVVB.ort.ilike(f"%{q}%"),
                TournamentVVB.ausrichter.ilike(f"%{q}%"),
            )
        )
    if gender:
        conds.append(TournamentVVB.gender.ilike(f"%{gender}%"))
    if quelle:
        conds.append(TournamentVVB.quelle == quelle)
    if from_date:
        conds.append(TournamentVVB.datum_von >= from_date)
    if to_date:
        conds.append(TournamentVVB.datum_von <= to_date)
    if conds:
        stmt = stmt.where(and_(*conds))
    stmt = stmt.order_by(TournamentVVB.datum_von.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


# ===========================================================================
# TOURNAMENT TEAMS  (generisch, ohne Quelle-Filter)
# ===========================================================================

@app.get("/tur_teams", response_model=list[TournamentTeamSchema])
async def get_all_tur_teams(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TournamentTeam))
    return result.scalars().all()