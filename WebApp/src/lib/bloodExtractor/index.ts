import * as pdfjsLib from 'pdfjs-dist';
import type { BloodTestResult } from '../../types/blood-results';
import type { ExtractionMetrics, ParseError } from './types';
import { createLogger } from './logger';
import { parsePageContent } from './page-parser';
import { cleanAndNormalizeResults } from './cleaners';
import { deduplicateResults } from './deduplicator';
import { validateResultsBatch } from './validators';
import { withRetry } from './error-recovery';

// Worker configuration is handled globally in main.tsx

const logger = createLogger('BloodExtractor');

/**
 * Extract blood test results from a merged PDF
 * @param pdfBytes - PDF file as Uint8Array
 * @returns Array of blood test results
 */
export async function extractBloodResults(
    pdfBytes: Uint8Array
): Promise<BloodTestResult[]> {
    const startTime = Date.now();
    const metrics: ExtractionMetrics = {
        totalPages: 0,
        totalRows: 0,
        successfulExtractions: 0,
        failedExtractions: 0,
        retryAttempts: 0,
        warnings: 0,
        errors: 0,
        processingTimeMs: 0
    };

    const allErrors: ParseError[] = [];

    try {
        logger.info('Starting blood test extraction from PDF');

        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const pdf = await loadingTask.promise;

        metrics.totalPages = pdf.numPages;
        logger.info(`Processing PDF with ${metrics.totalPages} pages`);

        const results: BloodTestResult[] = [];
        let previousDate: string | undefined = undefined;
        let previousColumnMap: ReturnType<typeof parsePageContent>['columnMap'] = null;

        logger.debug('[STICKY MAPS] Starting extraction with previousColumnMap = null');

        // Process each page with retry mechanism
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            try {
                // DEBUG: Log what we're passing to this page
                logger.debug(
                    `[STICKY MAPS] Page ${pageNum}: Passing previousColumnMap = ` +
                    `${previousColumnMap ? previousColumnMap.strategy : 'null'}`
                );

                const pageResults = await withRetry(
                    async () => {
                        const page = await pdf.getPage(pageNum);
                        const textContent = await page.getTextContent();

                        return parsePageContent(textContent, pageNum, previousDate, previousColumnMap);
                    },
                    `Page ${pageNum} extraction`,
                    { maxAttempts: 2, initialDelayMs: 50, maxDelayMs: 200, backoffMultiplier: 2 }
                );

                // DEBUG: Log what we received from this page
                logger.debug(
                    `[STICKY MAPS] Page ${pageNum}: Received columnMap = ` +
                    `${pageResults.columnMap ? pageResults.columnMap.strategy : 'null'}, ` +
                    `extracted ${pageResults.results.length} results`
                );

                results.push(...pageResults.results);
                metrics.totalRows += pageResults.results.length;
                metrics.successfulExtractions += pageResults.results.length;

                // Track errors
                allErrors.push(...pageResults.errors);
                const criticalErrors = pageResults.errors.filter((e) => e.severity === 'error');
                const warnings = pageResults.errors.filter((e) => e.severity === 'warning');

                metrics.errors += criticalErrors.length;
                metrics.warnings += warnings.length;

                // Update previous date for next page (sticky dates)
                if (pageResults.pageDate) {
                    previousDate = pageResults.pageDate;
                }

                // Update previous column map for next page (sticky column maps)
                if (pageResults.columnMap) {
                    previousColumnMap = pageResults.columnMap;
                    logger.debug(`[STICKY MAPS] Page ${pageNum}: Updated previousColumnMap for next page`);
                } else {
                    logger.debug(`[STICKY MAPS] Page ${pageNum}: No columnMap returned, keeping previous`);
                }

                logger.debug(`Page ${pageNum}: ${pageResults.results.length} results extracted`);
            } catch (error) {
                logger.error(`Failed to process page ${pageNum}`, error as Error);
                metrics.failedExtractions++;
                allErrors.push({
                    page: pageNum,
                    rowText: 'Entire page',
                    issue: `Page processing failed: ${(error as Error).message}`,
                    severity: 'error'
                });
            }
        }

        logger.info(
            `Extracted ${results.length} raw results from ${metrics.totalPages} pages`
        );

        // Validation
        const { validResults, invalidResults, qualityScore } =
            validateResultsBatch(results);

        logger.info(`Validation quality score: ${qualityScore.toFixed(1)}%`, {
            valid: validResults.length,
            invalid: invalidResults.length
        });

        if (invalidResults.length > 0) {
            logger.warn(
                `${invalidResults.length} results failed validation`,
                invalidResults.slice(0, 5).map((r) => ({
                    test: r.result.test_name,
                    issues: r.validation.errors.map((e) => e.issue)
                }))
            );
        }

        // Clean, normalize, and deduplicate
        const cleanedResults = cleanAndNormalizeResults(validResults);
        const { unique: dedupedResults, duplicates } = deduplicateResults(cleanedResults);

        logger.info(
            `Final: ${dedupedResults.length} unique results (removed ${duplicates} duplicates)`
        );

        // Calculate final metrics
        metrics.successfulExtractions = dedupedResults.length;
        metrics.processingTimeMs = Date.now() - startTime;

        logger.metrics('Extraction complete', {
            totalPages: metrics.totalPages,
            totalRows: metrics.totalRows,
            successfulExtractions: metrics.successfulExtractions,
            failedExtractions: metrics.failedExtractions,
            warnings: metrics.warnings,
            errors: metrics.errors,
            qualityScore: Math.round(qualityScore),
            processingTimeMs: metrics.processingTimeMs,
            duplicatesRemoved: duplicates
        });

        // Save error report if there are significant errors
        if (allErrors.length > 0) {
            await saveErrorReport(allErrors);
        }

        return dedupedResults;
    } catch (error) {
        logger.error('Fatal error during extraction', error as Error);
        throw error;
    }
}

/**
 * Save error report (for debugging)
 * In browser environment, this just logs to console
 */
async function saveErrorReport(errors: ParseError[]): Promise<void> {
    const report = {
        generated_at: new Date().toISOString(),
        total_errors: errors.length,
        errors: errors
    };

    logger.debug(`Generated error report with ${errors.length} issues`);
    console.log('Error report:', JSON.stringify(report, null, 2));
}

// Re-export commonly used functions for convenience
export { parseResultCell, parseReferenceRange } from './cell-parsers';
export { resolveUnit, extractTestDate } from './field-resolvers';
export { validateBloodTestResult } from './validators';
export { getStandardRefRange } from './referenceRanges';
export { createLogger } from './logger';
