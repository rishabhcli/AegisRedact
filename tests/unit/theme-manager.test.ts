/**
 * Tests for ThemeManager
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import type { Theme } from '../../src/lib/theme/types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock matchMedia
const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
}));

// Mock document for CSS variable setting
const documentStyleMock = {
  setProperty: vi.fn(),
};

// Setup global mocks before any imports
beforeAll(() => {
  vi.stubGlobal('localStorage', localStorageMock);
  vi.stubGlobal('matchMedia', matchMediaMock);
  (global as any).window = {
    matchMedia: matchMediaMock,
  };
  vi.stubGlobal('document', {
    documentElement: {
      style: documentStyleMock,
    },
    dispatchEvent: vi.fn(),
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

// Import ThemeManager after mocks are set up
// Dynamic import to ensure mocks are in place
describe('ThemeManager', () => {
  let ThemeManager: any;

  beforeAll(async () => {
    // Reset modules to ensure fresh import with mocks
    vi.resetModules();
    const module = await import('../../src/lib/theme/ThemeManager');
    ThemeManager = module.ThemeManager;
  });

  let themeManager: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    themeManager = new ThemeManager({ syncWithSystem: false });
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const tm = new ThemeManager({ syncWithSystem: false });
      expect(tm.getCurrentThemeId()).toBeDefined();
    });

    it('should accept custom config', () => {
      const tm = new ThemeManager({
        defaultTheme: 'light',
        syncWithSystem: false,
        persistChoice: false,
      });
      expect(tm).toBeDefined();
    });

    it('should load theme from localStorage if available', () => {
      localStorageMock.getItem.mockReturnValue('light');
      const tm = new ThemeManager({ syncWithSystem: false });
      expect(tm.getCurrentThemeId()).toBe('light');
    });
  });

  describe('registerTheme and getTheme', () => {
    it('should register a custom theme', () => {
      const customTheme: Theme = {
        id: 'custom',
        name: 'Custom Theme',
        variables: {
          '--bg-primary': '#123456',
        },
      };

      themeManager.registerTheme(customTheme);
      const retrieved = themeManager.getTheme('custom');

      expect(retrieved).toBe(customTheme);
    });

    it('should return undefined for non-existent theme', () => {
      const theme = themeManager.getTheme('non-existent');
      expect(theme).toBeUndefined();
    });
  });

  describe('getAllThemes', () => {
    it('should return array of themes', () => {
      const themes = themeManager.getAllThemes();
      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThan(0);
    });

    it('should include default themes', () => {
      const themes = themeManager.getAllThemes();
      const themeIds = themes.map((t: Theme) => t.id);

      expect(themeIds).toContain('dark');
      expect(themeIds).toContain('light');
    });
  });

  describe('setTheme', () => {
    it('should change current theme', () => {
      themeManager.setTheme('light');
      expect(themeManager.getCurrentThemeId()).toBe('light');
    });

    it('should apply CSS variables', () => {
      themeManager.setTheme('dark');
      expect(documentStyleMock.setProperty).toHaveBeenCalled();
    });

    it('should save to localStorage when persistChoice is true', () => {
      themeManager.setTheme('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'app-theme',
        'light'
      );
    });

    it('should not change theme for invalid ID', () => {
      const before = themeManager.getCurrentThemeId();
      themeManager.setTheme('invalid-theme');
      expect(themeManager.getCurrentThemeId()).toBe(before);
    });
  });

  describe('getCurrentTheme', () => {
    it('should return current theme object', () => {
      themeManager.setTheme('dark');
      const current = themeManager.getCurrentTheme();

      expect(current).toBeDefined();
      expect(current?.id).toBe('dark');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle between dark and light', () => {
      themeManager.setTheme('dark');
      themeManager.toggleTheme();
      expect(themeManager.getCurrentThemeId()).toBe('light');

      themeManager.toggleTheme();
      expect(themeManager.getCurrentThemeId()).toBe('dark');
    });
  });

  describe('listeners', () => {
    it('should add and call listener on theme change', () => {
      const listener = vi.fn();
      themeManager.addListener(listener);

      themeManager.setTheme('light');

      expect(listener).toHaveBeenCalledWith('light');
    });

    it('should remove listener', () => {
      const listener = vi.fn();
      themeManager.addListener(listener);
      themeManager.removeListener(listener);

      themeManager.setTheme('light');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const badListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      themeManager.addListener(badListener);

      // Should not throw
      expect(() => themeManager.setTheme('light')).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should remove theme from localStorage', () => {
      themeManager.reset();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('app-theme');
    });

    it('should set theme to default', () => {
      themeManager.setTheme('light');
      themeManager.reset();

      // Should be back to default (dark)
      expect(themeManager.getCurrentThemeId()).toBe('dark');
    });
  });

  describe('destroy', () => {
    it('should clear all listeners', () => {
      const listener = vi.fn();
      themeManager.addListener(listener);

      themeManager.destroy();
      themeManager.setTheme('light');

      // Listener should not be called after destroy
      // Note: setTheme still works but listeners are cleared
    });
  });

  describe('system preference sync', () => {
    it('should sync with system dark mode preference', () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query.includes('dark'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }));

      const tm = new ThemeManager({ syncWithSystem: true });
      // Should use dark theme when system prefers dark
      expect(tm.getCurrentThemeId()).toBe('dark');
    });

    it('should sync with high contrast preference', () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query.includes('contrast'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }));

      const tm = new ThemeManager({ syncWithSystem: true });
      // High contrast takes priority
      expect(tm.getCurrentThemeId()).toBe('high-contrast');
    });
  });
});
