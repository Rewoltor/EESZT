export interface TextItem {
    str: string;
    transform: number[];
    width: number;
    height: number;
}

export interface RowData {
    y: number;
    items: TextItem[];
}

export interface ColumnMap {
    testNameIdx: number;
    resultIdx: number;
    unitIdx: number;
    refIdx: number;
    flagIdx: number;
}

export interface ParsedResult {
    operator?: '<' | '>' | '<=';
    value: number | string;
    unit?: string;
    isQualitative: boolean;
}

export interface RefRange {
    min: number | null;
    max: number | null;
    original: string;
}

export interface ParseError {
    page: number;
    rowText: string;
    issue: string;
    severity: 'error' | 'warning';
}

export interface ReferenceTest {
    test_name: string;
    result_type: 'numeric' | 'string';
    unit: string;
    ref_range: string;
    ref_min: number | null;
    ref_max: number | null;
}

export interface PageResults {
    results: import('../../types/blood-results').BloodTestResult[];
    pageDate: string | null;
    errors: ParseError[];
    columnMap?: { columnMap: ColumnMap; strategy: ColumnDetectionStrategy } | null;
}

// NEW: Extraction strategies
export type ColumnDetectionStrategy = 'header-based' | 'spatial-analysis' | 'hybrid';

// NEW: Parsing context for better error messages
export interface ParsingContext {
    pageNum: number;
    rowNum: number;
    strategy: ColumnDetectionStrategy;
    columnMap?: ColumnMap;
}

// NEW: Validation result
export interface ValidationResult {
    isValid: boolean;
    warnings: ValidationWarning[];
    errors: ValidationError[];
}

export interface ValidationWarning {
    field: string;
    value: any;
    issue: string;
    suggestion?: string;
}

export interface ValidationError {
    field: string;
    value: any;
    issue: string;
    severity: 'critical' | 'high' | 'medium';
}

// NEW: Retry configuration
export interface RetryConfig {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}

// NEW: Extraction metrics for monitoring
export interface ExtractionMetrics {
    totalPages: number;
    totalRows: number;
    successfulExtractions: number;
    failedExtractions: number;
    retryAttempts: number;
    warnings: number;
    errors: number;
    processingTimeMs: number;
}
