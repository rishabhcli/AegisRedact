import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration following best practices from Context7 docs
 * @see https://vitest.dev/config/
 */
export default defineConfig({
  test: {
    // Use global APIs (describe, it, expect) without imports
    globals: true,

    // DOM environment for component testing
    environment: 'jsdom',

    // Test file patterns
    include: ['tests/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.tsx'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'tests/e2e.spec.ts' // Playwright tests run separately
    ],

    // Mock configuration for isolated tests
    clearMocks: true,
    restoreMocks: true,

    // Test timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        'src/main.ts' // Entry point
      ],
      // Coverage thresholds (recommended minimums)
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60
      }
    },

    // Sequence configuration
    sequence: {
      shuffle: false,
      concurrent: false
    }
  }
});
