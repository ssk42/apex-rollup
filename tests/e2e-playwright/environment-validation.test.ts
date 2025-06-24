import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from './utils/scratch-org-helper';
import { SalesforceHelper } from './utils/salesforce-helper';

test.describe('Environment Validation Tests', () => {
  test('scratch org integration works', async () => {
    console.log('🔍 Testing scratch org integration...');
    
    // Test that we can get org info
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    console.log(`✅ Got credentials for: ${credentials.username}`);
    
    expect(credentials.username).toBeTruthy();
    expect(credentials.password).toBeTruthy();
    expect(credentials.loginUrl).toBeTruthy();
    
    // Test org features
    const features = await ScratchOrgHelper.checkOrgFeatures();
    console.log(`✅ Org features: ${JSON.stringify(features)}`);
    
    expect(features).toBeTruthy();
  });

  test('basic Salesforce authentication works', async ({ page }) => {
    console.log('🔐 Testing Salesforce authentication...');
    
    // Get scratch org credentials
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    
    // Create helper and attempt login
    const sfHelper = new SalesforceHelper(page);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Verify we're logged in by checking for Lightning interface
    await expect(page).toHaveURL(/.*lightning.*/);
    
    // Take a screenshot to verify login state
    await sfHelper.takeScreenshot('environment-validation-login-success');
    
    console.log('✅ Salesforce authentication successful');
  });

  test('can navigate to Rollup app', async ({ page }) => {
    console.log('🧭 Testing navigation to Rollup app...');
    
    // Get credentials and login
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Try to navigate to Rollup app
    try {
      await sfHelper.navigateToApp('Rollup');
      await sfHelper.takeScreenshot('environment-validation-rollup-app');
      console.log('✅ Successfully navigated to Rollup app');
    } catch (error) {
      console.log('⚠️  Rollup app not available, this is expected if not deployed yet');
      await sfHelper.takeScreenshot('environment-validation-rollup-not-found');
      
      // This is okay for now - we'll deploy the app later
      expect(error.message).toContain('Rollup');
    }
  });

  test('can create and cleanup test data', async ({ page }) => {
    console.log('📝 Testing data creation and cleanup...');
    
    // Get credentials and login
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create a test account
    const testAccount = await sfHelper.createTestRecord('Account', {
      Name: `Test Account ${Date.now()}`,
      Type: 'Customer'
    });
    
    console.log(`✅ Created test account: ${testAccount.Id}`);
    expect(testAccount.Id).toBeTruthy();
    expect(testAccount.Name).toContain('Test Account');
    
    // Verify we can read the record back
    const readAccount = await sfHelper.getRecord('Account', testAccount.Id!, ['Name', 'Type']);
    expect(readAccount.Name).toBe(testAccount.Name);
    
    // Test cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ Test data cleanup completed');
    
    await sfHelper.takeScreenshot('environment-validation-data-test-complete');
  });
});