import referenceData from '../../data/reference.json';
import type { ReferenceTest } from './types';

/**
 * Standardized reference ranges for blood tests
 * Loaded from reference.json - single source of truth for all blood test metadata
 */
const STANDARD_REFERENCE_RANGES: Record<string, { min: number | null, max: number | null, unit: string }> = {};

// Build lookup map from reference data
for (const test of referenceData as ReferenceTest[]) {
    STANDARD_REFERENCE_RANGES[test.test_name] = {
        min: test.ref_min,
        max: test.ref_max,
        unit: test.unit
    };
}

/**
 * Get standard reference range for a test
 */
export function getStandardRefRange(testName: string): { min: number | null, max: number | null, unit: string } | null {
    return STANDARD_REFERENCE_RANGES[testName] || null;
}
