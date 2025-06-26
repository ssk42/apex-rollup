import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { TestDataFactory } from '../utils/test-data-factory';

test.describe('Grandparent Rollup Testing: Account -> ContactPointAddress', () => {
  test('Should perform COUNT rollup from ContactPointAddress to Account', async ({ page }) => {
    console.log('👴 Testing Account -> ContactPointAddress grandparent rollup (COUNT operation)...');

    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);

    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);

    console.log('🏗️ Creating 2-level data hierarchy for grandparent rollup...');
    const account = await testFactory.createTestAccount({
      Name: `GrandparentCPA_COUNT_${Date.now()}`
    });

    const cpas = [
      { Name: 'Address 1', ParentId: account.Id, PreferenceRank: 1 },
      { Name: 'Address 2', ParentId: account.Id, PreferenceRank: 2 },
      { Name: 'Address 3', ParentId: account.Id, PreferenceRank: 3 }
    ];

    for (const cpaData of cpas) {
      await sfHelper.createTestRecord('ContactPointAddress', cpaData);
    }

    console.log(`Created grandparent hierarchy: Account ${account.Id} -> ${cpas.length} ContactPointAddresses`);
    console.log('Expected COUNT result: 3');

    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');

    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });

    console.log('📝 Filling grandparent COUNT rollup configuration...');

    const operationDropdown = page.locator('lightning-combobox').first();
    await operationDropdown.click();
    await page.locator('[role="option"]:has-text("COUNT")').first().click();

    await page.locator('input[name="CalcItem__c"]').fill('ContactPointAddress');
    await page.locator('input[name="RollupFieldOnCalcItem__c"]').fill('Id');
    await page.locator('input[name="LookupFieldOnCalcItem__c"]').fill('ParentId');
    await page.locator('input[name="LookupObject__c"]').fill('Account');
    await page.locator('input[name="RollupFieldOnLookupObject__c"]').fill('GrandparentRollupResult__c');

    console.log('🚀 Executing grandparent COUNT rollup...');
    await page.locator('button:has-text("Start rollup!")').first().click();

    console.log('⏳ Waiting for grandparent rollup completion...');
    await page.waitForTimeout(12000);

    console.log('🔍 Verifying rollup result...');
    const rollupResult = await sfHelper.queryRecord('Account', account.Id, ['GrandparentRollupResult__c']);
    expect(rollupResult.GrandparentRollupResult__c).toBe(3);

    await sfHelper.cleanupTestData();
    console.log('✅ PASS: Grandparent COUNT rollup test completed successfully');
  });
});
