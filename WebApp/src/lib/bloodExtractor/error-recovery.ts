import { createLogger } from './logger';
import type { RetryConfig } from './types';
import { CONFIG } from './config';

const logger = createLogger('ErrorRecovery');

/**
 * Retry a function with exponential backoff
 * Best practice: Exponential backoff for transient failures
 * Reference: https://medium.com/@vijay.bhavik/resilient-data-pipelines-error-handling-and-retry-mechanisms-in-python-a60f77d34889
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    context: string,
    config: RetryConfig = CONFIG.RETRY
): Promise<T> {
    let lastError: Error | null = null;
    let delay = config.initialDelayMs;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        try {
            logger.debug(`${context} - Attempt ${attempt}/${config.maxAttempts}`);
            return await fn();
        } catch (error) {
            lastError = error as Error;
            logger.warn(`${context} - Attempt ${attempt} failed: ${lastError.message}`);

            if (attempt < config.maxAttempts) {
                logger.debug(`Retrying in ${delay}ms...`);
                await sleep(delay);

                // Exponential backoff
                delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
            }
        }
    }

    // All retries exhausted
    logger.error(`${context} - All ${config.maxAttempts} attempts failed`, lastError!);
    throw new Error(
        `${context} failed after ${config.maxAttempts} attempts: ${lastError!.message}`
    );
}

/**
 * Helper: Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Classify error type to determine if retry is appropriate
 * Best practice: Don't retry permanent errors
 */
export function shouldRetry(error: Error): boolean {
    const permanentErrors = [
        'Authentication failed',
        'Invalid credentials',
        'File not found',
        'Permission denied',
        'Invalid PDF structure'
    ];

    const message = error.message;

    // Don't retry permanent errors
    if (permanentErrors.some((pattern) => message.includes(pattern))) {
        logger.debug(`Error classified as permanent, will not retry: ${message}`);
        return false;
    }

    // Retry transient errors (network, timeout, etc.)
    logger.debug(`Error classified as transient, will retry: ${message}`);
    return true;
}

/**
 * Quarantine problematic data for manual review
 * Best practice: Separate bad data for investigation
 */
export interface QuarantinedData {
    timestamp: string;
    source: string;
    data: any;
    error: string;
    attempts: number;
}

const quarantine: QuarantinedData[] = [];

export function quarantineData(
    source: string,
    data: any,
    error: Error,
    attempts: number
): void {
    const quarantined: QuarantinedData = {
        timestamp: new Date().toISOString(),
        source,
        data,
        error: error.message,
        attempts
    };

    quarantine.push(quarantined);
    logger.warn(`Data quarantined from ${source}`, quarantined);
}

export function getQuarantinedData(): QuarantinedData[] {
    return [...quarantine];
}

export function clearQuarantine(): void {
    logger.info(`Clearing ${quarantine.length} quarantined items`);
    quarantine.length = 0;
}
