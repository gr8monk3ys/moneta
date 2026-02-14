import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['dist/**', 'mobile/**'],
    setupFiles: ['tests/vitest.setup.ts'],
    testTimeout: 20000
  }
});
