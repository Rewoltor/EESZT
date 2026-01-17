/**
 * Blood test result data structure
 */
export interface BloodTestResult {
    testName: string;
    value: number;
    unit: string;
    date: string; // ISO format YYYY-MM-DD
    ref_range?: string;
    ref_min?: number;
    ref_max?: number;
    category?: string;
    aliases?: string[];
}

/**
 * Stored blood data with metadata
 */
export interface StoredBloodData {
    results: BloodTestResult[];
    processedAt: string; // ISO timestamp
    fileCount: number;
}

/**
 * Chart data point for visualization
 */
export interface ChartDataPoint {
    date: string;
    value: number;
    refMin?: number;
    refMax?: number;
}

/**
 * Grouped blood test results by test name
 */
export interface GroupedBloodResults {
    [testName: string]: BloodTestResult[];
}
