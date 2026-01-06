import os
import re
import json
import time
import logging
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from playwright.sync_api import sync_playwright, TimeoutError
# Setup logging
logging.basicConfig(filename='eeszt_downloader.log', level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
console = logging.StreamHandler()
console.setLevel(logging.INFO)
logging.getLogger('').addHandler(console)
ARCHIVE_DIR = "./EESZT_Archive"
MANIFEST_FILE = "manifest.json"
ERRORS_LOG = "errors.log"
def setup_directories():
    if not os.path.exists(ARCHIVE_DIR):
        os.makedirs(ARCHIVE_DIR)
        logging.info(f"Created archive directory: {ARCHIVE_DIR}")
def load_manifest():
    if os.path.exists(MANIFEST_FILE):
        try:
            with open(MANIFEST_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"Failed to load manifest: {e}")
            return []
    return []
def save_manifest_entry(entry):
    manifest = load_manifest()
    manifest.append(entry)
    with open(MANIFEST_FILE, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=4, ensure_ascii=False)
def is_duplicate(entry, manifest):
    # Check based on unique combination of fields
    for item in manifest:
        if (item.get('date') == entry.get('date') and
            item.get('institution') == entry.get('institution') and
            item.get('type') == entry.get('type') and
            item.get('doctor') == entry.get('doctor')):
            return True
    return False
def clean_filename(text):
    return re.sub(r'[\\/*?:"<>|]', "", text).strip()
def check_login_status(page):
    # Returns True if logged in (Dashboard visible), False if not
    try:
        if "login" in page.url or "bejelentkezes" in page.url:
            return False
        # Assuming there is a logout button or specific dashboard element
        if page.locator("text=Kijelentkezés").count() > 0:
            return True
    except:
        pass
    return False
def login_procedure(page):
    logging.info("Navigating to EESZT...")
    page.goto("https://www.eeszt.gov.hu/", timeout=60000)
    
    # Click Citizen Login if not already there
    try:
        login_btn = page.locator("text=Lakossági bejelentkezés")
        if login_btn.is_visible():
            login_btn.click()
            logging.info("Clicked 'Lakossági bejelentkezés'")
    except: 
        logging.info("Already at login or redirecting...")
    # Click DÁP
    try:
        dap_btn = page.locator("text=DÁP mobilalkalmazással") # Adjust selector if needed
        if dap_btn.is_visible():
            dap_btn.click()
            logging.info("Selected DÁP login method.")
    except:
        pass
    logging.info(">>> PLEASE SCAN THE QR CODE NOW <<<")
    logging.info("Waiting for successful login...")
    
    print("\n" + "="*50)
    print("ACTION REQUIRED:")
    print("1. Scan the QR code in the browser.")
    print("2. Wait until you see the Dashboard/Main page.")
    print("3. THEN press ENTER in this terminal to continue.")
    print("="*50 + "\n")
    
    input("Press ENTER to confirm you are logged in...")
    logging.info("User confirmed login manually.")
    # Optional: still verify briefly but don't block
    if check_login_status(page):
        logging.info("Login verified by script.")
    else:
        logging.warning("Script could not visually verify login, but proceeding based on user confirmation.")
def navigate_to_documents(page):
    logging.info("Navigating to Health Documents...")
    try:
        # Try direct navigation to avoid menu issues
        document_url = "https://www.eeszt.gov.hu/hu/e-kortortenet"
        logging.info(f"Navigating directly to: {document_url}")
        page.goto(document_url)
        
        # Wait for load
        page.wait_for_load_state("networkidle")
        
        # Wait for the filter form - making selector more generic
        # Look for the "Keresés" button first, as that is definitely there
        page.wait_for_selector("button:has-text('Keresés')", timeout=30000)
        logging.info("Document filter page loaded (Search button found).")
        
    except Exception as e:
        logging.error(f"Navigation failed: {e}")
        # Take a screenshot to help debug
        page.screenshot(path="nav_error.png")
        raise e
    except Exception as e:
        logging.error(f"Navigation failed: {e}")
        raise e
def process_date_window(page, start_date, end_date):
    start_str = start_date.strftime("%Y.%m.%d.")
    end_str = end_date.strftime("%Y.%m.%d.")
    
    logging.info(f"Processing window: {start_str} - {end_str}")
    
    try:
        # Debugging inputs
        inputs = page.locator("input[type='text']").all()
        logging.info(f"Found {len(inputs)} text inputs on page.")
        
        # Try to identify date inputs by placeholder or just first two relevant ones
        # If specific placeholder fails, we might try by index if we are confident
        date_input_1 = page.locator("input[placeholder*='éééé.hh.nn']").nth(0)
        date_input_2 = page.locator("input[placeholder*='éééé.hh.nn']").nth(1)
        
        if date_input_1.count() == 0:
            logging.warning("Date inputs by placeholder not found! Trying generic text inputs 0 and 1.")
            if len(inputs) >= 2:
                inputs[0].fill(start_str)
                inputs[1].fill(end_str)
        else:
            date_input_1.fill(start_str)
            date_input_2.fill(end_str)
        
        # Click Search
        search_btn = page.locator("button:has-text('Keresés')")
        if search_btn.count() > 0:
            search_btn.click()
        else:
            logging.error("Search button not found!")
            return
        
        # Wait for results - Robust Poll
        # We wait up to 10 seconds for either the table or the 'No results' text
        max_retries = 10
        found_results = False
        
        for i in range(max_retries):
            if page.locator("table tbody tr").count() > 0:
                logging.info("Results table found.")
                found_results = True
                break
            
            if page.locator("text=Nincs találat").is_visible() or page.locator("text=nem hozott eredményt").is_visible():
                logging.info("No documents found msg detected.")
                return
                
            time.sleep(1)
            
        if not found_results:
             logging.warning("Timeout waiting for results (Table or No Results msg).")
             # Screenshot for debug
             page.screenshot(path=f"debug_{start_str}.png")
             return

        # Process Results
        extract_table_data(page)
        # Process Results
        extract_table_data(page)
    except Exception as e:
        logging.error(f"Error processing window {start_str}: {e}")
        page.screenshot(path=f"error_{start_str}.png")
def extract_table_data(page):
    while True:
        # Get all rows
        rows = page.locator("table tbody tr").all()
        
        logging.info(f"Found {len(rows)} rows on current page.")
        
        for row in rows:
            try:
                # Extract text
                cells = row.locator("td").all()
                if len(cells) < 4:
                    continue
                col_texts = [c.inner_text().strip() for c in cells]
                
                # Debugging column mapping
                if len(col_texts) > 5:
                     # Heuristic: Date is usually YYYY.MM.DD.
                     date_idx = next((i for i, t in enumerate(col_texts) if re.search(r'\d{4}\.\d{2}\.\d{2}', t)), -1)
                     if date_idx != -1:
                         date_text = col_texts[date_idx]
                         # Assume Type is before Date or at 0, Institution is after
                         # Adjusting dynamic mapping based on date anchor
                         doc_type = col_texts[0] 
                         institution = col_texts[date_idx + 1] if len(col_texts) > date_idx + 1 else "UnknownInst"
                         doctor = col_texts[date_idx + 2] if len(col_texts) > date_idx + 2 else "UnknownDoc"
                     else:
                         # Fallback to fixed indices
                         doc_type = col_texts[0]
                         date_text = col_texts[1]
                         institution = col_texts[2]
                         doctor = col_texts[3]
                else:
                     continue

                # ... (Metadata extraction code remains above, assuming we have DocType/Date/Inst/Dr)
                # Re-generating safe filename variables here since they were inside the removed block
                safe_inst = clean_filename(institution)[:30]
                safe_type = clean_filename(doc_type)[:30]
                safe_date = clean_filename(date_text).replace('.', '-')
                if safe_date.endswith('-'): safe_date = safe_date[:-1]
                
                filename = f"{safe_date}_{safe_inst}_{safe_type}.pdf"

                # Check Manifest Again
                meta = {
                    "date": date_text,
                    "institution": institution,
                    "type": doc_type,
                    "doctor": doctor
                }
                
                manifest = load_manifest()
                if is_duplicate(meta, manifest):
                    logging.info(f"Skipping duplicate: {meta}")
                    continue

                # DIRECT DOWNLOAD INTERACTION
                # User specified there is a "Letöltés" button directly in the row.
                # Screenshot confirms "Letöltés" is a blue link.
                
                download_btn = row.locator("a, button").filter(has_text="Letöltés").first
                
                if download_btn.count() == 0:
                     # Fallback: maybe just "Download" or icon
                     download_btn = row.locator("a[href*='download'], i.fa-download").first

                if download_btn.count() == 0:
                    logging.warning(f"No 'Letöltés' button found for row: {date_text} - {institution}")
                    continue

                logging.info(f"Initiating download for {filename}...")
                
                try:
                    with page.expect_download(timeout=60000) as download_info:
                        download_btn.click()
                    
                    download = download_info.value
                    filepath = os.path.join(ARCHIVE_DIR, filename)
                    download.save_as(filepath)
                    logging.info(f"Downloaded: {filename}")
                    
                    meta['filepath'] = filepath
                    save_manifest_entry(meta)
                    
                except Exception as e:
                    logging.error(f"Download failed: {e}")
                
                time.sleep(2) # Constraints: 2s delay

            except Exception as e:
                logging.error(f"Error processing row: {e}")
                with open(ERRORS_LOG, "a") as err:
                    err.write(f"{datetime.now()} - Error: {e}\n")
        
        # Pagination
        try:
            next_btn = page.locator("a.page-link:has-text('›'), li.next a, button[aria-label='Next']")
            if next_btn.is_visible() and not next_btn.is_disabled():
                 parent = next_btn.locator("..")
                 if "disabled" not in parent.get_attribute("class", ""):
                     next_btn.click()
                     time.sleep(2) # Wait for reload
                     continue
            break # No next page
        except:
            break
def main():
    setup_directories()
    
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        # Login
        login_procedure(page)
        
        # Navigation
        navigate_to_documents(page)
        
        # Sliding Window
        start_date = datetime(2017, 1, 1)
        now = datetime.now()
        
        current_start = start_date
        while current_start < now:
            current_end = current_start + relativedelta(months=5)
            if current_end > now:
                current_end = now
            
            logging.info(f"--- Starting Window: {current_start.date()} to {current_end.date()} ---")
            
            # Check session
            if not check_login_status(page):
                 logging.warning("Session lost! Re-authenticating...")
                 login_procedure(page)
                 navigate_to_documents(page)
            
            process_date_window(page, current_start, current_end)
            
            current_start = current_end + timedelta(days=1) # Start next day
            time.sleep(1)
        logging.info("All windows processed.")
        browser.close()
if __name__ == "__main__":
    main()