/**
 * Tests for PDF coordinate system conversion utilities
 */

import { describe, it, expect } from 'vitest';
import { convertBoxToPdfLib, convertBoxesToPdfLib } from '../../src/lib/pdf/coordinates';
import type { Box } from '../../src/lib/pdf/find';

describe('PDF coordinate conversion', () => {
  describe('convertBoxToPdfLib', () => {
    it('should convert canvas coordinates to PDF coordinates', () => {
      const box: Box = {
        x: 100,
        y: 200,
        w: 50,
        h: 20,
        text: 'test'
      };

      const pdfPageHeight = 792; // Standard letter height in points
      const scale = 2;

      const result = convertBoxToPdfLib(box, pdfPageHeight, scale);

      // x should be divided by scale
      expect(result.x).toBe(50); // 100 / 2

      // width and height should be divided by scale
      expect(result.width).toBe(25); // 50 / 2
      expect(result.height).toBe(10); // 20 / 2

      // y should be flipped: pdfPageHeight - (canvasY / scale + height)
      // canvasY = 200 / 2 = 100
      // height = 10
      // y = 792 - (100 + 10) = 682
      expect(result.y).toBe(682);
    });

    it('should handle boxes at top of page (y=0)', () => {
      const box: Box = {
        x: 0,
        y: 0,
        w: 100,
        h: 20,
        text: 'top'
      };

      const pdfPageHeight = 792;
      const scale = 1;

      const result = convertBoxToPdfLib(box, pdfPageHeight, scale);

      // At top of canvas (y=0), should map to top of PDF page
      // y = 792 - (0 + 20) = 772
      expect(result.y).toBe(772);
    });

    it('should handle boxes at bottom of page', () => {
      const box: Box = {
        x: 0,
        y: 772, // Near bottom of canvas
        w: 100,
        h: 20,
        text: 'bottom'
      };

      const pdfPageHeight = 792;
      const scale = 1;

      const result = convertBoxToPdfLib(box, pdfPageHeight, scale);

      // At bottom of canvas, should map to bottom of PDF page
      // y = 792 - (772 + 20) = 0
      expect(result.y).toBe(0);
    });

    it('should handle different scale factors', () => {
      const box: Box = {
        x: 200,
        y: 400,
        w: 100,
        h: 50,
        text: 'scaled'
      };

      const pdfPageHeight = 792;
      const scale = 4;

      const result = convertBoxToPdfLib(box, pdfPageHeight, scale);

      expect(result.x).toBe(50); // 200 / 4
      expect(result.width).toBe(25); // 100 / 4
      expect(result.height).toBe(12.5); // 50 / 4

      // y = 792 - (400/4 + 50/4) = 792 - 112.5 = 679.5
      expect(result.y).toBe(679.5);
    });

    it('should handle fractional coordinates', () => {
      const box: Box = {
        x: 123.456,
        y: 789.012,
        w: 45.678,
        h: 23.456,
        text: 'fraction'
      };

      const pdfPageHeight = 1000;
      const scale = 2.5;

      const result = convertBoxToPdfLib(box, pdfPageHeight, scale);

      expect(result.x).toBeCloseTo(49.3824, 3); // 123.456 / 2.5
      expect(result.width).toBeCloseTo(18.2712, 3); // 45.678 / 2.5
      expect(result.height).toBeCloseTo(9.3824, 3); // 23.456 / 2.5

      // y = 1000 - (789.012/2.5 + 23.456/2.5)
      const expectedY = 1000 - (789.012 / 2.5 + 23.456 / 2.5);
      expect(result.y).toBeCloseTo(expectedY, 3);
    });
  });

  describe('convertBoxesToPdfLib', () => {
    it('should convert multiple boxes', () => {
      const boxes: Box[] = [
        { x: 100, y: 200, w: 50, h: 20, text: 'box1' },
        { x: 300, y: 400, w: 60, h: 30, text: 'box2' },
        { x: 500, y: 600, w: 70, h: 40, text: 'box3' }
      ];

      const pdfPageHeight = 792;
      const scale = 2;

      const results = convertBoxesToPdfLib(boxes, pdfPageHeight, scale);

      expect(results).toHaveLength(3);

      // Verify first box
      expect(results[0].x).toBe(50);
      expect(results[0].y).toBe(682);

      // Verify second box
      expect(results[1].x).toBe(150);
      expect(results[1].y).toBe(577); // 792 - (400/2 + 30/2)

      // Verify third box
      expect(results[2].x).toBe(250);
      expect(results[2].y).toBe(472); // 792 - (600/2 + 40/2)
    });

    it('should handle empty array', () => {
      const boxes: Box[] = [];
      const result = convertBoxesToPdfLib(boxes, 792, 2);

      expect(result).toHaveLength(0);
    });
  });
});
