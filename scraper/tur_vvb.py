import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from api.db import TournamentVVB, SessionLocal
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime, date
import re

from scraper.utils import scrape_registrations

URL = "https://www.beachvolleybb.de/cms/home/beachtour/erwachsene/turniere.xhtml"




async def scrape():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(URL)
        await page.wait_for_selector("table.samsDataTable")
        html = await page.content()
        soup = BeautifulSoup(html, "lxml")

        table = soup.select_one("table.samsDataTable")
        if not table:
            Path("debug.html").write_text(html, encoding="utf-8")
            raise RuntimeError("Turnier-Tabelle nicht gefunden! HTML in debug.html gespeichert")

        rows = table.select("tr")[1:]
        print(f"Gefundene Turniere: {len(rows)}")

        async with SessionLocal() as session:
            for r in rows:
                tds = r.select("td")
                if not tds or len(tds) < 5:
                    continue
                cat, name, start_meldung, ort, geschlecht, teams, anmeldung= [c.get_text(strip=True) for c in tds[:7]]
                # Detail-Link extrahieren
                detail_url = None
                name_tag = tds[1].select_one("a") 
                if name_tag and name_tag.get("href"):
                    detail_url = "https://www.beachvolleybb.de" + name_tag["href"]

                # year =datetime.today().year 
                # meldeschluss = start_meldung.split("/")[1].strip()+str(year)
                # melde_date = datetime.strptime(meldeschluss, "%d.%m.%Y").date()

                # starttermin = start_meldung.split("/")[0].strip()+str(year)
                # start_date = datetime.strptime(starttermin, "%d.%m.%Y").date()
                mannschaften = int(teams.split(" / ")[0].strip())
                teams_hauptfeld = int(teams.split(" / ")[1].strip())

                match = re.search(r"tourneyId=(\d+)", detail_url)
                external_id = match.group(1) if match else None


                
                turnier_data = dict(
                    name=name,
                    kategorie=cat.replace("BB | Kategorie", "").strip(),
                    #starttermin=start_date,
                    #smeldeschluss=melde_date,
                    ort=ort,
                    gender=geschlecht,
                    anmeldung_url=detail_url,
                    gemeldete_mannschaften= mannschaften,
                    anzahl_teams_hauptfeld=teams_hauptfeld,
                    external_id=str (external_id)
                )

                
                stmt = insert(TournamentVVB).values(**turnier_data).returning(TournamentVVB.id)
                await session.execute(stmt)
                await scrape_registrations(browser, session, external_id, "summary")
                await scrape_registrations(browser, session, external_id, "details")
                await scrape_registrations(browser, session, external_id, "registrations")
                await scrape_registrations(browser, session, external_id, "admissions")
                await scrape_registrations(browser, session, external_id, "seeds")
                await scrape_registrations(browser, session, external_id, "rankings")
            await session.commit()



           

        await browser.close()


if __name__ == "__main__":
    asyncio.run(scrape())
