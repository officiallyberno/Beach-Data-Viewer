
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

    parts = re.split(r"\s*[-–]\s*", raw_datum.strip(), maxsplit=1)

    try:
        if len(parts) == 2:
            start_str, end_str = [p.strip() for p in parts]

            # Enddatum zuerst parsen bzw. Jahr ermitteln
            end_year = None

            match = re.match(r"^\d{2}\.\d{2}\.(\d{4})$", end_str)
            if match:
                end_year = match.group(1)

            current_year = str(datetime.today().year)
            year_to_use = end_year or current_year

            # Formate wie "20.09." oder "20.09"
            if re.match(r"^\d{2}\.\d{2}\.?$", start_str):
                start_str = f"{start_str.rstrip('.')}.{year_to_use}"

            if re.match(r"^\d{2}\.\d{2}\.?$", end_str):
                end_str = f"{end_str.rstrip('.')}.{year_to_use}"

            start_date = datetime.strptime(start_str, DATE_FORMAT).date()
            end_date = datetime.strptime(end_str, DATE_FORMAT).date()

        else:
            date_str = parts[0].strip()

            if re.match(r"^\d{2}\.\d{2}\.?$", date_str):
                date_str = f"{date_str.rstrip('.')}.{datetime.today().year}"

            start_date = datetime.strptime(date_str, DATE_FORMAT).date()
            end_date = start_date

        return start_date, end_date

    except Exception as e:
        print(f"⚠ Fehler beim Parsen von '{raw_datum}': {e}")
        return None, None