# in scripts/drop_recreate.py
import asyncio
from api.db import Base, engine

async def reset():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

asyncio.run(reset())
