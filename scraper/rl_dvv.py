# scraper/ranking_scraper.py
import asyncio
import re
from pathlib import Path
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from api.db import Ranking, SessionLocal
from sqlalchemy.dialects.postgresql import insert

RANK_URLS = [
    ("https://beach.volleyball-verband.de/public/rl-show.php?id=302", "Männer"),
    ("https://beach.volleyball-verband.de/public/rl-show.php?id=303", "Frauen"),
]

async def scrape_rankings():
    players = [] 
    async with async_playwright() as p:
        br = await p.chromium.launch(headless=True)

        async with SessionLocal() as s:
            for url, gender in RANK_URLS:
                print(f"🔍 Scrape {gender} Rangliste...")

                page = await br.new_page()
                await page.goto(url)
                await page.wait_for_selector("table.contenttable")
                html = await page.content()
                await page.close()

                soup = BeautifulSoup(html, "lxml")

                # Saison automatisch erkennen
                saison_text = soup.get_text(" ", strip=True)
                saison_match = re.search(r"Saison\s+(\d{4})", saison_text)
                saison = int(saison_match.group(1)) if saison_match else None
                if saison is None:
                    print(f"⚠️ Saison für {gender} nicht gefunden – Standardwert aktuelles Jahr")
                    from datetime import date
                    saison = date.today().year

                # Tabelle finden
                table = soup.select_one("table.contenttable")
                if not table:
                    Path(f"rank_debug_{gender}.html").write_text(html, encoding="utf-8")
                    raise RuntimeError(f"Ranking-Table ({gender}) nicht gefunden!")

                rows = table.select("tr")[1:]  # Kopfzeile überspringen
                for r in rows:
                    cells = r.select("td")
                    if len(cells) < 4:
                        continue

                
                
                    link_tag = cells[2].select_one("a")
                    href = link_tag["href"]  # "spieler.php?id=55268"
                    spieler_id = int(href.split("id=")[-1])

                    platz  = cells[1].get_text(strip=True)
                    punkte = cells[4].get_text(strip=True)
                    name   = cells[2].get_text(strip=True)
                    verein = cells[3].get_text(strip=True) or "-"

                    print(spieler_id)

                    stmt = (
                        insert(Ranking)
                        .values(
                            id=spieler_id,
                            platz=platz,
                            spieler=name,
                            verein=verein,
                            punkte=punkte,
                            geschlecht=gender,
                            saison=saison,
                        )
                        .on_conflict_do_nothing()
                    )
                    await s.execute(stmt)
                    
                    players.append({"id": spieler_id, "name": name, "gender": gender})


            await s.commit()

        await br.close()
    return players

if __name__ == "__main__":
    asyncio.run(scrape_rankings())
