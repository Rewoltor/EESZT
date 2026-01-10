/**
 * Blood Extractor - Main Entry Point
 * 
 * This file now serves as a re-export from the modular implementation.
 * The actual implementation is in /bloodExtractor/ directory.
 * 
 * Architecture:
 * - config.ts: Configuration constants
 * - logger.ts: Structured logging
 * - types.ts: Type definitions
 * - error-recovery.ts: Retry mechanisms & quarantine
 * - cell-parsers.ts: Parse result cells & reference ranges
 * - field-resolvers.ts: Resolve units & dates from multiple sources
 * - validators.ts: Multi-stage validation
 * - pdf-parser.ts: PDF text → rows
 * - table-detector.ts: Hybrid table structure detection
 * - row-parser.ts: Parse individual data rows
 * - page-parser.ts: Orchestrate page-level parsing
 * - cleaners.ts: Name normalization
 * - deduplicator.ts: Duplicate removal
 * - index.ts: Main extraction pipeline
 */

// Re-export main extraction function
export { extractBloodResults } from './bloodExtractor/index';

// Re-export commonly used utilities
export {
    parseResultCell,
    parseReferenceRange,
    resolveUnit,
    extractTestDate,
    validateBloodTestResult,
    getStandardRefRange,
    createLogger
} from './bloodExtractor/index';

// Re-export types if needed by consumers
export type {
    TextItem,
    RowData,
    ColumnMap,
    ParsedResult,
    RefRange,
    ParseError,
    ValidationResult,
    ValidationWarning,
    ValidationError,
    ExtractionMetrics
} from './bloodExtractor/types';