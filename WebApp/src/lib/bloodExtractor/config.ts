import type { RetryConfig } from './types';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Blood extractor configuration
 * All magic numbers and thresholds centralized here
 */
export const CONFIG = {
    // Date validation
    DATE_RANGE: {
        MIN_YEAR: 2016, // Earliest acceptable test date
        MAX_YEAR: 2030  // Latest acceptable test date (future buffer)
    },

    // Spatial analysis thresholds
    SPATIAL: {
        MIN_COLUMN_GAP: 15,     // Minimum pixel gap to consider column separator
        ROW_Y_TOLERANCE: 2,     // Y-coordinate tolerance for same row
        CLUSTER_THRESHOLD: 10   // Clustering threshold for column detection
    },

    // Validation thresholds
    VALIDATION: {
        MIN_TEST_NAME_LENGTH: 2,
        MAX_UNIT_LENGTH: 15,
        // Biological range multipliers (flag if outside range by this factor)
        REF_RANGE_MULTIPLIER: {
            MIN: 0.1, // Flag if < 10% of ref_min
            MAX: 10.0 // Flag if > 1000% of ref_max
        }
    },

    // Retry configuration
    RETRY: {
        maxAttempts: 3,
        initialDelayMs: 100,
        maxDelayMs: 2000,
        backoffMultiplier: 2
    } as RetryConfig,

    // Logging - default to 'info' in browser environment
    LOG_LEVEL: 'info' as LogLevel
};
