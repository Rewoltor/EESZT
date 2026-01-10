import { createLogger } from './logger';
import type { ParsedResult } from './types';
import { CONFIG } from './config';

const logger = createLogger('FieldResolvers');

/**
 * Check if a string is numeric
 */
function isNumeric(str: string): boolean {
    return /^[0-9.,\s<>-]+$/.test(str);
}

/**
 * Resolve the actual unit from multiple possible sources
 * Priority: 1) Result cell unit, 2) Unit column, 3) Reference range
 */
export function resolveUnit(
    parsed: ParsedResult,
    unitCol?: string,
    refRangeCol?: string
): string {
    // Priority 1: Unit from result cell itself (Format B: Szent János)
    if (parsed.unit) {
        logger.debug(`Unit resolved from result cell: "${parsed.unit}"`);
        return parsed.unit;
    }

    // Priority 2: Dedicated unit column (Format A: Synlab)
    if (unitCol && unitCol.trim() && !isNumeric(unitCol.trim())) {
        logger.debug(`Unit resolved from unit column: "${unitCol}"`);
        return unitCol.trim();
    }

    // Priority 3: Extract from reference range
    if (refRangeCol) {
        const unitMatch = refRangeCol.match(/([a-zA-Z/%*°]+)$/);
        if (unitMatch && unitMatch[1].trim().length < CONFIG.VALIDATION.MAX_UNIT_LENGTH) {
            logger.debug(`Unit resolved from reference range: "${unitMatch[1]}"`);
            return unitMatch[1].trim();
        }
    }

    logger.debug('No unit could be resolved');
    return '';
}

/**
 * Extract test date from page text with context-aware logic
 */
export function extractTestDate(pageText: string, previousDate?: string): string | null {
    // Prioritized date label patterns
    const datePatterns = [
        {
            label: 'Mintavétel',
            pattern: /Mintavétel[:\s]*(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})/i
        },
        {
            label: 'Ellátás',
            pattern: /Ellátás\s+időpontja[:\s]*(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})/i
        },
        {
            label: 'Létrehozás',
            pattern: /Létrehozás\s+dátuma[:\s]*(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})/i
        },
        { label: 'Generic', pattern: /(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})/g }
    ];

    for (const { label, pattern } of datePatterns) {
        const match = pageText.match(pattern);
        if (match) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]);
            const day = parseInt(match[3]);

            // STRICT: Only accept test dates, not birth dates
            const { MIN_YEAR, MAX_YEAR } = CONFIG.DATE_RANGE;

            if (
                year >= MIN_YEAR &&
                year <= MAX_YEAR &&
                month >= 1 &&
                month <= 12 &&
                day >= 1 &&
                day <= 31
            ) {
                const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                logger.debug(`Date extracted using "${label}" pattern: ${dateStr}`);
                return dateStr;
            }
        }
    }

    // Fallback: Use previous page date if available (sticky date)
    if (previousDate) {
        logger.debug(`Using sticky date from previous page: ${previousDate}`);
        return previousDate;
    }

    logger.debug('No date found on page');
    return null;
}
