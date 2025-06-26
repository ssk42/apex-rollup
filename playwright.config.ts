import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e-playwright',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'test-results/reports', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
    ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.SF_LOGIN_URL || 'https://login.salesforce.com',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on retry */
    video: 'retain-on-failure',
    
    /* Global timeout for each test */
    actionTimeout: 60000,
    
    /* Navigation timeout */
    navigationTimeout: 120000,
    
    /* Force headed mode for debugging */
    headless: false,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
        // Salesforce Lightning Experience optimizations
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-gpu',
            '--remote-debugging-port=9222'
          ]
        }
      },
    },

    // Uncomment for cross-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    //
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports for responsive testing */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Configure global test settings */
  timeout: 300000, // 5 minutes per test
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/screenshots',

  /* Configure test environments */
  globalSetup: require.resolve('./tests/e2e-playwright/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e-playwright/global-teardown.ts'),
  
  /* Configure test metadata */
  metadata: {
    testType: 'e2e',
    framework: 'playwright',
    salesforceIntegration: true,
    rollupTesting: true
  }
});