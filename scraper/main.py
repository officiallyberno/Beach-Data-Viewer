import asyncio
from scraper.player_dvv import scrape_player
from scraper.rl_dvv import scrape_rankings
from scraper.tur_lv import scrape

CONCURRENCY = 8  # max. gleichzeitige Scrapes

async def main():
    await scrape()
    players = await scrape_rankings()

    sem = asyncio.Semaphore(CONCURRENCY)

    async def sem_task(pid: int):
        async with sem:               # Limit der gleichzeitigen Jobs
            await scrape_player(pid)

    tasks = [sem_task(p["id"]) for p in players]
    await asyncio.gather(*tasks)      # ALLE parallel starten

if __name__ == "__main__":
    asyncio.run(main())
