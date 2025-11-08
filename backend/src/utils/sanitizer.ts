/**
 * Input sanitization utilities
 * Prevents XSS, path traversal, and other injection attacks
 */

/**
 * Sanitize filename to prevent path traversal and XSS
 *
 * Security issues prevented:
 * - Path traversal: "../../../etc/passwd"
 * - Null bytes: "file.pdf\0.exe"
 * - HTML/JS injection: "<script>alert('xss')</script>.pdf"
 * - Control characters that could break file systems
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components (/ or \)
  let sanitized = filename.replace(/[/\\]/g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters (ASCII 0-31 and 127)
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Remove leading/trailing dots and spaces (problematic on Windows)
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');

  // Replace HTML special characters to prevent XSS
  sanitized = sanitized
    .replace(/</g, '_')
    .replace(/>/g, '_')
    .replace(/"/g, '_')
    .replace(/'/g, '_')
    .replace(/&/g, '_');

  // Limit to safe characters: alphanumeric, dash, underscore, dot, space
  sanitized = sanitized.replace(/[^a-zA-Z0-9._\s-]/g, '_');

  // Collapse multiple underscores/spaces
  sanitized = sanitized.replace(/_{2,}/g, '_');
  sanitized = sanitized.replace(/\s{2,}/g, ' ');

  // Truncate to 200 chars (leave room for extension and encryption suffix)
  if (sanitized.length > 200) {
    const lastDot = sanitized.lastIndexOf('.');
    if (lastDot > 150 && lastDot < 200) {
      // Preserve extension
      const ext = sanitized.substring(lastDot);
      sanitized = sanitized.substring(0, 200 - ext.length) + ext;
    } else {
      sanitized = sanitized.substring(0, 200);
    }
  }

  // Ensure filename is not empty after sanitization
  if (sanitized.length === 0) {
    sanitized = 'unnamed_file';
  }

  // Prevent reserved Windows filenames
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
  ];

  const basenameLower = sanitized.split('.')[0].toUpperCase();
  if (reservedNames.includes(basenameLower)) {
    sanitized = `file_${sanitized}`;
  }

  return sanitized;
}

/**
 * Validate filename is safe after sanitization
 */
export function isValidFilename(filename: string): boolean {
  if (!filename || filename.length === 0) return false;
  if (filename.length > 255) return false;

  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }

  // Check for null bytes
  if (filename.includes('\0')) {
    return false;
  }

  // Must contain at least one alphanumeric character
  if (!/[a-zA-Z0-9]/.test(filename)) {
    return false;
  }

  return true;
}

/**
 * Sanitize email for logging (prevent log injection)
 */
export function sanitizeEmailForLogging(email: string): string {
  // Remove newlines and other control characters that could break logs
  return email.replace(/[\r\n\t]/g, '').substring(0, 100);
}

/**
 * Sanitize user input for error messages (prevent XSS in error responses)
 */
export function sanitizeForErrorMessage(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .substring(0, 200); // Limit length
}
