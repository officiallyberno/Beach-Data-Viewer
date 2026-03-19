import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from api.db import SessionLocal, TournamentVVB
from sqlalchemy.dialects.postgresql import insert 
from datetime import datetime

from scraper.dateUtils import parse_date_range
from scraper.tur_dvv_details import scrape_details_dvv




URL = "https://beach.volleyball-verband.de/public/tur.php?kat=1&bytyp=0&saison=25#"



async def scrape_tur_dvv():
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
                kategorie = tds[1].get_text(strip=True)
                ort = tds[2].get_text(strip=True)
                geschlecht = tds[3].get_text(strip=True)
                teams = tds[4].get_text(strip=True)

                geschlecht_tag = tds[3].select_one("a")
                href = geschlecht_tag["href"]
                external_id = href.split("id=")[1]

                start_datum, end_datum = parse_date_range(datum)
                print(f"{external_id} | {start_datum} | {end_datum} | {kategorie} | {ort} | {geschlecht} | {teams}")
                stmt = insert(TournamentVVB).values(
                    datum_von= start_datum,
                    datum_bis= end_datum,
                    ort=ort,
                    gender=geschlecht,
                    kategorie= kategorie.replace("Kategorie", "").strip(),
                    external_id=external_id,
                    name="Deutsche Tour",
                    quelle="DVV Turniere",
                    gemeldete_mannschaften= int(teams)
                )
            
                await session.execute(stmt)
                await scrape_details_dvv(browser, session, external_id, "tur-show") #Allgemein
                await scrape_details_dvv(browser, session, external_id, "tur-info") #Informationen
                await scrape_details_dvv(browser, session, external_id, "tur-ml") #Meldeliste
                await scrape_details_dvv(browser, session, external_id, "tur-zu") #Zulassung
                await scrape_details_dvv(browser, session, external_id, "courtplan") #Courtplan
                await scrape_details_dvv(browser, session, external_id, "tur-sl") #Setzliste HF (für Quali: &feld=2)
                await scrape_details_dvv(browser, session, external_id, "tur-sp") #Spiele HF (für Quali: &feld=2)
                await scrape_details_dvv(browser, session, external_id, "tur-er") #Ergebnisse HF (für Quali: &feld=2)
            await session.commit()
    await browser.close()

if __name__ == "__main__":
     asyncio.run(scrape_tur_dvv())
