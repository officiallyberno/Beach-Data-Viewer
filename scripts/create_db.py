# scripts/create_db.py
import asyncio
from api.db import Base, engine

async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

asyncio.run(main())