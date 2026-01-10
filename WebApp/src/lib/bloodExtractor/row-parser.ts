import { createLogger } from './logger';
import type { RowData, ColumnMap } from './types';
import type { BloodTestResult } from '../../types/blood-results';
import { parseResultCell, parseReferenceRange } from './cell-parsers';
import { resolveUnit } from './field-resolvers';
import { isNoisyText } from './utils';
import { getCanonicalTestName } from '../canonicalNames';
import { getStandardRefRange } from './referenceRanges';

const logger = createLogger('RowParser');

/**
 * Parse a data row using the identified column map
 * Implements multi-source field resolution for units and reference ranges
 */
export function parseDataRow(
    row: RowData,
    columnMap: ColumnMap,
    date: string | null | undefined
): BloodTestResult | null {
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

    // IMPROVED: Parse reference range from multiple sources
    // Priority 1: Dedicated reference range column
    let refRange = parseReferenceRange(refRangeText);

    // Priority 2: Check flag column for reference ranges (common in some labs)
    if (!refRange.min && !refRange.max && flagText) {
        // Check if flag contains range pattern like "35 - 52" or "< 87.0"
        const flagRefRange = parseReferenceRange(flagText);

        if (flagRefRange.min !== null || flagRefRange.max !== null) {
            refRange = flagRefRange;
            flagText = ''; // Clear flag since it was actually a reference range
            logger.debug(`Reference range found in flag column: ${flagText}`);
        }
    }

    // Get canonical test name for standardization
    const canonicalTestName = getCanonicalTestName(testName);

    // CRITICAL: Unit validation to prevent data corruption
    // If we have a canonical test name with a standard unit, validate the extracted unit matches
    if (canonicalTestName) {
        const standardRange = getStandardRefRange(canonicalTestName);

        if (standardRange?.unit && actualUnit) {
            // Normalize units for comparison (case-insensitive, trim whitespace)
            const expectedUnit = standardRange.unit.toLowerCase().trim();
            const extractedUnit = actualUnit.toLowerCase().trim();

            if (extractedUnit !== expectedUnit) {
                // REJECT this result to prevent incorrect data grouping
                logger.warn(
                    `[UNIT VALIDATION] Rejecting result for safety:` +
                    `\n  Test name: "${testName}" (canonical: "${canonicalTestName}")` +
                    `\n  Extracted unit: "${actualUnit}"` +
                    `\n  Expected unit: "${standardRange.unit}"` +
                    `\n  This likely indicates a different test that was incorrectly matched.` +
                    `\n  Result value: "${parsedResult.value}"` +
                    `\n  To fix: Either improve fuzzy matching or add this as a new test in reference.json`
                );
                return null; // Reject to prevent data corruption
            } else {
                logger.debug(
                    `[UNIT VALIDATION] ✅ Unit matches for "${canonicalTestName}": "${actualUnit}"`
                );
            }
        }
    }

    // Priority 3: Use standardized reference range as fallback
    if (canonicalTestName && !refRange.min && !refRange.max) {
        const standardRange = getStandardRefRange(canonicalTestName);

        if (standardRange) {
            refRange = {
                min: standardRange.min,
                max: standardRange.max,
                original:
                    standardRange.min !== null && standardRange.max !== null
                        ? `${standardRange.min} - ${standardRange.max}`
                        : standardRange.max !== null
                            ? `< ${standardRange.max}`
                            : standardRange.min !== null
                                ? `> ${standardRange.min}`
                                : ''
            };
            logger.debug(
                `Using standard reference range for ${canonicalTestName}: ${refRange.original}`
            );
        }
    }

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
