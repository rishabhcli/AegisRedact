/**
 * Financial Data Detection Patterns
 * Detects bank account numbers, SWIFT/BIC codes, and routing numbers
 */

/**
 * SWIFT/BIC code pattern (ISO 9362)
 * Format: AAAABBCCDDD
 * - AAAA: Bank code (4 letters)
 * - BB: Country code (2 letters, ISO 3166-1)
 * - CC: Location code (2 letters or digits)
 * - DDD: Branch code (3 letters or digits, optional)
 *
 * Length: 8 or 11 characters
 */
export const SWIFT_BIC = /\b[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/g;

/**
 * US ABA Routing Number
 * 9 digits with checksum validation
 * First two digits: 00-12 (Federal Reserve routing symbol) or 21-32 (thrift institutions)
 */
export const US_ROUTING = /\b(?:0[0-9]|1[0-2]|2[1-9]|3[0-2])\d{7}\b/g;

/**
 * CLABE (Mexican bank account number)
 * 18 digits: BBB SSS CCCCCCCCCCCC C
 * - BBB: Bank code (3 digits)
 * - SSS: Branch code (3 digits)
 * - CCCCCCCCCCCC: Account number (11 digits)
 * - C: Check digit (1 digit)
 */
export const CLABE = /\b\d{3}\s?\d{3}\s?\d{11}\s?\d{1}\b/g;

/**
 * IBAN pattern (simplified - full validation requires country-specific rules)
 * 15-34 alphanumeric characters
 * Format: CC12 XXXX XXXX XXXX XXXX XXXX XX
 * - CC: Country code (2 letters)
 * - 12: Check digits (2 digits)
 * - X: Bank and account number (varies by country)
 */
export const IBAN = /\b[A-Z]{2}\d{2}[\s]?(?:[A-Z0-9]{4}[\s]?){2,7}[A-Z0-9]{0,4}\b/g;

/**
 * Generic account number patterns (with context)
 * 8-17 digits, often with hyphens or spaces
 */
export const ACCOUNT_NUMBER = /\b(?:account|acct|a\/c)[\s#:]*(\d{4}[\s\-]?\d{4}[\s\-]?\d{4,9})\b/gi;

/**
 * Validate SWIFT/BIC code format
 * @param code - SWIFT/BIC code to validate
 * @returns true if valid format
 */
export function validateSWIFT(code: string): boolean {
  // Must be 8 or 11 characters
  if (code.length !== 8 && code.length !== 11) {
    return false;
  }

  // First 4 characters: Bank code (letters only)
  if (!/^[A-Z]{4}/.test(code)) {
    return false;
  }

  // Next 2 characters: Country code (letters only, valid ISO 3166-1)
  const countryCode = code.substring(4, 6);
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return false;
  }

  // Check if country code is valid (simplified check - major countries)
  const validCountryCodes = new Set([
    'US', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT',
    'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'GR', 'PL', 'CZ', 'HU',
    'CA', 'AU', 'NZ', 'JP', 'CN', 'HK', 'SG', 'IN', 'BR', 'MX',
    'AR', 'CL', 'CO', 'PE', 'ZA', 'AE', 'SA', 'IL', 'TR', 'RU'
  ]);

  if (!validCountryCodes.has(countryCode)) {
    return false;
  }

  // Next 2 characters: Location code (letters or digits)
  if (!/^[A-Z0-9]{2}$/.test(code.substring(6, 8))) {
    return false;
  }

  // If 11 characters, last 3 are branch code (letters or digits)
  if (code.length === 11 && !/^[A-Z0-9]{3}$/.test(code.substring(8, 11))) {
    return false;
  }

  return true;
}

/**
 * Validate US ABA routing number using checksum
 * Algorithm: 3(d1 + d4 + d7) + 7(d2 + d5 + d8) + (d3 + d6 + d9) mod 10 = 0
 *
 * @param routing - 9-digit routing number
 * @returns true if checksum is valid
 */
export function validateRoutingNumber(routing: string): boolean {
  // Must be exactly 9 digits
  const digits = routing.replace(/\D/g, '');
  if (digits.length !== 9) {
    return false;
  }

  // First two digits must be valid (00-12 or 21-32)
  const firstTwo = parseInt(digits.substring(0, 2), 10);
  if (!((firstTwo >= 0 && firstTwo <= 12) || (firstTwo >= 21 && firstTwo <= 32))) {
    return false;
  }

  // Checksum validation
  const d = digits.split('').map(Number);
  const checksum = (
    3 * (d[0] + d[3] + d[6]) +
    7 * (d[1] + d[4] + d[7]) +
    (d[2] + d[5] + d[8])
  ) % 10;

  return checksum === 0;
}

/**
 * Validate CLABE (Mexican bank account) using checksum
 * Uses weighted modulo 10 algorithm
 *
 * @param clabe - 18-digit CLABE number
 * @returns true if checksum is valid
 */
export function validateCLABE(clabe: string): boolean {
  // Remove spaces and validate length
  const digits = clabe.replace(/\s/g, '');
  if (digits.length !== 18 || !/^\d{18}$/.test(digits)) {
    return false;
  }

  // Weights for checksum (positions 1-17)
  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const product = parseInt(digits[i], 10) * weights[i];
    sum += product % 10;
  }

  const expectedCheckDigit = (10 - (sum % 10)) % 10;
  const actualCheckDigit = parseInt(digits[17], 10);

  return expectedCheckDigit === actualCheckDigit;
}

/**
 * Validate IBAN using mod-97 checksum (ISO 13616)
 *
 * @param iban - IBAN to validate
 * @returns true if checksum is valid
 */
export function validateIBAN(iban: string): boolean {
  // Remove spaces and convert to uppercase
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

  // Must be 15-34 characters
  if (cleanIBAN.length < 15 || cleanIBAN.length > 34) {
    return false;
  }

  // Must start with 2 letters and 2 digits
  if (!/^[A-Z]{2}\d{2}/.test(cleanIBAN)) {
    return false;
  }

  // Move first 4 characters to end
  const rearranged = cleanIBAN.substring(4) + cleanIBAN.substring(0, 4);

  // Convert letters to numbers (A=10, B=11, ..., Z=35)
  let numericString = '';
  for (const char of rearranged) {
    if (/[A-Z]/.test(char)) {
      numericString += (char.charCodeAt(0) - 55).toString();
    } else {
      numericString += char;
    }
  }

  // Calculate mod 97
  // For very long numbers, process in chunks
  let remainder = 0;
  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10 + parseInt(numericString[i], 10)) % 97;
  }

  return remainder === 1;
}

/**
 * Find all SWIFT/BIC codes in text
 */
export function findSWIFTCodes(text: string): string[] {
  const candidates = Array.from(text.matchAll(SWIFT_BIC), m => m[0]);
  return candidates.filter(validateSWIFT);
}

/**
 * Find all US routing numbers in text
 */
export function findRoutingNumbers(text: string): string[] {
  const candidates = Array.from(text.matchAll(US_ROUTING), m => m[0]);
  return candidates.filter(validateRoutingNumber);
}

/**
 * Find all CLABE numbers in text
 */
export function findCLABE(text: string): string[] {
  const candidates = Array.from(text.matchAll(CLABE), m => m[0]);
  return candidates.filter(validateCLABE);
}

/**
 * Find all IBANs in text
 */
export function findIBANs(text: string): string[] {
  const candidates = Array.from(text.matchAll(IBAN), m => m[0]);
  return candidates.filter(validateIBAN);
}

/**
 * Find account numbers with context labels
 */
export function findAccountNumbers(text: string): string[] {
  const matches = Array.from(text.matchAll(ACCOUNT_NUMBER), m => m[1]);
  // Return unique matches
  return Array.from(new Set(matches));
}

/**
 * Find all financial identifiers in text
 * Combines all financial pattern detection
 *
 * @param text - Text to analyze
 * @returns Object with arrays of detected financial data
 */
export function findAllFinancial(text: string): {
  swiftCodes: string[];
  routingNumbers: string[];
  clabe: string[];
  ibans: string[];
  accountNumbers: string[];
} {
  return {
    swiftCodes: findSWIFTCodes(text),
    routingNumbers: findRoutingNumbers(text),
    clabe: findCLABE(text),
    ibans: findIBANs(text),
    accountNumbers: findAccountNumbers(text)
  };
}
