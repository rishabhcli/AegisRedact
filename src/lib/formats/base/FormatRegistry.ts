/**
 * Format registry for detecting and instantiating document format handlers
 *
 * Central registry that manages all supported document formats. Uses lazy loading
 * to minimize initial bundle size by only importing format handlers when needed.
 *
 * @module formats/base/FormatRegistry
 *
 * @example
 * ```typescript
 * // Detect and get format handler for a file
 * const format = await FormatRegistry.getFormat(file);
 *
 * // Check if file is supported
 * const isSupported = await FormatRegistry.isSupported(file);
 *
 * // Get list of supported formats
 * const formats = await FormatRegistry.getSupportedFormats();
 * ```
 */

import type { DocumentFormat } from './DocumentFormat';
import { MIME_TYPES, FILE_EXTENSIONS } from './types';

/**
 * Registry of all supported document formats
 *
 * Provides factory methods for creating format handler instances based on
 * file type detection. Implements lazy initialization to reduce bundle size.
 *
 * @class FormatRegistry
 */
export class FormatRegistry {
  private static formats: Map<string, () => DocumentFormat> = new Map();
  private static initialized = false;

  /**
   * Register a format handler
   *
   * @param formatId - Unique format identifier (pdf, docx, txt, etc.)
   * @param factory - Factory function that creates a format instance
   */
  static register(formatId: string, factory: () => DocumentFormat): void {
    this.formats.set(formatId, factory);
  }

  /**
   * Initialize the registry with all format handlers
   * Lazy loads format implementations to reduce initial bundle size
   */
  private static async initialize(): Promise<void> {
    if (this.initialized) return;

    // Register plain text format (no external dependencies)
    const { PlainTextFormat } = await import('../text/PlainTextFormat');
    this.register('txt', () => new PlainTextFormat());
    this.register('md', () => new PlainTextFormat());

    // Register CSV/TSV format (Phase 2)
    const { CsvFormat } = await import('../structured/CsvFormat');
    this.register('csv', () => new CsvFormat());
    this.register('tsv', () => new CsvFormat());

    // Future format registrations will go here
    // Phase 3: DOCX, XLSX, PPTX
    // Phase 4: RTF, HTML, EPUB

    this.initialized = true;
  }

  /**
   * Detect format from file and return appropriate handler instance
   *
   * Automatically detects the file format based on MIME type and extension,
   * then returns an instance of the appropriate format handler. Initializes
   * the registry on first call (lazy loading).
   *
   * @param {File} file - The file to detect format for
   * @returns {Promise<DocumentFormat>} Format handler instance ready to use
   * @throws {Error} If format is not supported or not implemented
   *
   * @example
   * ```typescript
   * const file = new File(['Hello'], 'test.txt', { type: 'text/plain' });
   * const format = await FormatRegistry.getFormat(file);
   * const doc = await format.load(file);
   * ```
   */
  static async getFormat(file: File): Promise<DocumentFormat> {
    await this.initialize();

    const formatId = this.detectFormat(file);

    if (!formatId) {
      throw new Error(
        `Unsupported file format: ${file.name}\n` +
        `MIME type: ${file.type || 'unknown'}\n` +
        `Please use PDF, images, or supported text formats.`
      );
    }

    const factory = this.formats.get(formatId);

    if (!factory) {
      throw new Error(
        `Format "${formatId}" detected but no handler registered.\n` +
        `This format may not be implemented yet.`
      );
    }

    return factory();
  }

  /**
   * Detect format identifier from file without loading handler
   *
   * Examines MIME type and file extension to determine the format identifier.
   * Prefers MIME type over extension as it's more reliable. Returns null if
   * the format cannot be determined.
   *
   * @param {File} file - The file to detect
   * @returns {string | null} Format identifier (e.g., 'pdf', 'txt', 'csv') or null
   *
   * @example
   * ```typescript
   * const file = new File(['data'], 'data.csv', { type: 'text/csv' });
   * const formatId = FormatRegistry.detectFormat(file); // Returns 'csv'
   * ```
   */
  static detectFormat(file: File): string | null {
    // Try MIME type first (most reliable)
    if (file.type && MIME_TYPES[file.type]) {
      return MIME_TYPES[file.type];
    }

    // Fallback to file extension
    const extension = this.getFileExtension(file.name);
    if (extension && FILE_EXTENSIONS[extension]) {
      return FILE_EXTENSIONS[extension];
    }

    return null;
  }

  /**
   * Check if a file format is supported by the registry
   *
   * Determines whether the application can handle the given file format.
   * Initializes the registry if needed. Useful for filtering file inputs
   * or showing user-friendly error messages.
   *
   * @param {File} file - The file to check
   * @returns {Promise<boolean>} True if format is supported, false otherwise
   *
   * @example
   * ```typescript
   * const file = new File(['test'], 'doc.txt', { type: 'text/plain' });
   * if (await FormatRegistry.isSupported(file)) {
   *   console.log('File can be processed');
   * } else {
   *   console.log('Unsupported file type');
   * }
   * ```
   */
  static async isSupported(file: File): Promise<boolean> {
    await this.initialize();

    const formatId = this.detectFormat(file);
    return formatId !== null && this.formats.has(formatId);
  }

  /**
   * Get list of all supported format identifiers
   *
   * @returns Promise<string[]> - Array of format IDs
   */
  static async getSupportedFormats(): Promise<string[]> {
    await this.initialize();
    return Array.from(this.formats.keys());
  }

  /**
   * Get list of supported file extensions
   *
   * @returns string[] - Array of extensions (without dots)
   */
  static getSupportedExtensions(): string[] {
    return Object.keys(FILE_EXTENSIONS);
  }

  /**
   * Get list of supported MIME types
   *
   * @returns string[] - Array of MIME types
   */
  static getSupportedMimeTypes(): string[] {
    return Object.keys(MIME_TYPES);
  }

  /**
   * Get file extension from filename
   *
   * @param filename - The filename to parse
   * @returns string - Lowercase extension without dot
   */
  private static getFileExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length < 2) return '';
    return parts[parts.length - 1].toLowerCase();
  }

  /**
   * Get human-readable format name from file
   *
   * @param file - The file to check
   * @returns string - Format name (e.g., "PDF Document", "Plain Text")
   */
  static getFormatName(file: File): string {
    const formatId = this.detectFormat(file);

    const names: Record<string, string> = {
      'pdf': 'PDF Document',
      'png': 'PNG Image',
      'jpg': 'JPEG Image',
      'gif': 'GIF Image',
      'webp': 'WebP Image',
      'bmp': 'Bitmap Image',
      'docx': 'Word Document',
      'xlsx': 'Excel Spreadsheet',
      'pptx': 'PowerPoint Presentation',
      'txt': 'Plain Text',
      'md': 'Markdown',
      'csv': 'CSV File',
      'tsv': 'TSV File',
      'rtf': 'Rich Text Format',
      'html': 'HTML Document',
      'epub': 'EPUB eBook',
      'mobi': 'Mobi eBook'
    };

    return formatId ? names[formatId] || 'Unknown Format' : 'Unknown Format';
  }

  /**
   * Clear the registry (for testing)
   */
  static clear(): void {
    this.formats.clear();
    this.initialized = false;
  }
}
