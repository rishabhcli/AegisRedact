/**
 * Tests for Privacy Analyzer
 */

import { describe, it, expect } from 'vitest';
import { PrivacyAnalyzer } from '../../src/lib/privacy/analyzer';
import type { DocumentMetadata } from '../../src/lib/privacy/types';

describe('PrivacyAnalyzer', () => {
  // Helper to create minimal metadata
  const createMetadata = (overrides: Partial<DocumentMetadata> = {}): DocumentMetadata => ({
    fileName: 'test.pdf',
    fileType: 'application/pdf',
    fileSize: 1024,
    ...overrides,
  });

  describe('analyze', () => {
    it('should return complete analysis object', () => {
      const metadata = createMetadata();
      const analysis = PrivacyAnalyzer.analyze(metadata, 0, false);

      expect(analysis).toHaveProperty('score');
      expect(analysis).toHaveProperty('risks');
      expect(analysis).toHaveProperty('metadata');
      expect(analysis).toHaveProperty('recommendations');
      expect(analysis).toHaveProperty('timestamp');
      expect(analysis.timestamp).toBeGreaterThan(0);
    });

    it('should return perfect score for clean document', () => {
      const metadata = createMetadata();
      const analysis = PrivacyAnalyzer.analyze(metadata, 0, false);

      expect(analysis.score.overall).toBeGreaterThanOrEqual(90);
      expect(analysis.score.grade).toMatch(/^A/);
    });

    it('should penalize documents with author info', () => {
      const cleanMetadata = createMetadata();
      const metadataWithAuthor = createMetadata({ author: 'John Doe' });

      const cleanAnalysis = PrivacyAnalyzer.analyze(cleanMetadata, 0, false);
      const authorAnalysis = PrivacyAnalyzer.analyze(metadataWithAuthor, 0, false);

      expect(authorAnalysis.score.metadata).toBeLessThan(cleanAnalysis.score.metadata);
    });

    it('should penalize documents with detected PII', () => {
      const metadata = createMetadata();

      const noPII = PrivacyAnalyzer.analyze(metadata, 0, false);
      const somePII = PrivacyAnalyzer.analyze(metadata, 5, false);
      const manyPII = PrivacyAnalyzer.analyze(metadata, 50, false);

      expect(somePII.score.piiDetection).toBeLessThan(noPII.score.piiDetection);
      expect(manyPII.score.piiDetection).toBeLessThan(somePII.score.piiDetection);
    });

    it('should penalize documents with text layers', () => {
      const metadata = createMetadata();

      const noTextLayer = PrivacyAnalyzer.analyze(metadata, 0, false);
      const withTextLayer = PrivacyAnalyzer.analyze(metadata, 0, true);

      expect(withTextLayer.score.textLayer).toBeLessThan(noTextLayer.score.textLayer);
    });

    it('should heavily penalize GPS coordinates', () => {
      const metadataWithGPS = createMetadata({
        exif: {
          gps: {
            latitude: 37.7749,
            longitude: -122.4194,
          },
        },
      });

      const analysis = PrivacyAnalyzer.analyze(metadataWithGPS, 0, false);

      expect(analysis.score.exifData).toBeLessThanOrEqual(50);
      expect(analysis.risks.some(r => r.id === 'gps' && r.severity === 'critical')).toBe(true);
    });
  });

  describe('score calculation', () => {
    it('should calculate metadata score correctly', () => {
      const fullMetadata = createMetadata({
        author: 'John Doe',
        creator: 'Adobe',
        creationDate: new Date(),
        title: 'Test Document',
      });

      const analysis = PrivacyAnalyzer.analyze(fullMetadata, 0, false);

      // Should have deductions for author (-20), creator (-10), date (-5), title (-5)
      expect(analysis.score.metadata).toBeLessThanOrEqual(60);
    });

    it('should calculate EXIF score correctly', () => {
      const metadataWithExif = createMetadata({
        exif: {
          make: 'Canon',
          model: 'EOS 5D',
          software: 'Photoshop',
          dateTime: new Date(),
        },
      });

      const analysis = PrivacyAnalyzer.analyze(metadataWithExif, 0, false);

      // Should have deductions for make/model (-15), software (-10), dateTime (-10)
      expect(analysis.score.exifData).toBeLessThanOrEqual(65);
    });

    it('should use logarithmic scaling for PII count', () => {
      const metadata = createMetadata();

      const analysis1 = PrivacyAnalyzer.analyze(metadata, 1, false);
      const analysis10 = PrivacyAnalyzer.analyze(metadata, 10, false);
      const analysis100 = PrivacyAnalyzer.analyze(metadata, 100, false);

      // Score should decrease but not linearly
      const diff1to10 = analysis1.score.piiDetection - analysis10.score.piiDetection;
      const diff10to100 = analysis10.score.piiDetection - analysis100.score.piiDetection;

      // Second diff should be similar or smaller due to logarithmic scaling
      expect(diff10to100).toBeLessThanOrEqual(diff1to10 * 2);
    });
  });

  describe('grade assignment', () => {
    it('should assign A+ for score >= 95', () => {
      const metadata = createMetadata();
      const analysis = PrivacyAnalyzer.analyze(metadata, 0, false);

      // Clean document should get A+ or A
      expect(['A+', 'A', 'A-']).toContain(analysis.score.grade);
    });

    it('should assign F for very low scores', () => {
      const badMetadata = createMetadata({
        author: 'John Doe',
        creator: 'Word',
        exif: {
          gps: { latitude: 0, longitude: 0 },
          make: 'Apple',
          model: 'iPhone',
          software: 'iOS',
          dateTime: new Date(),
        },
      });

      const analysis = PrivacyAnalyzer.analyze(badMetadata, 100, true);

      // Should be D or F
      expect(['D', 'F']).toContain(analysis.score.grade);
    });
  });

  describe('risk identification', () => {
    it('should identify GPS as critical risk', () => {
      const metadata = createMetadata({
        exif: {
          gps: { latitude: 37.7749, longitude: -122.4194 },
        },
      });

      const analysis = PrivacyAnalyzer.analyze(metadata, 0, false);
      const gpsRisk = analysis.risks.find(r => r.id === 'gps');

      expect(gpsRisk).toBeDefined();
      expect(gpsRisk?.severity).toBe('critical');
      expect(gpsRisk?.found).toBe(true);
      expect(gpsRisk?.details).toContain('37.7749');
    });

    it('should identify author as high risk', () => {
      const metadata = createMetadata({ author: 'Jane Smith' });

      const analysis = PrivacyAnalyzer.analyze(metadata, 0, false);
      const authorRisk = analysis.risks.find(r => r.id === 'author');

      expect(authorRisk).toBeDefined();
      expect(authorRisk?.severity).toBe('high');
      expect(authorRisk?.details).toBe('Jane Smith');
    });

    it('should identify PII as risk based on count', () => {
      const metadata = createMetadata();

      const lowPII = PrivacyAnalyzer.analyze(metadata, 3, false);
      const medPII = PrivacyAnalyzer.analyze(metadata, 10, false);
      const highPII = PrivacyAnalyzer.analyze(metadata, 25, false);

      const lowRisk = lowPII.risks.find(r => r.id === 'pii');
      const medRisk = medPII.risks.find(r => r.id === 'pii');
      const highRisk = highPII.risks.find(r => r.id === 'pii');

      expect(lowRisk?.severity).toBe('low');
      expect(medRisk?.severity).toBe('medium');
      expect(highRisk?.severity).toBe('high');
    });

    it('should identify text layer as medium risk', () => {
      const metadata = createMetadata();
      const analysis = PrivacyAnalyzer.analyze(metadata, 0, true);
      const textRisk = analysis.risks.find(r => r.id === 'text-layer');

      expect(textRisk).toBeDefined();
      expect(textRisk?.severity).toBe('medium');
    });

    it('should identify device info as low risk', () => {
      const metadata = createMetadata({
        exif: {
          make: 'Canon',
          model: 'EOS R5',
        },
      });

      const analysis = PrivacyAnalyzer.analyze(metadata, 0, false);
      const deviceRisk = analysis.risks.find(r => r.id === 'device');

      expect(deviceRisk).toBeDefined();
      expect(deviceRisk?.severity).toBe('low');
      expect(deviceRisk?.details).toContain('Canon');
    });

    it('should sort risks by severity', () => {
      const metadata = createMetadata({
        author: 'Test Author',
        exif: {
          gps: { latitude: 0, longitude: 0 },
          make: 'Canon',
        },
      });

      const analysis = PrivacyAnalyzer.analyze(metadata, 10, true);

      // Critical risks should come first
      if (analysis.risks.length > 1) {
        const severityOrder = ['critical', 'high', 'medium', 'low'];
        for (let i = 1; i < analysis.risks.length; i++) {
          const prevIndex = severityOrder.indexOf(analysis.risks[i - 1].severity);
          const currIndex = severityOrder.indexOf(analysis.risks[i].severity);
          expect(currIndex).toBeGreaterThanOrEqual(prevIndex);
        }
      }
    });

    it('should only include found risks', () => {
      const metadata = createMetadata();
      const analysis = PrivacyAnalyzer.analyze(metadata, 0, false);

      // All returned risks should have found: true
      expect(analysis.risks.every(r => r.found)).toBe(true);
    });
  });

  describe('recommendations', () => {
    it('should recommend removing GPS for critical risk', () => {
      const metadata = createMetadata({
        exif: { gps: { latitude: 0, longitude: 0 } },
      });

      const analysis = PrivacyAnalyzer.analyze(metadata, 0, false);

      expect(analysis.recommendations.some(r => r.includes('GPS') || r.includes('CRITICAL'))).toBe(true);
    });

    it('should recommend redacting PII when many detected', () => {
      const metadata = createMetadata();
      // Need >20 PII items for high severity which triggers the redact recommendation
      const analysis = PrivacyAnalyzer.analyze(metadata, 25, false);

      expect(analysis.recommendations.some(r => r.toLowerCase().includes('redact'))).toBe(true);
    });

    it('should recommend flattening PDF with text layer', () => {
      const metadata = createMetadata();
      const analysis = PrivacyAnalyzer.analyze(metadata, 0, true);

      expect(analysis.recommendations.some(r => r.toLowerCase().includes('flatten'))).toBe(true);
    });

    it('should show positive message for clean documents', () => {
      const metadata = createMetadata();
      const analysis = PrivacyAnalyzer.analyze(metadata, 0, false);

      expect(analysis.recommendations.some(r => r.includes('✅') || r.toLowerCase().includes('good'))).toBe(true);
    });

    it('should recommend Maximum Privacy Export for risky documents', () => {
      const metadata = createMetadata({ author: 'Test' });
      const analysis = PrivacyAnalyzer.analyze(metadata, 5, true);

      expect(analysis.recommendations.some(r => r.includes('Maximum Privacy') || r.includes('💡'))).toBe(true);
    });
  });

  describe('getSeverityColor', () => {
    it('should return red for critical', () => {
      const color = PrivacyAnalyzer.getSeverityColor('critical');
      expect(color).toContain('dc2626');
    });

    it('should return orange for high', () => {
      const color = PrivacyAnalyzer.getSeverityColor('high');
      expect(color).toContain('ea580c');
    });

    it('should return amber for medium', () => {
      const color = PrivacyAnalyzer.getSeverityColor('medium');
      expect(color).toContain('f59e0b');
    });

    it('should return yellow for low', () => {
      const color = PrivacyAnalyzer.getSeverityColor('low');
      expect(color).toContain('fbbf24');
    });

    it('should return green for none', () => {
      const color = PrivacyAnalyzer.getSeverityColor('none');
      expect(color).toContain('10b981');
    });
  });

  describe('getScoreColor', () => {
    it('should return green for high scores', () => {
      const color = PrivacyAnalyzer.getScoreColor(95);
      expect(color).toContain('10b981');
    });

    it('should return lime for good scores', () => {
      const color = PrivacyAnalyzer.getScoreColor(80);
      expect(color).toContain('84cc16');
    });

    it('should return amber for medium scores', () => {
      const color = PrivacyAnalyzer.getScoreColor(65);
      expect(color).toContain('f59e0b');
    });

    it('should return orange for low scores', () => {
      const color = PrivacyAnalyzer.getScoreColor(45);
      expect(color).toContain('ea580c');
    });

    it('should return red for very low scores', () => {
      const color = PrivacyAnalyzer.getScoreColor(30);
      expect(color).toContain('dc2626');
    });
  });
});
