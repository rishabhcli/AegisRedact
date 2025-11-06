/**
 * Coordinate system conversion utilities for PDF processing
 *
 * PDF.js uses canvas/viewport coordinates: origin top-left, Y increases downward
 * pdf-lib uses PDF coordinates: origin bottom-left, Y increases upward
 */

import type { Box } from './find';

export interface PdfLibBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Convert a Box from PDF.js viewport coordinates to pdf-lib page coordinates
 *
 * @param box - Box in PDF.js viewport coordinates (top-left origin)
 * @param pdfPageHeight - Height of the PDF page in pdf-lib coordinates
 * @param scale - Scale factor used when rendering (viewport.scale)
 * @returns Box in pdf-lib coordinates (bottom-left origin)
 */
export function convertBoxToPdfLib(
  box: Box,
  pdfPageHeight: number,
  scale: number
): PdfLibBox {
  // Convert from canvas pixels to PDF points
  const x = box.x / scale;
  const width = box.w / scale;
  const height = box.h / scale;

  // Convert Y coordinate: flip from top-left to bottom-left origin
  // In canvas: Y=0 is top, increases downward
  // In PDF: Y=0 is bottom, increases upward
  const canvasY = box.y / scale;
  const y = pdfPageHeight - (canvasY + height);

  return { x, y, width, height };
}

/**
 * Convert multiple boxes at once
 */
export function convertBoxesToPdfLib(
  boxes: Box[],
  pdfPageHeight: number,
  scale: number
): PdfLibBox[] {
  return boxes.map(box => convertBoxToPdfLib(box, pdfPageHeight, scale));
}
