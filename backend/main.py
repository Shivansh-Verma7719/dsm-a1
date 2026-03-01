from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from data_loader import load_events, load_timeline, load_headlines
from analysis import (
    calc_response_delta,
    extract_entities,
    analyze_sentiment,
    calculate_forgotten_crisis,
    compare_vulnerability
)
import math

app = FastAPI(title="GDACS Disaster Analysis API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data into memory at startup
events_df = load_events()
timeline_df = load_timeline()
headlines_df = load_headlines()

@app.get("/")
def read_root():
    return {"message": "Welcome to GDACS Disaster Analysis API. Go to /docs for endpoints."}

@app.get("/api/events")
def get_events():
    # Returns the base events with cleaned metrics.
    # Convert dates to string for JSON serialization
    safe_df = events_df.copy()
    safe_df['inserted_at_dt'] = safe_df['inserted_at_dt'].astype(str)
    
    # Replace nan with None for JSON compliance
    records = safe_df.to_dict(orient="records")
    for r in records:
        for k, v in r.items():
            if isinstance(v, float) and math.isnan(v):
                r[k] = None
    return records

@app.get("/api/timeline")
def get_timeline():
    # Returns the timeline data for rendering the Evolution Timeline chart
    safe_df = timeline_df.copy()
    safe_df['date_dt'] = safe_df['date_dt'].astype(str)
    
    records = safe_df.to_dict(orient="records")
    for r in records:
        for k, v in r.items():
            if isinstance(v, float) and math.isnan(v):
                r[k] = None
    return records

@app.get("/api/analysis/temporal")
def get_temporal_analysis():
    # Task 2.1: Response Delta Calculation
    return calc_response_delta(events_df, timeline_df)

@app.get("/api/analysis/ner")
def get_ner_analysis():
    # Task 2.2: Entity Recognition
    return extract_entities(headlines_df)

@app.get("/api/analysis/sentiment")
def get_sentiment_analysis():
    # Task 2.3: Sentiment Volatility
    return analyze_sentiment(headlines_df, events_df)

@app.get("/api/analysis/forgotten-crisis")
def get_forgotten_crisis():
    # Task 3.1: The 'Forgotten Crisis' Index
    return calculate_forgotten_crisis(events_df)

@app.get("/api/analysis/vulnerability")
def get_vulnerability_benchmark():
    # Task 3.2: Vulnerability Benchmark
    return compare_vulnerability(events_df)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
