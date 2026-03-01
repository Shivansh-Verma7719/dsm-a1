import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000"

ENDPOINTS = [
    "/api/events",
    "/api/analysis/temporal",
    "/api/analysis/ner",
    "/api/analysis/sentiment",
    "/api/analysis/forgotten-crisis",
    "/api/analysis/vulnerability"
]

def test_endpoints():
    print("Starting API tests...")
    
    # Simple check to see if server is up
    try:
        urllib.request.urlopen(BASE_URL)
    except Exception as e:
        print(f"Error reaching server at {BASE_URL}. Ensure it is running: {e}")
        return

    for ep in ENDPOINTS:
        url = BASE_URL + ep
        print(f"\n--- Testing GET {ep} ---")
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req) as response:
                status = response.getcode()
                body = response.read().decode('utf-8')
                
                print(f"Status Code: {status}")
                if status == 200:
                    data = json.loads(body)
                    # Print first element if list, else full obj
                    if isinstance(data, list) and len(data) > 0:
                        print("Response data sample (first item):")
                        print(json.dumps(data[0], indent=2))
                    elif isinstance(data, dict):
                        # Dictionary mapping URLs to entities/etc
                        first_key = list(data.keys())[0] if data else None
                        print(f"Response data sample (for {first_key}):")
                        print(json.dumps({first_key: data.get(first_key)}, indent=2) if first_key else "{}")
                    else:
                        print("Response:")
                        print(data)
                else:
                    print("Error response:")
                    print(body[:200])
        except Exception as e:
            print(f"FAILED to fetch {url}: {e}")

if __name__ == "__main__":
    test_endpoints()
