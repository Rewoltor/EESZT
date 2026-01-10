/**
 * Canonical blood test names - this is the single source of truth
 * All extracted test names will be normalized to match these exactly
 */
export const CANONICAL_TEST_NAMES: Record<string, string> = {
    // Complete blood count (CBC)
    'fehérvérsejtszám': 'Fehérvérsejtszám (WBC)',
    'wbc': 'Fehérvérsejtszám (WBC)',
    'vörösvérsejtszám': 'Vörösvérsejtszám (RBC)',
    'rbc': 'Vörösvérsejtszám (RBC)',
    'hemoglobin': 'Hemoglobin',
    'hematokrit': 'Hematokrit',
    'mcv': 'MCV',
    'mch': 'MCH',
    'mchc': 'MCHC',
    'trombocitaszám': 'Trombocitaszám (Platelets)',
    'platelets': 'Trombocitaszám (Platelets)',
    'rdw-cv': 'RDW-CV',
    'rdw': 'RDW-CV',
    'mpv': 'MPV',

    // Differential white blood cell count
    'neutrofil granulocita %': 'Neutrofil granulocita %',
    'neutrofil %': 'Neutrofil granulocita %',
    'limfocita %': 'Limfocita %',
    'monocita %': 'Monocita %',
    'eozinofil granulocita %': 'Eozinofil granulocita %',
    'eozinofil %': 'Eozinofil granulocita %',
    'bazofil granulocita %': 'Bazofil granulocita %',
    'bazofil %': 'Bazofil granulocita %',
    'neutrofil granulocita #': 'Neutrofil granulocita #',
    'neutrofil #': 'Neutrofil granulocita #',
    'limfocita #': 'Limfocita #',
    'monocita #': 'Monocita #',
    'eozinofil granulocita #': 'Eozinofil granulocita #',
    'eozinofil #': 'Eozinofil granulocita #',
    'bazofil granulocita #': 'Bazofil granulocita #',
    'bazofil #': 'Bazofil granulocita #',
    'magvas vörösvértestek': 'Magvas vörösvértestek (NRBC)',
    'nrbc': 'Magvas vörösvértestek (NRBC)',

    // Chemistry
    'glükóz': 'Glükóz (Vércukor)',
    'vércukor': 'Glükóz (Vércukor)',
    'glucose': 'Glükóz (Vércukor)',
    'karbamid': 'Karbamid (Urea)',
    'urea': 'Karbamid (Urea)',
    'kreatinin': 'Kreatinin',
    'creatinine': 'Kreatinin',
    'egfr': 'eGFR-EPI',
    'egfr-epi': 'eGFR-EPI',
    'húgysav': 'Húgysav',
    'uric acid': 'Húgysav',
    'nátrium': 'Nátrium (Na)',
    'na': 'Nátrium (Na)',
    'sodium': 'Nátrium (Na)',
    'kálium': 'Kálium (K)',
    'k': 'Kálium (K)',
    'potassium': 'Kálium (K)',
    'vas': 'Vas (Fe)',
    'fe': 'Vas (Fe)',
    'iron': 'Vas (Fe)',

    // Lipids
    'koleszterin': 'Koleszterin',
    'cholesterol': 'Koleszterin',
    'triglicerid': 'Trigliceridek',
    'trigliceridek': 'Trigliceridek',
    'triglycerides': 'Trigliceridek',
    'hdl': 'HDL koleszterin',
    'hdl koleszterin': 'HDL koleszterin',
    'hdl-koleszterin': 'HDL koleszterin',

    // Liver function
    'totál bilirubin': 'Totál bilirubin',
    'bilirubin': 'Totál bilirubin',
    'got': 'GOT (ASAT)',
    'asat': 'GOT (ASAT)',
    'ast': 'GOT (ASAT)',
    'gpt': 'GPT (ALAT)',
    'alat': 'GPT (ALAT)',
    'alt': 'GPT (ALAT)',
    'gamma gt': 'Gamma GT (GGT)',
    'ggt': 'Gamma GT (GGT)',
    'alkalikus foszfatáz': 'Alkalikus foszfatáz',
    'alp': 'Alkalikus foszfatáz',
    'laktát dehidrogenáz': 'Laktát dehidrogenáz (LDH)',
    'ldh': 'Laktát dehidrogenáz (LDH)',

    // Thyroid
    'tsh': 'TSH',
    'tsh (szuperszenzitív)': 'TSH',
    'tireoidea stimuláló hormon': 'TSH',

    // Insulin
    'inzulin': 'Inzulin',
    'insulin': 'Inzulin',

    // Other
    'vörösvérsejt süllyedés': 'Vörösvérsejt süllyedés (ESR)',
    'esr': 'Vörösvérsejt süllyedés (ESR)',
    'we': 'Vörösvérsejt süllyedés (ESR)',

    // Immunoglobulins
    'immunglobulin e': 'Immunglobulin E (totál IgE)',
    'immunoglobulin e': 'Immunglobulin E (totál IgE)',
    'ige': 'Immunglobulin E (totál IgE)',
    'immunglobulin e (totál)': 'Immunglobulin E (totál IgE)',
    'immunglobulin e totál': 'Immunglobulin E (totál IgE)',

    // Specialty tests
    'hisztamin intolerancia': 'Hisztamin intolerancia (DAO)',
    'dao': 'Hisztamin intolerancia (DAO)',
    'széklet kalprotektin': 'Széklet kalprotektin',
    'kalprotektin': 'Széklet kalprotektin',
    'albumin': 'Albumin',
    'szérum albumin': 'Albumin',
    'c reaktív protein': 'C reaktív protein (CRP)',
    'crp': 'C reaktív protein (CRP)',
    'transzferrin': 'Transzferrin',
    'transferrin': 'Transzferrin',
    'transzferrin szaturáció': 'Transzferrin szaturáció',
    'amiláz': 'Amiláz',
    'amylase': 'Amiláz',
    'lipáz': 'Lipáz',
    'lipase': 'Lipáz',
    'összfehérje': 'Összfehérje',
    'total protein': 'Összfehérje',

    // HbA1c
    'hemoglobin a1c': 'Hemoglobin A1c (NGSP)',
    'hba1c': 'Hemoglobin A1c (NGSP)',
    'hba1c (ngsp)': 'Hemoglobin A1c (NGSP)',
    'hemoglobin a1c (ngsp)': 'Hemoglobin A1c (NGSP)',
    'hba1c (ifcc)': 'Hemoglobin A1c (IFCC)',
    'hemoglobin a1c (ifcc)': 'Hemoglobin A1c (IFCC)',

    // Minerals
    'kálcium': 'Kálcium (Ca)',
    'ca': 'Kálcium (Ca)',
    'calcium': 'Kálcium (Ca)',
    'magnézium': 'Magnézium (Mg)',
    'mg': 'Magnézium (Mg)',
    'magnesium': 'Magnézium (Mg)',

    // Other markers
    'széklet zonulin': 'Széklet zonulin',
    'zonulin': 'Széklet zonulin',
    'cea': 'CEA (Tumormarker)',
    'psa': 'PSA (Prosztata spec. antigén)',

    // Coagulation
    'protrombin %': 'Protrombin %',
    'protrombin inr': 'Protrombin INR',
    'inr': 'Protrombin INR',
    'protrombin idő': 'Protrombin idő',
    'apti': 'Parc. tromboplasztin ido (APTI)',
    'aptt': 'Parc. tromboplasztin ido (APTI)',
    'parc. tromboplasztin idő': 'Parc. tromboplasztin ido (APTI)',

    // Urine
    'vizelet fajsúly': 'Vizelet fajsúly',
    'vizelet ph': 'Vizelet pH',
    'vizelet fehérje': 'Vizelet fehérje',
};

/**
 * Get canonical test name from any variation
 */
export function getCanonicalTestName(rawName: string): string | null {
    if (!rawName || rawName.length < 2) return null;

    // Clean the input
    let cleaned = rawName.toLowerCase().trim();

    // Remove (A) suffix and everything after
    cleaned = cleaned.replace(/\s*\(a\).*$/i, '');

    // Remove multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Remove trailing punctuation
    cleaned = cleaned.replace(/[.:,;]+$/, '');

    // STRICT: Filter out obvious non-medical noise
    if (cleaned.length < 3) return null;
    if (cleaned.match(/^(és|vagy|a|az|csak|nem|meg|de|hogyan|milyen|mit|miten)$/)) return null; // Common Hungarian words
    if (cleaned.match(/(nyilatkozat|vény|szakorvos|ellátás|létrehozás)/)) return null; // Document text

    // Direct lookup
    if (CANONICAL_TEST_NAMES[cleaned]) {
        return CANONICAL_TEST_NAMES[cleaned];
    }

    // CRITICAL: Exclude allergen-specific tests before attempting partial matches
    // These often contain food/substance names that could match regular blood tests
    // Example: "Allergén specifikus IgE - Albumin" should NOT match "Albumin" (blood protein)
    if (cleaned.match(/(allergén|allergen|ige.*-|ige.*spec)/i)) {
        return null; // Don't match allergen tests to regular blood tests
    }

    // Try partial matches ONLY if cleaned name is at least 5 chars
    // This prevents single letter matches like "k" matching everything
    if (cleaned.length >= 5) {
        for (const [key, value] of Object.entries(CANONICAL_TEST_NAMES)) {
            // Require substantial overlap (at least 80% of key length)
            if (cleaned.includes(key) && key.length >= 5) {
                return value;
            }
            // Don't do reverse matching (key.includes(cleaned)) as it's too permissive
        }
    }

    // Return null if no match (will be filtered out later)
    return null;
}
