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
  });

  test.afterEach(async () => {
    await sfHelper.cleanupTestData();
  });

  test('Should perform a COUNT rollup from Case to Account (grandparent) via Contact', async () => {
    console.log('👴 Refactored Test: COUNT from Case -> Contact -> Account');

    const rollupMetadata: RollupCMDT = {
      DeveloperName: 'Grandparent_Case_Count_to_Account',
      MasterLabel: 'Grandparent Case Count to Account',
      RollupFieldOnCalcItem__c: 'Id',
      RollupOperation__c: 'COUNT',
      RollupFieldOnParent__c: 'NumberOfEmployees',
      CalcItem__c: 'Case',
      Parent__c: 'Account',
      GrandparentRelationshipFieldPath__c: 'Contact.AccountId'
    };

    await sfHelper.createRollupCMDT(rollupMetadata);

    const account = await testFactory.createTestAccount({ Name: 'GrandparentCOUNT' });
    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'TestContact',
      AccountId: account.Id
    });

    for (let i = 0; i < 3; i++) {
      await sfHelper.createTestRecord('Case', { Subject: `Case ${i}`, ContactId: contact.Id });
    }

    await sfHelper.waitForRecordUpdate('Account', account.Id!, {
      NumberOfEmployees: 3
    });

    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['NumberOfEmployees']);
    expect(updatedAccount.NumberOfEmployees).toBe(3);
  });

  test('Should perform a SUM rollup from Opportunity to Account (grandparent) via Contact', async () => {
    console.log('💰 Refactored Test: SUM from Opportunity -> Contact -> Account');

    const rollupMetadata: RollupCMDT = {
      DeveloperName: 'Grandparent_Opp_Sum_to_Account',
      MasterLabel: 'Grandparent Opp Sum to Account',
      RollupFieldOnCalcItem__c: 'Amount',
      RollupOperation__c: 'SUM',
      RollupFieldOnParent__c: 'AnnualRevenue',
      CalcItem__c: 'Opportunity',
      Parent__c: 'Account',
      GrandparentRelationshipFieldPath__c: 'Contact.AccountId'
    };

    await sfHelper.createRollupCMDT(rollupMetadata);

    const account = await testFactory.createTestAccount({ Name: 'GrandparentSUM' });
    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'TestContact',
      AccountId: account.Id
    });

    await testFactory.createTestOpportunity(account.Id!, { Amount: 100, ContactId: contact.Id });
    await testFactory.createTestOpportunity(account.Id!, { Amount: 200, ContactId: contact.Id });

    await sfHelper.waitForRecordUpdate('Account', account.Id!, {
      AnnualRevenue: 300
    });

    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['AnnualRevenue']);
    expect(updatedAccount.AnnualRevenue).toBe(300);
  });
});
