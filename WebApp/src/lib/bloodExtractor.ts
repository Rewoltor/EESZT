import * as pdfjsLib from 'pdfjs-dist';
import referenceData from '../data/reference.json';
import type { BloodTestResult } from '../types/blood-results';

/**
 * Simple Blood Result Extractor
 * 
 * Algorithm:
 * 1. Search for EXACT test names from reference.json in PDF text
 * 2. Extract the number that appears in the same row
 * 3. Get date from bottom of page (Létrehozás dátuma or Leletnyomtatás/mentés)
 * 4. Use reference.json for units, ref_range, etc.
 */

interface TextItem {
    str: string;
    transform: number[]; // [a, b, c, d, x, y]
}

interface PageText {
    items: TextItem[];
}

interface MatchPosition {
    pageNum: number;
    itemIndex: number;
    x: number;
    y: number;
}

/**
 * Main extraction function
 */
export async function extractBloodResultsSimple(
    pdfData: Uint8Array | ArrayBuffer
): Promise<BloodTestResult[]> {
    console.log('[SimpleExtractor] Starting extraction...');

    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const results: BloodTestResult[] = [];

    console.log(`[SimpleExtractor] Processing ${pdf.numPages} pages...`);

    // For each test in reference.json
    for (const testDef of referenceData) {
        console.log(`[SimpleExtractor] Searching for: "${testDef.test_name}"`);

        let foundCount = 0;

        // Search through all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const pageResults = await extractTestFromPage(pdf, pageNum, testDef);

            if (pageResults.length > 0) {
                foundCount += pageResults.length;
                console.log(
                    `[SimpleExtractor] Found ${pageResults.length} result(s) on page ${pageNum}`
                );
            }

            results.push(...pageResults);
        }

        if (foundCount > 0) {
            console.log(`[SimpleExtractor] Total found for "${testDef.test_name}": ${foundCount}`);
        }
    }

    console.log(`[SimpleExtractor] Extraction complete. Total results: ${results.length}`);

    return results;
}

/**
 * Extract specific test from a specific page
 */
async function extractTestFromPage(
    pdf: any,
    pageNum: number,
    testDef: any
): Promise<BloodTestResult[]> {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent() as PageText;
    const items = textContent.items;

    // 1. Find exact test name matches (checking aliases too)
    const matches = findExactMatches(items, testDef.test_name, testDef.aliases);

    if (matches.length === 0) {
        return [];
    }

    // 2. Extract date from bottom of page
    const pageDate = extractDateFromBottom(items);

    // 3. For each match, extract value
    const results: BloodTestResult[] = [];

    for (const match of matches) {
        const value = extractValueNearMatch(items, match);

        if (value !== null) {
            const result = buildResult(testDef, value, pageDate);
            results.push(result);

            console.log(
                `[SimpleExtractor] Page ${pageNum}: "${testDef.test_name}" = ${value} ${testDef.unit}`
            );
        }
    }

    return results;
}

/**
 * Find exact matches of test name (or aliases) in text items
 * Case-insensitive exact match
 * Handles Hungarian "(A)" suffix (e.g., "Albumin (A)" matches "Albumin")
 */
function findExactMatches(items: TextItem[], testName: string, aliases?: string[]): MatchPosition[] {
    const matches: MatchPosition[] = [];

    // Build list of all valid names to search for (canonical name + aliases)
    const searchTerms = [testName, ...(aliases || [])].map(t => t.toLowerCase().trim());

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let itemText = item.str.toLowerCase().trim();

        // Strip Hungarian "(A)" suffix if present
        // This appears in some medical notes but doesn't change the test meaning
        if (itemText.endsWith(' (a)')) {
            itemText = itemText.slice(0, -4).trim();
        }

        // Check if item matches ANY of the valid names (exact match)
        if (searchTerms.includes(itemText)) {
            const x = item.transform[4];
            const y = item.transform[5];

            matches.push({
                pageNum: 0, // Will be set by caller
                itemIndex: i,
                x,
                y
            });
        }
    }

    return matches;
}

/**
 * Extract numeric value near the match
 * Uses robust "same row" approach - finds any number in the same row
 */
function extractValueNearMatch(items: TextItem[], match: MatchPosition): number | null {
    const Y_TOLERANCE = 5; // Pixels - items in same row should have similar Y

    // Get all items in the same row (similar Y coordinate)
    const sameRowItems = items.filter((item) => {
        const itemY = item.transform[5];
        return Math.abs(itemY - match.y) < Y_TOLERANCE;
    });

    // Sort by X position (left to right)
    sameRowItems.sort((a, b) => a.transform[4] - b.transform[4]);

    // Find the first numeric value in the row (after the test name)
    for (const item of sameRowItems) {
        const itemX = item.transform[4];

        // Only look at items to the right of the test name
        if (itemX > match.x) {
            const num = extractNumber(item.str);
            if (num !== null) {
                return num;
            }
        }
    }

    return null;
}

/**
 * Extract number from text
 * Handles: "602.0", "+602.0", "-5.2", "73"
 */
function extractNumber(text: string): number | null {
    // Remove common non-numeric prefixes
    let cleaned = text.trim();

    // Match number pattern: optional +/-, digits, optional decimal point and more digits
    const match = cleaned.match(/([+-]?)(\d+[.,]?\d*)/);

    if (match) {
        const sign = match[1] === '-' ? -1 : 1;
        const numStr = match[2].replace(',', '.'); // Handle both , and . as decimal
        const num = parseFloat(numStr);

        if (!isNaN(num)) {
            return sign * num;
        }
    }

    return null;
}

/**
 * Extract date from bottom of page
 * Pattern 1: "Létrehozás dátuma: YYYY.MM.DD"
 * Pattern 2: "Leletnyomtatás/mentés: YYYY.MM.DD"
 * Returns first match in ISO format (YYYY-MM-DD)
 */
function extractDateFromBottom(items: TextItem[]): string | null {
    // Combine all text from bottom 20% of page
    // (Dates are typically at very bottom)
    const allY = items.map((item) => item.transform[5]);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);
    const pageHeight = maxY - minY;
    const bottomThreshold = minY + pageHeight * 0.2;

    const bottomItems = items.filter((item) => item.transform[5] < bottomThreshold);
    const bottomText = bottomItems.map((item) => item.str).join(' ');

    // Pattern 1: Létrehozás dátuma: YYYY.MM.DD
    const pattern1 = /Létrehozás\s+dátuma:\s*(\d{4})\.(\d{2})\.(\d{2})/i;
    const match1 = bottomText.match(pattern1);

    if (match1) {
        const [_, year, month, day] = match1;
        const isoDate = `${year}-${month}-${day}`;
        console.log(`[SimpleExtractor] Found date (Létrehozás): ${isoDate}`);
        return isoDate;
    }

    // Pattern 2: Leletnyomtatás/mentés: YYYY.MM.DD
    const pattern2 = /Leletnyomtatás\s*\/\s*mentés:\s*(\d{4})\.(\d{2})\.(\d{2})/i;
    const match2 = bottomText.match(pattern2);

    if (match2) {
        const [_, year, month, day] = match2;
        const isoDate = `${year}-${month}-${day}`;
        console.log(`[SimpleExtractor] Found date (Leletnyomtatás): ${isoDate}`);
        return isoDate;
    }

    console.log('[SimpleExtractor] No date found at bottom of page');
    return null;
}

/**
 * Build result object using reference.json as source of truth
 */
function buildResult(
    testDef: any,
    value: number,
    date: string | null
): BloodTestResult {
    // Determine flag based on reference ranges
    let flag = '';

    if (testDef.ref_min != null && value < testDef.ref_min) {
        flag = 'LOW';
    } else if (testDef.ref_max != null && value > testDef.ref_max) {
        flag = 'HIGH';
    }

    // Build result using reference.json for ALL metadata
    const result: BloodTestResult = {
        test_name: testDef.test_name,           // Exact from reference.json
        result: String(value).replace('.', ','), // Hungarian format (comma decimal)
        unit: testDef.unit,                     // From reference.json
        ref_range: testDef.ref_range,           // From reference.json
        flag: flag,
        date: date || undefined
    };

    // Add min/max if available
    if (testDef.ref_min !== undefined) {
        result.ref_min = testDef.ref_min;
    }
    if (testDef.ref_max !== undefined) {
        result.ref_max = testDef.ref_max;
    }

    return result;
}

/**
 * Extract FULL text content from PDF for LLM context
 */
export async function extractFullText(
    pdfData: Uint8Array | ArrayBuffer
): Promise<string> {
    console.log('[SimpleExtractor] Starting FULL TEXT extraction...');

    try {
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        let fullText = '';

        console.log(`[SimpleExtractor] Extracting text from ${pdf.numPages} pages...`);

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Join items with spaces, add newlines for visual structure roughly
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
        }

        console.log(`[SimpleExtractor] Full text extracted (${fullText.length} chars).`);
        return fullText;
    } catch (e) {
        console.error('Error extracting full text:', e);
        return 'Error extracting text from document.';
    }
}
