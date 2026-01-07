

from datetime import date, datetime
import re
import string
from bs4 import BeautifulSoup




from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from api.db import TournamentTeam, TournamentVVB

def parse_date(text: str) -> date | None:
    
    """Hilfsfunktion: dd.mm.yyyy -> date"""
    try:
        return datetime.strptime(text.strip(), "%d.%m.%Y").date()
    except Exception:
        return None


def parse_date_range(raw_datum: str):
    raw_datum = raw_datum.strip()
    try:
        if "-" in raw_datum:
            start_part, end_part = raw_datum.split("-")
            start_part = start_part.strip().rstrip(".")
            end_part = end_part.strip()

            if len(end_part) == 10:  # dd.mm.yyyy
                year = end_part[-4:]
            elif len(end_part) == 5:  # dd.mm
                year = str(datetime.today().year)
                end_part += f".{year}"
            else:
                year = str(datetime.today().year)

            if len(start_part) == 5:
                start_part += f".{year}"

            start_date = datetime.strptime(start_part, "%d.%m.%Y").date()
            end_date = datetime.strptime(end_part, "%d.%m.%Y").date()
        else:
            start_date = datetime.strptime(raw_datum, "%d.%m.%Y").date()
            end_date = start_date
        return start_date, end_date
    except Exception as e:
        print(f"⚠ Fehler beim Parsen von '{raw_datum}': {e}")
        return None, None


async def insert_teams(db: AsyncSession, tournament_id: int, registrations: list[dict]):
    for reg in registrations:
        # Pflichtfeld Mannschaftsname prüfen, sonst überspringen
        name = reg.get("Mannschaftsname") or reg.get("team") or "Unbekannt"
        if not name.strip():
            continue

        # Optional: Datum parsen
        anmeldedatum_raw = reg.get("angemeldet am")
        anmeldedatum = None
        if anmeldedatum_raw:
            try:
                anmeldedatum = datetime.strptime(anmeldedatum_raw, "%d.%m.%Y").date()
            except ValueError:
                anmeldedatum = None  # wenn das Datum ungültig ist

        team = TournamentTeam(
            tournament_id=tournament_id,
            mannschaftsname=name,
            mannschafts_id=reg.get("teamid"),
            verein=reg.get("Verein"),
            anmeldedatum=anmeldedatum,
            status="angemeldet"  # default-Status, kann man anpassen
        )

        db.add(team)

    await db.commit()





async def scrape_registrations(browser, db: AsyncSession, external_tournament_id: int, kind: string):
    """
    Scrapt die Registrations eines Turniers und speichert sie direkt in die DB.
    """
    url = (
        f"https://www.beachvolleybb.de/cms/home/beachtour/erwachsene/turniere.xhtml"
        f"?BeachTourneyComponent.view={kind}&BeachTourneyComponent.tourneyId={external_tournament_id}#samsCmsComponent_49930769"
    )

    page = await browser.new_page()
    await page.goto(url)
    await page.wait_for_selector("table.samsDataTable")
    html = await page.content()

    soup = BeautifulSoup(html, "lxml")
    await page.close()

    tables = soup.select("table.samsDataTable")
    table = tables[0]
    if len(tables)<2:
        return  # keine Tabelle gefunden → nichts einfügen
    
    if(kind == "registrations"):
       
        for tr in table.select("tbody tr"):
            tds = tr.select("td")
            if not tds:
                continue
            if len (tds) >1:
              name = tds[1].get_text(strip=True)
            else:
              name = "Nicht bekannt"
            if len (tds) >2:
              verein = tds[2].get_text(strip=True)
            else:
              verein= "Unbekannt"
            is_placeholder = (name.strip().lower() == "keine daten vorhanden") 
            # Fallback: falls es weniger als 4 <td> gibt, benutze heute als Datum
            if len(tds) > 3:
              anmeldedatum_raw = tds[3].get_text(strip=True).split(",")[0]
              try:
                anmeldedatum = datetime.strptime(anmeldedatum_raw, "%d.%m.%Y").date()
              except ValueError:
                anmeldedatum = datetime.today().date()
            else:
              anmeldedatum = datetime.today().date()
            result = await db.execute(
              select(TournamentVVB.id).where(TournamentVVB.external_id == external_tournament_id)
            )
            tournament_id = result.scalar_one_or_none()


            team = TournamentTeam(
                tournament_id=int(tournament_id),
                mannschaftsname=name,
                mannschafts_id=22,
                verein=verein,
                anmeldedatum=anmeldedatum,
                status="Angemeldet",
                is_placeholder= is_placeholder
            )

            db.add(team)
    elif(kind == "summary"):
       for tr in table.select("tbody tr"):
            tds = tr.select("td")
            
            if not tds:
                continue
            if len(tds) > 1 and tds[0].get_text(strip=True)!='':
              zulassung_reihenfolge=str(tds[0].get_text(strip=True))
            else:
              zulassung_reihenfolge =-1
            
            if len (tds) >1:
              name = tds[1].get_text(strip=True)
            else:
              name = "Nicht bekannt"
            
            if len(tds) > 3:
              status = tds[3].get_text(strip=True)
            else:
              status = "Angemeldet"
            if len(tds) > 4:
              doppelmeldung = tds[4].get_text(strip=True)
            else:
              doppelmeldung = "Nein"
            if len(tds) > 5:
              punkte = tds[5].get_text(strip=True)
            else:
              punkte = "Keine Informationen"
            result = await db.execute(select(TournamentVVB.id).where(TournamentVVB.external_id == external_tournament_id))
            tournament_id = result.scalar_one_or_none()

    elif(kind=="admissions"):
       for tr in table.select("tbody tr"):
            tds = tr.select("td")
            
            if not tds:
                continue
            if len(tds) > 1 and tds[0].get_text(strip=True)!='':
              zulassung_reihenfolge=str(tds[0].get_text(strip=True))
            else:
              zulassung_reihenfolge =-1
            
            if len (tds) >1:
              name = tds[1].get_text(strip=True)
            else:
              name = "Nicht bekannt"
            
            if len(tds) > 3:
              status = tds[3].get_text(strip=True)
            else:
              status = "Angemeldet"
            if len(tds) > 4:
              doppelmeldung = tds[4].get_text(strip=True)
            else:
              doppelmeldung = "Nein"
            if len(tds) > 5:
              punkte = tds[5].get_text(strip=True)
            else:
              punkte = "Keine Informationen"
            result = await db.execute(select(TournamentVVB.id).where(TournamentVVB.external_id == external_tournament_id))
            tournament_id = result.scalar_one_or_none()
            
            await upsert_team(
                    db,
                    tournament_id=int(tournament_id),
                    name=name,
                    zulassung_reihenfolge=int(zulassung_reihenfolge),
                    status=status,
                    doppelmeldung=doppelmeldung,
                    punkte_zulassung=punkte,
                )
    
    elif(kind=="seeds"):
       for tr in table.select("tbody tr"):
            tds = tr.select("td")
            
            if not tds:
                continue
            if len(tds) > 1 and tds[0].get_text(strip=True)!='':
              setzung_reihenfolge=str(tds[0].get_text(strip=True))
            else:
              setzung_reihenfolge =-1
            
            if len (tds) >1:
              name = tds[1].get_text(strip=True)
            else:
              name = "Nicht bekannt"
            if len(tds) > 5:
              punkte = tds[5].get_text(strip=True)
            else:
              punkte = "Keine Informationen"

            result = await db.execute(select(TournamentVVB.id).where(TournamentVVB.external_id == external_tournament_id))
            tournament_id = result.scalar_one_or_none()

            await upsert_team(
                    db,
                    tournament_id,
                    name=name,
                    setzung_reihenfolge= int(setzung_reihenfolge),
                    punkte_setzung=punkte,
                )
    
    elif(kind=="rankings"):
       for tr in table.find("tbody").find_all("tr", recursive=False):
            tds = tr.find_all("td", recursive=False)
            
            if not tds:
                continue
            if len(tds) > 1 and tds[0].get_text(strip=True)!='':
              platzierung=str(tds[0].get_text(strip=True))
            else:
              platzierung =-1
            
            if len (tds) >1:
              name = tds[1].get_text(strip=True)
            else:
              name = "Nicht bekannt"
            if len(tds) > 4:
              punkte = tds[4].get_text(strip=True)
            else:
              punkte = "Keine Informationen"

            result = await db.execute(select(TournamentVVB.id).where(TournamentVVB.external_id == external_tournament_id))
            tournament_id = result.scalar_one_or_none()

            await upsert_team(
                    db,
                    tournament_id,
                    name=name,
                    platzierung= int(platzierung),
                    punkte_pro_spieler=punkte,
                )
           


    await db.commit()


async def upsert_team(db, tournament_id, name, **kwargs):
    result = await db.execute(
        select(TournamentTeam).where(
            TournamentTeam.tournament_id == tournament_id,
            TournamentTeam.mannschaftsname == name
        )
    )
    team = result.scalar_one_or_none()

    if team:
        for key, value in kwargs.items():
            setattr(team, key, value)
    else:
        team = TournamentTeam(tournament_id=tournament_id, mannschaftsname=name, **kwargs)
        db.add(team)

    await db.commit()
    return team
