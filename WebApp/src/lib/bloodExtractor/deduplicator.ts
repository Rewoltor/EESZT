import { createLogger } from './logger';
import type { BloodTestResult } from '../../types/blood-results';

const logger = createLogger('Deduplicator');

/**
 * Remove exact duplicates while preserving time-series data
 */
export function deduplicateResults(results: BloodTestResult[]): {
    unique: BloodTestResult[];
    duplicates: number;
} {
    logger.info(`Deduplicating ${results.length} results`);

    const seen = new Set<string>();
    const unique: BloodTestResult[] = [];
    let duplicates = 0;

    for (const result of results) {
        // Create unique key
        // If date is null, include randomness to prevent deduplication
        // (better false negatives than false positives)
        const key = result.date
            ? `${result.test_name}|${result.date}|${result.result}`
            : `${result.test_name}|NO_DATE|${result.result}|${Math.random()}`;

        if (!seen.has(key)) {
            seen.add(key);
            unique.push(result);
        } else {
            // Only count as duplicate if we have a valid date
            if (result.date) {
                duplicates++;
                logger.debug(`Duplicate found: ${result.test_name} on ${result.date}`);
            } else {
                // Without dates, we can't be sure it's a duplicate, so keep it
                unique.push(result);
            }
        }
    }

    logger.info(
        `Deduplication complete: ${unique.length} unique, ${duplicates} duplicates removed`
    );
    return { unique, duplicates };
}
