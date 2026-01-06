import json
import os
import re
import sys
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def load_manifest(manifest_path="manifest.json"):
    if not os.path.exists(manifest_path):
        logging.error(f"Manifest not found at {manifest_path}")
        return []
    with open(manifest_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def clean_text(text):
    if not text:
        return ""
    return text.strip()

def parse_float(value_str):
    if not value_str:
        return None
    # Handle "< 0.1" or "> 100"
    clean = re.sub(r'[<>]', '', value_str).strip()
    try:
        return float(clean)
    except ValueError:
        return None

def parse_ref_range(ref_str):
    if not ref_str: return None, None
    ref_str = ref_str.replace(",", ".").strip()
    
    # Format: "3.5 - 5.2" or "3.5-5.2"
    # Also handle "4.4 11.3" (space separated min max)
    
    # Check for hyphenated range first
    range_match = re.search(r'([\d.]+)\s*-\s*([\d.]+)', ref_str)
    if range_match:
        return float(range_match.group(1)), float(range_match.group(2))
    
    # Check for space separated numbers (common in some PDF columns extraction)
    # E.g. "4.4 11.3" -> Min 4.4, Max 11.3
    # Be careful not to match dates or other loose numbers. 
    # Usually ref range is two numbers.
    space_match = re.search(r'^([\d.]+)\s+([\d.]+)$', ref_str)
    if space_match:
        return float(space_match.group(1)), float(space_match.group(2))

    # Format: "< 5.2"
    less_match = re.search(r'<\s*([\d.]+)', ref_str)
    if less_match:
        return 0.0, float(less_match.group(1))
        
    # Format: "> 10.0"
    more_match = re.search(r'>\s*([\d.]+)', ref_str)
    if more_match:
        return float(more_match.group(1)), None # No upper limit
        
    return None, None

def extract_from_pdf(filepath):
    results = []
    
    try:
        import pdfplumber
    except ImportError:
        logging.error("pdfplumber not installed. Please install it using: pip install pdfplumber")
        return []

    logging.info(f"Processing: {filepath}")
    
    try:
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                # Try multiple extraction strategies
                strategies = [
                    {}, # Default (lines)
                    {"vertical_strategy": "text", "horizontal_strategy": "text"}, # Whitespace
                ]
                
                tables = []
                for settings in strategies:
                    extracted = page.extract_tables(settings)
                    if extracted:
                        tables.extend(extracted)
                        # If we found good tables with default, maybe skip text? 
                        # But sometimes different parts use different styles. 
                        # However, duplicates might occur. Let's filter duplicates later or just process all.
                
                # Deduplicate tables is hard, just processing them all and relying on header detection to filter garbage.
                
                for table in tables:
                    # Heuristic: Identify header row
                    header_idx = -1
                    headers = []
                    
                    for i, row in enumerate(table):
                        # Clean row content
                        row_texts = [clean_text(cell) for cell in row]
                        
                        # Check for various header mappings
                        vizsgalat_idx = -1
                        eredmeny_idx = -1
                        
                        for idx, cell in enumerate(row_texts):
                            c_lower = cell.lower()
                            if any(k in c_lower for k in ["vizsgálat", "megnevezés", "teszt"]):
                                vizsgalat_idx = idx
                            elif any(k in c_lower for k in ["eredmény", "érték", "mért érték"]):
                                eredmeny_idx = idx
                                
                        if vizsgalat_idx != -1 and eredmeny_idx != -1:
                            header_idx = i
                            headers = row_texts
                            break
                    
                    if header_idx != -1:
                        # Map columns based on found header row
                        try:
                            # We already found vizsgalat/eredmeny indices in the loop above? 
                            # No, we just identified the row. Let's re-identify indices reliably.
                            vizsgalat_idx = -1
                            eredmeny_idx = -1
                            mertekegyseg_idx = -1
                            ref_idx = -1
                            minosites_idx = -1

                            for idx, h in enumerate(headers):
                                h_str = str(h) if h else ""
                                h_lower = h_str.lower()
                                
                                # Exact/Startswith matches are safer for "Vizsgálat"
                                if any(k in h_lower for k in ["vizsgálat", "megnevezés", "teszt"]):
                                    if vizsgalat_idx == -1: vizsgalat_idx = idx
                                
                                # Prevent "Mértékegység" matching "érték"
                                if "mértékegység" in h_lower or "m.e." in h_lower or "egység" in h_lower:
                                    mertekegyseg_idx = idx
                                    continue # Skip checking for Eredmény if this is definitely Unit

                                if any(k in h_lower for k in ["eredmény", "érték", "mért érték"]):
                                    if "mérték" not in h_lower and eredmeny_idx == -1: 
                                        eredmeny_idx = idx
                                
                                # Handle split header "Vizsgálat Ered" | "mény"
                                # If we see "mény" and haven't found eredmeny yet, this is likely it.
                                if "mény" in h_lower and eredmeny_idx == -1:
                                    eredmeny_idx = idx
                                
                                if any(k in h_lower for k in ["referencia", "ref.", "tartomány"]):
                                    ref_idx = idx
                                elif any(k in h_lower for k in ["minősítés", "státusz"]):
                                    minosites_idx = idx
                            
                            # Handle Merged Header: "Vizsgálat Eredmény" in one column
                            if vizsgalat_idx != -1 and eredmeny_idx == -1:
                                if "eredmény" in str(headers[vizsgalat_idx]).lower():
                                    logging.info("Detected MERGED Vizsgálat/Eredmény column.")
                                    # We will parse this column specially
                                    eredmeny_idx = vizsgalat_idx 

                            logging.info(f"HEADERS FOUND: {headers} indices: v={vizsgalat_idx}, e={eredmeny_idx}")

                            # Process data rows
                            for row in table[header_idx+1:]:
                                if not row: continue

                                test_name = ""
                                result_val = ""
                                unit_candidate = None # Initialize
                                
                                # Standard case: Distinct columns
                                if vizsgalat_idx != eredmeny_idx and len(row) > max(vizsgalat_idx, eredmeny_idx):
                                    test_name = clean_text(row[vizsgalat_idx])
                                    result_val = clean_text(row[eredmeny_idx])
                                
                                # Merged case: Header suggested same column, but data might be split or merged
                                elif vizsgalat_idx == eredmeny_idx:
                                    # Check next column for result (if pdfplumber split it)
                                    next_col_idx = vizsgalat_idx + 1
                                    split_found = False
                                    if len(row) > next_col_idx:
                                        next_val = clean_text(row[next_col_idx])
                                        # valid result pattern
                                        if re.match(r'^([<>]?[\d.,]+|Negatív|Pozitív|Neg|Poz|Normál)$', next_val, re.IGNORECASE):
                                            test_name = clean_text(row[vizsgalat_idx])
                                            result_val = next_val
                                            split_found = True
                                    
                                    if not split_found:
                                        # Must be inside the same column
                                        raw_text = clean_text(row[vizsgalat_idx])
                                        
                                        match = re.search(r'^(.*?)\s+([<>]?[\d.,]+)\s*(.*)$', raw_text)
                                        if match:
                                            test_name = match.group(1).strip()
                                            result_val = match.group(2).strip()
                                            unit_candidate = match.group(3).strip() # Potential unit
                                        else:
                                            # Try non-numeric
                                            match_text = re.search(r'^(.*?)\s+(Negatív|Pozitív|Neg|Poz|Normál)\s*(.*)$', raw_text, re.IGNORECASE)
                                            if match_text:
                                                test_name = match_text.group(1).strip()
                                                result_val = match_text.group(2).strip()
                                            else:
                                                continue

                                if not test_name or not result_val:
                                    continue
                                    
                                # Initialize entry
                                entry = {
                                    "test_name": test_name,
                                    "result": result_val,
                                    "unit": "",
                                    "ref_range": "",
                                    "flag": "" # +, -, !
                                }
                                
                                # If we found separate unit column, use it, otherwise use candidate
                                if mertekegyseg_idx != -1 and len(row) > mertekegyseg_idx:
                                     entry["unit"] = clean_text(row[mertekegyseg_idx])
                                elif unit_candidate: # Use the candidate from merged column parsing
                                     entry["unit"] = unit_candidate
                                
                                # Ref Range Extraction
                                # Strategy 1: Column based (with merge support)
                                final_ref_str = ""
                                r_min = None
                                r_max = None
                                
                                if ref_idx != -1 and len(row) > ref_idx:
                                    # Try merging up to 4 columns starting from ref_idx
                                    # This handles headers like "Refe" | "rencia" | "Tar" | "tomány"
                                    # and data like "3.5" | "-" | "5.5"
                                    
                                    # Build string from ref_idx onwards
                                    candidates = []
                                    for offset in range(0, 4):
                                        col_i = ref_idx + offset
                                        if col_i >= len(row): break
                                        # Stop if we hit explicit unit column (if valid)
                                        if mertekegyseg_idx != -1 and col_i == mertekegyseg_idx: break
                                        candidates.append(clean_text(row[col_i]))
                                    
                                    # Try parsing cumulatively
                                    for i in range(1, len(candidates) + 1):
                                        merged = " ".join(candidates[:i])
                                        t_min, t_max = parse_ref_range(merged)
                                        if t_min is not None or t_max is not None:
                                            final_ref_str = merged
                                            r_min, r_max = t_min, t_max
                                            # Keep going? classic ranges might be found earlier, but complex ones later.
                                            # Usually if we found a range, we are good.
                                            # Except "<" vs "< 5.5", but parse_ref_range handles that.
                                            break
                                            
                                # Strategy 2: Scan ALL columns to the right of Result (and Unit) if Ref not found
                                if r_min is None and r_max is None:
                                    search_start = max(vizsgalat_idx, eredmeny_idx) + 1
                                    if mertekegyseg_idx != -1: search_start = max(search_start, mertekegyseg_idx + 1)
                                    
                                    for col_i in range(search_start, len(row)):
                                        val = clean_text(row[col_i])
                                        if not val: continue
                                        
                                        t_min, t_max = parse_ref_range(val)
                                        if t_min is not None or t_max is not None:
                                            final_ref_str = val
                                            r_min, r_max = t_min, t_max
                                            # If we picked up a simple number like "50", it might be a flag or something else.
                                            # But parse_ref_range is stricter now? 
                                            # We need to trust parse_ref_range.
                                            break

                                entry["ref_range"] = final_ref_str
                                if r_min is not None: entry["ref_min"] = r_min
                                if r_max is not None: entry["ref_max"] = r_max

                                if minosites_idx != -1 and len(row) > minosites_idx:
                                    entry["flag"] = clean_text(row[minosites_idx])
                                elif "+" in result_val or "*" in result_val:
                                    # Heuristic extraction if inside result
                                    if result_val.endswith("+") or result_val.endswith("*") or result_val.endswith("-"):
                                         entry["flag"] = result_val[-1]
                                         # entry["result"] = result_val[:-1].strip() # Duplicated logic removed below


                                # Simplify Test Name
                                # Remove trailing punctuation, distinct lowercasing for noise check
                                test_name = test_name.strip().rstrip(".:")
                                
                                # Remove "(A)" suffix (common in Synlab reports for accredited tests)
                                # This ensures "TestName (A)" and "TestName" are grouped together
                                # Handle "(A)" with or without leading space, at the end of the string
                                test_name = re.sub(r'\s*\(A\).*$', '', test_name, flags=re.IGNORECASE)
                                
                                # Use standard name for common mappings if needed
                                # e.g. "Fehérvérsejtszám" vs "FVS"
                                # Explicit overrides for stubborn cases
                                lower_name = test_name.lower()
                                if "vas (fe)" in lower_name:
                                    test_name = "Vas (Fe)"
                                elif "fehérvérsejtszám" in lower_name:
                                    test_name = "Fehérvérsejtszám"
                                elif "vörösvérsejtszám" in lower_name:
                                    test_name = "Vörösvérsejtszám"
                                elif "hemoglobin" in lower_name and "vizelet" not in lower_name:
                                     test_name = "Hemoglobin"
                                elif "hematokrit" in lower_name:
                                     test_name = "Hematokrit"
                                elif "trombocitaszám" in lower_name:
                                     test_name = "Trombocitaszám"
                                
                                # IgE Filtering
                                # User wants only "IgE E" (Total). Exclude specific allergens.
                                if "ige" in test_name.lower():
                                    is_total = any(k in test_name.lower() for k in ["immunglobulin di", "immunglobulin e", "totál", "teljes", "összes"])
                                    if not is_total:
                                         continue

                                # Cleanup: Skip noise rows
                                noise_phrases = ["laboratóriumi lelet", "validálók", "oldal:", "hiteles", "amennyiben egy vizsgálatnál", "készült", "dátuma:", "időpontja:", "synlab", "leletnyo"]
                                if any(p in test_name.lower() or p in result_val.lower() for p in noise_phrases):
                                    continue

                                # Check if result_val is actually a unit
                                if result_val in ["Giga/L", "Tera/L", "g/L", "L/L", "fL", "pg", "%", "mmol/L", "umol/L", "kU/L", "U/L", "IU/mL"]:
                                     # Result is a unit. The real result might be in the previous column or next.
                                     # If we are at eredmeny_idx, try eredmeny_idx - 1 (if > vizsgalat_idx)
                                     
                                     # Try Left (Previous column)
                                     if eredmeny_idx > vizsgalat_idx + 1:
                                         prev_val = clean_text(row[eredmeny_idx - 1])
                                         if re.match(r'^[<>]?[\d.,]+$', prev_val):
                                             # Ensure it's not part of the name (heuristic)
                                             entry["unit"] = result_val # The original result was actually the unit
                                             result_val = prev_val
                                             
                                     # If still not found, could be just a shift. 
                                     if result_val in ["Giga/L", "Tera/L", "g/L", "L/L", "fL", "pg", "%", "mmol/L", "umol/L", "kU/L", "U/L", "IU/mL"]:
                                         continue # Skip this row if we couldn't resolve the value

                                if entry not in results:
                                    results.append(entry)
                                
                        except ValueError:
                            continue
                    else:
                         # Debug: print first row to see why it wasn't picked up
                         if len(table) > 0:
                             logging.info(f"Skipped table, first row: {[clean_text(c) for c in table[0]]}")

    except Exception as e:
        logging.error(f"Error parsing PDF {filepath}: {e}")
    
    # Final Cleanup Pass
    cleaned_results = []
    seen_tests = set()
    
    for entry in results:
        t_name = entry["test_name"]
        
        # Hard cleanup of (A)
        # remove (A) case insensitive from end
        t_name = re.sub(r'\s*\(A\).*$', '', t_name, flags=re.IGNORECASE).strip()
        
        # Explicit mapping cleanup
        t_lower = t_name.lower()
        if "vas (fe)" in t_lower: t_name = "Vas (Fe)"
        elif "fehérvérsejtszám" in t_lower: t_name = "Fehérvérsejtszám"
        elif "vörösvérsejtszám" in t_lower: t_name = "Vörösvérsejtszám"
        elif "hemoglobin" in t_lower and "vizelet" not in t_lower: t_name = "Hemoglobin"
        elif "hematokrit" in t_lower: t_name = "Hematokrit"
        elif "trombocitaszám" in t_lower: t_name = "Trombocitaszám"
        
        entry["test_name"] = t_name
        
        # Clean unit if it ended up in result (double check)
        if entry["unit"] == "" and entry["result"] in ["umol/L", "mmol/L", "g/L"]:
             # This is a bad parse, skip or fix?
             pass 

        cleaned_results.append(entry)

    return cleaned_results

def save_to_js(json_data, output_path="web_app/data.js"):
    """Saves the JSON data as a Javascript variable for local usage."""
    js_content = f"const bloodData = {json.dumps(json_data, indent=4, ensure_ascii=False)};"
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    logging.info(f"Generated {output_path}")

def main():
    manifest = load_manifest()
    all_data = []
    
    # Filter for labor results
    # Heuristic: "labor" in type or filename, or Synlab
    target_docs = [
        d for d in manifest 
        if "labor" in d.get('type', '').lower() 
        or "labor" in d.get('filepath', '').lower()
        or "Synlab" in d.get('institution', '')
    ]
    
    logging.info(f"Found {len(target_docs)} potential laboratory documents.")
    
    for doc in target_docs:
        filepath = doc.get('filepath')
        if not filepath or not os.path.exists(filepath):
            logging.warning(f"File missing: {filepath}")
            continue
            
        extracted_results = extract_from_pdf(filepath)
        
        if extracted_results:
            doc_record = {
                "metadata": doc,
                "results": extracted_results
            }
            all_data.append(doc_record)
            logging.info(f"Extracted {len(extracted_results)} results from {filepath}")
        else:
            logging.warning(f"No results extracted from {filepath}")

    # Save to JSON
    output_file = "blood_results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=4, ensure_ascii=False)
    
    logging.info(f"Successfully exported data to {output_file}")
    
    # Save to JS for web app
    save_to_js(all_data)

if __name__ == "__main__":
    main()
