

from datetime import date, datetime
import re
import string
from bs4 import BeautifulSoup
from scraper.dateUtils import normalize_date_field, normalize_datetime_field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from api.db import TournamentTeam, TournamentVVB


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
    Scrapt die Registrations eines Turniers und speichert sie direkt in die API.
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
    
    elif kind in ("summary", "details"):
      for tr in table.select("tbody tr"):
        tds = tr.select("td")
        
        if len(tds) != 2:
          continue
        
        raw_key = tds[0].get_text(strip=True).rstrip(":")
        raw_value = tds[1].get_text(strip=True)
        print(raw_key + raw_value)

        if not raw_key:
          continue

        normalized_key = raw_key.lower().strip()

        if normalized_key in ATTRIBUTE_MAP:
          db_field = ATTRIBUTE_MAP[normalized_key]
          scraped_data[db_field] = raw_value

        date_fields = ["starttermin", "zulassungstermin" ]  
        datetime_fields=["meldeschluss","start_hauptfeld", "termin_technical_meeting", "start_endspiele", "einschreibetermin"]
        
        for field in date_fields:
          scraped_data[field] = normalize_date_field(
          scraped_data.get(field),
          field_name=field
          )

        for field in datetime_fields:
          scraped_data[field] = normalize_datetime_field(
          scraped_data.get(field),
          field_name=field
          )

        int_fields = ["gemeldete_mannschaften","courts_hauptfeld","wildcards_hauptfeld", "anzahl_teams_hauptfeld", "anzahl_teams_qualifikation"]

        for field in int_fields:
          value = scraped_data.get(field)
          if isinstance(value, int):
            pass  # schon korrekt
          elif isinstance(value, str):
            try:
              scraped_data[field] = int(value)
            except ValueError:
              print(f"Ungültiger Integer im Feld {field}: {value}")
              scraped_data[field] = None
          else:
                scraped_data[field] = None

      
      span = table.find_next("span", class_="samsCmsComponentBlock")
      if span:
        scraped_data["oeffentliche_informationen"] = span.get_text(strip=True)
      
        

      result = await db.execute(select(TournamentVVB).where(TournamentVVB.external_id == external_tournament_id))
      tournament = result.scalar_one_or_none()

      if tournament:
          for field, value in scraped_data.items():
              if value is not None:
                  setattr(tournament, field, value)
                  print(hasattr(tournament, field), field)
      else:
          tournament = TournamentVVB(
              external_id=external_tournament_id,
              **scraped_data
          )
          db.add(tournament)
          await db.commit()
      
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


ATTRIBUTE_MAP = {
   
    # Basis
    "turnier": "name",
    "turnierhierarchie": "turnierhierarchie",
    "ort": "ort",
    "datum": "starttermin",
    "geschlecht": "gender",
    "ausrichter": "ausrichter",
    "kontakt": "kontakt",
    "altersklasse": "altersklasse",

    # Termine
    "meldeschluss": "meldeschluss",
    "einschreibetermin": "einschreibetermin",
    "start hauptfeld": "start_hauptfeld",
    "start endspiele": "start_endspiele",
    "termin technical meeting": "termin_technical_meeting",
    "ort technical meeting": "ort_technical_meeting",
    "zulassungstermin": "zulassungstermin",

    # Teams / Felder
    "gemeldete mannschaften": "gemeldete_mannschaften",
    "anzahl teams hauptfeld": "anzahl_teams_hauptfeld",
    "anzahl teams qualifikation": "anzahl_teams_qualifikation",
    "anzahl wildcards hauptfeld": "wildcards_hauptfeld",
    "anzahl spielfelder hauptfeld": "courts_hauptfeld",

    # Sonstiges
    "zulassungsreihenfolge": "zulassungsreihenfolge",
    "preisgeld": "preisgeld",
    "startgeld": "startgeld",
    "kaution": "kaution",
    "sachpreise":"sachpreise",
    "anmerkungen":"anmerkungen",
    "turniermodus":"turniermodus",
}


scraped_data = {
    "name": None,
    "turnierhierarchie": None,
    "ort": None,
    "starttermin": None,
    "gender": None,
    "ausrichter": None,
    "contact": None,
    "altersklasse": None,

    "registration_deadline": None,
    "einschreibetermin": None,
    "start_hauptfeld": None,
    "start_endspiele": None,
    "termin_technical_meeting": None,
    "ort_technical_meeting": None,
    "zulassungstermin": None,
    "meldeschluss":None,

    "gemeldete_mannschaften": None,
    "anzahl_teams_hauptfeld": None,
    "anzahl_teams_qualifikation": None,
    "wildcards_hauptfeld": None,
    "courts_hauptfeld": None,

    "zulassungsreihenfolge": None,
    "preisgeld": None,
    "startgeld": None,
    "kaution": None,
    "oeffentliche_informationen":None,
    "sachpreise":None,
    "anmerkungen":None,
    "turniermodus":None,
}