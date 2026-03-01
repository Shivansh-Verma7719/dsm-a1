from playwright.sync_api import sync_playwright
import csv
import os
import time

TIME_OUT = 10000

class GDACSScraper:
    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None
        self.data_dir = "scraper/data"
        os.makedirs(self.data_dir, exist_ok=True)

    def setup_browser(self):
        """Initialize Playwright browser."""
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=False)
        self.context = self.browser.new_context()
        self.page = self.context.new_page()

    def teardown_browser(self):
        """Close browser resources."""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()

    def _safe_goto(self, url, timeout=TIME_OUT):
        # Navigate and handle server runtime errors by reloading.
        self.page.goto(url, timeout=timeout)
        while True:
            try:
                title = self.page.title()
                if "Runtime Error" in title or "Server Error" in title:
                    print(f"Encountered error page at {url}, reloading...")
                    time.sleep(2)
                    self.page.reload(timeout=timeout)
                else:
                    break
            except Exception:
                break

    def search_events(self, country, date_from, date_to, level="Orange"):
        # Navigate to GDACS alerts page and perform search.
        
        print(f"Searching for {level} Earthquakes in {country} from {date_from} to {date_to}...")
        self._safe_goto("https://www.gdacs.org/Alerts/default.aspx", timeout=TIME_OUT)
        
        # Wait for search panel to be ready
        self.page.wait_for_selector("#panelSearch")

        # Select Event Type: Earthquakes (inputChEq)
        if not self.page.is_checked("#inputChEq"):
            self.page.click("#inputChEq")

        # Set Date From
        self.page.fill("#inputDateFrom", date_from)
        self.page.keyboard.press("Enter") # Ensure date picker closes/validates

        # Set Date To
        self.page.fill("#inputDateTo", date_to)
        self.page.keyboard.press("Enter")

        # Set Alert Level
        self.page.select_option("#inputAlert", value=level)

        # Set Country
        self.page.fill("#inputCountry", country)
        time.sleep(1) 

        # Click Search
        self.page.click("#btnsearch")

        # Wait for results to load
        try:
            self.page.wait_for_selector("#contentResult table", timeout=TIME_OUT)
            time.sleep(2) # Extra buffer for table rendering
        except Exception as e:
            print(f"Error waiting for search results: {e}")
            self.page.screenshot(path="scraper/data/search_error.png")
            raise e


    def extract_event_links(self):
        # Parse search results to find event links.
        # Returns a list of dicts with basic event info and URL.
        
        events = []
        rows = self.page.query_selector_all("#contentResult tr.clickable-row")
        
        for row in rows:
            # clickable-row has data-href attribute
            url = row.get_attribute("data-href")
            
            # The description text is in the second key cell (index 1) usually
            cells = row.query_selector_all("td")
            if len(cells) < 3:
                continue
            
            description = cells[1].inner_text()
            date_str = cells[2].inner_text()
            
            events.append({
                "url": url,
                "description": description,
                "date": date_str
            })
            
        print(f"Found {len(events)} events.")
        return events

    def scrape_event_details(self, event_url):
        # Scrape details from Summary, Impact, and Media tabs.
        
        full_url = event_url if event_url.startswith("http") else f"https://www.gdacs.org{event_url}"
        print(f"Scraping event: {full_url}")
        
        # Navigate to Summary tab (default)
        print("Extracting Summary tab...")
        self._safe_goto(full_url, timeout=TIME_OUT)
        self.page.wait_for_selector("#alert_summary_left", timeout=TIME_OUT)

        data = {}
        data['url'] = full_url

        # Summary Tab Extraction
        try:
            # Alert Level is often in the title or an icon.
            title_text = self.page.inner_text("title")
            if "Red" in title_text:
                data['alert_level'] = "Red"
            elif "Orange" in title_text:
                data['alert_level'] = "Orange"
            elif "Green" in title_text:
                data['alert_level'] = "Green"
            else:
                data['alert_level'] = "Unknown"

            # Magnitude and Country from the summary table
            summary_rows = self.page.query_selector_all("table.summary tr")
            for row in summary_rows:
                cells = row.query_selector_all("td")
                if len(cells) == 2:
                    key = cells[0].inner_text().strip().replace(":", "")
                    value = cells[1].inner_text().strip()
                    
                    if "Magnitude" in key:
                        data['magnitude'] = value
                    if "Inserted at" in key:
                        data['inserted_at'] = value
        except Exception as e:
            print(f"Error extracting summary: {e}")

        # Ensure Country is captured. Sometimes it's in the text description in summary
        try:
           p_summary = self.page.inner_text(".p_summary")
           # "The earthquake happened in Afghanistan..."
           if "happened in" in p_summary:
               parts = p_summary.split("happened in")
               if len(parts) > 1:
                   data['country'] = parts[1].split(",")[0].strip().split(".")[0].strip()
        except:
            pass
            
        # Impact Tab Extraction
        print("Extracting Impact tab...")
        try:
            impact_link = self.page.get_attribute("a:has-text('Impact')", "href")
            if impact_link:
                from urllib.parse import urljoin
                impact_url = urljoin(self.page.url, impact_link)
                print(f"Navigating to impact URL: {impact_url}")
                self._safe_goto(impact_url, timeout=TIME_OUT)
                try:
                    self.page.wait_for_selector("#contentGraph", timeout=5000)
                except:
                    pass
                
                summary_rows = self.page.query_selector_all("table.summary tr")
                for row in summary_rows:
                    cells = row.query_selector_all("td")
                    if len(cells) == 2:
                        key = cells[0].inner_text().strip()
                        value = cells[1].inner_text().strip()
                        if "Exposed Population" in key:
                             data['population_exposed'] = value
                        if "INFORM" in key:
                             data['vulnerability_score'] = value
                        if "Tsunami" in key or "Secondary" in key or "Landslide" in key:
                             data['secondary_risks'] = value
                
                # Check matrix for secondary risks
                try:
                    matrix_text = self.page.inner_text("#tableScoreMain")
                    if "Tsunami" in matrix_text:
                        data['secondary_risks'] = data.get('secondary_risks', "Tsunami risk detected")
                except:
                    pass

        except Exception as e:
             print(f"Error extracting impact: {e}")

        # Media Tab Extraction
        print("Extracting Media tab...")
        try:
            media_link = self.page.get_attribute("a:has-text('Media')", "href")
            if media_link:
                from urllib.parse import urljoin
                media_url = urljoin(self.page.url, media_link)
                print(f"Navigating to media URL: {media_url}")
                self._safe_goto(media_url, timeout=TIME_OUT)
                # We need to wait for #mediaCoverage to have content
                try:
                    self.page.wait_for_selector("#mediaCoverage table", timeout=5000)
                except:
                    pass
                
                # Total number of news articles
                # Look for "Articles:" in the table within #mediaCoverage
                try:
                    articles_text = self.page.inner_text("#mediaCoverage")
                    import re
                    match = re.search(r"Articles:\s*(\d+)", articles_text)
                    if match:
                        data['articles_count'] = match.group(1)
                    else:
                        data['articles_count'] = "0"
                except:
                    data['articles_count'] = "0"

                # Social media mentions
                try:
                    social_text = self.page.inner_text("#social_media")
                    import re
                    match = re.search(r"(\d+)\s*detected", social_text)
                    if match:
                        data['social_media_mentions'] = match.group(1)
                    else:
                        data['social_media_mentions'] = "0"
                except:
                    data['social_media_mentions'] = "0"

                # Extract News Articles per Day (Timeline)
                # content is in #newsForDay table.generic tr
                timeline = []
                try:
                    timeline_rows = self.page.query_selector_all("#newsForDay table.generic tr")
                    for row in timeline_rows:
                        cells = row.query_selector_all("td")
                        if len(cells) >= 2:
                            # Format: DateString | Bar+Count
                            date_str = cells[0].inner_text().strip()
                            # Count is in the second cell, usually text after the div or inside
                            count_text = cells[1].inner_text().strip()
                            # It might be just the number or mixed. The html shows: 
                            # <td>...<div ...></div><div ...>15</div></td>
                            # inner_text should get "15"
                            timeline.append({"date": date_str, "articles": count_text})
                    data['timeline'] = timeline
                except Exception as e:
                    print(f"Error extracting timeline: {e}")
                    data['timeline'] = []

                # Extract Headlines (#emmList)
                # It contains div.media_news_box
                headlines = []
                try:
                    news_boxes = self.page.query_selector_all("#emmList .media_news_box")
                    for box in news_boxes:
                        title_el = box.query_selector(".p_media_title a")
                        dida_el = box.query_selector(".p_media_dida")
                        summary_el = box.query_selector(".p_media_summary") # Class might be p_summary based on HTML view
                        
                        title = title_el.inner_text().strip() if title_el else ""
                        link = title_el.get_attribute("href") if title_el else ""
                        
                        # Dida: "Fri, 17 Oct 2025 08:32:00 +0200(startsat60) "
                        dida_text = dida_el.inner_text().strip() if dida_el else ""
                        
                        summary_text = ""
                        # HTML view showed class="p_summary" for description
                        summary_el = box.query_selector(".p_summary")
                        if summary_el:
                            summary_text = summary_el.inner_text().strip()
                            
                        headlines.append({
                            "title": title,
                            "link": link,
                            "source_date": dida_text,
                            "summary": summary_text
                        })
                    data['headlines'] = headlines
                except Exception as e:
                    print(f"Error extracting headlines: {e}")
                    data['headlines'] = []


        except Exception as e:
            print(f"Error extracting media: {e}")
            data['articles_count'] = "0"

        return data

    def save_data(self, all_data):
        # Save extracted data to CSVs.
        if not all_data:
            print("No data to save.")
            return

        # Events CSV
        event_keys = ['url', 'country', 'alert_level', 'magnitude', 'population_exposed', 'vulnerability_score', 'secondary_risks', 'articles_count', 'social_media_mentions', 'inserted_at']
        events_filepath = os.path.join(self.data_dir, "events.csv")
        
        # Check if file exists to append or write header
        file_exists = os.path.exists(events_filepath)
        
        with open(events_filepath, 'a', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=event_keys)
            if not file_exists:
                writer.writeheader()
            
            for row in all_data:
                filtered_row = {k: row.get(k, "") for k in event_keys}
                writer.writerow(filtered_row)
        
        print(f"Events data saved to {events_filepath}")

        # Timeline CSV
        timeline_filepath = os.path.join(self.data_dir, "timeline.csv")
        timeline_exists = os.path.exists(timeline_filepath)
        
        with open(timeline_filepath, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            if not timeline_exists:
                writer.writerow(['event_url', 'date', 'articles_count'])
            
            for row in all_data:
                event_url = row.get('url', "")
                for item in row.get('timeline', []):
                    writer.writerow([event_url, item.get('date', ''), item.get('articles', '')])
        
        print(f"Timeline data saved to {timeline_filepath}")

        # Headlines CSV
        headlines_filepath = os.path.join(self.data_dir, "headlines.csv")
        headlines_exists = os.path.exists(headlines_filepath)
        
        with open(headlines_filepath, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            if not headlines_exists:
                writer.writerow(['event_url', 'title', 'link', 'source_date', 'summary'])
            
            for row in all_data:
                event_url = row.get('url', "")
                for item in row.get('headlines', []):
                    writer.writerow([
                        event_url, 
                        item.get('title', ''), 
                        item.get('link', ''), 
                        item.get('source_date', ''),
                        item.get('summary', '')
                    ])

        print(f"Headlines data saved to {headlines_filepath}")


    def run(self):
        self.setup_browser()
        
        targets = [
            {"country": "India", "date_from": "2016-01-01", "date_to": "2026-02-17"},
            {"country": "Philippines", "date_from": "2016-01-01", "date_to": "2026-02-17"}
        ]
        
        all_scraped_data = []

        try:
            for target in targets:
                self.search_events(target["country"], target["date_from"], target["date_to"])
                events = self.extract_event_links()
                
                # Filter specific events based on extracting Description/Magnitude/Date
                
                target_events = []
                if target["country"] == "India":
                    target_events = [e for e in events if ("5.6" in e['description'] and "2017" in e['date']) or ("5.5" in e['description'] and "2025" in e['date'])]
                elif target["country"] == "Philippines":
                    target_events = [e for e in events if ("6.9" in e['description'] and "2017" in e['date']) or ("7.4" in e['description'] and "2025" in e['date'])]
                
                print(f"Targeting {len(target_events)} events for {target['country']}")

                for event in target_events:
                    details = self.scrape_event_details(event['url'])
                    # Enforce country if missed
                    if 'country' not in details:
                        details['country'] = target['country']
                    all_scraped_data.append(details)
            
            self.save_data(all_scraped_data)
            
        finally:
            self.teardown_browser()

if __name__ == "__main__":
    scraper = GDACSScraper()
    scraper.run()
