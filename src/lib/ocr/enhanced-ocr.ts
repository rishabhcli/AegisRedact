/**
 * Enhanced OCR with Form Recognition
 * Combines OCR word detection with form field identification and template matching
 */

import { detectFormFields, extractPIIFromFields, getFieldBoundingBoxes, type OCRWord, type FormField } from './form-detector';
import { detectFormType, enhanceWithTemplate, findMissingRequiredFields, type FormTemplate } from './form-templates';

export interface EnhancedOCRResult {
  // Raw OCR data
  text: string;
  words: OCRWord[];

  // Form recognition
  formType: FormTemplate | null;
  fields: FormField[];
  missingRequiredFields: string[];

  // Extracted PII
  piiValues: string[];
  piiBoxes: Array<{ type: string; bbox: FormField['bbox'] }>;

  // Confidence boost from template matching
  templateMatched: boolean;
}

/**
 * Enhanced OCR processing with form recognition
 * Performs OCR, detects form type, extracts fields, and identifies PII
 *
 * @param words - OCR words with bounding boxes (from Tesseract or other OCR engine)
 * @param fullText - Complete OCR text
 * @param options - Detection options
 * @returns Enhanced OCR result with form recognition
 */
export function performEnhancedOCR(
  words: OCRWord[],
  fullText: string,
  options: {
    detectForms?: boolean;
    extractNames?: boolean;
    extractSSNs?: boolean;
    extractEmails?: boolean;
    extractPhones?: boolean;
    extractAddresses?: boolean;
    extractDates?: boolean;
    extractAccounts?: boolean;
  } = {}
): EnhancedOCRResult {
  const defaults = {
    detectForms: true,
    extractNames: true,
    extractSSNs: true,
    extractEmails: true,
    extractPhones: true,
    extractAddresses: true,
    extractDates: false,
    extractAccounts: true
  };

  const opts = { ...defaults, ...options };

  // Step 1: Detect form type if enabled
  let formType: FormTemplate | null = null;
  if (opts.detectForms) {
    formType = detectFormType(fullText);
    if (formType) {
      console.log(`[EnhancedOCR] Detected form type: ${formType.name}`);
    }
  }

  // Step 2: Detect form fields
  let fields = detectFormFields(words);
  console.log(`[EnhancedOCR] Detected ${fields.length} form fields`);

  // Step 3: Enhance fields with template if form type detected
  let templateMatched = false;
  let missingRequiredFields: string[] = [];

  if (formType) {
    const enhanced = enhanceWithTemplate(
      fields.map(f => ({ label: f.label, value: f.value, type: f.type, confidence: f.confidence })),
      formType
    );

    // Update fields with enhanced data
    fields = enhanced.map((e, i) => ({
      ...fields[i],
      type: e.type as FormField['type'],
      confidence: e.confidence
    }));

    templateMatched = enhanced.some(e => e.fromTemplate);

    // Find missing required fields
    missingRequiredFields = findMissingRequiredFields(
      fields.map(f => ({ label: f.label })),
      formType
    );

    if (missingRequiredFields.length > 0) {
      console.warn(`[EnhancedOCR] Missing required fields: ${missingRequiredFields.join(', ')}`);
    }
  }

  // Step 4: Extract PII values
  const piiValues = extractPIIFromFields(fields, {
    names: opts.extractNames,
    ssns: opts.extractSSNs,
    emails: opts.extractEmails,
    phones: opts.extractPhones,
    addresses: opts.extractAddresses,
    dates: opts.extractDates,
    accounts: opts.extractAccounts
  });

  // Step 5: Get bounding boxes for PII
  const piiBoxes = getFieldBoundingBoxes(fields, {
    names: opts.extractNames,
    ssns: opts.extractSSNs,
    emails: opts.extractEmails,
    phones: opts.extractPhones,
    addresses: opts.extractAddresses,
    dates: opts.extractDates,
    accounts: opts.extractAccounts
  });

  return {
    text: fullText,
    words,
    formType,
    fields,
    missingRequiredFields,
    piiValues,
    piiBoxes,
    templateMatched
  };
}

/**
 * Combine form-detected PII with pattern-detected PII
 * Merges bounding boxes from form recognition with pattern matching
 *
 * @param formBoxes - Boxes from form field detection
 * @param patternBoxes - Boxes from pattern matching (regex/ML)
 * @returns Merged and deduplicated boxes
 */
export function mergePIIBoxes(
  formBoxes: Array<{ type: string; bbox: { x: number; y: number; width: number; height: number } }>,
  patternBoxes: Array<{ type: string; bbox: { x: number; y: number; width: number; height: number } }>
): Array<{ type: string; bbox: { x: number; y: number; width: number; height: number }; source: 'form' | 'pattern' | 'both' }> {
  const merged: Array<{ type: string; bbox: { x: number; y: number; width: number; height: number }; source: 'form' | 'pattern' | 'both' }> = [];

  // Add all form boxes
  for (const box of formBoxes) {
    merged.push({ ...box, source: 'form' });
  }

  // Add pattern boxes that don't overlap significantly with form boxes
  for (const patternBox of patternBoxes) {
    let overlaps = false;

    for (const formBox of formBoxes) {
      if (boxesOverlap(patternBox.bbox, formBox.bbox, 0.5)) {
        overlaps = true;
        // Mark the form box as confirmed by both sources
        const index = merged.findIndex(m => m.bbox === formBox.bbox);
        if (index >= 0) {
          merged[index].source = 'both';
        }
        break;
      }
    }

    if (!overlaps) {
      merged.push({ ...patternBox, source: 'pattern' });
    }
  }

  return merged;
}

/**
 * Check if two bounding boxes overlap
 * @param box1 - First bounding box
 * @param box2 - Second bounding box
 * @param threshold - Overlap threshold (0-1), default 0.5 (50%)
 * @returns true if boxes overlap more than threshold
 */
function boxesOverlap(
  box1: { x: number; y: number; width: number; height: number },
  box2: { x: number; y: number; width: number; height: number },
  threshold: number = 0.5
): boolean {
  // Calculate intersection
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

  if (x1 >= x2 || y1 >= y2) {
    return false; // No intersection
  }

  const intersectionArea = (x2 - x1) * (y2 - y1);
  const box1Area = box1.width * box1.height;
  const box2Area = box2.width * box2.height;
  const minArea = Math.min(box1Area, box2Area);

  const overlapRatio = intersectionArea / minArea;
  return overlapRatio >= threshold;
}

/**
 * Extract high-confidence form fields only
 * Filters fields by confidence threshold
 *
 * @param fields - Detected form fields
 * @param minConfidence - Minimum confidence threshold (0-1)
 * @returns Filtered high-confidence fields
 */
export function getHighConfidenceFields(fields: FormField[], minConfidence: number = 0.7): FormField[] {
  return fields.filter(field => field.confidence >= minConfidence);
}

/**
 * Group fields by type
 * Useful for organizing detected PII
 *
 * @param fields - Detected form fields
 * @returns Fields grouped by type
 */
export function groupFieldsByType(fields: FormField[]): Record<string, FormField[]> {
  const grouped: Record<string, FormField[]> = {
    name: [],
    ssn: [],
    email: [],
    phone: [],
    address: [],
    date: [],
    account: [],
    generic: []
  };

  for (const field of fields) {
    grouped[field.type].push(field);
  }

  return grouped;
}
