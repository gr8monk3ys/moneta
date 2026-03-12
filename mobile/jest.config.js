module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testTimeout: 15000,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', 'App.tsx'],
  coverageThreshold: {
    global: {
      lines: 80,
      statements: 80,
      functions: 82,
      branches: 70
    }
  }
};
