import { createLogger } from './logger';
import type { ValidationResult, ValidationWarning, ValidationError } from './types';
import type { BloodTestResult } from '../../types/blood-results';
import { getStandardRefRange } from './referenceRanges';
import { CONFIG } from './config';

const logger = createLogger('Validator');

/**
 * Validate extracted blood test result
 * Best practice: Multi-stage validation with severity levels
 * Reference: https://www.future-processing.com/blog/data-validation-in-etl/
 */
export function validateBloodTestResult(result: BloodTestResult): ValidationResult {
    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];

    // 1. Required fields check
    if (
        !result.test_name ||
        result.test_name.trim().length < CONFIG.VALIDATION.MIN_TEST_NAME_LENGTH
    ) {
        errors.push({
            field: 'test_name',
            value: result.test_name,
            issue: `Test name too short (min ${CONFIG.VALIDATION.MIN_TEST_NAME_LENGTH} chars)`,
            severity: 'critical'
        });
    }

    if (!result.result || result.result.trim() === '') {
        errors.push({
            field: 'result',
            value: result.result,
            issue: 'Result value is empty',
            severity: 'critical'
        });
    }

    // 2. Data type validation
    if (result.unit && result.unit.length > CONFIG.VALIDATION.MAX_UNIT_LENGTH) {
        warnings.push({
            field: 'unit',
            value: result.unit,
            issue: 'Unit string suspiciously long',
            suggestion: 'May have been incorrectly parsed from merged cell'
        });
    }

    // 3. Biological range validation
    if (result.ref_min !== undefined || result.ref_max !== undefined) {
        const numericResult = parseFloat(result.result.replace(',', '.'));

        if (!isNaN(numericResult)) {
            const { MIN, MAX } = CONFIG.VALIDATION.REF_RANGE_MULTIPLIER;

            // Flag if extremely outside range
            if (result.ref_min && numericResult < result.ref_min * MIN) {
                errors.push({
                    field: 'result',
                    value: numericResult,
                    issue: `Value ${numericResult} is ${((result.ref_min / numericResult) * 100).toFixed(1)}% below reference minimum (${result.ref_min})`,
                    severity: 'high'
                });
            }

            if (result.ref_max && numericResult > result.ref_max * MAX) {
                errors.push({
                    field: 'result',
                    value: numericResult,
                    issue: `Value ${numericResult} is ${((numericResult / result.ref_max) * 100).toFixed(1)}% above reference maximum (${result.ref_max})`,
                    severity: 'high'
                });
            }

            // Warn if moderately outside range
            if (result.ref_min && result.ref_max) {
                if (numericResult < result.ref_min) {
                    warnings.push({
                        field: 'result',
                        value: numericResult,
                        issue: `Value ${numericResult} below reference range (${result.ref_min} - ${result.ref_max})`,
                        suggestion: 'This may be a valid low result or parsing error'
                    });
                }

                if (numericResult > result.ref_max) {
                    warnings.push({
                        field: 'result',
                        value: numericResult,
                        issue: `Value ${numericResult} above reference range (${result.ref_min} - ${result.ref_max})`,
                        suggestion: 'This may be a valid high result or parsing error'
                    });
                }
            }
        }
    }

    // 4. Cross-reference with standard ranges
    const standardRange = getStandardRefRange(result.test_name);
    if (standardRange && !result.ref_min && !result.ref_max) {
        warnings.push({
            field: 'ref_range',
            value: result.ref_range,
            issue: 'No reference range extracted from PDF',
            suggestion: `Standard range available: ${standardRange.min} - ${standardRange.max} ${standardRange.unit}`
        });
    }

    // 5. Unit consistency check
    if (standardRange && result.unit && result.unit !== standardRange.unit) {
        warnings.push({
            field: 'unit',
            value: result.unit,
            issue: `Unit "${result.unit}" differs from standard "${standardRange.unit}"`,
            suggestion: 'Verify unit consistency across reports'
        });
    }

    // 6. Date format validation
    if (result.date) {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(result.date)) {
            errors.push({
                field: 'date',
                value: result.date,
                issue: 'Date not in ISO format (YYYY-MM-DD)',
                severity: 'medium'
            });
        } else {
            // Validate date is within acceptable range
            const year = parseInt(result.date.split('-')[0]);
            if (
                year < CONFIG.DATE_RANGE.MIN_YEAR ||
                year > CONFIG.DATE_RANGE.MAX_YEAR
            ) {
                errors.push({
                    field: 'date',
                    value: result.date,
                    issue: `Year ${year} outside acceptable range (${CONFIG.DATE_RANGE.MIN_YEAR}-${CONFIG.DATE_RANGE.MAX_YEAR})`,
                    severity: 'high'
                });
            }
        }
    }

    const isValid = errors.filter((e) => e.severity === 'critical').length === 0;

    if (!isValid) {
        logger.warn(`Validation failed for ${result.test_name}`, { errors, warnings });
    }

    return { isValid, warnings, errors };
}

/**
 * Validate a batch of results and generate quality report
 */
export function validateResultsBatch(results: BloodTestResult[]): {
    validResults: BloodTestResult[];
    invalidResults: Array<{ result: BloodTestResult; validation: ValidationResult }>;
    qualityScore: number;
} {
    logger.info(`Validating batch of ${results.length} results`);

    const validResults: BloodTestResult[] = [];
    const invalidResults: Array<{
        result: BloodTestResult;
        validation: ValidationResult;
    }> = [];

    for (const result of results) {
        const validation = validateBloodTestResult(result);

        if (validation.isValid) {
            validResults.push(result);
        } else {
            invalidResults.push({ result, validation });
        }
    }

    const qualityScore = (validResults.length / results.length) * 100;

    logger.info('Validation complete', {
        total: results.length,
        valid: validResults.length,
        invalid: invalidResults.length,
        qualityScore: `${qualityScore.toFixed(1)}%`
    });

    return { validResults, invalidResults, qualityScore };
}
