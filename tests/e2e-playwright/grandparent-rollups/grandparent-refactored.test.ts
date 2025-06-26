import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { TestDataFactory } from '../utils/test-data-factory';
import { RollupCMDT } from '../../types/rollup-cmdt';

test.describe('Grandparent Rollup Refactored Validation', () => {
  let sfHelper: SalesforceHelper;
  let testFactory: TestDataFactory;

  test.beforeEach(async ({ page }) => {
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    sfHelper = new SalesforceHelper(page);
    testFactory = new TestDataFactory(sfHelper);

    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    await sfHelper.deployMetadata('/Users/stephenreitz/apex-rollup/tests/e2e-playwright/temp-metadata');
  });

  test.afterEach(async () => {
    await sfHelper.cleanupTestData();
  });

  test('Should perform a COUNT rollup from Case to Account (grandparent) via Contact', async () => {
    console.log('👴 Refactored Test: COUNT from Case -> Contact -> Account');

    const account = await testFactory.createTestAccount({ Name: 'GrandparentCOUNT' });
    console.log(`Created account: ${account.Id}`);
    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'TestContact',
      AccountId: account.Id
    });
    console.log(`Created contact: ${contact.Id}`);

    for (let i = 0; i < 3; i++) {
      const newCase = await sfHelper.createTestRecord('Case', { Subject: `Case ${i}`, ContactId: contact.Id });
      console.log(`Created case: ${newCase.Id}`);
    }

    console.log('Waiting for record update...');
    await sfHelper.waitForRecordUpdate('Account', account.Id!, {
      NumberOfEmployees: 3
    });
    console.log('Record update complete.');

    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['NumberOfEmployees']);
    console.log(`Updated account: ${JSON.stringify(updatedAccount)}`);
    expect(updatedAccount.NumberOfEmployees).toBe(3);
  });

  test('Should perform a SUM rollup from Opportunity to Account (grandparent) via Contact', async () => {
    console.log('💰 Refactored Test: SUM from Opportunity -> Contact -> Account');

    const account = await testFactory.createTestAccount({ Name: 'GrandparentSUM' });
    console.log(`Created account: ${account.Id}`);
    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'TestContact',
      AccountId: account.Id
    });
    console.log(`Created contact: ${contact.Id}`);

    const opp1 = await testFactory.createTestOpportunity(account.Id!, { Amount: 100, ContactId: contact.Id });
    console.log(`Created opportunity: ${opp1.Id}`);
    const opp2 = await testFactory.createTestOpportunity(account.Id!, { Amount: 200, ContactId: contact.Id });
    console.log(`Created opportunity: ${opp2.Id}`);

    console.log('Waiting for record update...');
    await sfHelper.waitForRecordUpdate('Account', account.Id!, {
      AnnualRevenue: 300
    });
    console.log('Record update complete.');

    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['AnnualRevenue']);
    console.log(`Updated account: ${JSON.stringify(updatedAccount)}`);
    expect(updatedAccount.AnnualRevenue).toBe(300);
  });
});
