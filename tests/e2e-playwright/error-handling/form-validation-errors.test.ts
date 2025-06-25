import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { TestDataFactory } from '../utils/test-data-factory';

test.describe('Rollup Execution Error Testing', () => {
  
  test('Invalid object error: Non-existent child object produces execution error', async ({ page }) => {
    console.log('❌ Testing execution error with invalid child object...');
    
    // Setup (exact same pattern as working tests)
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create minimal test data (following the pattern of successful tests)
    console.log('🏗️ Creating minimal test data for error test...');
    const account = await testFactory.createTestAccount({
      Name: `ErrorTest_${Date.now()}`
    });
    console.log(`Created test account ${account.Id} for error testing`);
    
    // Navigate directly to the Rollup app using known working URL pattern
    console.log('🧭 Navigating directly to Rollup app...');
    const rollupAppUrl = 'https://customization-agility-7104-dev-ed.scratch.my.salesforce.com/lightning/n/Recalculate_Rollup';
    await page.goto(rollupAppUrl);
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('invalid-object-interface-loaded');
    
    // Fill form fields using the exact working field selectors (same as successful tests)
    console.log('📝 Filling rollup configuration with invalid object...');
    
    // 1. Select SUM operation from dropdown (exact same pattern)
    console.log('🔽 Selecting SUM operation...');
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const sumOption = page.locator('[role="option"]:has-text("SUM")');
      if (await sumOption.isVisible()) {
        await sumOption.click();
        console.log('✅ Selected SUM operation');
        await sfHelper.takeScreenshot('sum-operation-selected');
      }
    }
    
    // 2. Fill Child Object with INVALID name (this will cause the error)
    const childObjectInput = page.locator('input[name="CalcItem__c"]');
    if (await childObjectInput.isVisible()) {
      await childObjectInput.clear();
      await childObjectInput.fill('NonExistentObject__c'); // Invalid object
      console.log('❌ Filled Child Object with invalid name: NonExistentObject__c');
    }
    
    // 3. Fill Child Field (Amount) - valid field name
    const childFieldInput = page.locator('input[name="RollupFieldOnCalcItem__c"]');
    if (await childFieldInput.isVisible()) {
      await childFieldInput.clear();
      await childFieldInput.fill('Amount');
      console.log('✅ Filled Child Field: Amount');
    }
    
    // 4. Fill Lookup Field (AccountId) - valid field name
    const lookupFieldInput = page.locator('input[name="LookupFieldOnCalcItem__c"]');
    if (await lookupFieldInput.isVisible()) {
      await lookupFieldInput.clear();
      await lookupFieldInput.fill('AccountId');
      console.log('✅ Filled Lookup Field: AccountId');
    }
    
    // 5. Fill Parent Object (Account) - valid object
    const parentObjectInput = page.locator('input[name="LookupObject__c"]');
    if (await parentObjectInput.isVisible()) {
      await parentObjectInput.clear();
      await parentObjectInput.fill('Account');
      console.log('✅ Filled Parent Object: Account');
    }
    
    // 6. Fill Parent Field (AnnualRevenue) - valid field
    const parentFieldInput = page.locator('input[name="RollupFieldOnLookupObject__c"]');
    if (await parentFieldInput.isVisible()) {
      await parentFieldInput.clear();
      await parentFieldInput.fill('AnnualRevenue');
      console.log('✅ Filled Parent Field: AnnualRevenue');
    }
    
    await sfHelper.takeScreenshot('invalid-object-form-completed');
    
    // 7. Execute the rollup (expect this to fail due to invalid object)
    console.log('🚫 Attempting to execute rollup with invalid object...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('🔄 Rollup execution started (expecting error)...');
      await page.waitForTimeout(5000); // Wait for error response
      await sfHelper.takeScreenshot('invalid-object-rollup-executed');
    }
    
    // 8. Look for error toast notification (most common error display in Lightning)
    console.log('🔍 Looking for error message...');
    const errorToast = page.locator('.slds-notify--toast.slds-notify--error');
    const forceErrorToast = page.locator('.forceToastMessage--error');
    
    // Give some time for error toast to appear
    await page.waitForTimeout(2000);
    await sfHelper.takeScreenshot('error-toast-check');
    
    const hasErrorToast = await errorToast.isVisible();
    const hasForceErrorToast = await forceErrorToast.isVisible();
    
    // For debugging - log what we found
    if (hasErrorToast) {
      console.log('✅ Found standard error toast');
    }
    if (hasForceErrorToast) {
      console.log('✅ Found force error toast');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    
    expect(hasErrorToast || hasForceErrorToast).toBeTruthy();
    console.log('✅ Error handling test completed - invalid object correctly produced error');
  });
  
});