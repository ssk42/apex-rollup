import { test, expect } from '@playwright/test';

test.describe('Simple Authentication Test', () => {
  test('can login to scratch org directly', async ({ page }) => {
    console.log('🔐 Testing direct scratch org login...');
    
    // Hardcode the scratch org details we found
    const instanceUrl = 'https://customization-agility-7104-dev-ed.scratch.my.salesforce.com';
    const username = 'test-ggmjrwydon9a@example.com';
    const password = 'kkmlhyeyzM4n&';
    const accessToken = '00DD50000002i7M!ARgAQIFgHM7bCkflzVqeq7.onxCfRAVI.JMby2LZUe2KjrBC9EOuGIaxCU2XaGMQWOKFAeabO6CmBotI9t0zm6.g3GKctOMV';
    
    // Try the frontdoor approach first (should be fastest)
    console.log('🚪 Trying frontdoor authentication...');
    const frontdoorUrl = `${instanceUrl}/secur/frontdoor.jsp?sid=${accessToken}`;
    
    await page.goto(frontdoorUrl);
    
    // Wait a bit and see what happens
    await page.waitForTimeout(3000);
    
    // Take a screenshot to see where we land
    await page.screenshot({ path: 'test-results/screenshots/simple-auth-frontdoor.png' });
    
    console.log(`Current URL: ${page.url()}`);
    
    // If frontdoor worked, we should be in Lightning
    if (page.url().includes('lightning')) {
      console.log('✅ Frontdoor authentication successful!');
      
      // Try to find the app launcher
      try {
        await page.waitForSelector('[data-aura-class="oneAppLauncher"]', { timeout: 10000 });
        console.log('✅ Found app launcher - fully authenticated!');
      } catch {
        console.log('⚠️  No app launcher found, but we are in Lightning');
      }
      
    } else {
      console.log('🔄 Frontdoor failed, trying normal login...');
      
      // Go to the login page and try manual login
      await page.goto(`${instanceUrl}/`);
      await page.waitForTimeout(2000);
      
      // Check if we're on a login page
      const hasUsernameField = await page.locator('#username').isVisible().catch(() => false);
      
      if (hasUsernameField) {
        console.log('📝 Found login form, filling credentials...');
        
        await page.fill('#username', username);
        await page.fill('#password', password);
        await page.click('#Login');
        
        // Wait for login to complete
        await page.waitForURL('**/lightning/**', { timeout: 30000 });
        console.log('✅ Manual login successful!');
      } else {
        console.log('❓ No login form found');
        await page.screenshot({ path: 'test-results/screenshots/simple-auth-no-login-form.png' });
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'test-results/screenshots/simple-auth-final.png' });
    
    // Basic assertion - we should be somewhere on the Salesforce domain
    expect(page.url()).toContain('salesforce');
    
    // Verify we're in Lightning Experience
    expect(page.url()).toContain('lightning');
  });
});