import { createLogger } from './logger';
import type { RowData, ColumnMap, TextItem, ColumnDetectionStrategy } from './types';
import { CONFIG } from './config';

const logger = createLogger('TableDetector');

/**
 * Identify if a row is a header row containing column names
 * Best practice: Support multiple languages and patterns
 */
export function identifyHeaderRow(row: RowData): ColumnMap | null {
    const texts = row.items.map((item) => item.str.toLowerCase());

    let testNameIdx = -1;
    let resultIdx = -1;
    let unitIdx = -1;
    let refIdx = -1;
    let flagIdx = -1;

    // Look for column indicators (Hungarian & English)
    for (let i = 0; i < row.items.length; i++) {
        const text = texts[i];

        // Test name column
        if (
            text.includes('vizsgálat') ||
            text.includes('megnevezés') ||
            text.includes('teszt') ||
            text.includes('test') ||
            text.includes('name') ||
            text.includes('parameter')
        ) {
            if (testNameIdx === -1) testNameIdx = i;
        }

        // Result column
        if (
            (text.includes('eredmény') ||
                text.includes('érték') ||
                text.includes('result') ||
                text.includes('value')) &&
            !text.includes('mérték')
        ) {
            if (resultIdx === -1) resultIdx = i;
        }

        // Unit column
        if (
            text.includes('mértékegység') ||
            text.includes('m.e.') ||
            text.includes('egység') ||
            text.includes('unit') ||
            text.includes('measure')
        ) {
            unitIdx = i;
        }

        // Reference range column
        if (
            text.includes('referencia') ||
            text.includes('ref.') ||
            text.includes('tartomány') ||
            text.includes('reference') ||
            text.includes('range') ||
            text.includes('normal')
        ) {
            refIdx = i;
        }

        // Flag/Status column
        if (
            text.includes('minősítés') ||
            text.includes('státusz') ||
            text === '*' ||
            text.includes('flag') ||
            text.includes('status') ||
            text.includes('interpretation')
        ) {
            flagIdx = i;
        }
    }

    // Minimum requirement: test name and result columns
    if (testNameIdx !== -1 && resultIdx !== -1) {
        const columnMap: ColumnMap = {
            testNameIdx,
            resultIdx,
            unitIdx: unitIdx !== -1 ? unitIdx : -1,
            refIdx: refIdx !== -1 ? refIdx : -1,
            flagIdx: flagIdx !== -1 ? flagIdx : -1
        };

        logger.debug('Header row identified', { columnMap });
        return columnMap;
    }

    return null;
}

/**
 * NEW: Spatial boundary detection using X-position clustering
 * Best practice: Use clustering for column detection
 * Reference: https://arxiv.org/abs/2104.00650 (Table structure recognition)
 */
export function detectColumnBoundaries(rows: RowData[]): number[] {
    logger.debug('Starting spatial column boundary detection');

    if (rows.length === 0) return [];

    // Collect all X positions from all rows
    const xPositions: number[] = [];
    for (const row of rows) {
        for (const item of row.items) {
            xPositions.push(Math.round(item.transform[4]));
        }
    }

    // Sort and deduplicate
    const uniqueX = [...new Set(xPositions)].sort((a, b) => a - b);

    // Find gaps larger than MIN_COLUMN_GAP
    const boundaries: number[] = [];
    const minGap = CONFIG.SPATIAL.MIN_COLUMN_GAP;

    for (let i = 1; i < uniqueX.length; i++) {
        const gap = uniqueX[i] - uniqueX[i - 1];
        if (gap > minGap) {
            const boundary = (uniqueX[i] + uniqueX[i - 1]) / 2;
            boundaries.push(boundary);
        }
    }

    logger.debug(`Detected ${boundaries.length} column boundaries`, { boundaries });
    return boundaries;
}

/**
 * NEW: Assign cell to column based on spatial boundaries
 */
export function assignCellToColumn(item: TextItem, boundaries: number[]): number {
    const x = item.transform[4];

    for (let i = 0; i < boundaries.length; i++) {
        if (x < boundaries[i]) {
            return i;
        }
    }

    return boundaries.length; // Last column
}

/**
 * NEW: Build column map from spatial boundaries
 * Strategy: Analyze first few data rows to determine column purposes
 */
export function buildColumnMapFromSpatial(
    rows: RowData[],
    boundaries: number[]
): ColumnMap | null {
    logger.debug('Building column map from spatial analysis');

    // Take first 5 data rows (skip potential headers)
    const sampleRows = rows.slice(0, Math.min(5, rows.length));
    const numColumns = boundaries.length + 1;

    // Analyze each column's content
    const columnCharacteristics = Array(numColumns)
        .fill(null)
        .map(() => ({
            hasText: 0,
            hasNumbers: 0,
            hasRanges: 0,
            hasUnits: 0
        }));

    for (const row of sampleRows) {
        const columnCells: string[] = Array(numColumns).fill('');

        // Assign each cell to a column
        for (const item of row.items) {
            const colIdx = assignCellToColumn(item, boundaries);
            columnCells[colIdx] += item.str + ' ';
        }

        // Analyze each column
        columnCells.forEach((cell, idx) => {
            const trimmed = cell.trim();
            if (!trimmed) return;

            if (/[a-zA-Záéíóöőúüű]/.test(trimmed)) columnCharacteristics[idx].hasText++;
            if (/\d/.test(trimmed)) columnCharacteristics[idx].hasNumbers++;
            if (/-|<|>/.test(trimmed)) columnCharacteristics[idx].hasRanges++;
            if (/(g\/L|mmol|%|U\/L)/i.test(trimmed)) columnCharacteristics[idx].hasUnits++;
        });
    }

    // Heuristic assignment
    let testNameIdx = -1;
    let resultIdx = -1;
    let unitIdx = -1;
    let refIdx = -1;

    // Test name: mostly text, few numbers
    testNameIdx = columnCharacteristics.findIndex(
        (c) => c.hasText > c.hasNumbers && c.hasText >= sampleRows.length / 2
    );

    // Reference range: has ranges
    refIdx = columnCharacteristics.findIndex((c) => c.hasRanges >= sampleRows.length / 2);

    // Result: has numbers, not the reference column
    resultIdx = columnCharacteristics.findIndex(
        (c, i) => c.hasNumbers >= sampleRows.length / 2 && i !== refIdx
    );

    // Unit: has units
    unitIdx = columnCharacteristics.findIndex((c) => c.hasUnits >= sampleRows.length / 2);

    if (testNameIdx !== -1 && resultIdx !== -1) {
        const columnMap: ColumnMap = {
            testNameIdx,
            resultIdx,
            unitIdx,
            refIdx,
            flagIdx: -1 // Can't detect flag column spatially
        };

        logger.debug('Spatial column map built', { columnMap });
        return columnMap;
    }

    logger.warn('Could not build column map from spatial analysis');
    return null;
}

/**
 * NEW: Hybrid detection strategy
 * Try header-based first, fall back to spatial if headers unclear
 */
export function detectTableStructure(rows: RowData[]): {
    columnMap: ColumnMap;
    strategy: ColumnDetectionStrategy;
} | null {
    logger.debug('Detecting table structure with hybrid strategy');

    // Strategy 1: Header-based detection
    for (const row of rows) {
        const columnMap = identifyHeaderRow(row);
        if (columnMap) {
            logger.info('Table structure detected using header-based strategy');
            return { columnMap, strategy: 'header-based' };
        }
    }

    // Strategy 2: Spatial analysis
    const boundaries = detectColumnBoundaries(rows);
    if (boundaries.length > 0) {
        const columnMap = buildColumnMapFromSpatial(rows, boundaries);
        if (columnMap) {
            logger.info('Table structure detected using spatial analysis');
            return { columnMap, strategy: 'spatial-analysis' };
        }
    }

    logger.warn('Failed to detect table structure with any strategy');
    return null;
}
