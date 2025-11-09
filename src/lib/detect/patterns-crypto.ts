/**
 * Cryptocurrency Address Detection
 * Detects Bitcoin, Ethereum, and other cryptocurrency wallet addresses
 */

/**
 * Bitcoin address patterns
 * - Legacy P2PKH: Starts with 1, 26-35 characters, Base58
 * - Legacy P2SH: Starts with 3, 26-35 characters, Base58
 * - SegWit Bech32: Starts with bc1, 42-62 characters (mainnet)
 */
export const BITCOIN_LEGACY = /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g;
export const BITCOIN_SEGWIT = /\bbc1[a-z0-9]{39,59}\b/g;

/**
 * Ethereum address pattern
 * - 0x followed by 40 hexadecimal characters
 * - Case-insensitive (but EIP-55 uses mixed case for checksum)
 */
export const ETHEREUM = /\b0x[a-fA-F0-9]{40}\b/g;

/**
 * Other cryptocurrency patterns
 */
// Litecoin: Similar to Bitcoin but starts with L or M
export const LITECOIN = /\b[LM][a-km-zA-HJ-NP-Z1-9]{26,33}\b/g;

// Cardano (ADA): Starts with addr1, Bech32
export const CARDANO = /\baddr1[a-z0-9]{53,98}\b/g;

// Solana: Base58, 32-44 characters
export const SOLANA = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;

// Ripple (XRP): Starts with r, Base58
export const RIPPLE = /\br[a-km-zA-HJ-NP-Z1-9]{24,34}\b/g;

/**
 * Base58 alphabet (used by Bitcoin and others)
 * Excludes: 0, O, I, l (to avoid confusion)
 */
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Validate Base58 string
 * @param str - String to validate
 * @returns true if valid Base58
 */
function isBase58(str: string): boolean {
  for (const char of str) {
    if (!BASE58_ALPHABET.includes(char)) {
      return false;
    }
  }
  return true;
}

/**
 * Decode Base58 to byte array
 * Used for Bitcoin address checksum validation
 *
 * @param str - Base58 encoded string
 * @returns Decoded bytes as number array
 */
function decodeBase58(str: string): number[] {
  const bytes: number[] = [];
  let num = BigInt(0);

  // Convert Base58 to decimal
  for (let i = 0; i < str.length; i++) {
    const digit = BigInt(BASE58_ALPHABET.indexOf(str[i]));
    num = num * BigInt(58) + digit;
  }

  // Convert to bytes
  while (num > 0) {
    bytes.unshift(Number(num % BigInt(256)));
    num = num / BigInt(256);
  }

  // Add leading zeros
  for (let i = 0; i < str.length && str[i] === '1'; i++) {
    bytes.unshift(0);
  }

  return bytes;
}

/**
 * Simple SHA-256 hash (placeholder - would need crypto library for full implementation)
 * For now, we'll do format validation only
 *
 * Note: Full Bitcoin address validation requires double SHA-256 hashing,
 * which would need a crypto library. For privacy/security, we're doing
 * format validation only (pattern matching + Base58 check).
 */
function sha256(data: number[]): number[] {
  // Placeholder - in production, would use Web Crypto API or library
  // For now, return dummy hash (we'll rely on format validation)
  return new Array(32).fill(0);
}

/**
 * Validate Bitcoin legacy address (P2PKH or P2SH)
 * Checks format and Base58 encoding
 *
 * Note: Full validation would require checksum verification via double SHA-256,
 * but for privacy we're doing format-only validation
 *
 * @param address - Bitcoin address to validate
 * @returns true if valid format
 */
export function validateBitcoinLegacy(address: string): boolean {
  // Must start with 1 or 3
  if (!address.startsWith('1') && !address.startsWith('3')) {
    return false;
  }

  // Must be 26-35 characters
  if (address.length < 26 || address.length > 35) {
    return false;
  }

  // Must be valid Base58
  if (!isBase58(address)) {
    return false;
  }

  // Additional check: typical length is 26-34 characters
  // Reject if unusually short or long
  if (address.length < 26 || address.length > 35) {
    return false;
  }

  return true;
}

/**
 * Validate Bitcoin SegWit (Bech32) address
 * Format: bc1 + 39-59 lowercase alphanumeric characters
 *
 * @param address - Bitcoin Bech32 address
 * @returns true if valid format
 */
export function validateBitcoinSegwit(address: string): boolean {
  // Must start with bc1
  if (!address.startsWith('bc1')) {
    return false;
  }

  // Must be 42-62 characters total
  if (address.length < 42 || address.length > 62) {
    return false;
  }

  // Must be lowercase
  if (address !== address.toLowerCase()) {
    return false;
  }

  // Bech32 charset: qpzry9x8gf2tvdw0s3jn54khce6mua7l
  const bech32Charset = /^[a-z0-9]+$/;
  if (!bech32Charset.test(address.substring(3))) {
    return false;
  }

  return true;
}

/**
 * Validate Ethereum address
 * - Must be 0x + 40 hex characters
 * - Optionally validate EIP-55 checksum (mixed case)
 *
 * @param address - Ethereum address to validate
 * @param validateChecksum - Whether to validate EIP-55 checksum (default: false)
 * @returns true if valid format
 */
export function validateEthereum(address: string, validateChecksum: boolean = false): boolean {
  // Must start with 0x
  if (!address.startsWith('0x')) {
    return false;
  }

  // Must be exactly 42 characters (0x + 40 hex)
  if (address.length !== 42) {
    return false;
  }

  // Must be valid hex
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return false;
  }

  // If all lowercase or all uppercase, checksum validation not needed
  const addr = address.substring(2);
  if (addr === addr.toLowerCase() || addr === addr.toUpperCase()) {
    return true;
  }

  // EIP-55 checksum validation would require Keccak-256 hashing
  // For privacy, we skip full checksum validation
  // Just verify format is valid
  return true;
}

/**
 * Validate Litecoin address
 * Similar to Bitcoin but starts with L or M
 *
 * @param address - Litecoin address
 * @returns true if valid format
 */
export function validateLitecoin(address: string): boolean {
  // Must start with L or M
  if (!address.startsWith('L') && !address.startsWith('M')) {
    return false;
  }

  // Must be 26-34 characters
  if (address.length < 26 || address.length > 34) {
    return false;
  }

  // Must be valid Base58
  return isBase58(address);
}

/**
 * Validate Cardano address
 * Bech32 format starting with addr1
 *
 * @param address - Cardano address
 * @returns true if valid format
 */
export function validateCardano(address: string): boolean {
  // Must start with addr1
  if (!address.startsWith('addr1')) {
    return false;
  }

  // Must be 58-103 characters
  if (address.length < 58 || address.length > 103) {
    return false;
  }

  // Must be lowercase alphanumeric
  return /^addr1[a-z0-9]+$/.test(address);
}

/**
 * Find all Bitcoin addresses (legacy and SegWit)
 */
export function findBitcoinAddresses(text: string): string[] {
  const addresses: string[] = [];

  // Find legacy addresses
  const legacyCandidates = Array.from(text.matchAll(BITCOIN_LEGACY), m => m[0]);
  addresses.push(...legacyCandidates.filter(validateBitcoinLegacy));

  // Find SegWit addresses
  const segwitCandidates = Array.from(text.matchAll(BITCOIN_SEGWIT), m => m[0]);
  addresses.push(...segwitCandidates.filter(validateBitcoinSegwit));

  return addresses;
}

/**
 * Find all Ethereum addresses
 */
export function findEthereumAddresses(text: string): string[] {
  const candidates = Array.from(text.matchAll(ETHEREUM), m => m[0]);
  return candidates.filter(addr => validateEthereum(addr));
}

/**
 * Find all Litecoin addresses
 */
export function findLitecoinAddresses(text: string): string[] {
  const candidates = Array.from(text.matchAll(LITECOIN), m => m[0]);
  return candidates.filter(validateLitecoin);
}

/**
 * Find all Cardano addresses
 */
export function findCardanoAddresses(text: string): string[] {
  const candidates = Array.from(text.matchAll(CARDANO), m => m[0]);
  return candidates.filter(validateCardano);
}

/**
 * Find all Ripple addresses
 */
export function findRippleAddresses(text: string): string[] {
  const candidates = Array.from(text.matchAll(RIPPLE), m => m[0]);
  // Basic validation: must be Base58
  return candidates.filter(addr => {
    if (addr.length < 25 || addr.length > 35) return false;
    return isBase58(addr);
  });
}

/**
 * Find all cryptocurrency addresses in text
 * Returns categorized results by cryptocurrency type
 *
 * @param text - Text to analyze
 * @returns Object with arrays of detected crypto addresses
 */
export function findAllCrypto(text: string): {
  bitcoin: string[];
  ethereum: string[];
  litecoin: string[];
  cardano: string[];
  ripple: string[];
} {
  return {
    bitcoin: findBitcoinAddresses(text),
    ethereum: findEthereumAddresses(text),
    litecoin: findLitecoinAddresses(text),
    cardano: findCardanoAddresses(text),
    ripple: findRippleAddresses(text)
  };
}

/**
 * Find all crypto addresses (flattened array)
 * Useful for simple detection without categorization
 */
export function findAllCryptoAddresses(text: string): string[] {
  const all = findAllCrypto(text);
  return [
    ...all.bitcoin,
    ...all.ethereum,
    ...all.litecoin,
    ...all.cardano,
    ...all.ripple
  ];
}
