

from datetime import date, datetime
import re
import string
from bs4 import BeautifulSoup
from scraper.dateUtils import normalize_date_field, normalize_datetime_field, parse_date_range
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from api.db import TournamentTeam, TournamentVVB





async def scrape_registrations(browser, db: AsyncSession, external_tournament_id: int, kind: string):

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
        result = await db.execute(select(TournamentVVB.id).where(TournamentVVB.external_id == external_tournament_id))
        tournament_id = result.scalar_one_or_none()
  
        for tr in table.select("tbody tr"):
            tds = tr.select("td")
            if not tds:
                continue
            if len (tds) >1:
              name = tds[1].get_text(strip=True) # Name
              
              href=  tds[1].select_one("a").get("href") # TeamID
              start_index = href.find("beachTeamId=")
              if start_index != -1:
                start_index += len("beachTeamId=")
                rest = href[start_index:]
                end_index = rest.find("&")
              if end_index != -1:
                 beach_team_id = rest[:end_index]
              else:
                 beach_team_id = rest
            else:
              name = "Nicht bekannt"
              beach_team_id= -1
              anmeldedatum= None
            
            if len (tds) >2: # Verein
              verein = tds[2].get_text(strip=True)
            else:
              verein= "Unbekannt" 
            is_placeholder = (name.strip().lower() == "keine daten vorhanden") 
            
            if len(tds) > 3: # Anmeldezeitpunkt
              anmeldedatum_raw = tds[3].get_text(strip=True)
              anmeldedatum = datetime.strptime(anmeldedatum_raw, "%d.%m.%Y, %H:%M")

  
            team = TournamentTeam(
                tournament_id=int(tournament_id),
                mannschaftsname=name,
                verein=verein,
                anmeldedatum=anmeldedatum,
                status="Angemeldet",
                is_placeholder= is_placeholder, 
                external_mannschafts_id = int (beach_team_id)
            )

            db.add(team)
        await db.commit()

        
    elif kind in ("summary", "details"):
      scraped_data = {
        "name": None,
        "turnierhierarchie": None,
        "ort": None,
        "datum": None,
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
      
      result = await db.execute(select(TournamentVVB).where(TournamentVVB.external_id == external_tournament_id))
      tournament = result.scalar_one_or_none()

      for tr in table.select("tbody tr"):
        tds = tr.select("td")
        
        if len(tds) != 2:
          continue
        
        raw_key = tds[0].get_text(strip=True).rstrip(":")
        raw_value = tds[1].get_text(strip=True)
        #print(raw_key + raw_value)

        if not raw_key:
          continue

        normalized_key = raw_key.lower().strip()

        if normalized_key in ATTRIBUTE_MAP:
          db_field = ATTRIBUTE_MAP[normalized_key]
          scraped_data[db_field] = raw_value

        date_fields = ["zulassungstermin" ]  
        datetime_fields=["meldeschluss","start_hauptfeld", "termin_technical_meeting", "start_endspiele", "einschreibetermin"]
        
        for field in date_fields:
          scraped_data[field] = normalize_date_field(
          scraped_data.get(field),
          field_name=field
          )
        
        datum_raw = scraped_data.get("datum")
        if datum_raw:
          datum_von, datum_bis = parse_date_range(datum_raw)
          scraped_data["datum_von"] = datum_von
          scraped_data["datum_bis"] = datum_bis

        for field in datetime_fields:
          scraped_data[field] = normalize_datetime_field(
          scraped_data.get(field),
          field_name=field
          )

        int_fields = ["gemeldete_mannschaften","courts_hauptfeld","wildcards_hauptfeld", "anzahl_teams_hauptfeld", "anzahl_teams_qualifikation"]

        for field in int_fields:
          value = scraped_data.get(field)
          if isinstance(value, int):
            pass 
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
      
      
      for field, value in scraped_data.items():
          if value is not None:
                  setattr(tournament, field, value)
                  print(hasattr(tournament, field), field)
      
      
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

            dvv_lv_zulassung = parse_zulassungspunkte(punkte)

            
            await upsert_team(
                    db,
                    tournament_id=int(tournament_id),
                    name=name,
                    zulassung_reihenfolge=int(zulassung_reihenfolge),
                    status=status,
                    doppelmeldung=doppelmeldung,
                    punkte_zulassung=punkte,
                    dvv_punkte_zulassung= dvv_lv_zulassung[0],
                    lv_punkte_zulassung= dvv_lv_zulassung[1]
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
    "datum": "datum",
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




def parse_zulassungspunkte(text: str) -> tuple[int, int]:
    lv_match = re.search(r"LV.*?:\s*(\d+)", text)
    dvv_match = re.search(r"DVV.*?:\s*(\d+)", text)

    lv_punkte_zulassung = int(lv_match.group(1)) if lv_match else -1
    dvv_punkte_zulassung = int(dvv_match.group(1)) if dvv_match else -1

    return dvv_punkte_zulassung, lv_punkte_zulassung