import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e-playwright',
  testMatch: ['**/simple-*.test.ts', '**/fixed-*.test.ts', '**/data-*.test.ts'],
  
  /* Run tests in files in parallel */
  fullyParallel: false,
  workers: 1,
  
  /* Reporter to use */
  reporter: [['list'], ['html', { open: 'never' }]],
  
  /* Shared settings */
  use: {
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on retry */
    video: 'retain-on-failure',
    
    /* Global timeout for each test */
    actionTimeout: 10000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ]
        }
      },
    }
  ],

  /* Configure test timeout */
  timeout: 60000, // 1 minute per test
  
  /* Output directory for test artifacts */
  outputDir: 'test-results/screenshots'
});