# api/main.py (Ausschnitt)
from sqlalchemy.orm import joinedload, selectinload

from datetime import date
from typing import Annotated, List, Optional
from fastapi import Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from api.db import Player, Ranking, RankingClean, SessionLocal, Tournament, Result, TournamentTeam, TournamentVVB
from sqlalchemy import and_, or_, select
from fastapi import FastAPI
from api.schemas import RankingSchema, TournamentSchema, TournamentTeamListSchema   # ← neu importieren


app = FastAPI() 

async def get_db():
    async with SessionLocal() as session:
        yield session

@app.get("/tournaments", response_model=list[TournamentSchema])
  
async def list_tournaments(
    kategorie : Annotated[Optional[str], Query(alias="cat")] = None,
    verband   : Annotated[Optional[str], Query(alias="org")] = None,
    geschlecht: Annotated[Optional[str], Query(alias="gender")] = None,
    future    : Annotated[bool,           Query(alias="onlyFuture")] = False,
    db:        AsyncSession = Depends(get_db),
):
    stmt = select(Tournament)

    conds = []
    if kategorie:
        cond = Tournament.kategorie.ilike(f"%{kategorie}%")
        print("→ Bedingung Kategorie:", cond)
        conds.append(cond)
    if verband:
        conds.append(Tournament.veranstalter.ilike(f"%{verband}%"))
    if geschlecht:
        conds.append(Tournament.geschlecht.ilike(f"%{geschlecht}%"))
    if future:
        conds.append(
            Tournament.start_datum.op("~")(r"-\s*(\d{2}\.\d{2}\.\d{4})$")
            & (Tournament.start_datum.like(f"%{date.today().year}%"))
        )
       
    if conds:
        stmt = stmt.where(and_(*conds))
    
    result = await db.execute(stmt.order_by(Tournament.start_datum))
    return result.scalars().all()


@app.get("/rankings", response_model=list[RankingSchema])
async def list_rankings(
    gender: Annotated[Optional[str], Query(alias="gender")] = None,
    q: Annotated[Optional[str], Query(alias="q")] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Ranking)

    if q:
        stmt = stmt.where(
            or_(
                Ranking.spieler.ilike(f"%{q}%"),
                Ranking.verein.ilike(f"%{q}%")
            )
        )


    if gender:
        stmt = stmt.where(Ranking.geschlecht == gender)

    stmt = stmt.order_by(Ranking.platz.asc())

    result = await db.execute(stmt)
    return result.scalars().all()

@app.get("/tournaments/{tournament_id}", response_model=TournamentSchema)
async def get_tournament(
    tournament_id: int,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Tournament).where(Tournament.id == tournament_id)
    result = await db.execute(stmt)
    tournament = result.scalar_one_or_none()

    if tournament is None:
        raise HTTPException(status_code=404, detail="Tournament not found")

    return tournament


# @app.get("/players/{player_id}")
# async def get_player(player_id: int, db: AsyncSession = Depends(get_db)):
#     result = await db.execute(select(Player).where(Player.id == player_id))
#     player = result.scalar_one_or_none()
#     if not player:
#         raise HTTPException(status_code=404, detail="Player not found")
#     return player

@app.get("/players/{external_id}")
async def get_player(external_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Player).where(Player.external_id == external_id))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@app.get("/players/{player_id}/rankings")
async def get_player_rankings(player_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RankingClean).where(RankingClean.external_id == player_id))
    return result.scalars().all()


@app.get("/players/{player_id}/results")
async def get_player_results(player_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Result).where(Result.external_id== player_id))
    return result.scalars().all()



@app.get("/vvb")
async def get_all_tournaments(db: AsyncSession = Depends(get_db)):
    stmt = select(TournamentVVB)
    result = await db.execute(stmt)
    tournaments = result.scalars().all()

    return tournaments


@app.get("/vvb/{tournament_id}")
async def get_tournament_by_id(
    tournament_id: int,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TournamentVVB).where(TournamentVVB.id == tournament_id)
    result = await db.execute(stmt)
    tournament = result.scalar_one_or_none()

    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    return tournament

@app.get("/tur_teams")
async def get_all_tur_teams(db: AsyncSession = Depends(get_db)):
    stmt = select(TournamentTeam)
    result = await db.execute(stmt)
    tournaments = result.scalars().all()

    return tournaments


@app.get("/vvb/teams", response_model=List[TournamentTeamListSchema])
async def get_all_tournaments(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(TournamentVVB)
        .options(joinedload(TournamentVVB.teams))
    )
    result = await db.execute(stmt)
    tournaments = result.unique().scalars().all()
    return tournaments

@app.get("/vvb/{tournament_id}/teams")
async def get_tournament_teams(tournament_id: int, db: AsyncSession = Depends(get_db)):
    # check if tournament exists
    result = await db.execute(select(TournamentVVB).where(TournamentVVB.id == tournament_id))
    tournament = result.scalar_one_or_none()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    # get all teams for this tournament
    result = await db.execute(select(TournamentTeam).where(TournamentTeam.tournament_id == tournament_id))
    teams = result.scalars().all()

    # convert to simple dicts
    return teams

@app.get("/rank/{association}/{year}")
async def get_ranking(association: str, year:str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
    select(RankingClean)
    .options(selectinload(RankingClean.player))       # 👈 Spieler mitladen!
    .join(Player)
    .filter(RankingClean.association == association)
    .filter(RankingClean.year == year)
    .order_by(RankingClean.rank.asc())
)
    players = result.scalars().all()

    return players