
from datetime import date, datetime
import re


DATETIME_FORMATS = [
    "%d.%m.%Y, %H:%M",  # 28.03.2026, 17:45
    "%d.%m.%Y %H:%M",   # 20.10.2025 12:00
]

def normalize_datetime_field(value, field_name=None):
    if isinstance(value, datetime):
        return value

    if isinstance(value, str):
        for fmt in DATETIME_FORMATS:
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue

        if field_name:
            print(f"Ungültiges Datetime im Feld {field_name}: {value}")
        return None

    return None
    
    
def normalize_date_field(value, field_name=None, fmt="%d.%m.%Y"):
    if isinstance(value, str):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            if field_name:
                print(f"Ungültiges Datum im Feld {field_name}: {value}")
            return None
    elif isinstance(value, date):
        return value
    else:
        return None
    
def parse_date(text: str) -> date | None:
    
    """Hilfsfunktion: dd.mm.yyyy -> date"""
    try:
        return datetime.strptime(text.strip(), "%d.%m.%Y").date()
    except Exception:
        return None
    

DATE_FORMAT = "%d.%m.%Y"

def parse_date_range(raw_datum: str):
    if not raw_datum:
        return None, None


    parts = re.split(r"\s*[-–]\s*", raw_datum, maxsplit=1)

    try:
        if len(parts) == 2:
            start_str, end_str = parts

            # year fix für unvollständige daten
            current_year = str(datetime.today().year)

            if len(start_str.strip()) == 5:  # dd.mm
                start_str = f"{start_str}.{current_year}"

            if len(end_str.strip()) == 5:
                end_str = f"{end_str}.{current_year}"

            start_date = datetime.strptime(start_str.strip(), DATE_FORMAT).date()
            end_date = datetime.strptime(end_str.strip(), DATE_FORMAT).date()

        else:
            start_date = datetime.strptime(parts[0].strip(), DATE_FORMAT).date()
            end_date = start_date

        return start_date, end_date

    except Exception as e:
        print(f"⚠ Fehler beim Parsen von '{raw_datum}': {e}")
        return None, None