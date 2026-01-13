/**
 * Tests for Hybrid Detection (Regex + ML)
 */

import { describe, it, expect, vi } from 'vitest';
import {
  crossValidateWithRegex,
  identifyPIIRegions,
  smartMerge,
  boostMLNearRegex,
  combineConfidences,
} from '../../src/lib/detect/hybrid';
import type { MLEntity } from '../../src/lib/detect/ml';
import type { DetectionResult } from '../../src/lib/detect/merger';

describe('Hybrid Detection', () => {
  // Helper to create ML entities
  const createMLEntity = (
    text: string,
    entity: string,
    score: number,
    start: number,
    end: number
  ): MLEntity => ({
    text,
    entity,
    score,
    start,
    end,
  });

  // Helper to create detection results
  const createDetection = (
    text: string,
    type: string,
    confidence: number,
    source: 'regex' | 'ml',
    positions?: { start: number; end: number }
  ): DetectionResult => ({
    text,
    type,
    confidence,
    source,
    positions,
  });

  describe('crossValidateWithRegex', () => {
    it('should reclassify email entities', () => {
      const entities: MLEntity[] = [
        createMLEntity('test@example.com', 'MISC', 0.8, 0, 16),
      ];

      const validated = crossValidateWithRegex(entities, 'test@example.com');

      expect(validated[0].entity).toBe('EMAIL');
      expect(validated[0].score).toBe(1.0);
    });

    it('should reclassify phone entities', () => {
      const entities: MLEntity[] = [
        createMLEntity('+14155552671', 'MISC', 0.7, 0, 12),
      ];

      const validated = crossValidateWithRegex(entities, '+14155552671');

      expect(validated[0].entity).toBe('PHONE');
      expect(validated[0].score).toBe(1.0);
    });

    it('should reclassify SSN entities', () => {
      const entities: MLEntity[] = [
        createMLEntity('123-45-6789', 'MISC', 0.6, 0, 11),
      ];

      const validated = crossValidateWithRegex(entities, '123-45-6789');

      expect(validated[0].entity).toBe('SSN');
      expect(validated[0].score).toBe(1.0);
    });

    it('should keep entity as-is if no regex match', () => {
      const entities: MLEntity[] = [
        createMLEntity('John Doe', 'PERSON', 0.95, 0, 8),
      ];

      const validated = crossValidateWithRegex(entities, 'John Doe is here');

      expect(validated[0].entity).toBe('PERSON');
      expect(validated[0].score).toBe(0.95);
    });

    it('should handle multiple entities', () => {
      const entities: MLEntity[] = [
        createMLEntity('test@test.com', 'MISC', 0.8, 0, 13),
        createMLEntity('John Doe', 'PERSON', 0.9, 14, 22),
        createMLEntity('123-45-6789', 'NUMBER', 0.7, 23, 34),
      ];

      const validated = crossValidateWithRegex(
        entities,
        'test@test.com John Doe 123-45-6789'
      );

      expect(validated[0].entity).toBe('EMAIL');
      expect(validated[1].entity).toBe('PERSON'); // No regex match
      expect(validated[2].entity).toBe('SSN');
    });
  });

  describe('identifyPIIRegions', () => {
    it('should return full text if no regex results', () => {
      const text = 'This is some text without any PII';
      const regexResults: DetectionResult[] = [];

      const regions = identifyPIIRegions(text, regexResults);

      expect(regions).toHaveLength(1);
      expect(regions[0].text).toBe(text);
      expect(regions[0].start).toBe(0);
      expect(regions[0].end).toBe(text.length);
    });

    it('should identify regions around regex hits', () => {
      const text = 'Start ' + 'x'.repeat(200) + ' test@example.com ' + 'y'.repeat(200) + ' End';
      const regexResults: DetectionResult[] = [
        createDetection('test@example.com', 'email', 1.0, 'regex', { start: 206, end: 222 }),
      ];

      const regions = identifyPIIRegions(text, regexResults);

      expect(regions).toHaveLength(1);
      // Region should be around the email with CONTEXT_RADIUS (150) padding
      expect(regions[0].start).toBeLessThan(206);
      expect(regions[0].end).toBeGreaterThan(222);
    });

    it('should merge overlapping regions', () => {
      const text = 'Email1: test@a.com and Email2: test@b.com close together';
      const regexResults: DetectionResult[] = [
        createDetection('test@a.com', 'email', 1.0, 'regex', { start: 8, end: 18 }),
        createDetection('test@b.com', 'email', 1.0, 'regex', { start: 31, end: 41 }),
      ];

      const regions = identifyPIIRegions(text, regexResults);

      // Should be merged into one region since they're close
      expect(regions).toHaveLength(1);
    });

    it('should find position when not explicitly provided', () => {
      const text = 'Contact: test@example.com for help';
      const regexResults: DetectionResult[] = [
        createDetection('test@example.com', 'email', 1.0, 'regex'),
      ];

      const regions = identifyPIIRegions(text, regexResults);

      expect(regions).toHaveLength(1);
    });
  });

  describe('smartMerge', () => {
    it('should keep all regex results', () => {
      const regexResults: DetectionResult[] = [
        createDetection('test@test.com', 'email', 1.0, 'regex'),
        createDetection('123-45-6789', 'ssn', 1.0, 'regex'),
      ];
      const mlResults: DetectionResult[] = [];

      const merged = smartMerge(regexResults, mlResults);

      expect(merged).toHaveLength(2);
    });

    it('should add non-overlapping ML results', () => {
      const regexResults: DetectionResult[] = [
        createDetection('test@test.com', 'email', 1.0, 'regex'),
      ];
      const mlResults: DetectionResult[] = [
        createDetection('John Doe', 'person', 0.9, 'ml'),
      ];

      const merged = smartMerge(regexResults, mlResults);

      expect(merged).toHaveLength(2);
    });

    it('should skip ML results that overlap with regex', () => {
      const regexResults: DetectionResult[] = [
        createDetection('test@test.com', 'email', 1.0, 'regex'),
      ];
      const mlResults: DetectionResult[] = [
        createDetection('test@test.com', 'misc', 0.8, 'ml'), // Same text, lower confidence
      ];

      const merged = smartMerge(regexResults, mlResults);

      expect(merged).toHaveLength(1);
      expect(merged[0].source).toBe('regex');
    });

    it('should prefer higher confidence ML when both are ML', () => {
      const regexResults: DetectionResult[] = [];
      const mlResults: DetectionResult[] = [
        createDetection('John', 'person', 0.8, 'ml'),
        createDetection('John', 'name', 0.95, 'ml'), // Higher confidence
      ];

      const merged = smartMerge(regexResults, mlResults);

      expect(merged).toHaveLength(1);
      expect(merged[0].confidence).toBe(0.95);
    });

    it('should handle partial text overlap', () => {
      const regexResults: DetectionResult[] = [
        createDetection('John Doe', 'person', 1.0, 'regex'),
      ];
      const mlResults: DetectionResult[] = [
        createDetection('John', 'name', 0.9, 'ml'), // Part of John Doe
      ];

      const merged = smartMerge(regexResults, mlResults);

      // John is inside "John Doe", so should be skipped
      expect(merged).toHaveLength(1);
      expect(merged[0].text).toBe('John Doe');
    });
  });

  describe('boostMLNearRegex', () => {
    it('should boost ML confidence near regex patterns', () => {
      const mlResults: DetectionResult[] = [
        createDetection('John Doe', 'person', 0.8, 'ml', { start: 0, end: 8 }),
      ];
      const regexResults: DetectionResult[] = [
        createDetection('test@test.com', 'email', 1.0, 'regex', { start: 10, end: 23 }),
      ];

      const boosted = boostMLNearRegex(mlResults, regexResults, 50);

      expect(boosted[0].confidence).toBeGreaterThan(0.8);
    });

    it('should not boost ML far from regex', () => {
      const mlResults: DetectionResult[] = [
        createDetection('John Doe', 'person', 0.8, 'ml', { start: 0, end: 8 }),
      ];
      const regexResults: DetectionResult[] = [
        createDetection('test@test.com', 'email', 1.0, 'regex', { start: 200, end: 213 }),
      ];

      const boosted = boostMLNearRegex(mlResults, regexResults, 50);

      expect(boosted[0].confidence).toBe(0.8);
    });

    it('should cap boosted confidence at 1.0', () => {
      const mlResults: DetectionResult[] = [
        createDetection('John Doe', 'person', 0.95, 'ml', { start: 0, end: 8 }),
      ];
      const regexResults: DetectionResult[] = [
        createDetection('test@test.com', 'email', 1.0, 'regex', { start: 10, end: 23 }),
      ];

      const boosted = boostMLNearRegex(mlResults, regexResults, 50);

      expect(boosted[0].confidence).toBeLessThanOrEqual(1.0);
    });

    it('should handle ML without positions', () => {
      const mlResults: DetectionResult[] = [
        createDetection('John Doe', 'person', 0.8, 'ml'), // No positions
      ];
      const regexResults: DetectionResult[] = [
        createDetection('test@test.com', 'email', 1.0, 'regex', { start: 0, end: 13 }),
      ];

      const boosted = boostMLNearRegex(mlResults, regexResults, 50);

      expect(boosted[0].confidence).toBe(0.8); // Not boosted
    });
  });

  describe('combineConfidences', () => {
    it('should combine independent probabilities', () => {
      // P(combined) = 1 - (1 - P1) * (1 - P2)
      const combined = combineConfidences(0.8, 0.8);

      // 1 - (0.2 * 0.2) = 1 - 0.04 = 0.96
      expect(combined).toBeCloseTo(0.96);
    });

    it('should return 1.0 when either is 1.0', () => {
      expect(combineConfidences(1.0, 0.5)).toBe(1.0);
      expect(combineConfidences(0.5, 1.0)).toBe(1.0);
    });

    it('should return 0 when both are 0', () => {
      expect(combineConfidences(0, 0)).toBe(0);
    });

    it('should handle typical confidence values', () => {
      // Regex (1.0) + ML (0.9)
      expect(combineConfidences(1.0, 0.9)).toBe(1.0);

      // ML (0.7) + ML (0.8)
      const combined = combineConfidences(0.7, 0.8);
      // 1 - (0.3 * 0.2) = 0.94
      expect(combined).toBeCloseTo(0.94);
    });
  });

  describe('integration scenarios', () => {
    it('should handle mixed regex and ML results', () => {
      const regexResults: DetectionResult[] = [
        createDetection('test@example.com', 'email', 1.0, 'regex', { start: 0, end: 16 }),
        createDetection('123-45-6789', 'ssn', 1.0, 'regex', { start: 20, end: 31 }),
      ];
      const mlResults: DetectionResult[] = [
        createDetection('John Doe', 'person', 0.9, 'ml', { start: 35, end: 43 }),
        createDetection('Acme Corp', 'organization', 0.85, 'ml', { start: 50, end: 59 }),
      ];

      const merged = smartMerge(regexResults, mlResults);

      expect(merged).toHaveLength(4);
      expect(merged.filter(r => r.source === 'regex')).toHaveLength(2);
      expect(merged.filter(r => r.source === 'ml')).toHaveLength(2);
    });

    it('should handle empty inputs', () => {
      expect(smartMerge([], [])).toHaveLength(0);
      expect(crossValidateWithRegex([], '')).toHaveLength(0);
      expect(identifyPIIRegions('some text', [])).toHaveLength(1);
      expect(boostMLNearRegex([], [])).toHaveLength(0);
    });
  });
});
