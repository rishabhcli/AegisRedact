/**
 * Column-Specific Detection Rules
 * Applies targeted PII detection based on column headers in tables
 */

import type { DetectedTable, TableCell } from './table-detector';
import { findColumnByHeader, extractColumnText, getColumnCells } from './table-detector';

export interface ColumnRule {
  headerKeywords: string[];  // Keywords to match in column header
  detectionType: 'name' | 'ssn' | 'email' | 'phone' | 'address' | 'date' | 'account' | 'card' | 'all';
  confidence: number;  // Confidence boost if column matches rule
}

export interface ColumnDetectionResult {
  columnIndex: number;
  columnHeader: string;
  detectionType: string;
  values: string[];
  cells: TableCell[];
  confidence: number;
}

/**
 * Pre-defined column detection rules
 * Maps common column headers to appropriate detection types
 */
export const COLUMN_RULES: ColumnRule[] = [
  // Name columns
  {
    headerKeywords: ['name', 'full name', 'employee name', 'patient name', 'customer name', 'participant'],
    detectionType: 'name',
    confidence: 0.95
  },
  {
    headerKeywords: ['first name', 'given name', 'fname'],
    detectionType: 'name',
    confidence: 0.9
  },
  {
    headerKeywords: ['last name', 'surname', 'family name', 'lname'],
    detectionType: 'name',
    confidence: 0.9
  },

  // SSN columns
  {
    headerKeywords: ['ssn', 'social security', 'social security number', 'ss#', 'ss no'],
    detectionType: 'ssn',
    confidence: 1.0
  },

  // Email columns
  {
    headerKeywords: ['email', 'e-mail', 'email address', 'e-mail address', 'contact email'],
    detectionType: 'email',
    confidence: 1.0
  },

  // Phone columns
  {
    headerKeywords: ['phone', 'telephone', 'phone number', 'tel', 'mobile', 'cell', 'contact number'],
    detectionType: 'phone',
    confidence: 1.0
  },

  // Address columns
  {
    headerKeywords: ['address', 'street', 'street address', 'home address', 'mailing address'],
    detectionType: 'address',
    confidence: 0.95
  },
  {
    headerKeywords: ['city', 'town', 'municipality'],
    detectionType: 'address',
    confidence: 0.8
  },
  {
    headerKeywords: ['state', 'province', 'region'],
    detectionType: 'address',
    confidence: 0.7
  },
  {
    headerKeywords: ['zip', 'postal code', 'postcode', 'zip code'],
    detectionType: 'address',
    confidence: 0.9
  },

  // Date columns
  {
    headerKeywords: ['date', 'dob', 'date of birth', 'birth date', 'birthday'],
    detectionType: 'date',
    confidence: 0.9
  },
  {
    headerKeywords: ['hire date', 'start date', 'end date', 'termination date'],
    detectionType: 'date',
    confidence: 0.85
  },

  // Account/ID columns
  {
    headerKeywords: ['account', 'account number', 'acct no', 'account #'],
    detectionType: 'account',
    confidence: 0.95
  },
  {
    headerKeywords: ['id', 'id number', 'employee id', 'patient id', 'member id', 'customer id'],
    detectionType: 'account',
    confidence: 0.9
  },
  {
    headerKeywords: ['policy', 'policy number', 'policy no'],
    detectionType: 'account',
    confidence: 0.95
  },

  // Card columns
  {
    headerKeywords: ['card', 'credit card', 'card number', 'cc', 'payment'],
    detectionType: 'card',
    confidence: 0.95
  }
];

/**
 * Find matching rule for a column header
 * @param headerText - Column header text
 * @returns Matching rule or null
 */
export function findMatchingRule(headerText: string): ColumnRule | null {
  const lowerHeader = headerText.toLowerCase().trim();

  for (const rule of COLUMN_RULES) {
    for (const keyword of rule.headerKeywords) {
      if (lowerHeader.includes(keyword.toLowerCase())) {
        return rule;
      }
    }
  }

  return null;
}

/**
 * Apply column-specific detection rules to a table
 * Identifies columns that should be redacted based on headers
 *
 * @param table - Detected table
 * @returns Array of column detection results
 */
export function applyColumnRules(table: DetectedTable): ColumnDetectionResult[] {
  const results: ColumnDetectionResult[] = [];

  for (let columnIndex = 0; columnIndex < table.columns.length; columnIndex++) {
    const column = table.columns[columnIndex];
    const header = column.header || '';

    // Find matching rule for this column
    const rule = findMatchingRule(header);

    if (rule) {
      const values = extractColumnText(table, columnIndex, true);  // Skip header
      const cells = getColumnCells(table, columnIndex).filter(c => c.rowIndex > 0);  // Skip header cells

      results.push({
        columnIndex,
        columnHeader: header,
        detectionType: rule.detectionType,
        values,
        cells,
        confidence: rule.confidence
      });
    }
  }

  return results;
}

/**
 * Get all PII values from table columns
 * Extracts values from columns that match detection rules
 *
 * @param table - Detected table
 * @param options - Which types to extract
 * @returns Array of PII values to redact
 */
export function extractPIIFromTable(
  table: DetectedTable,
  options: {
    names?: boolean;
    ssns?: boolean;
    emails?: boolean;
    phones?: boolean;
    addresses?: boolean;
    dates?: boolean;
    accounts?: boolean;
    cards?: boolean;
  } = {}
): string[] {
  const defaults = {
    names: true,
    ssns: true,
    emails: true,
    phones: true,
    addresses: true,
    dates: false,
    accounts: true,
    cards: true
  };

  const opts = { ...defaults, ...options };
  const columnResults = applyColumnRules(table);
  const piiValues: string[] = [];

  for (const result of columnResults) {
    let shouldExtract = false;

    switch (result.detectionType) {
      case 'name':
        shouldExtract = opts.names;
        break;
      case 'ssn':
        shouldExtract = opts.ssns;
        break;
      case 'email':
        shouldExtract = opts.emails;
        break;
      case 'phone':
        shouldExtract = opts.phones;
        break;
      case 'address':
        shouldExtract = opts.addresses;
        break;
      case 'date':
        shouldExtract = opts.dates;
        break;
      case 'account':
        shouldExtract = opts.accounts;
        break;
      case 'card':
        shouldExtract = opts.cards;
        break;
    }

    if (shouldExtract) {
      piiValues.push(...result.values.filter(v => v.trim() !== ''));
    }
  }

  return piiValues;
}

/**
 * Get bounding boxes for all PII cells in table
 * Returns boxes for cells in columns that match detection rules
 *
 * @param table - Detected table
 * @param options - Which types to include
 * @returns Array of bounding boxes with type information
 */
export function getTablePIIBoundingBoxes(
  table: DetectedTable,
  options: {
    names?: boolean;
    ssns?: boolean;
    emails?: boolean;
    phones?: boolean;
    addresses?: boolean;
    dates?: boolean;
    accounts?: boolean;
    cards?: boolean;
  } = {}
): Array<{ type: string; bbox: TableCell['bbox']; columnHeader: string }> {
  const defaults = {
    names: true,
    ssns: true,
    emails: true,
    phones: true,
    addresses: true,
    dates: false,
    accounts: true,
    cards: true
  };

  const opts = { ...defaults, ...options };
  const columnResults = applyColumnRules(table);
  const boxes: Array<{ type: string; bbox: TableCell['bbox']; columnHeader: string }> = [];

  for (const result of columnResults) {
    let shouldInclude = false;

    switch (result.detectionType) {
      case 'name':
        shouldInclude = opts.names;
        break;
      case 'ssn':
        shouldInclude = opts.ssns;
        break;
      case 'email':
        shouldInclude = opts.emails;
        break;
      case 'phone':
        shouldInclude = opts.phones;
        break;
      case 'address':
        shouldInclude = opts.addresses;
        break;
      case 'date':
        shouldInclude = opts.dates;
        break;
      case 'account':
        shouldInclude = opts.accounts;
        break;
      case 'card':
        shouldInclude = opts.cards;
        break;
    }

    if (shouldInclude) {
      for (const cell of result.cells) {
        boxes.push({
          type: result.detectionType,
          bbox: cell.bbox,
          columnHeader: result.columnHeader
        });
      }
    }
  }

  return boxes;
}

/**
 * Validate that column values match expected pattern
 * Reduces false positives by checking if values match the expected type
 *
 * @param columnResult - Column detection result
 * @param validationPattern - Regex pattern to validate values
 * @returns Validation score (0-1)
 */
export function validateColumnValues(
  columnResult: ColumnDetectionResult,
  validationPattern: RegExp
): number {
  if (columnResult.values.length === 0) {
    return 0;
  }

  const matchCount = columnResult.values.filter(value =>
    validationPattern.test(value)
  ).length;

  return matchCount / columnResult.values.length;
}

/**
 * Smart column detection with validation
 * Applies rules and validates that values match expected patterns
 *
 * @param table - Detected table
 * @returns Validated column detection results
 */
export function detectTableColumnsWithValidation(table: DetectedTable): ColumnDetectionResult[] {
  const rawResults = applyColumnRules(table);
  const validatedResults: ColumnDetectionResult[] = [];

  for (const result of rawResults) {
    // Get validation pattern for detection type
    let validationPattern: RegExp | null = null;

    switch (result.detectionType) {
      case 'email':
        validationPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
        break;
      case 'phone':
        validationPattern = /\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/;
        break;
      case 'ssn':
        validationPattern = /\d{3}[\s-]?\d{2}[\s-]?\d{4}/;
        break;
      case 'date':
        validationPattern = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/;
        break;
    }

    // Validate if pattern available
    if (validationPattern) {
      const validationScore = validateColumnValues(result, validationPattern);

      // Only include if validation score is > 50%
      if (validationScore > 0.5) {
        validatedResults.push({
          ...result,
          confidence: result.confidence * validationScore
        });
      }
    } else {
      // No validation pattern - include as is
      validatedResults.push(result);
    }
  }

  return validatedResults;
}
