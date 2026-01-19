import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Momenta AI
 *
 * Tests interact with the real AI, so they:
 * - Have longer timeouts (60s per test)
 * - Run sequentially to avoid rate limits
 * - Generate HTML reports for analysis
 */
export default defineConfig({
  testDir: './e2e/tests',

  /* Longer timeout for AI responses */
  timeout: 60000,
  expect: {
    timeout: 30000,
  },

  /* Run tests sequentially (AI calls are expensive) */
  fullyParallel: false,
  workers: 1,

  /* No retries - we want to see real failures */
  retries: 0,

  /* HTML Reporter for viewing results */
  reporter: [
    ['html', { outputFolder: 'e2e/report', open: 'never' }],
    ['list'], // Also show in console
  ],

  /* Shared settings */
  use: {
    baseURL: 'http://localhost:3000',

    /* Capture screenshots on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Capture trace for debugging */
    trace: 'retain-on-failure',
  },

  /* Only Chromium for now */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start dev server before tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
