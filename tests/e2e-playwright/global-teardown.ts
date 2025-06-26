import { chromium, FullConfig } from '@playwright/test';
import { SalesforceHelper } from './utils/salesforce-helper';
import { ScratchOrgHelper } from './utils/scratch-org-helper';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Apex Rollup E2E Test Suite Global Teardown...');
  
  // Check if we have credentials from global setup
  if (!process.env.E2E_SF_USERNAME || !process.env.E2E_SF_PASSWORD || !process.env.E2E_SF_LOGIN_URL) {
    console.log('⚠️  Skipping teardown - no credentials available');
    return;
  }
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  
  const page = await context.newPage();
  const sfHelper = new SalesforceHelper(page);
  
  try {
    console.log('🔐 Authenticating with Salesforce for cleanup...');
    
    await page.goto(process.env.E2E_SF_LOGIN_URL!);
    await sfHelper.login(process.env.E2E_SF_USERNAME!, process.env.E2E_SF_PASSWORD!);
    
    console.log('🧹 Performing final test data cleanup...');
    
    // Use scratch org helper for more efficient cleanup if available
    await ScratchOrgHelper.cleanupTestData();
    console.log('✅ Scratch org cleanup completed');
    
    console.log('📊 Generating test summary report...');
    await sfHelper.generateTestSummary();
    
  } catch (error) {
    console.error('⚠️  Teardown encountered an error (non-fatal):', error);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;