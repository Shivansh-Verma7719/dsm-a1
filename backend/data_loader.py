import pandas as pd
import os
import re

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def clean_population(val):
    if pd.isna(val):
        return 0
    val = str(val).lower()
    # Extract numbers
    nums = re.findall(r'[\d\.]+', val)
    if not nums:
        return 0
    base = float(nums[0])
    if 'thousand' in val:
        base *= 1000
    elif 'million' in val:
        base *= 1000000
    return int(base)

def clean_magnitude(val):
    if pd.isna(val):
        return 0.0
    nums = re.findall(r'[\d\.]+', str(val))
    if nums:
        return float(nums[0])
    return 0.0

def clean_vulnerability(val):
    if pd.isna(val):
        return 0.0
    nums = re.findall(r'[\d\.]+', str(val))
    if nums:
        return float(nums[0])
    return 0.0


def load_events():
    path = os.path.join(DATA_DIR, "events.csv")
    if not os.path.exists(path):
        return pd.DataFrame()
    df = pd.read_csv(path)
    
    # Process numeric/clean values
    df['magnitude_clean'] = df['magnitude'].apply(clean_magnitude)
    df['population_clean'] = df['population_exposed'].apply(clean_population)
    df['vulnerability_clean'] = df['vulnerability_score'].apply(clean_vulnerability)
    # Parse dates and make tz-naive so they can be compared with other dates
    df['inserted_at_dt'] = pd.to_datetime(df['inserted_at'], errors='coerce', utc=True).dt.tz_localize(None)
    
    def classify_period(dt):
        if pd.isna(dt):
            return 'Unknown'
        if dt.year <= 2020:
            return 'Historical'
        else:
            return 'Recent'
            
    df['period'] = df['inserted_at_dt'].apply(classify_period)
    
    return df

def load_timeline():
    path = os.path.join(DATA_DIR, "timeline.csv")
    if not os.path.exists(path):
        return pd.DataFrame()
    df = pd.read_csv(path)
    
    # Filter out dirty scrape rows that swallowed the whole chart axis
    df = df[~df['date'].astype(str).str.contains(r'\t|\n', regex=True)]
    
    # Parse dates and make tz-naive (defaults to year 1900)
    df['date_dt'] = pd.to_datetime(df['date'], format='%d/%m', errors='coerce', utc=True).dt.tz_localize(None)
    df['articles_count'] = pd.to_numeric(df['articles_count'], errors='coerce').fillna(0).astype(int)
    return df

def load_headlines():
    path = os.path.join(DATA_DIR, "headlines.csv")
    if not os.path.exists(path):
        return pd.DataFrame()
    try:
        df = pd.read_csv(path, on_bad_lines='skip')
    except Exception:
        df = pd.read_csv(path, on_bad_lines='skip', engine='python')
    return df
