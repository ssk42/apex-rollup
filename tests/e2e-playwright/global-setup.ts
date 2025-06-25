import { chromium, FullConfig } from '@playwright/test';
import { SalesforceHelper } from './utils/salesforce-helper';
import { ScratchOrgHelper } from './utils/scratch-org-helper';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Apex Rollup E2E Test Suite Global Setup...');
  
  let credentials;
  
  // Try to use scratch org first, fall back to manual credentials
  try {
    // Ensure scratch org exists and is ready
    await ScratchOrgHelper.ensureScratchOrg();
    await ScratchOrgHelper.validateOrgForTesting();
    
    // Get scratch org credentials
    credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    console.log('✅ Using scratch org for E2E testing');
    
  } catch (scratchOrgError) {
    console.warn('⚠️  Scratch org not available:', scratchOrgError.message);
    console.log('🔄 Falling back to manual credentials...');
    
    // Validate required environment variables for manual setup
    const requiredEnvVars = ['SF_USERNAME', 'SF_PASSWORD', 'SF_LOGIN_URL'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      throw new Error(`Neither scratch org nor manual credentials available. Missing: ${missingEnvVars.join(', ')}`);
    }
    
    credentials = {
      username: process.env.SF_USERNAME!,
      password: process.env.SF_PASSWORD!,
      loginUrl: process.env.SF_LOGIN_URL!
    };
    
    console.log('✅ Using manual credentials for E2E testing');
  }
  
  // Store credentials globally for tests to use
  process.env.E2E_SF_USERNAME = credentials.username;
  process.env.E2E_SF_PASSWORD = credentials.password;
  process.env.E2E_SF_LOGIN_URL = credentials.loginUrl;
  
  // Launch browser for setup operations
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
    console.log('🔐 Authenticating with Salesforce...');
    
    // Login to Salesforce to validate credentials
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    console.log('✅ Salesforce authentication successful');
    
    // Skip Rollup app verification for now - will be tested in individual tests
    console.log('🔍 Skipping Rollup app verification in global setup');
    console.log('✅ Global setup authentication completed');
    
    // Cleanup any existing test data from previous runs
    console.log('🧹 Cleaning up existing test data...');
    await sfHelper.cleanupTestData();
    console.log('✅ Test data cleanup completed');
    
    // Verify test objects and fields are available
    console.log('🔍 Verifying test objects and fields...');
    await sfHelper.verifyTestEnvironment();
    console.log('✅ Test environment verified');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed successfully');
}

export default globalSetup;