import { test, expect } from '@playwright/test';
import { SalesforceHelper } from '../utils/salesforce-helper';

test.describe('CMDT Driven Rollup Tests', () => {
  let sfHelper: SalesforceHelper;

  test.beforeEach(async ({ page }) => {
    sfHelper = new SalesforceHelper(page);

    // Using environment variables for login to keep credentials secure
    const loginUrl = process.env.E2E_SF_LOGIN_URL || 'https://login.salesforce.com';
    const username = process.env.E2E_SF_USERNAME!;
    const password = process.env.E2E_SF_PASSWORD!;

    // Basic validation of credentials
    if (!username || !password) {
      throw new Error('Salesforce username and password environment variables must be set');
    }

    await page.goto(loginUrl);
    await sfHelper.login(username, password);
  });

  test.afterEach(async () => {
    // Cleanup all created test data
    await sfHelper.cleanupTestData();
  });

  test('Grandparent rollup defined by CMDT works correctly', async () => {
    console.log('👵 Testing CMDT-driven grandparent rollup...');

    // This test relies on the "Amount from Children to Grandparent" Rollup__mdt record
    // being deployed to the target org.

    // 1. Create Grandparent record
    const grandparent = await sfHelper.createTestRecord('RollupGrandparent__c', {
      Name: `Test Grandparent ${Date.now()}`
    });

    // 2. Create Parent record linked to Grandparent
    const parent = await sfHelper.createTestRecord('RollupParent__c', {
      Name: `Test Parent ${Date.now()}`,
      RollupGrandparent__c: grandparent.Id
    });

    // 3. Create Child records with values to be rolled up
    const childValues = [100, 200, 50];
    const expectedSum = childValues.reduce((a, b) => a + b, 0);

    for (const value of childValues) {
      await sfHelper.createTestRecord('RollupChild__c', {
        Name: `Test Child ${value}`,
        RollupParent__c: parent.Id,
        NumberField__c: value
      });
    }

    // 4. Verification
    // The rollup should be triggered automatically by the creation of child records.
    // We may need to wait briefly for the asynchronous processing to complete.
    await sfHelper.waitForTimeout(5000); // Wait 5 seconds for rollup processing

    const updatedGrandparent = await sfHelper.getRecord('RollupGrandparent__c', grandparent.Id!, [
      'AmountFromChildren__c'
    ]);

    expect(updatedGrandparent.AmountFromChildren__c).toBe(expectedSum);

    await sfHelper.takeScreenshot('cmdt-grandparent-rollup-result');
    console.log(`✅ CMDT grandparent rollup test passed - Expected: ${expectedSum}, Actual: ${updatedGrandparent.AmountFromChildren__c}`);
  });
});