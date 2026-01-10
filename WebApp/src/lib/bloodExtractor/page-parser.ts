import { createLogger } from './logger';
import type { PageResults, ParseError, ColumnMap, ColumnDetectionStrategy } from './types';
import { groupItemsByRow, extractPageText } from './pdf-parser';
import { detectTableStructure } from './table-detector';
import { parseDataRow } from './row-parser';
import { extractTestDate } from './field-resolvers';
import { isNoisyRow } from './utils';

const logger = createLogger('PageParser');

/**
 * Parse a single page of PDF content
 * Extracts date, detects table structure, and parses all data rows
 * IMPORTANT: Uses "sticky" column maps - reuses structure from previous pages
 */
export function parsePageContent(
    textContent: any,
    pageNum: number,
    previousDate?: string,
    previousColumnMap?: { columnMap: ColumnMap; strategy: ColumnDetectionStrategy } | null
): PageResults {
    const results: import('../../types/blood-results').BloodTestResult[] = [];
    const errors: ParseError[] = [];
    const items = textContent.items;

    // Extract date from page
    const allText = extractPageText(items);
    const pageDate = extractTestDate(allText, previousDate);

    if (!pageDate && !previousDate) {
        errors.push({
            page: pageNum,
            rowText: 'Page header',
            issue: 'No date found on page or in previous pages',
            severity: 'warning'
        });
    }

    // Group items by Y coordinate (rows)
    const rows = groupItemsByRow(items);
    logger.debug(`Page ${pageNum}: Grouped ${items.length} items into ${rows.length} rows`);

    // DEBUG: Log what column map we received
    logger.debug(
        `[STICKY MAPS] Page ${pageNum}: Received previousColumnMap = ` +
        `${previousColumnMap ? previousColumnMap.strategy : 'null'}`
    );

    // STICKY COLUMN MAP: Try to detect on this page, but reuse previous if detection fails
    // This handles multi-page reports where only the first page has headers
    let detection = detectTableStructure(rows);

    if (detection) {
        logger.info(
            `Page ${pageNum}: Detected NEW table structure using ${detection.strategy}`,
            detection.columnMap
        );
    } else if (previousColumnMap) {
        // Reuse previous page's column map
        detection = previousColumnMap;
        logger.info(
            `✅ Page ${pageNum}: Reusing column map from previous page (${previousColumnMap.strategy})`
        );
    }

    if (!detection) {
        logger.warn(`Page ${pageNum}: Could not detect table structure and no previous map available`);
        errors.push({
            page: pageNum,
            rowText: 'Entire page',
            issue: 'Failed to detect table structure (no headers or spatial patterns) and no previous map',
            severity: 'error'
        });
        return { results, pageDate: pageDate ?? null, errors, columnMap: null };
    }

    const { columnMap } = detection;

    // Parse data rows using detected column map
    for (const row of rows) {
        const result = parseDataRow(row, columnMap, pageDate ?? previousDate ?? null);

        if (result) {
            results.push(result);
        } else if (row.items.length > 2 && !isNoisyRow(row)) {
            // Log unparseable row (only if it has enough content and isn't noise)
            logger.debug(`Page ${pageNum}: Failed to parse row`, {
                rowText: row.items.map((i) => i.str).join(' | ')
            });

            errors.push({
                page: pageNum,
                rowText: row.items.map((i) => i.str).join(' | '),
                issue: 'Failed to parse data row',
                severity: 'warning'
            });
        }
    }

    logger.info(`Page ${pageNum}: Extracted ${results.length} results with ${errors.length} errors`);

    return { results, pageDate: pageDate ?? null, errors, columnMap: detection };
}
