# scraper/tur_dvv_details.py
from datetime import datetime
import re
import string
from urllib.parse import parse_qs, urlparse
from bs4 import BeautifulSoup
from scraper.dateUtils import (
    normalize_date_field,
    normalize_datetime_field,
    parse_date_range,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from api.db import TournamentTeam, TournamentVVB


# ---------------------------------------------------------------------------
# URL-Builder
# ---------------------------------------------------------------------------

def _build_url(kind: str, external_id: str) -> str:
    # Courtplan hat einen anderen Pfad
    if kind == "courtplan":
        return f"https://beach.volleyball-verband.de/public/courtplan.php?id={external_id}"
    return f"https://beach.volleyball-verband.de/public/{kind}.php?id={external_id}"


# ---------------------------------------------------------------------------
# Haupt-Scraper
# ---------------------------------------------------------------------------

async def scrape_details_dvv(
    browser, db: AsyncSession, external_tournament_id: str, kind: str
):
    url = _build_url(kind, external_tournament_id)

    page = await browser.new_page()
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        # Warte auf irgendeine Tabelle — manche Seiten haben keine
        try:
            if kind == "tur-er":
                await page.wait_for_selector("table", timeout=8_000)
            else:
                await page.wait_for_selector("table.contenttable", timeout=8_000)
        except Exception:
            print(f"  ⚠  Keine contenttable für {kind} (id={external_tournament_id}) – übersprungen")
            return
        html = await page.content()
    finally:
        await page.close()

    soup = BeautifulSoup(html, "lxml")

    # Turnier aus DB holen (wird von fast allen Branches gebraucht)
    result = await db.execute(
        select(TournamentVVB).where(
            TournamentVVB.external_id == str(external_tournament_id)
        )
    )
    tournament = result.scalar_one_or_none()
    if not tournament:
        print(f"  ⚠  Turnier {external_tournament_id} nicht in DB – übersprungen")
        return

    # -----------------------------------------------------------------------
    if kind == "tur-show":
        await _scrape_allgemein(soup, tournament, db)

    elif kind == "tur-info":
        await _scrape_info(soup, tournament, db)

    elif kind == "tur-ml":
        await _scrape_meldeliste(soup, tournament, db)

    elif kind == "tur-zu":
        await _scrape_zulassung(soup, tournament, db)

    elif kind == "tur-sl":
        await _scrape_setzliste(soup, tournament, db)

    elif kind == "tur-sp":
        await _scrape_spiele(soup, tournament, db)

    elif kind == "tur-er":
        await _scrape_ergebnisse(soup, tournament, db)

    elif kind == "courtplan":
        await _scrape_courtplan(soup, tournament, db)


# ---------------------------------------------------------------------------
# tur-show  →  Allgemeine Turnierdaten (Key-Value-Tabelle)
# ---------------------------------------------------------------------------

ALLGEMEIN_MAP = {
    "turnier":                          "name",
    "turnierhierarchie":                "turnierhierarchie",
    "ort":                              "ort",
    "datum":                            "datum",          # wird zu datum_von / datum_bis
    "geschlecht":                       "gender",
    "ausrichter":                       "ausrichter",
    "kontakt":                          "kontakt",
    "altersklasse":                     "altersklasse",
    "meldeschluss":                     "meldeschluss",
    "einschreibetermin":                "einschreibetermin",
    "start hauptfeld":                  "start_hauptfeld",
    "start endspiele":                  "start_endspiele",
    "termin technical meeting":         "termin_technical_meeting",
    "ort technical meeting":            "ort_technical_meeting",
    "zulassungstermin":                 "zulassungstermin",
    "ranglisteneingang":                "ranglisteneingang",
    "gemeldete mannschaften":           "gemeldete_mannschaften",
    "anzahl teams hauptfeld":           "anzahl_teams_hauptfeld",
    "anzahl teams qualifikation":       "anzahl_teams_qualifikation",
    "anzahl teams hf aus quali":        "anzahl_teams_hauptfeld_aus_qualifikation",
    "anzahl wildcards hauptfeld":       "wildcards_hauptfeld",
    "anzahl spielfelder hauptfeld":     "courts_hauptfeld",
    "zulassungsreihenfolge":            "zulassungsreihenfolge",
    "turniermodus":                     "turniermodus",
    "preisgeld":                        "preisgeld",
    "startgeld":                        "startgeld",
    "kaution":                          "kaution",
    "sachpreise":                       "sachpreise",
    "anmerkungen":                      "anmerkungen",
    "verpflegungshinweise":             "verpflegungshinweise",
    "links":                            "links",
    # GBT-spezifische Felder
    "sportorganisatorische leitung":    "sportorganisatorische_leitung",
    "teilnehmer":                       "teilnehmer",
    "preisgeld infos":                  "preisgeld_infos",
    "ausrichter infos":                 "ausrichter_infos",
    "startgeld infos":                  "startgeld_infos",
    "kaution infos":                    "kaution_infos",
    "übernachtung":                     "uebernachtung",
    "physio":                           "physio",
    "livestream":                       "livestream",
    "einschreibung":                    "einschreibung",
    "trikots":                          "trikots",
    "spielort":                         "spielort",
    "akkreditierungen":                 "akkreditierungen",
    "autoanreise":                      "autoanreise",
    "parkmöglichkeiten":                "parkmöglichkeiten",
    "bahnanreise":                      "bahnanreise",
    "trainingsmöglichkeiten":           "trainingsmöglichkeiten",
    "tickets":                          "tickets",
    "zeitplan":                         "zeitplan",
}

DATE_FIELDS     = {"zulassungstermin", "ranglisteneingang"}
DATETIME_FIELDS = {
    "meldeschluss", "einschreibetermin", "start_hauptfeld",
    "start_endspiele", "termin_technical_meeting",
}
INT_FIELDS = {
    "gemeldete_mannschaften", "anzahl_teams_hauptfeld",
    "anzahl_teams_qualifikation", "anzahl_teams_hauptfeld_aus_qualifikation",
    "wildcards_hauptfeld", "courts_hauptfeld",
}


# async def _scrape_allgemein(soup, tournament, db):
#     scraped: dict = {}

#     # Key-Value-Tabelle auslesen
#     for table in soup.select("table.contenttable"):
#         for tr in table.select("tr"):
#             tds = tr.select("td")
#             if len(tds) != 2:
#                 continue
#             key   = tds[0].get_text(strip=True).rstrip(":").lower().strip()
#             value = tds[1].get_text(strip=True)
#             if not key or not value:
#                 continue
#             if key in ALLGEMEIN_MAP:
#                 scraped[ALLGEMEIN_MAP[key]] = value

#     # datum → datum_von / datum_bis
#     if "datum" in scraped:
#         dv, db_ = parse_date_range(scraped.pop("datum"))
#         if dv:
#             scraped["datum_von"] = dv
#         if db_:
#             scraped["datum_bis"] = db_

#     # Typ-Normalisierung
#     for f in DATE_FIELDS:
#         if f in scraped:
#             scraped[f] = normalize_date_field(scraped[f], field_name=f)

#     for f in DATETIME_FIELDS:
#         if f in scraped:
#             scraped[f] = normalize_datetime_field(scraped[f], field_name=f)

#     for f in INT_FIELDS:
#         if f in scraped:
#             v = scraped[f]
#             try:
#                 scraped[f] = int(str(v).strip()) if v is not None else None
#             except ValueError:
#                 print(f"  ⚠  Ungültiger Integer in {f}: {v}")
#                 scraped[f] = None

#     # Auf Turnier-Objekt schreiben
#     for field, value in scraped.items():
#         if value is not None and hasattr(tournament, field):
#             setattr(tournament, field, value)

#     await db.commit()
#     print(f"  ✓  tur-show: {len(scraped)} Felder gespeichert")


# ---------------------------------------------------------------------------
# tur-info  →  Öffentliche Informationen (Freitext)
# ---------------------------------------------------------------------------

# async def _scrape_info(soup, tournament, db):
#     # DVV zeigt Infotexte oft in <p>-Tags oder einer einfachen Tabelle
#     paras = soup.select("div.content p, td.content")
#     text  = "\n".join(p.get_text(strip=True) for p in paras if p.get_text(strip=True))
#     if text:
#         tournament.oeffentliche_informationen = text
#         await db.commit()
#         print(f"  ✓  tur-info: {len(text)} Zeichen")


# ---------------------------------------------------------------------------
# tur-ml  →  Meldeliste
# ---------------------------------------------------------------------------

async def _scrape_meldeliste(soup, tournament, db):
    table = soup.select_one("table.contenttable")
    if not table:
        return

    count = 0

    rows = table.select("tbody > tr")
    if not rows:
        rows = table.select("tr")

    for tr in rows:
        # Kopfzeilen überspringen
        if tr.find("th"):
            continue

        tds = tr.find_all("td")
        if len(tds) < 2:
            continue

        # Überschrift "Anmeldungen" überspringen
        if len(tds) == 1:
            continue

        name_raw = tds[0].get_text(strip=True)
        if not name_raw or name_raw.lower() == "team":
            continue

        verein = tds[1].get_text(strip=True) or None
        bemerkung = tds[2].get_text(strip=True) if len(tds) > 2 else None

        # externe Team-ID
        ext_id = None
        link_tag = tds[0].find("a")
        if link_tag and link_tag.get("href"):
            m = re.search(r"id=(\d+)", link_tag["href"])
            if m:
                ext_id = int(m.group(1))

        is_placeholder = (
            name_raw.strip().lower() == "keine daten vorhanden"
        )

        await _upsert_team(
            db,
            tournament_id=tournament.id,
            name=name_raw,
            verein=verein,
            status="Angemeldet",
            is_placeholder=is_placeholder,
            external_mannschafts_id=ext_id,
        )

        count += 1

    await db.commit()
    print(f"  ✓  tur-ml: {count} Teams")


# ---------------------------------------------------------------------------
# tur-zu  →  Zulassungsliste
# ---------------------------------------------------------------------------

async def _scrape_zulassung(soup, tournament, db):
    table = soup.select_one("table.contenttable")
    if not table:
        return

    count = 0
    aktueller_status = None

    rows = table.select("tbody > tr")
    if not rows:
        rows = table.select("tr")

    for tr in rows:
        tds = tr.find_all("td")
        if not tds:
            continue

        # Abschnittsüberschriften
        if len(tds) == 1 and tds[0].has_attr("colspan"):
            aktueller_status = tds[0].get_text(strip=True)
            continue

        # Tabellenkopf
        if tds[0].get_text(strip=True) == "Nr.":
            continue

        if len(tds) < 7:
            continue

        try:
            reihenfolge = int(tds[0].get_text(strip=True))
        except ValueError:
            continue

        name = tds[1].get_text(strip=True)
        verein = tds[2].get_text(strip=True) or None
        punkte_raw = tds[3].get_text(strip=True)
        zulassung_nach = tds[4].get_text(strip=True)
        wildcard = tds[5].get_text(strip=True) or None
        doppelm = tds[6].get_text(strip=True) or None

        dvv_p, lv_p = _parse_zulassungspunkte(punkte_raw)

        # Team-ID
        ext_id = None
        link = tds[1].find("a")
        if link and link.get("href"):
            m = re.search(r"id=(\d+)", link["href"])
            if m:
                ext_id = int(m.group(1))

        await _upsert_team(
            db,
            tournament_id=tournament.id,
            name=name,
            verein=verein,
            zulassung_reihenfolge=reihenfolge,

            # Hauptfeld / Qualifikation / Absage/Nachrücker
            status=aktueller_status,

            doppelmeldung=doppelm,

            punkte_zulassung=punkte_raw,
            dvv_punkte_zulassung=dvv_p,
            lv_punkte_zulassung=lv_p,

            external_mannschafts_id=ext_id,

            # falls vorhanden
            zulassung_nach=zulassung_nach,
            wildcard=wildcard,
        )

        count += 1

    await db.commit()
    print(f"  ✓  tur-zu: {count} Teams")

# ---------------------------------------------------------------------------
# tur-sl  →  Setzliste
# ---------------------------------------------------------------------------

async def _scrape_setzliste(soup, tournament, db):
    table = soup.select_one("table.contenttable")
    if not table:
        return

    count = 0
    for tr in table.select("tbody tr, tr"):
        tds = tr.select("td")
        if len(tds) < 2:
            continue

        try:
            setzung = int(tds[0].get_text(strip=True))
        except ValueError:
            continue

        name   = tds[1].get_text(strip=True)
        # Punkte stehen je nach Seite in Spalte 2 oder 5
        punkte = tds[3].get_text(strip=True) if len(tds) > 2 else ""

        await _upsert_team(
            db,
            tournament_id=tournament.id,
            name=name,
            setzung_reihenfolge=setzung,
            punkte_setzung=punkte,
        )
        count += 1

    await db.commit()
    print(f"  ✓  tur-sl: {count} Teams")


# ---------------------------------------------------------------------------
# tur-sp  →  Spielplan
# ---------------------------------------------------------------------------

# async def _scrape_spiele(soup, tournament, db):
#     """
#     Spielplan-Tabelle: Datum | Zeit | Court | Team1 | Team2 | Ergebnis
#     Wir speichern die Matches in TournamentMatch (falls gewünscht).
#     Vorerst werden die Rohdaten geloggt – die Match-Logik kann hier
#     einfach eingehängt werden sobald TournamentMatch befüllt werden soll.
#     """
#     table = soup.select_one("table.contenttable")
#     if not table:
#         return

#     matches_raw = []
#     for tr in table.select("tbody tr, tr"):
#         tds = tr.select("td")
#         if len(tds) < 4:
#             continue
#         row = [td.get_text(strip=True) for td in tds]
#         # Kopfzeilen überspringen
#         if row[0].lower() in ("datum", "tag", "nr."):
#             continue
#         matches_raw.append(row)

#     print(f"  ✓  tur-sp: {len(matches_raw)} Spiele gefunden (noch nicht in DB gespeichert)")
#     # TODO: TournamentMatch-Objekte anlegen sobald Match-Scraping aktiviert wird


# ---------------------------------------------------------------------------
# tur-er  →  Ergebnisse / Platzierungen
# ---------------------------------------------------------------------------

async def _scrape_ergebnisse(soup, tournament, db):
    table = None

    # richtige Tabelle über Kopfzeile suchen
    for t in soup.find_all("table"):
        header = t.find("tr", class_="bez")

        if header:
            headers = [
                td.get_text(" ", strip=True)
                for td in header.find_all("td")
            ]

            if "Platz" in headers and "Team" in headers:
                table = t
                break

    if not table:
        print("  ⚠ Ergebnistabelle nicht gefunden")
        return

    count = 0

    for tr in table.find_all("tr"):
        tds = tr.find_all("td")

        if len(tds) < 4:
            continue

        # Kopfzeile überspringen
        platz_text = tds[0].get_text(" ", strip=True)

        if not platz_text.isdigit():
            continue

        platzierung = int(platz_text)

        # Teamname
        name = tds[1].get_text(" ", strip=True)

        # Punkte
        punkte_pro_sp = tds[3].get_text(" ", strip=True)

        await _upsert_team(
            db,
            tournament_id=tournament.id,
            name=name,
            platzierung=platzierung,
            punkte_pro_spieler=punkte_pro_sp,
        )

        count += 1

    await db.commit()

    print(f"  ✓ Ergebnisse: {count} Platzierungen")


# ---------------------------------------------------------------------------
# courtplan  →  Court-Belegungsplan (nur loggen, kein eigenes Modell)
# ---------------------------------------------------------------------------

# async def _scrape_courtplan(soup, tournament, db):
#     table = soup.select_one("table.contenttable")
#     rows  = table.select("tr") if table else []
#     print(f"  ✓  courtplan: {len(rows)} Zeilen gefunden (kein DB-Speicher vorgesehen)")


# ---------------------------------------------------------------------------
# Hilfsfunktionen
# ---------------------------------------------------------------------------

async def _upsert_team(db, tournament_id: int, name: str, **kwargs):
    """Legt Team an oder aktualisiert vorhandenes."""
    result = await db.execute(
        select(TournamentTeam).where(
            TournamentTeam.tournament_id == tournament_id,
            TournamentTeam.mannschaftsname == name,
        )
    )
    team = result.scalar_one_or_none()
    if team:
        for k, v in kwargs.items():
            if v is not None:
                setattr(team, k, v)
    else:
        team = TournamentTeam(
            tournament_id=tournament_id, mannschaftsname=name, **{k: v for k, v in kwargs.items() if v is not None}
        )
        db.add(team)
    return team


def _parse_zulassungspunkte(text: str) -> tuple[int, int]:
    lv_m  = re.search(r"LV.*?:\s*(\d+)", text)
    dvv_m = re.search(r"DVV.*?:\s*(\d+)", text)
    return (
        int(dvv_m.group(1)) if dvv_m else -1,
        int(lv_m.group(1))  if lv_m  else -1,
    )