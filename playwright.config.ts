import { defineConfig } from '@playwright/test';

const port = 3320;

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: 'npm run dev',
    url: `http://127.0.0.1:${port}/health`,
    env: { NODE_ENV: 'development', PORT: String(port) },
    reuseExistingServer: false
  }
});
