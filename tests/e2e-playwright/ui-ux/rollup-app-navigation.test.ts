import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';

test.describe('Rollup App Navigation', () => {
  test('can navigate to Rollup app from App Launcher', async ({ page }) => {
    console.log('🧭 Testing Rollup app navigation...');
    
    // Get credentials and login
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    console.log('✅ Authenticated successfully');
    
    // Navigate to Rollup app
    console.log('🎯 Opening App Launcher...');
    await sfHelper.navigateToApp('Rollup');
    
    // Verify we're in the Rollup app (could be app or tab URL)
    await expect(page).toHaveURL(/.*lightning.*(app.*Rollup|n\/Recalculate_Rollup).*/);
    
    // Take screenshot of successful navigation
    await sfHelper.takeScreenshot('rollup-app-navigation');
    console.log('✅ Successfully navigated to Rollup app');
  });

  test('can access Recalculate Rollup tab', async ({ page }) => {
    console.log('📋 Testing Recalculate Rollup tab access...');
    
    // Get credentials and login
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Navigate to Rollup app and Recalculate Rollup tab
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Verify we can see the rollup force recalculation component
    const rollupComponent = page.locator('c-rollup-force-recalculation, [data-name="rollupForceRecalculation"]');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    // Take screenshot showing the recalculation interface
    await sfHelper.takeScreenshot('recalculate-rollup-tab');
    console.log('✅ Successfully accessed Recalculate Rollup tab');
  });

  test('can navigate between Rollup app tabs', async ({ page }) => {
    console.log('🔄 Testing navigation between Rollup app tabs...');
    
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Navigate to Rollup app
    await sfHelper.navigateToApp('Rollup');
    
    // Test navigation to Recalculate Rollup tab
    await sfHelper.navigateToTab('Recalculate Rollup');
    await sfHelper.takeScreenshot('recalc-tab-active');
    
    // Test Rollup State tab (if available)
    try {
      await sfHelper.navigateToTab('Rollup State');
      await sfHelper.takeScreenshot('rollup-state-tab-active');
    } catch (error) {
      console.log('ℹ️  Rollup State tab not available:', error.message);
    }
    
    // Verify navigation works by going back to Recalculate
    await sfHelper.navigateToTab('Recalculate Rollup');
    
    // Verify the rollup component is visible again
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 10000 });
    console.log('✅ Successfully navigated between Rollup app tabs');
    
    await sfHelper.takeScreenshot('rollup-tab-navigation-complete');
  });

  test('can access App Launcher and verify Rollup app availability', async ({ page }) => {
    console.log('🚀 Testing App Launcher and Rollup app visibility...');
    
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Open App Launcher
    console.log('📱 Opening App Launcher...');
    const appLauncherButton = page.locator('[data-aura-class="oneAppLauncher"] button, .slds-icon-waffle_container button');
    await appLauncherButton.click();
    
    // Wait for App Launcher to open
    await page.waitForSelector('.slds-app-launcher__content, [data-aura-class="appTileTitle"]', { timeout: 10000 });
    
    // Search for Rollup app
    const searchInput = page.locator('input[placeholder*="Search apps"], input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Rollup');
      await page.waitForTimeout(1000); // Wait for search results
    }
    
    // Look for Rollup app tile
    const rollupApp = page.locator('[data-aura-class="appTileTitle"]:has-text("Rollup"), .slds-app-launcher__tile-title:has-text("Rollup")');
    await expect(rollupApp).toBeVisible({ timeout: 10000 });
    
    await sfHelper.takeScreenshot('app-launcher-rollup-visible');
    
    // Click on Rollup app
    await rollupApp.click();
    
    // Verify we're now in the Rollup app (could be app or tab URL)
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await expect(page).toHaveURL(/.*lightning.*(app.*Rollup|n\/Recalculate_Rollup).*/);
    
    await sfHelper.takeScreenshot('rollup-app-launched');
    console.log('✅ Successfully launched Rollup app from App Launcher');
  });
});