import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from api.db import SessionLocal, TournamentVVB
from sqlalchemy.dialects.postgresql import insert 
from datetime import datetime

from scraper.dateUtils import parse_date_range



URL = "https://beach.volleyball-verband.de/public/tur.php?kat=2&saison=26"



async def scrape_tur_lv():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(URL)
        await page.wait_for_selector("table.contenttable")
        html = await page.content()
        await browser.close()
        soup  = BeautifulSoup(html, "lxml")
        table = soup.select_one("table.contenttable")
        if not table:
            Path("debug.html").write_text(html, encoding="utf-8")
            raise RuntimeError("Turnier‑Table nicht gefunden! HTML in debug.html gespeichert")

        rows = table.select("tr")[1:]
        print(f"Gefundene Turniere: {len(rows)}")

        async with SessionLocal() as session:
            for r in rows:
                tds = r.select("td")[:5]

                datum = tds[0].get_text(strip=True)
                verband = tds[1].get_text(strip=True)
                kategorie = tds[2].get_text(strip=True)
                ort = tds[3].get_text(strip=True)

                geschlecht_tag = tds[4].select_one("a")
                geschlecht = geschlecht_tag.get_text(strip=True)

                href = geschlecht_tag["href"]
                external_id = href.split("id=")[1]

                start_datum, end_datum = parse_date_range(datum)
                #print(f"{external_id} | {start_datum} | {end_datum} | {verband} | {kategorie} | {ort} | {geschlecht}")
                stmt = insert(TournamentVVB).values(
                    datum_von= start_datum,
                    datum_bis = end_datum,
                    ort=ort,
                    gender=geschlecht,
                    kategorie= kategorie.replace("Kategorie", "").strip(),
                    ausrichter=verband,
                    external_id=external_id,
                    name="Landesverbandsturnier",
                    quelle="LV_DVV"
                )
            
                await session.execute(stmt)
            await session.commit()
    await browser.close()

if __name__ == "__main__":
     asyncio.run(scrape_tur_lv())
