import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Comprehensive test configuration for full E2E testing suite
 * This runs all test categories with extended timeouts and enhanced reporting
 */
export default defineConfig({
  ...baseConfig,
  
  /* Extended timeout for comprehensive testing */
  timeout: 300000, // 5 minutes per test
  
  /* More retries for comprehensive testing */
  retries: 3,
  
  /* Run tests sequentially for comprehensive testing to avoid resource conflicts */
  fullyParallel: false,
  workers: 1,
  
  /* Enhanced reporter configuration */
  reporter: [
    ['html', { 
      outputFolder: 'test-results/reports/comprehensive', 
      open: 'never',
      attachmentsBaseURL: '../screenshots/'
    }],
    ['junit', { outputFile: 'test-results/comprehensive-junit-results.xml' }],
    ['json', { outputFile: 'test-results/comprehensive-results.json' }],
    ['list'],
    ['github'] // For CI/CD integration
  ],
  
  use: {
    ...baseConfig.use,
    
    /* Always capture trace for comprehensive testing */
    trace: 'on',
    
    /* Always take screenshots */
    screenshot: 'on',
    
    /* Always record video */
    video: 'on',
    
    /* Extended timeouts for comprehensive operations */
    actionTimeout: 60000, // 1 minute
    navigationTimeout: 120000, // 2 minutes
  },
  
  /* Test categories to include in comprehensive testing */
  testMatch: [
    '**/core-operations/**/*.test.ts',
    '**/cmdt-integration/**/*.test.ts', 
    '**/advanced-features/**/*.test.ts',
    '**/multi-object/**/*.test.ts',
    '**/integration-workflows/**/*.test.ts',
    '**/ui-ux/**/*.test.ts',
    '**/error-handling/**/*.test.ts',
    '**/plugin-architecture/**/*.test.ts'
  ],
  
  /* Output directory for comprehensive test artifacts */
  outputDir: 'test-results/screenshots/comprehensive'
});