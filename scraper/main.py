import asyncio
from scraper.player_dvv import scrape_player
from scraper.rl_dvv import scrape_rankings
from scraper.tur_lv import scrape_tur_lv
from scraper.tur_vvb import scrape_tur_vvb

CONCURRENCY = 8  # max. gleichzeitige Scrapes

async def main():
    # await scrape_tur_lv()
    # await scrape_tur_vvb()
    
    players = await scrape_rankings()

    sem = asyncio.Semaphore(CONCURRENCY)

    async def sem_task(pid: int, gender:str):
        async with sem:               # Limit der gleichzeitigen Jobs
            await scrape_player(pid, gender )

    tasks = [sem_task(p["id"],p["gender"]) 
             for p in players]
    await asyncio.gather(*tasks)      # ALLE parallel starten

if __name__ == "__main__":
    asyncio.run(main())
