import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npx next start -p 3000',
      port: 3000,
      timeout: 30000,
      reuseExistingServer: true,
      cwd: './',
    },
  ],
});
