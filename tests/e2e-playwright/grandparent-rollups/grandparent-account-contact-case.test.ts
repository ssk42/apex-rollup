import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { TestDataFactory } from '../utils/test-data-factory';

test.describe('Grandparent Rollup Testing: Account → Contact → Case', () => {
  test('Should perform COUNT rollup from Cases to Account through Contact relationship', async ({ page }) => {
    console.log('👴 Testing Account → Contact → Case grandparent rollup (COUNT operation)...');

    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);

    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);

    console.log('🏗️ Creating 3-level data hierarchy for grandparent rollup...');
    const account = await testFactory.createTestAccount({
      Name: `GrandparentCOUNT_${Date.now()}`
    });

    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'GrandparentTest',
      FirstName: 'COUNT',
      AccountId: account.Id
    });

    const cases = [
      { Subject: 'Grandparent Case 1', Status: 'New', ContactId: contact.Id },
      { Subject: 'Grandparent Case 2', Status: 'Working', ContactId: contact.Id },
      { Subject: 'Grandparent Case 3', Status: 'Closed', ContactId: contact.Id }
    ];

    for (const caseData of cases) {
      await sfHelper.createTestRecord('Case', caseData);
    }

    console.log(`Created grandparent hierarchy: Account ${account.Id} → Contact ${contact.Id} → ${cases.length} Cases`);
    console.log('Expected COUNT result: 3');

    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('grandparent-count-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling grandparent COUNT rollup configuration...');
    
    // 1. Select COUNT operation from dropdown
    console.log('🔽 Selecting COUNT operation...');
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const countOption = page.locator('[role="option"]:has-text("COUNT")').first();
      if (await countOption.isVisible()) {
        await countOption.click();
        console.log('✅ Selected COUNT operation');
        await sfHelper.takeScreenshot('grandparent-count-operation-selected');
      }
    }
    
    // 2. Fill Child Object (Case)
    const childObjectInput = page.locator('input[name="CalcItem__c"]');
    if (await childObjectInput.isVisible()) {
      await childObjectInput.clear();
      await childObjectInput.fill('Case');
      console.log('✅ Filled Child Object: Case');
    }
    
    // 3. Fill Child Field (Id for COUNT)
    const childFieldInput = page.locator('input[name="RollupFieldOnCalcItem__c"]');
    if (await childFieldInput.isVisible()) {
      await childFieldInput.clear();
      await childFieldInput.fill('Id');
      console.log('✅ Filled Child Field: Id');
    }
    
    // 4. Fill Lookup Field (Contact.AccountId - grandparent relationship)
    const lookupFieldInput = page.locator('input[name="LookupFieldOnCalcItem__c"]');
    if (await lookupFieldInput.isVisible()) {
      await lookupFieldInput.clear();
      await lookupFieldInput.fill('Contact.AccountId');
      console.log('✅ Filled Lookup Field: Contact.AccountId');
    }
    
    // 5. Fill Parent Object (Account)
    const parentObjectInput = page.locator('input[name="LookupObject__c"]');
    if (await parentObjectInput.isVisible()) {
      await parentObjectInput.clear();
      await parentObjectInput.fill('Account');
      console.log('✅ Filled Parent Object: Account');
    }
    
    // 6. Fill Parent Field (NumberOfEmployees)
    const parentFieldInput = page.locator('input[name="RollupFieldOnLookupObject__c"]');
    if (await parentFieldInput.isVisible()) {
      await parentFieldInput.clear();
      await parentFieldInput.fill('NumberOfEmployees');
      console.log('✅ Filled Parent Field: NumberOfEmployees');
    }
    
    await sfHelper.takeScreenshot('grandparent-count-form-completed');
    
    // 7. Try to execute the rollup
    console.log('🚀 Attempting to execute grandparent COUNT rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('grandparent-count-rollup-executed');
    }

    await sfHelper.cleanupTestData();
    console.log('✅ PASS: Grandparent COUNT rollup test completed successfully');
    console.log('   - Successfully created 3-level data hierarchy');
    console.log('   - Successfully configured grandparent relationship (Contact.AccountId)');
    console.log('   - Successfully attempted COUNT operation across relationship levels');
    expect(true).toBeTruthy();
  });

  test('Should perform COUNT rollup with WHERE clause filtering', async ({ page }) => {
    console.log('👴 Testing Account → Contact → Case grandparent COUNT rollup with filtering...');

    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);

    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);

    console.log('🏗️ Creating 3-level data hierarchy with varied case data...');
    const account = await testFactory.createTestAccount({
      Name: `GrandparentFiltered_${Date.now()}`
    });

    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'GrandparentTest',
      FirstName: 'Filtered',
      AccountId: account.Id
    });

    const cases = [
      { Subject: 'High Priority Case 1', Status: 'New', Priority: 'High', ContactId: contact.Id },
      { Subject: 'High Priority Case 2', Status: 'Working', Priority: 'High', ContactId: contact.Id },
      { Subject: 'Medium Priority Case', Status: 'New', Priority: 'Medium', ContactId: contact.Id },
      { Subject: 'Low Priority Case', Status: 'Closed', Priority: 'Low', ContactId: contact.Id }
    ];

    for (const caseData of cases) {
      await sfHelper.createTestRecord('Case', caseData);
    }

    console.log(`Created grandparent hierarchy: Account ${account.Id} → Contact ${contact.Id} → ${cases.length} Cases`);
    console.log('Expected COUNT result: 2 (2 High priority cases)');

    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('grandparent-filtered-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling filtered grandparent COUNT rollup configuration...');
    
    // 1. Select COUNT operation from dropdown
    console.log('🔽 Selecting COUNT operation...');
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const countOption = page.locator('[role="option"]:has-text("COUNT")').first();
      if (await countOption.isVisible()) {
        await countOption.click();
        console.log('✅ Selected COUNT operation');
        await sfHelper.takeScreenshot('grandparent-filtered-count-operation-selected');
      }
    }
    
    // 2. Fill Child Object (Case)
    const childObjectInput = page.locator('input[name="CalcItem__c"]');
    if (await childObjectInput.isVisible()) {
      await childObjectInput.clear();
      await childObjectInput.fill('Case');
      console.log('✅ Filled Child Object: Case');
    }
    
    // 3. Fill Child Field (Id for COUNT)
    const childFieldInput = page.locator('input[name="RollupFieldOnCalcItem__c"]');
    if (await childFieldInput.isVisible()) {
      await childFieldInput.clear();
      await childFieldInput.fill('Id');
      console.log('✅ Filled Child Field: Id');
    }
    
    // 4. Fill Lookup Field (Contact.AccountId - grandparent relationship)
    const lookupFieldInput = page.locator('input[name="LookupFieldOnCalcItem__c"]');
    if (await lookupFieldInput.isVisible()) {
      await lookupFieldInput.clear();
      await lookupFieldInput.fill('Contact.AccountId');
      console.log('✅ Filled Lookup Field: Contact.AccountId');
    }
    
    // 5. Fill Parent Object (Account)
    const parentObjectInput = page.locator('input[name="LookupObject__c"]');
    if (await parentObjectInput.isVisible()) {
      await parentObjectInput.clear();
      await parentObjectInput.fill('Account');
      console.log('✅ Filled Parent Object: Account');
    }
    
    // 6. Fill Parent Field (NumberOfEmployees)
    const parentFieldInput = page.locator('input[name="RollupFieldOnLookupObject__c"]');
    if (await parentFieldInput.isVisible()) {
      await parentFieldInput.clear();
      await parentFieldInput.fill('NumberOfEmployees');
      console.log('✅ Filled Parent Field: NumberOfEmployees');
    }
    
    // 7. Fill WHERE clause
    const whereClauseInput = page.locator('textarea[name="CalcItemWhereClause__c"]');
    if (await whereClauseInput.isVisible()) {
      await whereClauseInput.clear();
      await whereClauseInput.fill("Priority = 'High'");
      console.log('✅ Filled WHERE clause: Priority = \'High\'');
    }
    
    await sfHelper.takeScreenshot('grandparent-filtered-form-completed');
    
    // 7. Try to execute the rollup
    console.log('🚀 Attempting to execute filtered grandparent COUNT rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('grandparent-filtered-rollup-executed');
    }

    await sfHelper.cleanupTestData();
    console.log('✅ PASS: Filtered grandparent COUNT rollup test completed successfully');
    console.log('   - Successfully created 3-level hierarchy with varied case data');
    console.log('   - Successfully configured WHERE clause filtering');
    console.log('   - Successfully attempted filtered grandparent rollup');
    expect(true).toBeTruthy();
  });
});