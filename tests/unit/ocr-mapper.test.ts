/**
 * Tests for OCR to PII coordinate mapping
 */

import { describe, it, expect } from 'vitest';
import { mapPIIToOCRBoxes, expandBoxes } from '../../src/lib/ocr/mapper';
import type { DetectionResult } from '../../src/lib/detect/merger';
import type { OCRWord } from '../../src/lib/images/ocr';

describe('OCR Mapper', () => {
  // Helper to create OCR words
  const createWord = (
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    confidence: number = 0.95
  ): OCRWord => ({
    text,
    bbox: { x, y, width, height },
    confidence,
  });

  // Helper to create detection results
  const createDetection = (
    text: string,
    type: string,
    positions?: { start: number; end: number }
  ): DetectionResult => ({
    text,
    type,
    confidence: 1.0,
    source: 'regex',
    positions,
  });

  describe('mapPIIToOCRBoxes', () => {
    it('should return empty array for no detections', () => {
      const words: OCRWord[] = [createWord('Hello', 10, 10, 50, 20)];
      const detections: DetectionResult[] = [];
      const fullText = 'Hello';

      const boxes = mapPIIToOCRBoxes(detections, words, fullText);
      expect(boxes).toHaveLength(0);
    });

    it('should return empty array for no OCR words', () => {
      const words: OCRWord[] = [];
      const detections: DetectionResult[] = [createDetection('test@example.com', 'email')];
      const fullText = 'Contact: test@example.com';

      const boxes = mapPIIToOCRBoxes(detections, words, fullText);
      expect(boxes).toHaveLength(0);
    });

    it('should map single word detection to box', () => {
      const words: OCRWord[] = [
        createWord('Contact:', 10, 10, 60, 20),
        createWord('test@example.com', 80, 10, 120, 20),
      ];
      const detections: DetectionResult[] = [createDetection('test@example.com', 'email')];
      const fullText = 'Contact: test@example.com';

      const boxes = mapPIIToOCRBoxes(detections, words, fullText);

      expect(boxes).toHaveLength(1);
      expect(boxes[0].text).toBe('test@example.com');
      expect(boxes[0].type).toBe('email');
      expect(boxes[0].x).toBe(80);
      expect(boxes[0].y).toBe(10);
      expect(boxes[0].w).toBe(120);
      expect(boxes[0].h).toBe(20);
    });

    it('should map multi-word detection to combined box', () => {
      const words: OCRWord[] = [
        createWord('John', 10, 10, 40, 20),
        createWord('Doe', 60, 10, 30, 20),
        createWord('Engineer', 100, 10, 60, 20),
      ];
      const detections: DetectionResult[] = [createDetection('John Doe', 'person')];
      const fullText = 'John Doe Engineer';

      const boxes = mapPIIToOCRBoxes(detections, words, fullText);

      expect(boxes).toHaveLength(1);
      expect(boxes[0].text).toBe('John Doe');
      // Combined box should span from John to Doe
      expect(boxes[0].x).toBe(10); // John's x
      expect(boxes[0].w).toBe(80); // From John start to Doe end (60 + 30 - 10)
    });

    it('should find multiple occurrences of same term', () => {
      const words: OCRWord[] = [
        createWord('Email:', 10, 10, 50, 20),
        createWord('test@test.com', 70, 10, 100, 20),
        createWord('Copy:', 10, 50, 50, 20),
        createWord('test@test.com', 70, 50, 100, 20),
      ];
      const detections: DetectionResult[] = [createDetection('test@test.com', 'email')];
      const fullText = 'Email: test@test.com Copy: test@test.com';

      const boxes = mapPIIToOCRBoxes(detections, words, fullText);

      expect(boxes).toHaveLength(2);
      expect(boxes[0].y).toBe(10); // First occurrence
      expect(boxes[1].y).toBe(50); // Second occurrence
    });

    it('should use explicit positions when provided', () => {
      const words: OCRWord[] = [
        createWord('SSN:', 10, 10, 40, 20),
        createWord('123-45-6789', 60, 10, 90, 20),
      ];
      const detections: DetectionResult[] = [
        createDetection('123-45-6789', 'ssn', { start: 5, end: 16 }),
      ];
      const fullText = 'SSN: 123-45-6789';

      const boxes = mapPIIToOCRBoxes(detections, words, fullText);

      expect(boxes).toHaveLength(1);
      expect(boxes[0].text).toBe('123-45-6789');
    });

    it('should handle case-insensitive matching', () => {
      const words: OCRWord[] = [
        createWord('EMAIL', 10, 10, 50, 20),
        createWord('Test@Example.COM', 70, 10, 120, 20),
      ];
      const detections: DetectionResult[] = [createDetection('test@example.com', 'email')];
      const fullText = 'EMAIL Test@Example.COM';

      const boxes = mapPIIToOCRBoxes(detections, words, fullText);

      expect(boxes).toHaveLength(1);
    });

    it('should apply scale factor to coordinates', () => {
      const words: OCRWord[] = [createWord('test@test.com', 100, 200, 150, 30)];
      const detections: DetectionResult[] = [createDetection('test@test.com', 'email')];
      const fullText = 'test@test.com';
      const scaleFactor = 2.0;

      const boxes = mapPIIToOCRBoxes(detections, words, fullText, 0, scaleFactor);

      expect(boxes).toHaveLength(1);
      expect(boxes[0].x).toBe(200); // 100 * 2
      expect(boxes[0].y).toBe(400); // 200 * 2
      expect(boxes[0].w).toBe(300); // 150 * 2
      expect(boxes[0].h).toBe(60); // 30 * 2
    });

    it('should set page index correctly', () => {
      const words: OCRWord[] = [createWord('test@test.com', 10, 10, 100, 20)];
      const detections: DetectionResult[] = [createDetection('test@test.com', 'email')];
      const fullText = 'test@test.com';
      const pageIndex = 5;

      const boxes = mapPIIToOCRBoxes(detections, words, fullText, pageIndex);

      expect(boxes[0].page).toBe(5);
    });

    it('should preserve detection metadata', () => {
      const words: OCRWord[] = [createWord('123-45-6789', 10, 10, 100, 20)];
      const detections: DetectionResult[] = [
        {
          text: '123-45-6789',
          type: 'ssn',
          confidence: 0.95,
          source: 'ml',
        },
      ];
      const fullText = '123-45-6789';

      const boxes = mapPIIToOCRBoxes(detections, words, fullText);

      expect(boxes[0].type).toBe('ssn');
      expect(boxes[0].source).toBe('ml');
      expect(boxes[0].confidence).toBe(0.95);
    });

    it('should handle partial word matches', () => {
      // When PII is part of a larger OCR word
      const words: OCRWord[] = [
        createWord('Contact:test@test.com', 10, 10, 200, 20),
      ];
      const detections: DetectionResult[] = [createDetection('test@test.com', 'email')];
      const fullText = 'Contact:test@test.com';

      const boxes = mapPIIToOCRBoxes(detections, words, fullText);

      // Should still find the match within the word
      expect(boxes).toHaveLength(1);
    });

    it('should handle detection not found in text', () => {
      const words: OCRWord[] = [createWord('Hello', 10, 10, 50, 20)];
      const detections: DetectionResult[] = [createDetection('notfound@test.com', 'email')];
      const fullText = 'Hello';

      const boxes = mapPIIToOCRBoxes(detections, words, fullText);

      expect(boxes).toHaveLength(0);
    });

    it('should combine overlapping word boxes correctly', () => {
      // Words on the same line that form a phone number
      const words: OCRWord[] = [
        createWord('(555)', 10, 100, 40, 20),
        createWord('123-4567', 55, 100, 70, 20),
      ];
      const detections: DetectionResult[] = [createDetection('(555) 123-4567', 'phone')];
      const fullText = '(555) 123-4567';

      const boxes = mapPIIToOCRBoxes(detections, words, fullText);

      expect(boxes).toHaveLength(1);
      // Combined box should span both words
      expect(boxes[0].x).toBe(10);
      expect(boxes[0].w).toBe(115); // From 10 to 125 (55 + 70)
    });
  });

  describe('expandBoxes', () => {
    it('should expand boxes by default padding (4px)', () => {
      const boxes = [
        { x: 100, y: 100, w: 50, h: 20, text: 'test' },
      ];

      const expanded = expandBoxes(boxes as any);

      expect(expanded[0].x).toBe(96); // 100 - 4
      expect(expanded[0].y).toBe(96); // 100 - 4
      expect(expanded[0].w).toBe(58); // 50 + 8
      expect(expanded[0].h).toBe(28); // 20 + 8
    });

    it('should expand boxes by custom padding', () => {
      const boxes = [
        { x: 100, y: 100, w: 50, h: 20, text: 'test' },
      ];

      const expanded = expandBoxes(boxes as any, 10);

      expect(expanded[0].x).toBe(90); // 100 - 10
      expect(expanded[0].y).toBe(90); // 100 - 10
      expect(expanded[0].w).toBe(70); // 50 + 20
      expect(expanded[0].h).toBe(40); // 20 + 20
    });

    it('should preserve other box properties', () => {
      const boxes = [
        { x: 100, y: 100, w: 50, h: 20, text: 'test', type: 'email', page: 1 },
      ];

      const expanded = expandBoxes(boxes as any, 5);

      expect(expanded[0].text).toBe('test');
      expect(expanded[0].type).toBe('email');
      expect(expanded[0].page).toBe(1);
    });

    it('should expand multiple boxes', () => {
      const boxes = [
        { x: 100, y: 100, w: 50, h: 20, text: 'box1' },
        { x: 200, y: 200, w: 60, h: 25, text: 'box2' },
      ];

      const expanded = expandBoxes(boxes as any, 5);

      expect(expanded).toHaveLength(2);
      expect(expanded[0].x).toBe(95);
      expect(expanded[1].x).toBe(195);
    });

    it('should handle empty array', () => {
      const expanded = expandBoxes([]);
      expect(expanded).toHaveLength(0);
    });

    it('should handle zero padding', () => {
      const boxes = [
        { x: 100, y: 100, w: 50, h: 20, text: 'test' },
      ];

      const expanded = expandBoxes(boxes as any, 0);

      expect(expanded[0].x).toBe(100);
      expect(expanded[0].y).toBe(100);
      expect(expanded[0].w).toBe(50);
      expect(expanded[0].h).toBe(20);
    });
  });
});
