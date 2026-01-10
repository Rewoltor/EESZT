import { createLogger } from './logger';
import type { BloodTestResult } from '../../types/blood-results';
import { getCanonicalTestName } from '../canonicalNames';
import { isDefinitelyJunk } from './utils';

const logger = createLogger('Cleaners');

/**
 * Clean and normalize all results - USE CANONICAL NAMES
 */
export function cleanAndNormalizeResults(
    results: BloodTestResult[]
): BloodTestResult[] {
    logger.info(`Normalizing ${results.length} raw results`);

    const cleanedResults: BloodTestResult[] = [];

    for (const result of results) {
        const originalName = result.test_name;

        // Skip obvious junk
        if (isDefinitelyJunk(originalName)) {
            logger.debug(`Skipping junk: "${originalName}"`);
            continue;
        }

        // Get canonical name
        const canonicalName = getCanonicalTestName(originalName);

        if (!canonicalName) {
            logger.debug(`No canonical match for: "${originalName}"`);
            continue;
        }

        logger.debug(`Normalized: "${originalName}" → "${canonicalName}"`);

        // KEEP ALL RESULTS - no deduplication for longitudinal data
        cleanedResults.push({
            ...result,
            test_name: canonicalName
        });
    }

    logger.info(`Normalization complete: ${cleanedResults.length} results`);
    return cleanedResults;
}
