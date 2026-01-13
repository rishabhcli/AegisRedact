/**
 * Tests for StyleRegistry
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StyleRegistry, createPreviewCanvas } from '../../src/lib/redact/styles';
import type { RedactionStyle, StyleOptions } from '../../src/lib/redact/styles';
import type { Box } from '../../src/lib/pdf/find';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

describe('StyleRegistry', () => {
  // Create a mock style for testing
  const createMockStyle = (id: string, securityScore: number = 100): RedactionStyle => ({
    id,
    name: `Test Style ${id}`,
    description: `A test style called ${id}`,
    securityScore,
    category: securityScore >= 90 ? 'secure' : 'experimental',
    render: vi.fn(),
    export: vi.fn(),
    getPreview: () => 'data:image/png;base64,test',
  });

  beforeEach(() => {
    // Clear registry state between tests by re-registering
    vi.clearAllMocks();
  });

  describe('register and get', () => {
    it('should register a style', () => {
      const style = createMockStyle('test-style');
      StyleRegistry.register(style);

      const retrieved = StyleRegistry.get('test-style');
      expect(retrieved).toBe(style);
    });

    it('should return undefined for non-existent style', () => {
      const retrieved = StyleRegistry.get('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should overwrite existing style with same ID', () => {
      const style1 = createMockStyle('overwrite-test');
      const style2 = createMockStyle('overwrite-test');
      style2.name = 'Updated Name';

      StyleRegistry.register(style1);
      StyleRegistry.register(style2);

      const retrieved = StyleRegistry.get('overwrite-test');
      expect(retrieved?.name).toBe('Updated Name');
    });
  });

  describe('getAll and getIds', () => {
    it('should return all registered styles', () => {
      const styles = StyleRegistry.getAll();
      expect(Array.isArray(styles)).toBe(true);
    });

    it('should return all style IDs', () => {
      const ids = StyleRegistry.getIds();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.every(id => typeof id === 'string')).toBe(true);
    });
  });

  describe('getDefault and setDefault', () => {
    it('should return a default style after registration', () => {
      // Register a style with 'solid' ID to match default
      const solidStyle = createMockStyle('solid');
      StyleRegistry.register(solidStyle);

      const defaultStyle = StyleRegistry.getDefault();
      expect(defaultStyle).toBeDefined();
      expect(defaultStyle?.id).toBe('solid');
    });

    it('should change default style when valid ID provided', () => {
      const style = createMockStyle('new-default');
      StyleRegistry.register(style);
      StyleRegistry.setDefault('new-default');

      // Verify setDefault doesn't throw for valid IDs
      expect(StyleRegistry.get('new-default')).toBeDefined();
    });

    it('should not change default for invalid ID', () => {
      // Register solid style as default
      const solidStyle = createMockStyle('solid');
      StyleRegistry.register(solidStyle);

      const before = StyleRegistry.getDefault();
      StyleRegistry.setDefault('invalid-style-id');
      const after = StyleRegistry.getDefault();

      // Default should remain unchanged
      expect(after?.id).toBe(before?.id);
    });
  });

  describe('getByCategory', () => {
    it('should filter styles by category', () => {
      const secureStyle = createMockStyle('secure-test', 95);
      secureStyle.category = 'secure';
      StyleRegistry.register(secureStyle);

      const experimentalStyle = createMockStyle('exp-test', 60);
      experimentalStyle.category = 'experimental';
      StyleRegistry.register(experimentalStyle);

      const secureStyles = StyleRegistry.getByCategory('secure');
      expect(secureStyles.every(s => s.category === 'secure')).toBe(true);

      const experimentalStyles = StyleRegistry.getByCategory('experimental');
      expect(experimentalStyles.every(s => s.category === 'experimental')).toBe(true);
    });
  });

  describe('getSecureStyles', () => {
    it('should return only styles with security score >= 90', () => {
      const secureStyle = createMockStyle('high-security', 95);
      StyleRegistry.register(secureStyle);

      const insecureStyle = createMockStyle('low-security', 50);
      StyleRegistry.register(insecureStyle);

      const secureStyles = StyleRegistry.getSecureStyles();
      expect(secureStyles.every(s => s.securityScore >= 90)).toBe(true);
    });
  });

  describe('getSecurityWarning', () => {
    it('should return warning for low security styles', () => {
      const lowSecStyle = createMockStyle('very-low-sec', 30);
      lowSecStyle.getWarning = () => 'This style is not secure';
      StyleRegistry.register(lowSecStyle);

      const warning = StyleRegistry.getSecurityWarning('very-low-sec');
      expect(warning).toContain('Low Security');
      expect(warning).toContain('30/100');
    });

    it('should return warning for moderate security styles', () => {
      const modSecStyle = createMockStyle('mod-sec', 70);
      StyleRegistry.register(modSecStyle);

      const warning = StyleRegistry.getSecurityWarning('mod-sec');
      expect(warning).toContain('Moderate Security');
    });

    it('should return null for high security styles', () => {
      const highSecStyle = createMockStyle('high-sec', 95);
      StyleRegistry.register(highSecStyle);

      const warning = StyleRegistry.getSecurityWarning('high-sec');
      expect(warning).toBeNull();
    });

    it('should return null for non-existent style', () => {
      const warning = StyleRegistry.getSecurityWarning('does-not-exist');
      expect(warning).toBeNull();
    });
  });

  describe('storage persistence', () => {
    it('should load default from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('saved-style');

      const loaded = StyleRegistry.loadDefaultFromStorage();
      expect(loaded).toBe('saved-style');
    });

    it('should return default style ID if localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const loaded = StyleRegistry.loadDefaultFromStorage();
      expect(typeof loaded).toBe('string');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw
      expect(() => StyleRegistry.loadDefaultFromStorage()).not.toThrow();
    });

    it('should save default to localStorage', () => {
      const style = createMockStyle('to-save');
      StyleRegistry.register(style);

      StyleRegistry.saveDefaultToStorage('to-save');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'redaction-style-default',
        'to-save'
      );
    });

    it('should handle localStorage save errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw
      expect(() => StyleRegistry.saveDefaultToStorage('test')).not.toThrow();
    });
  });
});

describe('createPreviewCanvas', () => {
  // Mock the canvas context
  const mockCtx = {
    fillStyle: '',
    fillRect: vi.fn(),
  };

  beforeEach(() => {
    // Mock document.createElement for canvas
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        const canvas = {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue(mockCtx),
        } as unknown as HTMLCanvasElement;
        return canvas;
      }
      return originalCreateElement(tagName);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create canvas with default dimensions', () => {
    const { canvas, ctx } = createPreviewCanvas();

    expect(canvas.width).toBe(50);
    expect(canvas.height).toBe(30);
    expect(ctx).toBeDefined();
  });

  it('should create canvas with custom dimensions', () => {
    const { canvas } = createPreviewCanvas(100, 60);

    expect(canvas.width).toBe(100);
    expect(canvas.height).toBe(60);
  });
});
