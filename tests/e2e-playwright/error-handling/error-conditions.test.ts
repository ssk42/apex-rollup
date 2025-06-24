import { test, expect } from '@playwright/test';
import { SalesforceHelper } from '../utils/salesforce-helper';

test.describe('Error Handling and Validation Tests', () => {
  let sfHelper: SalesforceHelper;

  test.beforeEach(async ({ page }) => {
    sfHelper = new SalesforceHelper(page);

    const loginUrl = process.env.E2E_SF_LOGIN_URL || 'https://login.salesforce.com';
    const username = process.env.E2E_SF_USERNAME!;
    const password = process.env.E2E_SF_PASSWORD!;

    await page.goto(loginUrl);
    await sfHelper.login(username, password);

    await sfHelper.navigateToApp('Rollup');
    await page.click('a[data-label="Recalculate Rollup"]');
  });

  test('Submitting manual recalc form with missing fields shows errors', async ({ page }) => {
    console.log('🧪 Testing error handling for missing required fields...');

    // 1. Ensure we are in manual mode (default) and click submit
    await page.click('lightning-button:has-text("Start rollup!")');

    // 2. Verify that required fields show a validation error
    // The LWC's required fields should display an error message when empty.
    const childObjectInput = page.locator('lightning-input[data-id="CalcItem__c"]');
    
    // Check for the "slds-has-error" class on the form element containing the input
    await expect(childObjectInput.locator('xpath=./ancestor::div[contains(@class, "slds-form-element")]')).toHaveClass(/slds-has-error/);

    // A generic "Complete this field" message is expected
    const errorMessage = childObjectInput.locator('.slds-form-element__help');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText('Complete this field.');

    // 3. Fill one field and check that others are still invalid
    await childObjectInput.fill('Opportunity');
    await page.click('lightning-button:has-text("Start rollup!")');

    const rollupFieldInput = page.locator('lightning-input[data-id="RollupFieldOnCalcItem__c"]');
    await expect(rollupFieldInput.locator('xpath=./ancestor::div[contains(@class, "slds-form-element")]')).toHaveClass(/slds-has-error/);

    await sfHelper.takeScreenshot('error-missing-fields');
    console.log('✅ Missing fields error test passed.');
  });

  test('Submitting recalc with invalid WHERE clause shows error', async ({ page }) => {
    console.log('🧪 Testing error handling for invalid WHERE clause...');

    // 1. Create test data (doesn't need to be perfect, just for context)
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account Error ${Date.now()}`
    });
    await sfHelper.createTestRecord('Opportunity', {
      Name: 'Test Opp Error',
      Amount: 1,
      AccountId: account.Id,
      StageName: 'Prospecting',
      CloseDate: '2024-12-31'
    });

    // 2. Fill out the manual rollup form with a broken WHERE clause
    await page.locator('lightning-input[data-id="CalcItem__c"]').fill('Opportunity');
    await page.locator('lightning-input[data-id="RollupFieldOnCalcItem__c"]').fill('Amount');
    await page.locator('lightning-input[data-id="LookupFieldOnCalcItem__c"]').fill('AccountId');
    await page.locator('lightning-input[data-id="LookupObject__c"]').fill('Account');
    await page.locator('lightning-input[data-id="RollupFieldOnLookupObject__c"]').fill('AnnualRevenue');
    await page.locator('lightning-input[data-id="LookupFieldOnLookupObject__c"]').fill('Id');
    await page.click('lightning-combobox[data-id="RollupOperation__c"] button');
    await page.click('lightning-base-combobox-item[data-value="SUM"]');

    // Enter the invalid WHERE clause
    await page.locator('lightning-textarea[name="CalcItemWhereClause__c"]').fill("StageName = 'MissingQuote");

    // 3. Submit the rollup
    await page.click('lightning-button:has-text("Start rollup!")');

    // 4. Verify the error is displayed
    await expect(page.locator('lightning-spinner')).toBeHidden({ timeout: 20000 });

    const errorLocator = page.locator('div[data-id="rollupError"]');
    await expect(errorLocator).toBeVisible();
    
    // The error message should indicate a SOQL parsing issue.
    // We check for a substring as the full message might vary.
    await expect(errorLocator).toContainText('System.QueryException');

    await sfHelper.takeScreenshot('error-invalid-where-clause');
    console.log('✅ Invalid WHERE clause error test passed.');
  });
});