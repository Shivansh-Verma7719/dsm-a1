import datetime
import re

def parse_date(date_str):
    """
    Parses a date string into a datetime object.
    Common formats in GDACS: 
    - "10 Oct 2025 01:43 UTC"
    - "26 Oct 2015"
    """
    if not date_str:
        return None
    
    # Clean up excess whitespace
    date_str = date_str.strip()
    
    # Try parsing with time first
    try:
        return datetime.datetime.strptime(date_str, "%d %b %Y %H:%M %Z")
    except ValueError:
        pass
        
    try:
        # Sometimes format might be slightly different or without TZ
        # Removing UTC if present for simple parsing if strptime failed
        clean_str = date_str.replace(" UTC", "")
        return datetime.datetime.strptime(clean_str, "%d %b %Y %H:%M")
    except ValueError:
        pass

    # Try parsing date only
    try:
        return datetime.datetime.strptime(date_str, "%d %b %Y")
    except ValueError:
        pass

    return None

def clean_text(text):
    """
    Cleans extracted text by removing extra whitespace and newlines.
    """
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()

def extract_number(text):
    """
    Extracts the first number from a string, removing commas.
    Useful for population or article counts.
    """
    if not text:
        return 0
    matches = re.findall(r'[\d,]+', text)
    if matches:
        return int(matches[0].replace(',', ''))
    return 0
