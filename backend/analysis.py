import pandas as pd
import spacy
from textblob import TextBlob
import subprocess
import sys

try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

def calc_response_delta(events_df, timeline_df):
    results = []
    # Timeline contains event_url, date, articles_count
    for idx, row in events_df.iterrows():
        url = row['url']
        system_alert_time = row['inserted_at_dt']
        
        event_timeline = timeline_df[timeline_df['event_url'] == url]
        if event_timeline.empty or pd.isna(system_alert_time):
            continue
            
        # Find day with max articles
        max_day = event_timeline.loc[event_timeline['articles_count'].idxmax()]
        media_peak_time = max_day['date_dt']
        
        if pd.isna(media_peak_time):
            continue
            
        # timeline.csv dates are like '18/09' lacking a year. Pandas defaults to 1900 or 0001.
        year = system_alert_time.year
        if media_peak_time.month < system_alert_time.month - 6:
            # likely crossed into new year
            year += 1
        elif media_peak_time.month > system_alert_time.month + 6:
             # likely event was late dec, peak is somehow earlier, very edge case but handled
            year -= 1
            
        media_peak_time = media_peak_time.replace(year=year)
            
        delta = media_peak_time - system_alert_time
        
        results.append({
            "event_url": url,
            "system_alert": system_alert_time.isoformat(),
            "media_peak": media_peak_time.isoformat(),
            "delta_days": delta.days,
            "delta_seconds": delta.total_seconds(),
            "period": row['period'],
             "country": row['country'],
        })
    return results

def extract_entities(headlines_df):
    results = {}
    
    # Keyword matches for specific tracking
    ngo_keywords = ['red cross', 'unicef', 'msf', 'doctors without borders', 'who', 'un', 'oxfam']
    gov_keywords = ['government', 'ministry', 'department', 'military', 'army', 'navy', 'police']
    
    for url, group in headlines_df.groupby('event_url'):
        ngos_found = set()
        govs_found = set()
        deaths = []
        funds = []
        
        for idx, row in group.iterrows():
            text = str(row['title']) + " " + str(row['summary'])
            doc = nlp(text)
            
            for ent in doc.ents:
                if ent.label_ == "ORG":
                    if any(ngo in ent.text.lower() for ngo in ngo_keywords):
                        ngos_found.add(ent.text)
                    elif any(gov in ent.text.lower() for gov in gov_keywords):
                        govs_found.add(ent.text)
                elif ent.label_ == "GPE":
                    pass
                elif ent.label_ == "MONEY":
                    funds.append(ent.text)
                elif ent.label_ in ["CARDINAL", "QUANTITY"]:
                    if any(w in ent.sent.text.lower() for w in ['dead', 'death', 'killed', 'casualty', 'loss', 'toll']):
                        deaths.append(ent.text)
                        
        results[url] = {
            "ngos_mentioned": list(ngos_found),
            "govs_mentioned": list(govs_found),
            "deaths_metrics": list(set(deaths)),
            "funds_metrics": list(set(funds))
        }
    return results

def analyze_sentiment(headlines_df, events_df):
    results = []
    for url, group in headlines_df.groupby('event_url'):
        event_row = events_df[events_df['url'] == url]
        if event_row.empty:
            continue
        
        period = event_row.iloc[0]['period']
        country = event_row.iloc[0]['country']
        alert_level = event_row.iloc[0]['alert_level']
        
        polarities = []
        subjectivities = []
        for text in group['title'].fillna(''):
            blob = TextBlob(text)
            polarities.append(blob.sentiment.polarity)
            subjectivities.append(blob.sentiment.subjectivity)
            
        avg_polarity = sum(polarities) / len(polarities) if polarities else 0.0
        avg_subjectivity = sum(subjectivities) / len(subjectivities) if subjectivities else 0.0
        
        tone = "Alarmist" if avg_polarity < -0.1 and avg_subjectivity > 0.3 else "Analytical/Neutral"
        if avg_polarity > 0.1:
            tone = "Positive/Recovery"

        results.append({
            "event_url": url,
            "country": country,
            "period": period,
            "alert_level": alert_level,
            "avg_polarity": round(avg_polarity, 3),
            "avg_subjectivity": round(avg_subjectivity, 3),
            "tone": tone
        })
    return results

def calculate_forgotten_crisis(events_df):
    results = []
    
    for idx, row in events_df.iterrows():
        articles = float(row.get('articles_count', 0))
        pop = row.get('population_clean', 0)
        
        if pop > 0:
            index_val = (articles / pop) * 100000 
        else:
            index_val = 0.0
            
        results.append({
            "event_url": row['url'],
            "country": row['country'],
            "period": row['period'],
            "magnitude": row['magnitude_clean'],
            "articles_count": articles,
            "population_exposed": pop,
            "forgotten_crisis_index": round(index_val, 4),
            "status": "Over-covered" if index_val > 50 else "Under-reported"
        })
    return results

def compare_vulnerability(events_df):
    results = []
    for idx, row in events_df.iterrows():
        results.append({
            "event_url": row['url'],
            "country": row['country'],
            "period": row['period'],
            "magnitude": row['magnitude_clean'],
            "vulnerability_score": row['vulnerability_clean'],
            "alert_level": row['alert_level']
        })
    return results
