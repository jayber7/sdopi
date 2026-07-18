import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on',
    screenshot: 'on',
    video: {
      mode: 'on',
      size: { width: 1280, height: 720 },
    },
  },
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/tutorial-steps.json' }],
  ],
  webServer: [
    {
      command: 'npx next dev -p 3000',
      port: 3000,
      timeout: 30000,
      reuseExistingServer: true,
      cwd: './',
    },
  ],
});
