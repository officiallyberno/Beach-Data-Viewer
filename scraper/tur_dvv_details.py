from datetime import date, datetime
import re
import string
from bs4 import BeautifulSoup
from scraper.dateUtils import normalize_date_field, normalize_datetime_field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from api.db import TournamentTeam, TournamentVVB




async def scrape_details_dvv(browser, db: AsyncSession, external_tournament_id: int, kind: string):

    url = (
        "https://beach.volleyball-verband.de/public/{kind}.php?id={external_tournament_id}"
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
    
    
  
       
    
    

   