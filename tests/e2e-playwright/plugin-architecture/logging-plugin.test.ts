import { test, expect } from '@playwright/test';
import { SalesforceHelper } from '../utils/salesforce-helper';

test.describe('Plugin Architecture Tests', () => {
  let sfHelper: SalesforceHelper;

  test.beforeEach(async ({ page }) => {
    sfHelper = new SalesforceHelper(page);

    const loginUrl = process.env.E2E_SF_LOGIN_URL || 'https://login.salesforce.com';
    const username = process.env.E2E_SF_USERNAME!;
    const password = process.env.E2E_SF_PASSWORD!;

    await page.goto(loginUrl);
    await sfHelper.login(username, password);
  });

  test.afterEach(async () => {
    await sfHelper.cleanupTestData();
  });

  test('Custom object logger plugin creates logs correctly', async ({ page }) => {
    console.log('🧪 Testing custom object logger plugin...');

    // This test assumes the "RollupCustomObjectLogger" plugin is active.

    // 1. Create a uniquely named Account to run the rollup on
    const uniqueAccountName = `Test Account Logger ${Date.now()}`;
    const account = await sfHelper.createTestRecord('Account', {
      Name: uniqueAccountName,
      AnnualRevenue: 0
    });
    await sfHelper.createTestRecord('Opportunity', {
      Name: 'Logging Test Opp',
      Amount: 123,
      AccountId: account.Id,
      StageName: 'Prospecting',
      CloseDate: '2024-12-31'
    });

    // 2. Run a rollup using the manual UI recalc page
    await sfHelper.navigateToApp('Rollup');
    await page.click('a[data-label="Recalculate Rollup"]');

    await page.locator('lightning-input[data-id="CalcItem__c"]').fill('Opportunity');
    await page.locator('lightning-input[data-id="RollupFieldOnCalcItem__c"]').fill('Amount');
    await page.locator('lightning-input[data-id="LookupFieldOnCalcItem__c"]').fill('AccountId');
    await page.locator('lightning-input[data-id="LookupObject__c"]').fill('Account');
    await page.locator('lightning-input[data-id="RollupFieldOnLookupObject__c"]').fill('AnnualRevenue');
    await page.locator('lightning-input[data-id="LookupFieldOnLookupObject__c"]').fill('Id');
    await page.click('lightning-combobox[data-id="RollupOperation__c"] button');
    await page.click('lightning-base-combobox-item[data-value="SUM"]');
    await page.click('lightning-button:has-text("Start rollup!")');
    await expect(page.locator('lightning-spinner')).toBeHidden({ timeout: 60000 });

    // 3. Verify that logs were created
    await sfHelper.navigateToObject('RollupLog__c');

    // Click on the first log in the "Recently Viewed" list, which should be the one we just created
    await page.click('th[scope="row"] a');
    await page.waitForURL('**/RollupLog__c/*/view');
    
    // Check the related list for Log Entries
    const logEntriesRelatedList = page.locator('div.slds-card:has-text("Rollup Log Entries")');
    await expect(logEntriesRelatedList).toBeVisible();

    // Check for an entry message containing our unique account name
    const logEntryMessage = logEntriesRelatedList.locator(`//div[contains(text(), "${uniqueAccountName}")]`);
    await expect(logEntryMessage).toBeVisible();

    await sfHelper.takeScreenshot('plugin-logger-result');
    console.log('✅ Custom object logger plugin test passed.');
  });
});