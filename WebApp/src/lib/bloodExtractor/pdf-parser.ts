import { createLogger } from './logger';
import type { RowData, TextItem } from './types';
import { CONFIG } from './config';

const logger = createLogger('PDFParser');

/**
 * Group text items by their Y coordinate (row)
 * Best practice: Use spatial clustering for robust row detection
 */
export function groupItemsByRow(items: any[]): RowData[] {
    logger.debug(`Grouping ${items.length} text items into rows`);

    const rowMap = new Map<number, TextItem[]>();
    const tolerance = CONFIG.SPATIAL.ROW_Y_TOLERANCE;

    for (const item of items) {
        const y = Math.round(item.transform[5]);
        const str = item.str.trim();

        if (!str) continue;

        // Find existing row within tolerance
        let matchedY: number | null = null;
        for (const existingY of rowMap.keys()) {
            if (Math.abs(existingY - y) <= tolerance) {
                matchedY = existingY;
                break;
            }
        }

        const targetY = matchedY ?? y;
        if (!rowMap.has(targetY)) {
            rowMap.set(targetY, []);
        }

        rowMap.get(targetY)!.push({
            str,
            transform: item.transform,
            width: item.width,
            height: item.height
        });
    }

    // Convert to array and sort
    const rows: RowData[] = [];
    for (const [y, items] of rowMap.entries()) {
        // Sort items in row by X coordinate (left to right)
        items.sort((a, b) => a.transform[4] - b.transform[4]);
        rows.push({ y, items });
    }

    // Sort rows by Y coordinate (top to bottom)
    rows.sort((a, b) => b.y - a.y);

    logger.debug(`Grouped into ${rows.length} rows`);
    return rows;
}

/**
 * Extract all text from a page for date/metadata extraction
 */
export function extractPageText(items: any[]): string {
    return items.map((item: any) => item.str).join(' ');
}
