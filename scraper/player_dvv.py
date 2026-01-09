import asyncio
from datetime import datetime
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from sqlalchemy import select
from api.db import SessionLocal, Player, RankingClean, Result


async def scrape_player(player_id: int):
    url = f"https://beach.volleyball-verband.de/public/spieler.php?id={player_id}"

    # Seite laden
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url)
        html = await page.content()
        await browser.close()

    soup = BeautifulSoup(html, "lxml")

    async with SessionLocal() as session:
        
        tables = soup.find_all("table")
        stammdaten_table = tables[3]  # erste Tabelle = allgemeine Daten
        ranking_table    = tables[5]  # zweite Tabelle = Ranglistenplätze
        results_table    = tables[6]

        external_id=0
        
        # --- Stammdaten ---
        stammdaten = {}
        rows = stammdaten_table.find_all("tr")
        for r in rows:
            cells = [c.get_text(strip=True) for c in r.find_all("td")]
            if len(cells) == 2:
                key, value = cells
                stammdaten[key] = value

        name = stammdaten.get("Name")
        vorname = stammdaten.get("Vorname")
        verein = stammdaten.get("Verein", None)
        lizenz = stammdaten.get("Lizenznummer", None)
        external_id=lizenz


        # Player upsert
        
        player = await session.scalar(
        select(Player).where(Player.external_id == player_id))        
        if not player:
            player = Player(
                external_id=player_id,
                last_name=name,
                first_name=vorname,
                club=verein,
                license_number=lizenz,
            )
            session.add(player)
            await session.flush()  # id holen
        

        # --- Ranglistenplätze ---
        rows = ranking_table.select("tr.tablesorter-hasChildRow")

        for row in rows:   # erste Zeile
          cells = row.find_all("td")


        for r in ranking_table.select("tr.tablesorter-hasChildRow"):
            cells = [c.get_text(strip=True) for c in r.find_all("td")]
            if len(cells) < 5:
                continue
            jahr, kategorie, datum_str, platz, punkte = cells
            datum = datetime.strptime(datum_str, "%d.%m.%Y").date()

            ranking = RankingClean(
                player_id=player.id,
                external_id=int(external_id),
                year=jahr,
                association=kategorie,
                date=datum,
                rank=platz,
                points=punkte,
            )
            session.add(ranking)

        # --- Ergebnisse ---
        for r in results_table.find("tbody").find_all("tr"):
            cells = [c.get_text(strip=True) for c in r.find_all("td")]
            if len(cells) < 7:
                continue

            classes = r.get("class", [])
            turnier_id = None
            for cls in classes:
                if cls.startswith("turnierid_"):
                    parts = cls.split("_")
                    if len(parts) >= 2:
                        turnier_id = parts[1]
                break

            datum_str, partner, turnier, ort, platz, punkte, kategorie = cells
            datum = datetime.strptime(datum_str, "%d.%m.%Y").date()

            result = Result(
                player_id=player.id,
                turnier_id=turnier_id,
                external_id=int(external_id),
                date=datum,
                partner=partner,
                tournament_name=turnier,
                location=ort,
                rank=platz,
                points=punkte,
                association=kategorie,
            )
            session.add(result)
            

        await session.commit()


if __name__ == "__main__":
    asyncio.run(scrape_player(55268))
