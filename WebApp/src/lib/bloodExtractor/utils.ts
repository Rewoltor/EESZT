import type { RowData } from './types';

/**
 * Check if string is numeric
 */
export function isNumeric(str: string): boolean {
    if (!str || str.trim() === '') return false;
    const num = parseFloat(str.replace(',', '.'));
    return !isNaN(num) && isFinite(num);
}

/**
 * Check if row contains mostly noise/non-test data
 */
export function isNoisyRow(row: RowData): boolean {
    const rowText = row.items.map(item => item.str).join(' ');
    return isNoisyText(rowText);
}

/**
 * Check if text is likely noise/non-test data
 */
export function isNoisyText(text: string): boolean {
    if (!text || text.trim().length < 2) return true;
    const lower = text.toLowerCase().trim();
    const noisePatterns = [
        /^[_\-=~*#]+$/,
        /^oldalszám/,
        /^oldal\s+\d+/,
        /^page\s+\d+/,
        /mintavétel.*időpont/i,
        /^mintavételi.*hely/i,
        /^készült.*időpont/i,
        /^(?:neve|születési.*idő|taj|lakcím|anyja.*neve)/i,
        /^(?:ellátás|létrehozás).*(?:dátum|időpont)/i,
        /^(?:vérvételi|mintavételi).*időpont/i,
        /orvos.*szakképesítés/i,
        /pecsétszám/i,
        /^orvosi.*nyilatkozat/i,
        /^kizárólag.*szakorvos/i
    ];
    return noisePatterns.some(pattern => pattern.test(lower));
}

/**
 * Check if test name is definitely junk/non-test
 */
export function isDefinitelyJunk(testName: string): boolean {
    if (!testName || testName.trim().length < 2) return true;
    const lower = testName.toLowerCase().trim();
    const junkPatterns = [
        /^(?:null|undefined|nan)$/,
        /^[0-9\s.,\-:\/]+$/,
        /^x+$/i,
        /^(?:eredmény|vizsgálat|név|nime|dátum|teszt)$/i,
        /paraméter/i,
        /teszt.*név/i,
        /^measure/i,
        /^result$/i,
        /^value$/i,
        /vizsgáló.*labor/i,
        /szolgáltató/i
    ];
    return junkPatterns.some(pattern => pattern.test(lower));
}
