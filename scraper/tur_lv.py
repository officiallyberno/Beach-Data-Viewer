import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from api.db import Tournament, SessionLocal
from sqlalchemy.dialects.postgresql import insert 
from datetime import datetime



URL = "https://beach.volleyball-verband.de/public/tur.php?kat=2&saison=25"

def parse_date_range(raw_datum: str):
    raw_datum = raw_datum.strip()

    try:
        if "-" in raw_datum:
            start_part, end_part = raw_datum.split("-")
            start_part = start_part.strip().rstrip(".")
            end_part = end_part.strip()

            # Jahr aus dem Enddatum extrahieren
            if len(end_part) == 10:  # Format "dd.mm.yyyy"
                year = end_part[-4:]
            elif len(end_part) == 5:  # Format "dd.mm"
                # Fallback: aktuelles Jahr
                year = str(datetime.today().year)
                end_part += f".{year}"
            else:
                raise ValueError(f"Enddatum-Format nicht erkannt: {end_part}")

            # Falls Startdatum kein Jahr enthält → Jahr hinzufügen
            if len(start_part) == 5:  # "dd.mm"
                start_part += f".{year}"

            # Jetzt beide in Date-Objekte umwandeln
            start_date = datetime.strptime(start_part, "%d.%m.%Y").date()
            end_date = datetime.strptime(end_part, "%d.%m.%Y").date()

        else:
            # Nur ein Datum → Start und Ende gleich
            start_date = datetime.strptime(raw_datum, "%d.%m.%Y").date()
            end_date = start_date

        return start_date, end_date

    except Exception as e:
        print(f"⚠ Fehler beim Parsen von '{raw_datum}': {e}")
        return None, None
    raw_datum = raw_datum.strip()
    try:
        if "-" in raw_datum:
            start_part, end_part = raw_datum.split("-")
            start_part = start_part.strip()
            end_part = end_part.strip()

            if "." not in end_part[:-4]:  # falls Enddatum nur Tag & Jahr enthält
                # Beispiel: "03.01. - 05.01.2025"
                year = end_part[-4:]
                if len(start_part) <= 6:  # nur Tag.Monat.
                    start_part += year
                if len(end_part) <= 6:
                    end_part += year
            else:
                # Beispiel: "03.01.2025 - 05.01.2025"
                pass

            start_date = datetime.strptime(start_part, "%d.%m.%Y").date()
            end_date = datetime.strptime(end_part, "%d.%m.%Y").date()
        else:
            # Nur ein Datum vorhanden → Start = Ende
            start_date = datetime.strptime(raw_datum, "%d.%m.%Y").date()
            end_date = start_date

        return start_date, end_date
    except Exception as e:
        print(f"⚠ Fehler beim Parsen von '{raw_datum}': {e}")
        return None, None

async def scrape():
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
            datum, verband, kategorie, ort, geschlecht = [
                c.get_text(strip=True) for c in r.select("td")[:5]
            ]
            start_datum, end_datum = parse_date_range(datum)
            print(f"{start_datum} | {end_datum} |{verband} | {kategorie} | {ort} | {geschlecht}")
            

            stmt = insert(Tournament).values(
                start_datum = start_datum,
                end_datum = end_datum,
                ort=ort,
                geschlecht=geschlecht,
                kategorie= kategorie.replace("Kategorie", "").strip(),
                veranstalter=verband
            )
            
            await session.execute(stmt)
        await session.commit()


if __name__ == "__main__":
     asyncio.run(scrape())
