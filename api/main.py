# api/main.py (Ausschnitt)
from datetime import date
from typing import Annotated, Optional
from fastapi import Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from api.db import Ranking, SessionLocal, Tournament
from sqlalchemy import and_, or_, select
from fastapi import FastAPI
from api.schemas import RankingSchema, TournamentSchema   # ← neu importieren


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

