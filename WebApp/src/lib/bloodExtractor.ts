/**
 * Blood Extractor - Simple Exact-Match Approach
 * 
 * Architecture:
 * - Searches for exact test names from reference.json in PDF text
 * - Extracts numbers in the same row as matched test name
 * - Gets dates from bottom of page  
 * - Uses reference.json as single source of truth for units and ref ranges
 * 
 * This replaces the previous complex table-detection approach with a simpler,
 * more reliable exact-matching strategy.
 */

// Re-export main extraction function from simple extractor
export { extractBloodResultsSimple as extractBloodResults } from './bloodResultExtractor';