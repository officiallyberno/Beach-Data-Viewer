
from datetime import date, datetime


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