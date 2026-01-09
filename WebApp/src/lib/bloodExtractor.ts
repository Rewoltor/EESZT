import * as pdfjsLib from 'pdfjs-dist';

import type { BloodTestResult } from '../types/blood-results';

import { getCanonicalTestName } from './canonicalNames';



// Worker configuration is handled globally in main.tsx



// ============================================================================

// INTERFACES

// ============================================================================



interface TextItem {

    str: string;

    transform: number[];

    width: number;

    height: number;

}



// interface Cell {

// text: string;

// x: number;

// y: number;

// width: number;

// }



interface RowData {

    y: number;

    items: TextItem[];

}



interface ColumnMap {

    testNameIdx: number;

    resultIdx: number;

    unitIdx: number;

    refIdx: number;

    flagIdx: number;

}



interface ParsedResult {

    operator?: '<' | '>' | '<=';

    value: number | string;

    unit?: string;

    isQualitative: boolean;

}



interface RefRange {

    min: number | null;

    max: number | null;

    original: string;

}



interface ParseError {

    page: number;

    rowText: string;

    issue: string;

    severity: 'error' | 'warning';

}



// ============================================================================

// MAIN EXTRACTION FUNCTION

// ============================================================================



/**

* Extract blood test results from a merged PDF

* @param pdfBytes - PDF file as Uint8Array

* @returns Array of blood test results

*/

export async function extractBloodResults(pdfBytes: Uint8Array): Promise<BloodTestResult[]> {

    const results: BloodTestResult[] = [];

    const errors: ParseError[] = [];

    let previousDate: string | undefined = undefined;



    try {

        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });

        const pdf = await loadingTask.promise;



        console.log(`Processing PDF with ${pdf.numPages} pages`);



        // Process each page

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

            const page = await pdf.getPage(pageNum);

            const textContent = await page.getTextContent();



            const { results: pageResults, pageDate, errors: pageErrors } = parsePageContent(

                textContent,

                pageNum,

                previousDate

            );



            results.push(...pageResults);

            errors.push(...pageErrors);



            // Update previous date for next page

            if (pageDate) {

                previousDate = pageDate;

            }

        }



        console.log(`Extracted ${results.length} raw results with ${errors.length} errors`);



        // Clean, normalize, and deduplicate

        const cleanedResults = cleanAndNormalizeResults(results);

        const { unique: dedupedResults, duplicates } = deduplicateResults(cleanedResults);



        console.log(`Final: ${dedupedResults.length} unique results (removed ${duplicates} duplicates)`);



        // Save error report

        if (errors.length > 0) {

            await saveErrorReport(errors);

        }



        return dedupedResults;

    } catch (error) {

        console.error('Error extracting blood results:', error);

        throw error;

    }

}



// ============================================================================

// PHASE 1: SPATIAL TABLE DETECTION

// ============================================================================



/**

* Detect column boundaries by analyzing X-position distribution

* NOTE: This is a placeholder for future spatial column detection enhancement

* Currently using header-based detection in identifyHeaderRow()

*/

// function detectColumnBoundaries(cells: Cell[]): number[] {

// if (cells.length === 0) return [];

//

// // Collect all unique X positions

// const xPositions = [...new Set(cells.map(c => Math.round(c.x)))].sort((a, b) => a - b);

//

// const boundaries: number[] = [];

// const MIN_GAP = 15; // Minimum gap to consider a column separator

//

// for (let i = 1; i < xPositions.length; i++) {

// const gap = xPositions[i] - xPositions[i - 1];

// if (gap > MIN_GAP) {

// boundaries.push((xPositions[i] + xPositions[i - 1]) / 2);

// }

// }

//

// return boundaries;

// }



/**

* Assign each cell to a column index based on boundaries

* NOTE: This is a placeholder for future spatial column detection enhancement

*/

// function assignCellToColumn(cell: Cell, boundaries: number[]): number {

// for (let i = 0; i < boundaries.length; i++) {

// if (cell.x < boundaries[i]) {

// return i;

// }

// }

// return boundaries.length; // Last column

// }



// ============================================================================

// PHASE 2: INTELLIGENT RESULT PARSING

// ============================================================================



/**

* Parse a result cell that may contain operator, value, and unit

*/

function parseResultCell(text: string): ParsedResult {

    const trimmed = text.trim();



    // Pattern 1: Qualitative results

    const qualitativePattern = /^(neg|negat[ií]v|poz|pozit[ií]v|norm[aá]l|k[öő]zepes|enyhe|s[úu]lyos)/i;

    if (qualitativePattern.test(trimmed)) {

        return {

            value: trimmed,

            isQualitative: true

        };

    }



    // Pattern 2: Operator + Number + Unit (e.g., "<0.35 kU/L", ">90 mL/min")

    const operatorPattern = /^([<>]=?)\s*([0-9.,]+)\s*(.*)$/;

    const operatorMatch = trimmed.match(operatorPattern);



    if (operatorMatch) {

        return {

            operator: operatorMatch[1] as any,

            value: parseFloat(operatorMatch[2].replace(',', '.')),

            unit: operatorMatch[3].trim() || undefined,

            isQualitative: false

        };

    }



    // Pattern 3: Number + Unit (e.g., "73 g/L", "5.23 Giga/L")

    const numberUnitPattern = /^([0-9.,]+)\s*([a-zA-Z/%*°]+.*)$/;

    const numberUnitMatch = trimmed.match(numberUnitPattern);



    if (numberUnitMatch) {

        return {

            value: parseFloat(numberUnitMatch[1].replace(',', '.')),

            unit: numberUnitMatch[2].trim(),

            isQualitative: false

        };

    }



    // Pattern 4: Just a number

    const justNumberPattern = /^[0-9.,]+$/;

    if (justNumberPattern.test(trimmed)) {

        return {

            value: parseFloat(trimmed.replace(',', '.')),

            isQualitative: false

        };

    }



    // Fallback: return as qualitative

    return {

        value: trimmed,

        isQualitative: true

    };

}



// ============================================================================

// PHASE 3: MULTI-SOURCE FIELD RESOLUTION

// ============================================================================



/**

* Resolve the actual unit from multiple possible sources

*/

function resolveUnit(parsed: ParsedResult, unitCol?: string, refRangeCol?: string): string {

    // Priority 1: Unit from result cell itself (Format B: Szent János)

    if (parsed.unit) return parsed.unit;



    // Priority 2: Dedicated unit column (Format A: Synlab)

    if (unitCol && unitCol.trim() && !isNumeric(unitCol.trim())) {

        return unitCol.trim();

    }



    // Priority 3: Extract from reference range

    if (refRangeCol) {

        const unitMatch = refRangeCol.match(/([a-zA-Z/%*°]+)$/);

        if (unitMatch && unitMatch[1].trim().length < 15) {

            return unitMatch[1].trim();

        }

    }



    return '';

}



/**

* Check if a string is numeric

*/

function isNumeric(str: string): boolean {

    return /^[0-9.,\s<>-]+$/.test(str);

}



/**

* Parse reference range string with various formats

*/

function parseReferenceRange(text: string): RefRange {

    if (!text || !text.trim()) {

        return { min: null, max: null, original: '' };

    }



    const original = text;



    // Strip units first (everything after last digit)

    let cleanText = text.replace(/[a-zA-Z/%*°]+\s*$/, '').trim();

    cleanText = cleanText.replace(/,/g, '.'); // Normalize decimal separator



    // Pattern 1: "5.0 - 21.0" or "140 - 175"

    let match = cleanText.match(/([0-9.]+)\s*-\s*([0-9.]+)/);

    if (match) {

        const min = parseFloat(match[1]);

        const max = parseFloat(match[2]);

        if (!isNaN(min) && !isNaN(max)) {

            return { min, max, original };

        }

    }



    // Pattern 2: "< 87.0" or "<87"

    match = cleanText.match(/<\s*([0-9.]+)/);

    if (match) {

        const max = parseFloat(match[1]);

        if (!isNaN(max)) {

            return { min: 0, max, original };

        }

    }



    // Pattern 3: "> 10.0" or ">10"

    match = cleanText.match(/>\s*([0-9.]+)/);

    if (match) {

        const min = parseFloat(match[1]);

        if (!isNaN(min)) {

            return { min, max: null, original };

        }

    }



    return { min: null, max: null, original };

}



/**

* Extract test date from page text with context-aware logic

*/

function extractTestDate(pageText: string, previousDate?: string): string | null {

    // Prioritized date label patterns

    const datePatterns = [

        { label: 'Mintavétel', pattern: /Mintavétel[:\s]*(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})/i },

        { label: 'Ellátás', pattern: /Ellátás\s+időpontja[:\s]*(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})/i },

        { label: 'Létrehozás', pattern: /Létrehozás\s+dátuma[:\s]*(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})/i },

        { label: 'Generic', pattern: /(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})/g }

    ];



    for (const { pattern } of datePatterns) {

        const match = pageText.match(pattern);

        if (match) {

            const year = parseInt(match[1]);

            const month = parseInt(match[2]);

            const day = parseInt(match[3]);



            // STRICT: Only accept test dates (2016-2030), not birth dates

            if (year >= 2016 && year <= 2030 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {

                return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

            }

        }

    }



    // Fallback: Use previous page date if available (sticky date)

    return previousDate || null;

}



// ============================================================================

// PAGE PARSING

// ============================================================================



interface PageResults {

    results: BloodTestResult[];

    pageDate?: string;

    errors: ParseError[];

}



function parsePageContent(textContent: any, pageNum: number, previousDate?: string): PageResults {

    const results: BloodTestResult[] = [];

    const errors: ParseError[] = [];

    const items = textContent.items;



    // Extract date from page

    const allText = items.map((item: any) => item.str).join(' ');

    const pageDate = extractTestDate(allText, previousDate);



    if (!pageDate && !previousDate) {

        errors.push({

            page: pageNum,

            rowText: 'Page header',

            issue: 'No date found on page or in previous pages',

            severity: 'warning'

        });

    }



    // Group items by Y coordinate (rows)

    const rows = groupItemsByRow(items);



    // Try to identify table structure

    let headerRow: RowData | null = null;

    let columnMap: ColumnMap | null = null;



    for (const row of rows) {

        // Try to identify header row

        if (!headerRow) {

            const map = identifyHeaderRow(row);

            if (map) {

                headerRow = row;

                columnMap = map;

                continue;

            }

        }



        // If we have a column map, try to parse data rows

        if (columnMap) {

            const result = parseDataRow(row, columnMap, pageDate ?? previousDate ?? null);

            if (result) {

                results.push(result);

            } else if (row.items.length > 2 && !isNoisyRow(row)) {

                // Log unparseable row

                errors.push({

                    page: pageNum,

                    rowText: row.items.map(i => i.str).join(' | '),

                    issue: 'Failed to parse data row',

                    severity: 'warning'

                });

            }

        }

    }



    return { results, pageDate: pageDate ?? undefined, errors };

}



/**

* Group text items by their Y coordinate (row)

*/

function groupItemsByRow(items: any[]): RowData[] {

    const rowMap = new Map<number, TextItem[]>();



    for (const item of items) {

        const y = Math.round(item.transform[5]); // Y coordinate

        const str = item.str.trim();



        if (!str) continue;



        if (!rowMap.has(y)) {

            rowMap.set(y, []);

        }



        rowMap.get(y)!.push({

            str,

            transform: item.transform,

            width: item.width,

            height: item.height

        });

    }



    // Convert to array and sort by Y coordinate (top to bottom)

    const rows: RowData[] = [];

    for (const [y, items] of rowMap.entries()) {

        // Sort items in the row by X coordinate (left to right)

        items.sort((a, b) => a.transform[4] - b.transform[4]);

        rows.push({ y, items });

    }



    rows.sort((a, b) => b.y - a.y); // Top to bottom



    return rows;

}



/**

* Try to identify if a row is a header row containing column names

*/

function identifyHeaderRow(row: RowData): ColumnMap | null {

    const texts = row.items.map(item => item.str.toLowerCase());



    let testNameIdx = -1;

    let resultIdx = -1;

    let unitIdx = -1;

    let refIdx = -1;

    let flagIdx = -1;



    // Look for column indicators

    for (let i = 0; i < row.items.length; i++) {

        const text = texts[i];



        // Test name column

        if (text.includes('vizsgálat') || text.includes('megnevezés') || text.includes('teszt')) {

            if (testNameIdx === -1) testNameIdx = i;

        }



        // Result column

        if ((text.includes('eredmény') || text.includes('érték')) && !text.includes('mérték')) {

            if (resultIdx === -1) resultIdx = i;

        }



        // Unit column

        if (text.includes('mértékegység') || text.includes('m.e.') || text.includes('egység')) {

            unitIdx = i;

        }



        // Reference range column

        if (text.includes('referencia') || text.includes('ref.') || text.includes('tartomány')) {

            refIdx = i;

        }



        // Flag/Status column

        if (text.includes('minősítés') || text.includes('státusz') || text === '*') {

            flagIdx = i;

        }

    }



    // We need at least test name and result columns

    if (testNameIdx !== -1 && resultIdx !== -1) {

        return {

            testNameIdx,

            resultIdx,

            unitIdx: unitIdx !== -1 ? unitIdx : -1,

            refIdx: refIdx !== -1 ? refIdx : -1,

            flagIdx: flagIdx !== -1 ? flagIdx : -1

        };

    }



    return null;

}



/**

* Parse a data row using the identified column map

*/

function parseDataRow(row: RowData, columnMap: ColumnMap, date: string | null | undefined): BloodTestResult | null {

    if (row.items.length === 0) return null;



    let testName = '';

    let resultText = '';

    let unitText = '';

    let refRangeText = '';

    let flagText = '';



    // Extract values based on column map

    if (columnMap.testNameIdx < row.items.length) {

        testName = row.items[columnMap.testNameIdx].str.trim();

    }



    if (columnMap.resultIdx < row.items.length) {

        resultText = row.items[columnMap.resultIdx].str.trim();

    }



    if (columnMap.unitIdx !== -1 && columnMap.unitIdx < row.items.length) {

        unitText = row.items[columnMap.unitIdx].str.trim();

    }



    if (columnMap.refIdx !== -1 && columnMap.refIdx < row.items.length) {

        refRangeText = row.items[columnMap.refIdx].str.trim();

    }



    if (columnMap.flagIdx !== -1 && columnMap.flagIdx < row.items.length) {

        flagText = row.items[columnMap.flagIdx].str.trim();

    }



    // Filter out noise and invalid rows

    if (!testName || !resultText) return null;

    if (testName.length < 2) return null;

    if (isNoisyText(testName) || isNoisyText(resultText)) return null;



    // Parse result with smart parser

    const parsedResult = parseResultCell(resultText);



    // Resolve actual unit from multiple sources

    const actualUnit = resolveUnit(parsedResult, unitText, refRangeText);



    // Parse reference range

    const refRange = parseReferenceRange(refRangeText);



    // Build result object

    const bloodResult: BloodTestResult = {

        test_name: testName,

        result: parsedResult.isQualitative

            ? String(parsedResult.value)

            : String(parsedResult.value).replace('.', ','), // Hungarian decimal format for display

        unit: actualUnit,

        ref_range: refRange.original,

        flag: flagText,

        date: date !== null ? date : undefined

    };



    // Add parsed reference values if available

    if (refRange.min !== null) bloodResult.ref_min = refRange.min;

    if (refRange.max !== null) bloodResult.ref_max = refRange.max;



    return bloodResult;

}



/**

* Check if a row is likely noise (headers, footers, etc.)

*/

function isNoisyRow(row: RowData): boolean {

    const rowText = row.items.map(i => i.str).join(' ').toLowerCase();

    return isNoisyText(rowText);

}



/**

* Check if text is likely noise/header/footer

*/

function isNoisyText(text: string): boolean {

    const lowerText = text.toLowerCase();



    const noisePhrases = [

        'laboratóriumi lelet', 'validálók', 'oldal:', 'hiteles', 'készült',

        'dátuma:', 'időpontja:', 'synlab', 'leletnyo', 'érvényes', 'dr.',

        'főorvos', 'belgyógyász', 'asszisztens', 'telefon', 'fax', 'email',

        'e-mail', 'utc', 'tér', 'kerület', 'emelet', 'ajtó', 'szakrendelő',

        'kórház', 'laboratórium', 'időpont', 'honlap', 'ügyfélszolgálat',

        'járóbeteg', 'beutaló', 'szent jános', 'globenet', 'loinc'

    ];



    return noisePhrases.some(phrase => lowerText.includes(phrase));

}



/**

* Check if this is definitely junk data

*/

function isDefinitelyJunk(testName: string): boolean {

    // Pure numbers (like "10", "11", "12")

    if (/^\d+$/.test(testName.trim())) return true;



    // Numbers with dashes (like "777-3", "32623-1")

    if (/^\d+[-]\d+$/.test(testName.trim())) return true;



    // Short garbage

    if (testName.length < 3) return true;



    // Contains junk phrases

    const junkPhrases = [

        'eeszt', 'globenet', 'labworks', 'validált',

        'lap:', 'információ', 'lásd megj', 'ssz.',

        'windows', 'zrt.', 'által generált'

    ];



    const lower = testName.toLowerCase();

    if (junkPhrases.some(phrase => lower.includes(phrase))) return true;



    return false;

}



// ============================================================================

// PHASE 4: VALIDATION & QUALITY CONTROL

// ============================================================================



/**

* Clean and normalize all results - USE CANONICAL NAMES

*/

function cleanAndNormalizeResults(results: BloodTestResult[]): BloodTestResult[] {

    console.log(`=== Normalization: ${results.length} raw results ===`);



    const cleanedResults: BloodTestResult[] = [];



    for (const result of results) {

        const originalName = result.test_name;



        // Skip obvious junk

        if (isDefinitelyJunk(originalName)) {

            console.log(`❌ JUNK: "${originalName}"`);

            continue;

        }



        // Get canonical name

        const canonicalName = getCanonicalTestName(originalName);



        if (!canonicalName) {

            console.log(`⚠️ NO MATCH: "${originalName}"`);

            continue;

        }



        console.log(`✅ "${originalName}" → "${canonicalName}"`);



        // KEEP ALL RESULTS - no deduplication for longitudinal data

        cleanedResults.push({

            ...result,

            test_name: canonicalName

        });

    }



    console.log(`=== Result: ${cleanedResults.length} normalized results ===`);

    return cleanedResults;

}



/**

* Remove exact duplicates while preserving time-series data

*/

function deduplicateResults(results: BloodTestResult[]): { unique: BloodTestResult[], duplicates: number } {

    const seen = new Set<string>();

    const unique: BloodTestResult[] = [];

    let duplicates = 0;



    for (const result of results) {

        // Create unique key: test_name + date + result value

        const key = `${result.test_name}|${result.date || 'null'}|${result.result}`;



        if (!seen.has(key)) {

            seen.add(key);

            unique.push(result);

        } else {

            duplicates++;

        }

    }



    return { unique, duplicates };

}



/**

* Save error report to errors.json

*/

async function saveErrorReport(errors: ParseError[]): Promise<void> {

    const report = {

        generated_at: new Date().toISOString(),

        total_errors: errors.length,

        errors: errors

    };



    console.log(`Generated error report with ${errors.length} issues`);

    console.log('Error report:', JSON.stringify(report, null, 2));



    // Note: In browser environment, we can't write files directly

    // This would need to be handled by the calling code

}