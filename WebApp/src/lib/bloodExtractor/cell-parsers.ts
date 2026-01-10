import { createLogger } from './logger';
import type { ParsedResult, RefRange } from './types';

const logger = createLogger('CellParsers');

/**
 * Parse a result cell that may contain operator, value, and unit
 */
export function parseResultCell(text: string): ParsedResult {
    const trimmed = text.trim();

    // Pattern 1: Qualitative results
    const qualitativePattern = /^(neg|negatív|pozitív|normál|közepes|enyhe|súlyos)/i;
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
    logger.debug(`Result cell parsed as qualitative fallback: "${trimmed}"`);
    return {
        value: trimmed,
        isQualitative: true
    };
}

/**
 * Parse reference range string with various formats
 */
export function parseReferenceRange(text: string): RefRange {
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

    logger.debug(`Could not parse reference range: "${text}"`);
    return { min: null, max: null, original };
}
