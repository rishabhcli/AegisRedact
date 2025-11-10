/**
 * Shared types and interfaces for document format abstraction layer
 *
 * This module defines the core data structures used across all format handlers,
 * providing a unified interface for working with different document types.
 *
 * @module formats/base/types
 */

/**
 * Bounding box for redaction areas (unified across all formats)
 *
 * Represents a rectangular area containing sensitive information that should be redacted.
 * Coordinates are format-specific (see each format's implementation for details).
 *
 * @interface BoundingBox
 * @property {number} x - Left edge coordinate
 * @property {number} y - Top edge coordinate
 * @property {number} w - Width of the box
 * @property {number} h - Height of the box
 * @property {string} text - The text content to be redacted
 * @property {number} [page] - Page number for multi-page documents (0-indexed)
 * @property {number} [sheet] - Sheet index for spreadsheets (0-indexed)
 * @property {number} [slide] - Slide number for presentations (0-indexed)
 * @property {number} [line] - Line number for text-based formats (0-indexed)
 * @property {number} [row] - Row index for table-based formats (0-indexed)
 * @property {number} [column] - Column index for table-based formats (0-indexed)
 * @property {string} [type] - PII type identifier (email, phone, ssn, card, etc.)
 * @property {'regex' | 'ml' | 'manual' | 'hybrid'} [source] - Detection method
 * @property {number} [confidence] - Detection confidence (0.0 to 1.0, primarily for ML)
 * @property {string} [detectionId] - Unique identifier for tracking across pipeline
 *
 * @example
 * ```typescript
 * const emailBox: BoundingBox = {
 *   x: 100, y: 50, w: 200, h: 20,
 *   text: 'user@example.com',
 *   type: 'email',
 *   source: 'regex',
 *   confidence: 1.0
 * };
 * ```
 */
export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  page?: number;          // For multi-page documents (PDF, DOCX, etc.)
  sheet?: number;         // For spreadsheets (XLSX)
  slide?: number;         // For presentations (PPTX)
  line?: number;          // For line-based formats (TXT, MD)
  row?: number;           // For table-based formats (CSV, TSV)
  column?: number;        // For table-based formats (CSV, TSV)
  type?: string;          // PII type (email, phone, ssn, etc.)
  source?: 'regex' | 'ml' | 'manual' | 'hybrid';
  confidence?: number;    // 0.0 to 1.0 for ML detections
  detectionId?: string;   // Unique identifier for tracking
}

/**
 * Document metadata containing file information and format-specific properties
 *
 * Provides essential information about the loaded document, including file details
 * and structural information (page counts, dimensions, etc.).
 *
 * @interface DocumentMetadata
 * @property {string} fileName - Original filename
 * @property {number} fileSize - File size in bytes
 * @property {string} mimeType - MIME type (e.g., 'text/plain', 'application/pdf')
 * @property {number} [pageCount] - Number of pages (for PDFs, presentations)
 * @property {number} [sheetCount] - Number of sheets (for spreadsheets)
 * @property {number} [slideCount] - Number of slides (for presentations)
 * @property {number} [lineCount] - Number of lines (for text files)
 * @property {number} [rowCount] - Number of rows (for CSV/TSV)
 * @property {number} [columnCount] - Number of columns (for CSV/TSV)
 * @property {boolean} [hasTextLayer] - Whether PDF has embedded text (vs scanned)
 * @property {string} format - Format identifier (pdf, txt, csv, etc.)
 *
 * @example
 * ```typescript
 * const metadata: DocumentMetadata = {
 *   fileName: 'report.pdf',
 *   fileSize: 524288,
 *   mimeType: 'application/pdf',
 *   pageCount: 5,
 *   hasTextLayer: true,
 *   format: 'pdf'
 * };
 * ```
 */
export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  pageCount?: number;     // For multi-page documents
  sheetCount?: number;    // For spreadsheets
  slideCount?: number;    // For presentations
  lineCount?: number;     // For text documents
  rowCount?: number;      // For CSV/TSV
  columnCount?: number;   // For CSV/TSV
  hasTextLayer?: boolean; // For PDFs (indicates if OCR needed)
  format: string;         // Format identifier (pdf, docx, txt, etc.)
  [key: string]: any;     // Format-specific metadata
}

/**
 * Rendering options for document display
 *
 * Controls how a document is rendered to the UI, including target container,
 * page selection, zoom level, and format-specific rendering modes.
 *
 * @interface RenderOptions
 * @property {HTMLElement} container - Target DOM element for rendering
 * @property {number} [page] - Page to render (for multi-page documents, 0-indexed)
 * @property {number} [sheet] - Sheet to render (for spreadsheets, 0-indexed)
 * @property {number} [slide] - Slide to render (for presentations, 0-indexed)
 * @property {number} [scale] - Zoom level multiplier (default: 1.0)
 * @property {number} [width] - Target width in pixels
 * @property {number} [height] - Target height in pixels
 * @property {'canvas' | 'dom' | 'hybrid'} [renderMode] - Rendering strategy
 *
 * @example
 * ```typescript
 * const options: RenderOptions = {
 *   container: document.getElementById('viewer'),
 *   page: 0,
 *   scale: 1.5,
 *   renderMode: 'canvas'
 * };
 * ```
 */
export interface RenderOptions {
  container: HTMLElement;
  page?: number;          // For multi-page documents
  sheet?: number;         // For spreadsheets
  slide?: number;         // For presentations
  scale?: number;         // Zoom level (default: 1.0)
  width?: number;         // Target width
  height?: number;        // Target height
  renderMode?: 'canvas' | 'dom' | 'hybrid'; // Rendering strategy
  [key: string]: any;     // Format-specific options
}

/**
 * Export options for redacted documents
 *
 * Controls how the redacted document is exported, including target format,
 * quality settings, and metadata preservation options.
 *
 * @interface ExportOptions
 * @property {'pdf' | 'png' | 'original' | 'text'} [format] - Target export format
 * @property {number} [quality] - Image quality for lossy formats (0.0 to 1.0)
 * @property {boolean} [flatten] - Whether to flatten to rasterized output (security)
 * @property {boolean} [includeMetadata] - Whether to preserve non-sensitive metadata
 * @property {string} [fileName] - Suggested filename for download
 *
 * @example
 * ```typescript
 * const exportOpts: ExportOptions = {
 *   format: 'pdf',
 *   flatten: true,
 *   includeMetadata: false,
 *   fileName: 'document-redacted.pdf'
 * };
 * ```
 */
export interface ExportOptions {
  format?: 'pdf' | 'png' | 'original' | 'text'; // Target export format
  quality?: number;       // Image quality (0.0 to 1.0)
  flatten?: boolean;      // Flatten to rasterized output (security)
  includeMetadata?: boolean; // Whether to preserve non-sensitive metadata
  fileName?: string;      // Suggested filename
  [key: string]: any;     // Format-specific options
}

/**
 * Document state during processing
 */
export interface Document {
  metadata: DocumentMetadata;
  content: any;           // Format-specific content representation
  boxes: BoundingBox[];   // All redaction boxes (detected + manual)
  currentPage?: number;   // Current page/sheet/slide being viewed
  rendered: boolean;      // Whether document has been rendered
  modified: boolean;      // Whether document has been modified
}

/**
 * Text extraction result
 */
export interface TextExtractionResult {
  fullText: string;
  pageText?: Map<number, string>;  // For multi-page documents
  sheetText?: Map<number, string>; // For spreadsheets
  lineText?: string[];             // For line-based formats
  characterPositions?: CharacterPosition[]; // For precise mapping
}

/**
 * Character position for precise text mapping
 */
export interface CharacterPosition {
  char: string;
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
  page?: number;
  line?: number;
  row?: number;
  column?: number;
}

/**
 * Format capabilities describing what features a document format supports
 *
 * Used to determine available operations and UI features for a specific format.
 * This allows the application to adapt its interface based on format limitations.
 *
 * @interface FormatCapabilities
 * @property {boolean} canRenderToCanvas - Can render to HTML canvas element
 * @property {boolean} canRenderToDOM - Can render to DOM elements (div, table, etc.)
 * @property {boolean} supportsMultiPage - Has multiple pages/sheets/slides
 * @property {boolean} supportsTextExtraction - Can extract text without OCR
 * @property {boolean} requiresOCR - Requires OCR for text extraction (e.g., images)
 * @property {boolean} supportsDirectExport - Can export in original format
 * @property {boolean} requiresFlattening - Must be flattened for security (e.g., PDFs)
 * @property {string[]} supportedExportFormats - List of available export formats
 *
 * @example
 * ```typescript
 * const capabilities: FormatCapabilities = {
 *   canRenderToCanvas: false,
 *   canRenderToDOM: true,
 *   supportsMultiPage: false,
 *   supportsTextExtraction: true,
 *   requiresOCR: false,
 *   supportsDirectExport: true,
 *   requiresFlattening: false,
 *   supportedExportFormats: ['txt']
 * };
 * ```
 */
export interface FormatCapabilities {
  canRenderToCanvas: boolean;
  canRenderToDOM: boolean;
  supportsMultiPage: boolean;
  supportsTextExtraction: boolean;
  requiresOCR: boolean;
  supportsDirectExport: boolean;  // Can export in original format
  requiresFlattening: boolean;    // Must flatten for security
  supportedExportFormats: string[];
}

/**
 * MIME type to format mapping
 */
export const MIME_TYPES: Record<string, string> = {
  // PDF
  'application/pdf': 'pdf',

  // Images
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',

  // Office Documents
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/msword': 'doc',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.ms-powerpoint': 'ppt',

  // Text formats
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
  'text/tab-separated-values': 'tsv',
  'application/rtf': 'rtf',
  'text/rtf': 'rtf',
  'text/html': 'html',
  'application/xhtml+xml': 'html',

  // E-books
  'application/epub+zip': 'epub',
  'application/x-mobipocket-ebook': 'mobi'
};

/**
 * File extension to format mapping
 */
export const FILE_EXTENSIONS: Record<string, string> = {
  // PDF
  'pdf': 'pdf',

  // Images
  'png': 'png',
  'jpg': 'jpg',
  'jpeg': 'jpg',
  'gif': 'gif',
  'webp': 'webp',
  'bmp': 'bmp',

  // Office Documents
  'docx': 'docx',
  'xlsx': 'xlsx',
  'pptx': 'pptx',
  'doc': 'doc',
  'xls': 'xls',
  'ppt': 'ppt',

  // Text formats
  'txt': 'txt',
  'md': 'md',
  'markdown': 'md',
  'csv': 'csv',
  'tsv': 'tsv',
  'rtf': 'rtf',
  'html': 'html',
  'htm': 'html',

  // E-books
  'epub': 'epub',
  'mobi': 'mobi'
};
