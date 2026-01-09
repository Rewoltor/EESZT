// Blood Test Result Data Structures

export interface BloodTestResult {
  test_name: string;
  result: string;
  unit: string;
  ref_range: string;
  flag: string;
  ref_min?: number;
  ref_max?: number;
  date?: string; // ISO date string when blood was drawn
}

export interface DocumentMetadata {
  lastModified: string;
  filepath: string;
  institution: string;
  type: string;
}

export interface BloodResultsDocument {
  metadata: DocumentMetadata;
  results: BloodTestResult[];
}

export type BloodResultsData = BloodResultsDocument[];
