import { test, expect } from '@playwright/test';
import { SalesforceHelper } from '../utils/salesforce-helper';

test.describe('Flow-Based Rollup Integration Tests', () => {
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

  test('Rollup with parent WHERE clause in a Flow works correctly', async () => {
    console.log('🧪 Testing flow-based rollup with parent WHERE clause...');

    // This test relies on the "Rollup Integration - Parent Where Clause Filtering" flow being active.

    // 1. Create two Accounts
    const matchingAccount = await sfHelper.createTestRecord('Account', {
      Name: 'Test Parent Fields',
      Phone: null
    });
    const nonMatchingAccount = await sfHelper.createTestRecord('Account', {
      Name: 'Another Account',
      Phone: null
    });

    // 2. Create a contact for the non-matching account
    await sfHelper.createTestRecord('Contact', {
      LastName: 'NonMatching',
      Phone: '111-111-1111',
      AccountId: nonMatchingAccount.Id
    });

    // 3. Create contacts for the matching account
    const lastPhone = '999-999-9999';
    await sfHelper.createTestRecord('Contact', {
      LastName: 'Aaaaa', // First alphabetically
      Phone: '222-222-2222',
      AccountId: matchingAccount.Id
    });
    await sfHelper.createTestRecord('Contact', {
      LastName: 'Zzzzz', // Last alphabetically
      Phone: lastPhone,
      AccountId: matchingAccount.Id
    });

    // 4. Verification
    // Wait for the flow and subsequent rollup to complete
    await sfHelper.waitForTimeout(5000);

    // Verify the matching account was updated
    const updatedMatchingAccount = await sfHelper.getRecord('Account', matchingAccount.Id!, ['Phone']);
    expect(updatedMatchingAccount.Phone).toBe(lastPhone);

    // Verify the non-matching account was NOT updated
    const updatedNonMatchingAccount = await sfHelper.getRecord('Account', nonMatchingAccount.Id!, ['Phone']);
    expect(updatedNonMatchingAccount.Phone).toBeNull();

    await sfHelper.takeScreenshot('flow-parent-where-clause-result');
    console.log('✅ Flow-based rollup with parent WHERE clause test passed.');
  });
});