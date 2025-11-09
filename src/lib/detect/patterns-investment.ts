/**
 * Investment and Securities Detection
 * Detects stock tickers, brokerage account numbers, and portfolio data
 */

/**
 * US Stock ticker symbols (NYSE, NASDAQ)
 * 1-5 uppercase letters (most common: 1-4 letters)
 * Context-aware: requires nearby keywords to avoid false positives
 */
export const STOCK_TICKER_PATTERN = /\b[A-Z]{1,5}\b/g;

/**
 * Keywords that indicate stock/investment context
 * Used to filter ticker false positives
 */
const STOCK_CONTEXT_KEYWORDS = [
  'stock', 'shares', 'ticker', 'symbol', 'equity', 'securities',
  'portfolio', 'holdings', 'position', 'trade', 'trading',
  'NYSE', 'NASDAQ', 'market', 'investment', 'dividend',
  'price', 'quote', 'volume', 'shares of', 'bought', 'sold'
];

/**
 * Brokerage account number patterns
 * Common formats from major brokerages
 */

// Fidelity: 9 digits, sometimes with hyphens (XXX-XXXXXX)
export const FIDELITY_ACCOUNT = /\b\d{3}-?\d{6}\b/g;

// Schwab: 4 digits + 4 digits (XXXX-XXXX)
export const SCHWAB_ACCOUNT = /\b\d{4}-\d{4}\b/g;

// TD Ameritrade: 9-10 digits
export const TD_AMERITRADE_ACCOUNT = /\b\d{9,10}\b/g;

// E*TRADE: 4-8 digits
export const ETRADE_ACCOUNT = /\b\d{4,8}\b/g;

// Generic brokerage account pattern (with context label)
export const BROKERAGE_ACCOUNT = /\b(?:account|acct|portfolio|brokerage)[\s#:]*([A-Z0-9]{4,12})\b/gi;

/**
 * CUSIP (Committee on Uniform Securities Identification Procedures)
 * 9-character alphanumeric code identifying North American securities
 * Format: 6 chars (issuer) + 2 chars (issue) + 1 check digit
 */
export const CUSIP = /\b[A-Z0-9]{9}\b/g;

/**
 * ISIN (International Securities Identification Number)
 * 12-character alphanumeric code
 * Format: 2-letter country code + 9-char identifier + 1 check digit
 */
export const ISIN = /\b[A-Z]{2}[A-Z0-9]{9}\d\b/g;

/**
 * Common stock ticker symbols (for validation)
 * Top 100 most commonly traded stocks to reduce false positives
 */
const COMMON_TICKERS = new Set([
  // Tech giants
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'NVDA',
  'AMD', 'INTC', 'CSCO', 'ORCL', 'IBM', 'CRM', 'ADBE', 'NFLX',

  // Financial
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP',
  'V', 'MA', 'PYPL',

  // Healthcare
  'JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'MRK', 'LLY', 'ABT',

  // Consumer
  'WMT', 'HD', 'DIS', 'MCD', 'NKE', 'SBUX', 'TGT', 'COST',

  // Industrial
  'BA', 'CAT', 'GE', 'MMM', 'HON', 'UPS', 'RTX',

  // Energy
  'XOM', 'CVX', 'COP', 'SLB',

  // Telecom
  'T', 'VZ', 'TMUS',

  // ETFs
  'SPY', 'QQQ', 'IWM', 'DIA', 'VOO', 'VTI', 'AGG', 'BND'
]);

/**
 * Words that are commonly mistaken for tickers
 * These are valid English words that happen to be 1-5 uppercase letters
 */
const FALSE_POSITIVE_WORDS = new Set([
  'I', 'A', 'THE', 'AND', 'OR', 'NOT', 'FOR', 'TO', 'OF', 'IN', 'ON', 'AT',
  'USA', 'CEO', 'CFO', 'CTO', 'VP', 'SVP', 'LLC', 'INC', 'CORP', 'LTD',
  'DR', 'MR', 'MRS', 'MS', 'AM', 'PM', 'EST', 'PST', 'UTC',
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN',
  'PDF', 'HTML', 'XML', 'JSON', 'API', 'URL', 'HTTP', 'HTTPS', 'FTP',
  'ID', 'SSN', 'DOB', 'ZIP', 'PO', 'BOX', 'ST', 'AVE', 'RD', 'BLVD'
]);

/**
 * Check if text contains stock/investment context
 * @param text - Text to check
 * @param radius - Number of characters to check around matches
 * @returns true if context keywords are found
 */
function hasStockContext(text: string, radius: number = 100): boolean {
  const lowerText = text.toLowerCase();
  return STOCK_CONTEXT_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Get context around a match
 * @param text - Full text
 * @param index - Match index
 * @param radius - Characters before/after to include
 * @returns Context string
 */
function getContext(text: string, index: number, radius: number): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return text.substring(start, end);
}

/**
 * Validate stock ticker
 * @param ticker - Ticker symbol to validate
 * @param context - Surrounding text for context clues
 * @returns true if likely a valid ticker
 */
export function validateTicker(ticker: string, context: string = ''): boolean {
  // Too short (single letter) - only valid if it's a known ticker
  if (ticker.length === 1) {
    return COMMON_TICKERS.has(ticker);
  }

  // Check against false positive list
  if (FALSE_POSITIVE_WORDS.has(ticker)) {
    return false;
  }

  // If it's a known common ticker, accept it
  if (COMMON_TICKERS.has(ticker)) {
    return true;
  }

  // Otherwise, require stock context nearby
  return hasStockContext(context);
}

/**
 * Validate CUSIP checksum
 * Uses Luhn-like algorithm with specific weights
 *
 * @param cusip - 9-character CUSIP
 * @returns true if checksum is valid
 */
export function validateCUSIP(cusip: string): boolean {
  if (cusip.length !== 9) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    let code: number;
    const char = cusip[i];

    if (/\d/.test(char)) {
      code = parseInt(char, 10);
    } else if (/[A-Z]/.test(char)) {
      // A=10, B=11, ..., Z=35
      code = char.charCodeAt(0) - 55;
    } else if (char === '*') {
      code = 36;
    } else if (char === '@') {
      code = 37;
    } else if (char === '#') {
      code = 38;
    } else {
      return false; // Invalid character
    }

    // Double every second digit
    if (i % 2 === 1) {
      code *= 2;
    }

    // Sum the digits
    sum += Math.floor(code / 10) + (code % 10);
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(cusip[8], 10);
}

/**
 * Validate ISIN checksum
 * Uses Luhn algorithm
 *
 * @param isin - 12-character ISIN
 * @returns true if checksum is valid
 */
export function validateISIN(isin: string): boolean {
  if (isin.length !== 12) {
    return false;
  }

  // First 2 must be letters (country code)
  if (!/^[A-Z]{2}/.test(isin)) {
    return false;
  }

  // Convert to numeric string (A=10, B=11, ..., Z=35)
  let numericString = '';
  for (let i = 0; i < 12; i++) {
    const char = isin[i];
    if (/[A-Z]/.test(char)) {
      numericString += (char.charCodeAt(0) - 55).toString();
    } else if (/\d/.test(char)) {
      numericString += char;
    } else {
      return false; // Invalid character
    }
  }

  // Apply Luhn algorithm
  let sum = 0;
  let double = true; // Start from second-to-last digit

  for (let i = numericString.length - 2; i >= 0; i--) {
    let digit = parseInt(numericString[i], 10);

    if (double) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }

    sum += digit;
    double = !double;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(numericString[numericString.length - 1], 10);
}

/**
 * Find stock ticker symbols with context validation
 */
export function findStockTickers(text: string): string[] {
  const candidates = Array.from(text.matchAll(STOCK_TICKER_PATTERN), m => m[0]);
  const validated: string[] = [];

  for (const match of candidates) {
    // Get match position
    const index = text.indexOf(match);
    const context = getContext(text, index, 100);

    if (validateTicker(match, context)) {
      validated.push(match);
    }
  }

  // Return unique tickers
  return Array.from(new Set(validated));
}

/**
 * Find CUSIP identifiers
 */
export function findCUSIPs(text: string): string[] {
  const candidates = Array.from(text.matchAll(CUSIP), m => m[0]);
  return candidates.filter(validateCUSIP);
}

/**
 * Find ISIN identifiers
 */
export function findISINs(text: string): string[] {
  const candidates = Array.from(text.matchAll(ISIN), m => m[0]);
  return candidates.filter(validateISIN);
}

/**
 * Find brokerage account numbers
 */
export function findBrokerageAccounts(text: string): string[] {
  const accounts = new Set<string>();

  // Find labeled accounts
  const labeled = Array.from(text.matchAll(BROKERAGE_ACCOUNT), m => m[1]);
  labeled.forEach(acct => accounts.add(acct));

  return Array.from(accounts);
}

/**
 * Find all investment-related data
 * Combines tickers, securities IDs, and account numbers
 *
 * @param text - Text to analyze
 * @returns Object with arrays of detected investment data
 */
export function findAllInvestment(text: string): {
  tickers: string[];
  cusips: string[];
  isins: string[];
  accounts: string[];
} {
  return {
    tickers: findStockTickers(text),
    cusips: findCUSIPs(text),
    isins: findISINs(text),
    accounts: findBrokerageAccounts(text)
  };
}
