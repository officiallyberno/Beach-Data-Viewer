import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from api.db import SessionLocal, TournamentVVB
from sqlalchemy.dialects.postgresql import insert

from scraper.dateUtils import parse_date_range
from scraper.tur_dvv_details import scrape_details_dvv

# Saison in URL anpassen wenn nötig
URL = "https://beach.volleyball-verband.de/public/tur.php?kat=1&bytyp=0&saison=26#"

# Reihenfolge der Detail-Scrapes
DETAIL_KINDS = [
    #"tur-show",    # Allgemeine Infos
   # "tur-info",    # Öffentliche Informationen
    "tur-ml",      # Meldeliste
    "tur-zu",      # Zulassung
    "tur-sl",      # Setzliste Hauptfeld
   # "tur-sp",      # Spielplan
    "tur-er",      # Ergebnisse / Platzierungen
   # "courtplan",   # Courtplan
]


async def scrape_tur_dvv():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # --- Turnierliste laden ---
        page = await browser.new_page()
        await page.goto(URL)
        await page.wait_for_selector("table.contenttable")
        html = await page.content()
        await page.close()

        soup  = BeautifulSoup(html, "lxml")
        table = soup.select_one("table.contenttable")
        if not table:
            Path("debug_dvv.html").write_text(html, encoding="utf-8")
            raise RuntimeError("Turnier-Tabelle nicht gefunden! HTML in debug_dvv.html gespeichert")

        rows = table.select("tr")[1:]  # Kopfzeile überspringen
        print(f"Gefundene DVV-Turniere: {len(rows)}")

        async with SessionLocal() as session:
            for r in rows:
                tds = r.select("td")
                if len(tds) < 5:
                    continue

                datum      = tds[0].get_text(strip=True)
                kategorie  = tds[1].get_text(strip=True)
                ort        = tds[2].get_text(strip=True)
                geschlecht = tds[3].get_text(strip=True)
                teams_raw  = tds[4].get_text(strip=True)
                teams      = -1 if teams_raw == "k.a." else int(teams_raw or -1)

                # externe ID aus dem Link in der Geschlecht-Spalte
                link_tag = tds[3].select_one("a")
                if not link_tag:
                    print(f"  ⚠  Kein Link gefunden für Zeile: {datum} {ort} – übersprungen")
                    continue
                external_id = link_tag["href"].split("id=")[1]

                start_datum, end_datum = parse_date_range(datum)
                print(f"→ {external_id} | {start_datum} | {kategorie} | {ort} | {geschlecht}")

                # Turnier in DB anlegen (on_conflict_do_nothing damit re-runs sicher sind)
                stmt = (
                    insert(TournamentVVB)
                    .values(
                        datum_von=start_datum,
                        datum_bis=end_datum,
                        ort=ort,
                        gender=geschlecht,
                        kategorie=kategorie.replace("Kategorie", "").strip(),
                        external_id=external_id,
                        name="Deutsche Tour",
                        quelle="DVV Turniere",
                        gemeldete_mannschaften=teams,
                    )
                    .on_conflict_do_nothing(index_elements=["external_id"])
                )
                await session.execute(stmt)
                await session.commit()

                # Detail-Seiten scrapen
                for kind in DETAIL_KINDS:
                    print(f"  Scrape {kind} …")
                    try:
                        await scrape_details_dvv(browser, session, external_id, kind)
                    except Exception as e:
                        print(f"  ✗  Fehler bei {kind} (id={external_id}): {e}")

        await browser.close()
        print("✅ DVV-Scraper abgeschlossen")


if __name__ == "__main__":
    asyncio.run(scrape_tur_dvv())