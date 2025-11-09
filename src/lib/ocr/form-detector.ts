/**
 * Form Field Detection
 * Detects form labels and extracts associated field values
 * Works with OCR word bounding boxes to identify labeled fields
 */

export interface OCRWord {
  text: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

export interface FormField {
  label: string;
  value: string;
  type: 'name' | 'ssn' | 'email' | 'phone' | 'address' | 'date' | 'account' | 'generic';
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Common form field labels and their types
 * Keys are lowercase for case-insensitive matching
 */
const FIELD_LABEL_PATTERNS: Record<string, 'name' | 'ssn' | 'email' | 'phone' | 'address' | 'date' | 'account'> = {
  // Name fields
  'name': 'name',
  'full name': 'name',
  'first name': 'name',
  'last name': 'name',
  'middle name': 'name',
  'surname': 'name',
  'given name': 'name',
  'applicant name': 'name',
  'patient name': 'name',
  'employee name': 'name',
  'participant name': 'name',

  // SSN fields
  'ssn': 'ssn',
  'social security': 'ssn',
  'social security number': 'ssn',
  'social security no': 'ssn',
  'ss#': 'ssn',
  'ss no': 'ssn',

  // Email fields
  'email': 'email',
  'e-mail': 'email',
  'email address': 'email',
  'e-mail address': 'email',

  // Phone fields
  'phone': 'phone',
  'telephone': 'phone',
  'phone number': 'phone',
  'tel': 'phone',
  'mobile': 'phone',
  'cell': 'phone',
  'contact number': 'phone',

  // Address fields
  'address': 'address',
  'street address': 'address',
  'mailing address': 'address',
  'home address': 'address',
  'residential address': 'address',
  'street': 'address',
  'city': 'address',
  'state': 'address',
  'zip': 'address',
  'postal code': 'address',

  // Date fields
  'date': 'date',
  'dob': 'date',
  'date of birth': 'date',
  'birth date': 'date',
  'birthday': 'date',
  'hire date': 'date',
  'start date': 'date',
  'date signed': 'date',

  // Account fields
  'account': 'account',
  'account number': 'account',
  'account no': 'account',
  'policy number': 'account',
  'member id': 'account',
  'customer id': 'account',
  'patient id': 'account',
  'employee id': 'account',
  'id number': 'account'
};

/**
 * Pattern suffixes that indicate a field label
 * e.g., "Name:", "SSN #", "Email (required)"
 */
const LABEL_SUFFIX_PATTERNS = [
  /:\s*$/,           // Colon
  /\s*[#:]\s*$/,     // Hash or colon
  /\s*\(\s*$/,       // Opening parenthesis
  /\s*-\s*$/,        // Dash
  /\s*_+\s*$/        // Underscores
];

/**
 * Check if a word appears to be a form field label
 * @param word - OCR word to check
 * @returns true if word looks like a label
 */
function isLikelyLabel(word: OCRWord): boolean {
  const text = word.text.toLowerCase().trim();

  // Check if it matches a known field label
  if (FIELD_LABEL_PATTERNS[text]) {
    return true;
  }

  // Check for partial matches (e.g., "name:" matches "name")
  for (const pattern of Object.keys(FIELD_LABEL_PATTERNS)) {
    if (text.startsWith(pattern)) {
      // Check if it has a label suffix
      const remainder = text.substring(pattern.length);
      if (LABEL_SUFFIX_PATTERNS.some(p => p.test(remainder)) || remainder.trim() === '') {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get field type from label text
 * @param labelText - The label text
 * @returns Field type
 */
function getFieldType(labelText: string): FormField['type'] {
  const text = labelText.toLowerCase().trim();

  // Direct match
  if (FIELD_LABEL_PATTERNS[text]) {
    return FIELD_LABEL_PATTERNS[text];
  }

  // Partial match
  for (const [pattern, type] of Object.entries(FIELD_LABEL_PATTERNS)) {
    if (text.includes(pattern)) {
      return type;
    }
  }

  return 'generic';
}

/**
 * Calculate distance between two bounding boxes
 * Uses center-to-center distance
 */
function calculateDistance(bbox1: OCRWord['bbox'], bbox2: OCRWord['bbox']): number {
  const center1X = bbox1.x + bbox1.width / 2;
  const center1Y = bbox1.y + bbox1.height / 2;
  const center2X = bbox2.x + bbox2.width / 2;
  const center2Y = bbox2.y + bbox2.height / 2;

  return Math.sqrt(
    Math.pow(center2X - center1X, 2) +
    Math.pow(center2Y - center1Y, 2)
  );
}

/**
 * Check if word2 is to the right of word1 (on same line)
 * @param word1 - First word
 * @param word2 - Second word
 * @param tolerance - Vertical tolerance in pixels
 * @returns true if word2 is to the right
 */
function isToRight(word1: OCRWord, word2: OCRWord, tolerance: number = 10): boolean {
  // Check if roughly on same horizontal line
  const verticalAlign = Math.abs(word1.bbox.y - word2.bbox.y) < tolerance;

  // Check if word2 is to the right
  const horizontalOrder = word2.bbox.x > (word1.bbox.x + word1.bbox.width);

  return verticalAlign && horizontalOrder;
}

/**
 * Check if word2 is below word1
 * @param word1 - First word
 * @param word2 - Second word
 * @param tolerance - Horizontal tolerance in pixels
 * @returns true if word2 is below
 */
function isBelow(word1: OCRWord, word2: OCRWord, tolerance: number = 50): boolean {
  // Check if roughly in same column
  const horizontalAlign = Math.abs(word1.bbox.x - word2.bbox.x) < tolerance;

  // Check if word2 is below
  const verticalOrder = word2.bbox.y > (word1.bbox.y + word1.bbox.height);

  return horizontalAlign && verticalOrder;
}

/**
 * Find the value field(s) associated with a label
 * Looks for words to the right of or below the label
 *
 * @param label - The label word
 * @param words - All OCR words
 * @param maxDistance - Maximum distance to search (pixels)
 * @returns Array of words that form the field value
 */
function findFieldValue(label: OCRWord, words: OCRWord[], maxDistance: number = 200): OCRWord[] {
  const candidates: Array<{ word: OCRWord; distance: number; direction: 'right' | 'below' }> = [];

  for (const word of words) {
    // Skip the label itself and other labels
    if (word === label || isLikelyLabel(word)) {
      continue;
    }

    // Check if word is to the right (same line)
    if (isToRight(label, word)) {
      const distance = calculateDistance(label.bbox, word.bbox);
      if (distance < maxDistance) {
        candidates.push({ word, distance, direction: 'right' });
      }
    }
    // Check if word is below (next line, aligned)
    else if (isBelow(label, word)) {
      const distance = calculateDistance(label.bbox, word.bbox);
      if (distance < maxDistance) {
        candidates.push({ word, distance, direction: 'below' });
      }
    }
  }

  if (candidates.length === 0) {
    return [];
  }

  // Prefer words to the right over words below
  const rightCandidates = candidates.filter(c => c.direction === 'right');
  const belowCandidates = candidates.filter(c => c.direction === 'below');

  let selectedCandidates = rightCandidates.length > 0 ? rightCandidates : belowCandidates;

  // Sort by distance and take closest ones
  selectedCandidates.sort((a, b) => a.distance - b.distance);

  // For "right" direction, take multiple words on same line
  if (selectedCandidates.length > 0 && selectedCandidates[0].direction === 'right') {
    const firstWord = selectedCandidates[0].word;
    const result = [firstWord];

    // Add additional words on the same line
    for (let i = 1; i < selectedCandidates.length && i < 10; i++) {
      const candidate = selectedCandidates[i].word;
      if (isToRight(firstWord, candidate, 10)) {
        result.push(candidate);
      }
    }

    // Sort by horizontal position
    result.sort((a, b) => a.bbox.x - b.bbox.x);
    return result;
  }

  // For "below" direction, take first word only (unless it's an address)
  return [selectedCandidates[0].word];
}

/**
 * Combine word bounding boxes into a single bbox
 */
function combineBBoxes(words: OCRWord[]): FormField['bbox'] {
  if (words.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...words.map(w => w.bbox.x));
  const minY = Math.min(...words.map(w => w.bbox.y));
  const maxX = Math.max(...words.map(w => w.bbox.x + w.bbox.width));
  const maxY = Math.max(...words.map(w => w.bbox.y + w.bbox.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Detect form fields from OCR word data
 * Identifies labels and extracts associated values
 *
 * @param words - OCR words with bounding boxes
 * @returns Array of detected form fields
 */
export function detectFormFields(words: OCRWord[]): FormField[] {
  const fields: FormField[] = [];

  for (const word of words) {
    if (isLikelyLabel(word)) {
      const labelText = word.text;
      const fieldType = getFieldType(labelText);

      // Find associated value words
      const valueWords = findFieldValue(word, words);

      if (valueWords.length > 0) {
        const valueText = valueWords.map(w => w.text).join(' ');
        const avgConfidence = valueWords.reduce((sum, w) => sum + w.confidence, 0) / valueWords.length;

        fields.push({
          label: labelText,
          value: valueText,
          type: fieldType,
          confidence: avgConfidence,
          bbox: combineBBoxes(valueWords)
        });
      }
    }
  }

  return fields;
}

/**
 * Extract PII from detected form fields
 * Returns field values that should be redacted
 *
 * @param fields - Detected form fields
 * @param options - Which field types to extract
 * @returns Array of values to redact
 */
export function extractPIIFromFields(
  fields: FormField[],
  options: {
    names?: boolean;
    ssns?: boolean;
    emails?: boolean;
    phones?: boolean;
    addresses?: boolean;
    dates?: boolean;
    accounts?: boolean;
  } = {}
): string[] {
  const defaults = {
    names: true,
    ssns: true,
    emails: true,
    phones: true,
    addresses: true,
    dates: false,  // Dates often have false positives
    accounts: true
  };

  const opts = { ...defaults, ...options };
  const values: string[] = [];

  for (const field of fields) {
    let shouldExtract = false;

    switch (field.type) {
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
    }

    if (shouldExtract && field.value.trim()) {
      values.push(field.value);
    }
  }

  return values;
}

/**
 * Get bounding boxes for form field values
 * Useful for drawing redaction boxes
 *
 * @param fields - Detected form fields
 * @param options - Which field types to include
 * @returns Array of bounding boxes
 */
export function getFieldBoundingBoxes(
  fields: FormField[],
  options: {
    names?: boolean;
    ssns?: boolean;
    emails?: boolean;
    phones?: boolean;
    addresses?: boolean;
    dates?: boolean;
    accounts?: boolean;
  } = {}
): Array<{ type: string; bbox: FormField['bbox'] }> {
  const defaults = {
    names: true,
    ssns: true,
    emails: true,
    phones: true,
    addresses: true,
    dates: false,
    accounts: true
  };

  const opts = { ...defaults, ...options };
  const boxes: Array<{ type: string; bbox: FormField['bbox'] }> = [];

  for (const field of fields) {
    let shouldInclude = false;

    switch (field.type) {
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
    }

    if (shouldInclude) {
      boxes.push({
        type: field.type,
        bbox: field.bbox
      });
    }
  }

  return boxes;
}
