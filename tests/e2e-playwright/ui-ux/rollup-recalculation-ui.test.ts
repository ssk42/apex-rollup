import { test, expect } from '@playwright/test';
import { SalesforceHelper } from '../utils/salesforce-helper';

test.describe('Rollup Recalculation UI Tests', () => {
  let sfHelper: SalesforceHelper;

  test.beforeEach(async ({ page }) => {
    sfHelper = new SalesforceHelper(page);

    const loginUrl = process.env.E2E_SF_LOGIN_URL || 'https://login.salesforce.com';
    const username = process.env.E2E_SF_USERNAME!;
    const password = process.env.E2E_SF_PASSWORD!;

    await page.goto(loginUrl);
    await sfHelper.login(username, password);

    // Navigate to the Rollup app
    await sfHelper.navigateToApp('Rollup');
    // Click on the "Recalculate Rollup" tab
    await page.click('a[data-label="Recalculate Rollup"]');
  });

  test.afterEach(async () => {
    await sfHelper.cleanupTestData();
  });

  test('Manual rollup recalculation from UI works correctly', async ({ page }) => {
    console.log('🧪 Testing manual rollup recalculation via UI...');

    // 1. Create test data
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account UI Manual ${Date.now()}`,
      AnnualRevenue: 0
    });

    const oppAmounts = [1500, 2500, 1000];
    const expectedSum = oppAmounts.reduce((a, b) => a + b, 0);

    for (const amount of oppAmounts) {
      await sfHelper.createTestRecord('Opportunity', {
        Name: `Test Opp ${amount}`,
        Amount: amount,
        AccountId: account.Id,
        StageName: 'Prospecting',
        CloseDate: '2024-12-31'
      });
    }

    // 2. Fill out the manual rollup form
    await page.locator('lightning-input[data-id="CalcItem__c"]').fill('Opportunity');
    await page.locator('lightning-input[data-id="RollupFieldOnCalcItem__c"]').fill('Amount');
    await page.locator('lightning-input[data-id="LookupFieldOnCalcItem__c"]').fill('AccountId');
    await page.locator('lightning-input[data-id="LookupObject__c"]').fill('Account');
    await page.locator('lightning-input[data-id="RollupFieldOnLookupObject__c"]').fill('AnnualRevenue');
    await page.locator('lightning-input[data-id="LookupFieldOnLookupObject__c"]').fill('Id');

    // Select 'SUM' from the operation picklist
    await page.click('lightning-combobox[data-id="RollupOperation__c"] button');
    await page.click('lightning-base-combobox-item[data-value="SUM"]');

    // 3. Submit the rollup
    await page.click('lightning-button:has-text("Start rollup!")');

    // 4. Wait for completion and verify
    // Wait for the spinner to disappear
    await expect(page.locator('lightning-spinner:has-text("Rolling up ....")')).toBeHidden({ timeout: 60000 });

    // Check for an error message
    const errorLocator = page.locator('div[data-id="rollupError"]');
    expect(await errorLocator.isVisible()).toBe(false);

    // Give a brief moment for data to be visible on the record page
    await sfHelper.waitForTimeout(2000);

    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['AnnualRevenue']);
    expect(updatedAccount.AnnualRevenue).toBe(expectedSum);

    await sfHelper.takeScreenshot('ui-manual-recalc-result');
    console.log(`✅ Manual UI rollup test passed - Expected: ${expectedSum}, Actual: ${updatedAccount.AnnualRevenue}`);
  });

  test('CMDT-based rollup recalculation from UI works correctly', async ({ page }) => {
    console.log('🧪 Testing CMDT-based rollup recalculation via UI...');

    // This test assumes a Rollup__mdt record with DeveloperName = 'Opp_SUM' exists
    // for the Opportunity object.

    // 1. Create test data
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account UI CMDT ${Date.now()}`,
      AnnualRevenue: 0
    });

    const oppAmounts = [300, 500, 700];
    const expectedSum = oppAmounts.reduce((a, b) => a + b, 0);

    for (const amount of oppAmounts) {
      await sfHelper.createTestRecord('Opportunity', {
        Name: `Test Opp CMDT ${amount}`,
        Amount: amount,
        AccountId: account.Id,
        StageName: 'Prospecting',
        CloseDate: '2024-12-31'
      });
    }

    // 2. Switch to CMDT mode and select the rollup
    await page.click('lightning-input[data-id="cmdt-toggle"]');

    // Select 'Opportunity' from the child object combobox
    await page.click('lightning-combobox[label="Select Child Object"] button');
    await page.click('lightning-base-combobox-item[data-value="Opportunity"]');

    // Wait for the datatable to appear and select the row for 'Opp_SUM'
    const datatable = page.locator('lightning-datatable[data-id="datatable"]');
    await expect(datatable).toBeVisible({ timeout: 10000 });
    
    // The key-field is DeveloperName, but we need to select by label in the row
    const rollupRow = datatable.locator('tr:has-text("Opp SUM")');
    await rollupRow.locator('lightning-primitive-cell-checkbox').click();

    // 3. Submit the rollup
    await page.click('lightning-button:has-text("Start rollup!")');

    // 4. Wait for completion and verify
    await expect(page.locator('lightning-spinner:has-text("Rolling up ....")')).toBeHidden({ timeout: 60000 });

    const errorLocator = page.locator('div[data-id="rollupError"]');
    expect(await errorLocator.isVisible()).toBe(false);

    await sfHelper.waitForTimeout(2000);

    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['AnnualRevenue']);
    expect(updatedAccount.AnnualRevenue).toBe(expectedSum);

    await sfHelper.takeScreenshot('ui-cmdt-recalc-result');
    console.log(`✅ CMDT UI rollup test passed - Expected: ${expectedSum}, Actual: ${updatedAccount.AnnualRevenue}`);
  });
});