import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['dist/**', 'mobile/**', 'tests/**/*.e2e.ts'],
    setupFiles: ['tests/vitest.setup.ts'],
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        lines: 85,
        statements: 85,
        functions: 85,
        branches: 75
      }
    }
  }
});
