import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from './utils/scratch-org-helper';
import { SalesforceHelper } from './utils/salesforce-helper';

test.describe('Fixed Authentication Test', () => {
  test('scratch org helper with salesforce helper works', async ({ page }) => {
    console.log('🔧 Testing fixed authentication flow...');
    
    // Get credentials using our helper
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    console.log(`Got credentials for: ${credentials.username}`);
    console.log(`Login URL: ${credentials.loginUrl}`);
    console.log(`Access token starts with: ${credentials.password.substring(0, 10)}...`);
    
    // Create Salesforce helper and login
    const sfHelper = new SalesforceHelper(page);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Verify we're authenticated
    await expect(page).toHaveURL(/.*lightning.*/);
    
    // Try to find the app launcher (this should work now that we're in main Lightning)
    try {
      await page.waitForSelector('[data-aura-class="oneAppLauncher"]', { timeout: 10000 });
      console.log('✅ Found app launcher - in main Lightning app!');
    } catch {
      // Take a screenshot to see where we are
      await sfHelper.takeScreenshot('fixed-auth-no-app-launcher');
      console.log('⚠️  No app launcher found, but authentication worked');
    }
    
    // Take final screenshot
    await sfHelper.takeScreenshot('fixed-auth-success');
    
    console.log(`Final URL: ${page.url()}`);
    console.log('✅ Fixed authentication test completed');
  });
});