import json
import os
import re
import sys
import logging
from datetime import datetime

# Setup logging
import difflib

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')


VALID_TEST_NAMES = [
    "Albumin", "Alkalikus foszfatáz (AP)", "Alfa-Amiláz", "Amiláz izoenzimek", "Pankreász specifikus amiláz",
    "Makroamiláz", "Lipáz", "Bilirubin (Összes)", "Bilirubin (Konjugált/Direkt)", "GOT (ASAT)", "GPT (ALAT)",
    "GGT", "LDH", "Kolinészteráz", "Kreatin-kináz (CK)", "CK-MB izoenzim", "Troponin T", "Troponin I",
    "Myoglobin", "BNP", "NT-proBNP", "Karbamid", "Kreatinin", "eGFR", "Húgysav", "Cisztatin C",
    "Glükóz (Vércukor)", "HbA1c", "Fruktózamin", "Inzulin", "C-peptid", "Koleszterin (Összes)",
    "HDL-koleszterin", "LDL-koleszterin", "Triglicerid", "Lipoprotein (a)", "Apolipoprotein A1",
    "Apolipoprotein A2", "Apolipoprotein B", "Lipoprint", "Összfehérje", "Szuperoxid-dizmutáz",
    "Szérum protein elektroforézis (ELFO)", "Immunfixáció", "CRP (C-reaktív protein)", "Prokalcitonin",
    "Amyloid A", "Vas", "TVK (Teljes vaskötő kapacitás)", "Ferritin", "Transzferrin",
    "Szolubilis transzferrin receptor", "Hepszidin", "Nátrium", "Kálium", "Klorid", "Kalcium", "Ionizált kalcium",
    "Magnézium", "Foszfát", "Lítium", "Réz", "Cink", "Szelén", "Jód", "Vérkép (Mennyiségi)", "Vérkép (Minőségi)",
    "Retikulocyta", "Vérsejtsüllyedés", "Prothrombin idő (INR)", "APTI", "Thrombin idő", "Fibrinogén",
    "D-dimer", "Antithrombin III", "Protein C", "Protein S", "APC rezisztencia", "Lupus anticoaguláns",
    "Faktor II", "Faktor V", "Faktor VII", "Faktor VIII", "Faktor IX", "Faktor X", "Faktor XI", "Faktor XII",
    "Faktor XIII", "Anti-Xa", "Von Willebrand antigén", "TSH", "Szabad T4 (fT4)", "Szabad T3 (fT3)", "Anti-TPO",
    "Anti-TG", "TRAK (TSH receptor antitest)", "Thyreoglobulin", "Kalcitonin", "Reverz T3 (rT3)", "LH", "FSH",
    "Ösztradiol", "Progeszteron", "17-OH-Progeszteron", "AMH (Anti-Müllerian hormon)", "Tesztoszteron",
    "Szabad tesztoszteron", "SHBG", "DHEA-S", "Androsztendion", "Dihidro-tesztoszteron", "Béta-hCG", "PAPP-A",
    "Szabad esztriol", "Placentáris növekedési faktor (PlGF)", "Kortizol", "ACTH", "Aldoszteron", "Renin",
    "Prolaktin", "Makroprolaktin", "Növekedési hormon (GH)", "IGF-1", "Adrenalin", "Noradrenalin", "Dopamin",
    "Chromogranin A", "AFP", "CEA", "CA 125", "CA 15-3", "CA 19-9", "CA 72-4", "HE4", "ROMA-index", "PSA",
    "Szabad PSA (fPSA)", "NSE", "S-100 protein", "Béta-2-mikroglobulin", "SCC", "Cyfra 21-1", "TPA",
    "Immunglobulin A (IgA)", "Immunglobulin G (IgG)", "Immunglobulin M (IgM)", "Összes IgE", "Komplement C3",
    "Komplement C4", "CH50", "Reuma faktor (RF)", "Anti-CCP", "ASLO", "ANA (ELISA)", "ANA (Hep-2)", "ENA szűrés",
    "ENA panel (Ro, La, Sm, RNP, Scl-70, Jo-1)", "ds-DNS", "ANCA", "MPO", "PR-3", "Kardiolipin antitest (IgG, IgM)",
    "Béta-2-glikoprotein antitest (IgG, IgM)", "Prothrombin elleni antitest", "Annexin V elleni antitest",
    "tTG IgA", "tTG IgG", "EMA IgA", "EMA IgG", "ASCA (IgA, IgG)", "Aquaporin-4", "Gasztrin-17", "Pepszinogén I",
    "Pepszinogén II", "D-vitamin", "B12-vitamin", "Aktív B12", "Folsav", "A-vitamin", "E-vitamin", "C-vitamin",
    "K-vitamin", "B1-vitamin", "B2-vitamin", "B3-vitamin", "B5-vitamin", "B6-vitamin", "H-vitamin (Biotin)",
    "HIV-1,2", "HBsAg", "Anti-HBs", "Anti-HBc", "Anti-HBc IgM", "HBeAg", "Anti-HBe", "Anti-HCV",
    "Hepatitis A (IgG, IgM)", "Hepatitis E (IgG, IgM)", "Syphilis (Lues)", "CMV (IgG, IgM)", "EBV (IgG, IgM)",
    "HSV 1,2 (IgG, IgM)", "VZV (IgG, IgM)", "Toxoplasma (IgG, IgM)", "Borrelia (IgG, IgM)",
    "Helicobacter pylori IgG", "Chlamydia trachomatis (IgG, IgM, IgA)", "Chlamydia pneumoniae (IgG, IgM, IgA)",
    "Mycoplasma pneumoniae (IgG, IgM, IgA)", "Quantiferon-TB", "SARS-CoV-2 (IgG, IgM)", "Vércsoport",
    "Ellenanyagszűrés", "Leiden mutáció", "Prothrombin (G20210A) mutáció", "MTHFR (C677T, A1298C)",
    "Laktózintolerancia (C/T-13910)", "HLA-B27", "ACE gén", "BRCA1", "BRCA2", "ColonAiQ", "T-lymphocyta",
    "B-lymphocyta", "NK-lymphocyta"
]

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
    # also handle "4.4 11.3" (space separated min max)
    
    try:
        # Check for hyphenated range first
        range_match = re.search(r'([\d.]+)\s*-\s*([\d.]+)', ref_str)
        if range_match:
             # Validate dots: count number of dots
             v1 = range_match.group(1)
             v2 = range_match.group(2)
             if v1.count('.') <= 1 and v2.count('.') <= 1:
                 return float(v1), float(v2)
        
        # Check for space separated numbers (common in some PDF columns extraction)
        # But be strict: start and end of string, no dates (e.g. 2023.01.01)
        space_match = re.search(r'^([\d.]+)\s+([\d.]+)$', ref_str)
        if space_match:
             v1 = space_match.group(1)
             v2 = space_match.group(2)
             if v1.count('.') <= 1 and v2.count('.') <= 1:
                 return float(v1), float(v2)
    
        # Format: "< 5.2"
        less_match = re.search(r'<\s*([\d.]+)', ref_str)
        if less_match:
            v1 = less_match.group(1)
            if v1.count('.') <= 1:
                return 0.0, float(v1)
            
        # Format: "> 10.0"
        more_match = re.search(r'>\s*([\d.]+)', ref_str)
        if more_match:
            v1 = more_match.group(1)
            if v1.count('.') <= 1:
                return float(v1), None 
    except ValueError:
        pass
        
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
            active_header_map = None # Form: {v: idx, e: idx, m: idx, r: idx, f: idx}
            
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
                
                for table in tables:
                    if not table: continue

                    # Heuristic: Identify header row
                    header_idx = -1
                    headers = []
                    
                    found_header_map = None

                    for i, row in enumerate(table):
                        # Clean row content
                        row_texts = [clean_text(cell) for cell in row]
                        
                        vizsgalat_idx = -1
                        eredmeny_idx = -1
                        mertekegyseg_idx = -1
                        ref_idx = -1
                        minosites_idx = -1
                        
                        # Identify columns in this row
                        for idx, cell in enumerate(row_texts):
                            c_lower = cell.lower()
                            
                            if any(k in c_lower for k in ["vizsgálat", "megnevezés", "teszt"]):
                                if vizsgalat_idx == -1: vizsgalat_idx = idx
                            
                            if "mértékegység" in c_lower or "m.e." in c_lower or "egység" in c_lower:
                                mertekegyseg_idx = idx
                                continue

                            if any(k in c_lower for k in ["eredmény", "érték", "mért érték"]):
                                if "mérték" not in c_lower and eredmeny_idx == -1: 
                                    eredmeny_idx = idx
                            
                            if "mény" in c_lower and eredmeny_idx == -1: # Split header support
                                eredmeny_idx = idx
                            
                            if any(k in c_lower for k in ["referencia", "ref.", "tartomány"]):
                                ref_idx = idx
                            elif any(k in c_lower for k in ["minősítés", "státusz"]):
                                minosites_idx = idx
                        
                        # Merged Header check
                        if vizsgalat_idx != -1 and eredmeny_idx == -1:
                            if "eredmény" in str(row_texts[vizsgalat_idx]).lower():
                                eredmeny_idx = vizsgalat_idx

                        if vizsgalat_idx != -1 and (eredmeny_idx != -1 or ("eredmény" in str(row_texts[vizsgalat_idx]).lower() and vizsgalat_idx == eredmeny_idx)):
                            header_idx = i
                            headers = row_texts
                            found_header_map = {
                                "v": vizsgalat_idx,
                                "e": eredmeny_idx,
                                "m": mertekegyseg_idx,
                                "r": ref_idx,
                                "f": minosites_idx
                            }
                            break
                    
                    # Determine usage map
                    current_map = None
                    start_row = 0
                    
                    if found_header_map:
                        current_map = found_header_map
                        active_header_map = found_header_map
                        start_row = header_idx + 1
                        logging.info(f"HEADERS FOUND: {headers} map: {current_map}")
                    elif active_header_map:
                         # Check if table has enough columns to support validity
                         # At least up to max(v, e)
                         # Also check if the first row is not empty, which might indicate a blank table or separator
                         if not table[0] or not any(clean_text(c) for c in table[0]):
                             logging.debug("Skipping empty or separator table.")
                             continue

                         req_cols = max(active_header_map["v"], active_header_map["e"])
                         if len(table[0]) > req_cols:
                             current_map = active_header_map
                             start_row = 0
                             logging.info(f"Using inherited header map for table starting: {[clean_text(c) for c in table[0][:3]]}...")
                         else:
                             logging.debug(f"Table too narrow ({len(table[0])} cols) for inherited map (needs {req_cols+1} cols), skipping. First row: {[clean_text(c) for c in table[0]]}")
                             continue
                    else:
                         if len(table) > 0:
                             logging.info(f"Skipped table (no header), first row: {[clean_text(c) for c in table[0]]}")
                         continue

                    # Unpack map
                    vizsgalat_idx = current_map["v"]
                    eredmeny_idx = current_map["e"]
                    mertekegyseg_idx = current_map["m"]
                    ref_idx = current_map["r"]
                    minosites_idx = current_map["f"]

                    # Process data rows
                    for row in table[start_row:]:
                        if not row: continue

                        test_name = ""
                        result_val = ""
                        unit_candidate = None 
                        
                        # Standard case
                        if vizsgalat_idx != eredmeny_idx:
                            if len(row) > max(vizsgalat_idx, eredmeny_idx):
                                test_name = clean_text(row[vizsgalat_idx])
                                result_val = clean_text(row[eredmeny_idx])
                            else:
                                logging.debug(f"Row too short for standard case: {row}")
                                continue
                        
                        # Merged case
                        elif vizsgalat_idx == eredmeny_idx:
                            next_col_idx = vizsgalat_idx + 1
                            split_found = False
                            if len(row) > next_col_idx:
                                next_val = clean_text(row[next_col_idx])
                                if re.match(r'^([<>]?[\d.,]+|Negatív|Pozitív|Neg|Poz|Normál)$', next_val, re.IGNORECASE):
                                    test_name = clean_text(row[vizsgalat_idx])
                                    result_val = next_val
                                    split_found = True
                            
                            if not split_found:
                                raw_text = clean_text(row[vizsgalat_idx])
                                match = re.search(r'^(.*?)\s+([<>]?[\d.,]+)\s*(.*)$', raw_text)
                                if match:
                                    test_name = match.group(1).strip()
                                    result_val = match.group(2).strip()
                                    unit_candidate = match.group(3).strip()
                                else:
                                    match_text = re.search(r'^(.*?)\s+(Negatív|Pozitív|Neg|Poz|Normál)\s*(.*)$', raw_text, re.IGNORECASE)
                                    if match_text:
                                        test_name = match_text.group(1).strip()
                                        result_val = match_text.group(2).strip()
                                    else:
                                        logging.debug(f"Could not parse merged column: {raw_text}")
                                        continue

                        if not test_name or not result_val:
                            logging.debug(f"Empty name or result after parsing: name='{test_name}', res='{result_val}'")
                            continue
                            
                        # Initialize entry
                        entry = {
                            "test_name": test_name,
                            "result": result_val,
                            "unit": "",
                            "ref_range": "",
                            "flag": ""
                        }
                        
                        if mertekegyseg_idx != -1 and len(row) > mertekegyseg_idx:
                             entry["unit"] = clean_text(row[mertekegyseg_idx])
                        elif unit_candidate:
                             entry["unit"] = unit_candidate
                        
                        # Ref Range
                        final_ref_str = ""
                        r_min = None
                        r_max = None
                        
                        if ref_idx != -1 and len(row) > ref_idx:
                            candidates = []
                            for offset in range(0, 4):
                                col_i = ref_idx + offset
                                if col_i >= len(row): break
                                if mertekegyseg_idx != -1 and col_i == mertekegyseg_idx: break
                                candidates.append(clean_text(row[col_i]))
                            
                            for i in range(1, len(candidates) + 1):
                                merged = " ".join(candidates[:i])
                                t_min, t_max = parse_ref_range(merged)
                                if t_min is not None or t_max is not None:
                                    final_ref_str = merged
                                    r_min, r_max = t_min, t_max
                                    break
                                    
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
                                    break

                        entry["ref_range"] = final_ref_str
                        if r_min is not None: entry["ref_min"] = r_min
                        if r_max is not None: entry["ref_max"] = r_max

                        if minosites_idx != -1 and len(row) > minosites_idx:
                            entry["flag"] = clean_text(row[minosites_idx])
                        elif "+" in result_val or "*" in result_val:
                            if result_val.endswith("+") or result_val.endswith("*") or result_val.endswith("-"):
                                 entry["flag"] = result_val[-1]

                        # Simplify Test Name
                        test_name = test_name.strip().rstrip(".:")
                        test_name = re.sub(r'\s*\(A\).*$', '', test_name, flags=re.IGNORECASE)
                        
                        # Short name filter (Garbage collection)
                        if len(test_name) < 2 or test_name.replace('.','').replace('-','').isdigit():
                            logging.debug(f"Skipping short/numeric name: {test_name}")
                            continue

                        
                        # IgE Filtering
                        if "ige" in test_name.lower():
                            is_total = any(k in test_name.lower() for k in ["immunglobulin di", "immunglobulin e", "totál", "teljes", "összes"])
                            if not is_total:
                                 logging.debug(f"Skipping IgE variant: {test_name}")
                                 continue

                        # Noise filtering
                        noise_phrases = ["laboratóriumi lelet", "validálók", "oldal:", "hiteles", "amennyiben egy vizsgálatnál", "készült", "dátuma:", "időpontja:", "synlab", "leletnyo", "érvényes", "dr.", "főorvos", "belgyógyász", "asszisztens", "telefon", "fax", "email", "e-mail", "utc", "tér", "kerület", "emelet", "ajtó", "szakrendelő", "kórház", "laboratórium", "időpont", "honlap", "ügyfélszolgálat", "járóbeteg", "beutaló"]
                        
                        # Check both name and result for noise
                        if any(p in test_name.lower() or p in result_val.lower() for p in noise_phrases):
                            logging.debug(f"Skipping noise row: {test_name} - {result_val}")
                            continue

                        # Unit check in result
                        if result_val in ["Giga/L", "Tera/L", "g/L", "L/L", "fL", "pg", "%", "mmol/L", "umol/L", "kU/L", "U/L", "IU/mL"]:
                             if eredmeny_idx > 0: # Try Left
                                 prev_val = clean_text(row[eredmeny_idx - 1])
                                 if re.match(r'^[<>]?[\d.,]+$', prev_val):
                                     entry["unit"] = result_val
                                     result_val = prev_val
                             if result_val in ["Giga/L", "Tera/L", "g/L", "L/L", "fL", "pg", "%", "mmol/L", "umol/L", "kU/L", "U/L", "IU/mL"]:
                                 logging.debug(f"Result value is a unit, skipping: {result_val}")
                                 continue 

                        if entry not in results:
                            results.append(entry)

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
        
        # Fuzzy match against VALID_TEST_NAMES
        # If we find a close match, replace it.
        # We look for the best match with a high similarity threshold.
        # This helps normalize "Albumin (se)" to "Albumin" etc.
        
        best_match = None
        highest_ratio = 0.0
        
        # Check for exact containment first (case insensitive)
        for valid_name in VALID_TEST_NAMES:
            # Check exact match
            if valid_name.lower() == t_name.lower():
                best_match = valid_name
                highest_ratio = 1.0
                break
            
            # Check if valid_name is a substring of cleaned name or vice versa?
            # Usually strict substring is safe if long enough.
            # But let's use SequenceMatcher for robustness
            ratio = difflib.SequenceMatcher(None, t_name.lower(), valid_name.lower()).ratio()
            if ratio > highest_ratio:
                highest_ratio = ratio
                best_match = valid_name
        
        # Threshold for fuzzy matching
        # If > 0.85, we assume it's the same.
        # OR if one is substring of another and length difference is small?
        if highest_ratio > 0.85:
            t_name = best_match
        else:
             # Fallback check: is valid_name inside t_name?
             # e.g. "Sszes Albumin" (garbage) -> Albumin
             # e.g. "Albumin." -> Albumin
             found_contained = None
             for valid_name in VALID_TEST_NAMES:
                 if valid_name.lower() in t_name.lower():
                     # Only if valid_name is significant length
                     if len(valid_name) > 3:
                         # Prefer the longest match
                         if found_contained is None or len(valid_name) > len(found_contained):
                             found_contained = valid_name
             
             if found_contained:
                 t_name = found_contained

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
    
    # Process merged_medical_history.pdf specifically
    merged_pdf_path = os.path.abspath("merged_medical_history.pdf")
    
    if os.path.exists(merged_pdf_path):
        logging.info(f"Processing merged PDF: {merged_pdf_path}")
        extracted_results = extract_from_pdf(merged_pdf_path)
        if extracted_results:
             # Create a pseudo-doc record since we don't have manifest metadata for this manually created file
            doc_record = {
                "metadata": {
                    "lastModified": datetime.now().isoformat(),
                    "filepath": merged_pdf_path,
                    "institution": "Merged Document",
                    "type": "Laboratóriumi lelet"
                },
                "results": extracted_results
            }
            all_data.append(doc_record)
            logging.info(f"Extracted {len(extracted_results)} results from {merged_pdf_path}")
        else:
             logging.warning(f"No results extracted from {merged_pdf_path}")
    else:
        logging.error(f"Merged PDF not found at: {merged_pdf_path}")

    # Optionally process other docs if needed, but user emphasized the merged one.
    # We will keep the original loop but filter out if it touches the same content or if user wants ONLY the merged one.
    # Assuming the merged PDF contains everything, we might want to skip the manifest loop or keep it as backup.
    # Given the user instruction "That one should get the information from the merge_medical_history.pdf", 
    # implies this is the primary source.
    # To be safe, we'll process the manifest too ONLY IF merged pdf didn't yield results or if we want everything.
    # But usually merged pdf implies we just want that. Let's comment out the manifest loop to avoid duplicates if the merged pdf is working.
    # Actually, the user's workspace shows the file exists.
    
    if not all_data:
        logging.info("Fallback: Checking manifest for other labor documents...")
        for doc in target_docs:
            filepath = doc.get('filepath')
            if not filepath or not os.path.exists(filepath):
                continue
            
            # Skip if it's the extracted merged file itself (unlikely but possible)
            if os.path.abspath(filepath) == merged_pdf_path:
                continue

            extracted_results = extract_from_pdf(filepath)
            
            if extracted_results:
                doc_record = {
                    "metadata": doc,
                    "results": extracted_results
                }
                all_data.append(doc_record)
                logging.info(f"Extracted {len(extracted_results)} results from {filepath}")

    # Save to JSON
    output_file = "blood_results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=4, ensure_ascii=False)
    
    logging.info(f"Successfully exported data to {output_file}")
    
    # Save to JS for web app
    save_to_js(all_data)

if __name__ == "__main__":
    main()
