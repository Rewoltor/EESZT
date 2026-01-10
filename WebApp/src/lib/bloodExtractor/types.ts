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
}
