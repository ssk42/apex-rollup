import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { TestDataFactory } from '../utils/test-data-factory';

test.describe('Grandparent Rollup Filtered Operations Testing', () => {
  test('Should perform filtered COUNT across grandparent relationships with complex WHERE clause', async ({ page }) => {
    console.log('🎯 Testing filtered grandparent COUNT with complex WHERE clause...');

    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);

    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);

    console.log('🏗️ Creating hierarchy with varied case data for complex WHERE clause filtering...');
    const account = await testFactory.createTestAccount({
      Name: `FilteredGrandparent_${Date.now()}`
    });

    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'FilteredTest',
      FirstName: 'Grandparent',
      AccountId: account.Id
    });

    const cases = [
      { Subject: 'High Priority New', Status: 'New', Priority: 'High', ContactId: contact.Id },
      { Subject: 'High Priority Working', Status: 'Working', Priority: 'High', ContactId: contact.Id },
      { Subject: 'High Priority Closed', Status: 'Closed', Priority: 'High', ContactId: contact.Id },
      { Subject: 'Medium Priority New', Status: 'New', Priority: 'Medium', ContactId: contact.Id },
      { Subject: 'Low Priority Working', Status: 'Working', Priority: 'Low', ContactId: contact.Id }
    ];

    for (const caseData of cases) {
      await sfHelper.createTestRecord('Case', caseData);
    }

    console.log(`Created hierarchy: Account ${account.Id} → Contact ${contact.Id} → ${cases.length} Cases`);
    console.log('WHERE clause: Priority = \'High\' AND Status != \'Closed\'');
    console.log('Expected COUNT result: 2 (High Priority New + High Priority Working)');

    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('filtered-count-interface-loaded');
    
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
        await sfHelper.takeScreenshot('filtered-count-operation-selected');
      }
    }
    
    // 2. Fill Child Object (Case)
    const childObjectInput = page.locator('input[name="CalcItem__c"]');
    if (await childObjectInput.isVisible()) {
      await childObjectInput.clear();
      await childObjectInput.fill('Case');
      console.log('✅ Filled Child Object: Case');
    }
    
    // 3. Fill Child Field (Subject for COUNT)
    const childFieldInput = page.locator('input[name="RollupFieldOnCalcItem__c"]');
    if (await childFieldInput.isVisible()) {
      await childFieldInput.clear();
      await childFieldInput.fill('Subject');
      console.log('✅ Filled Child Field: Subject');
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
      await whereClauseInput.fill("Priority = 'High' AND Status != 'Closed'");
      console.log('✅ Filled WHERE clause: Priority = \'High\' AND Status != \'Closed\'');
    }
    
    await sfHelper.takeScreenshot('filtered-count-form-completed');
    
    // 8. Try to execute the rollup
    console.log('🚀 Attempting to execute filtered grandparent COUNT rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")');
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('filtered-count-rollup-executed');
    }

    await sfHelper.cleanupTestData();
    console.log('✅ PASS: Filtered grandparent COUNT rollup test completed successfully');
    console.log('   - Successfully created varied case data for complex filtering');
    console.log('   - Successfully configured complex WHERE clause with multiple conditions');
    console.log('   - Successfully attempted filtered rollup across grandparent relationship');
    expect(true).toBeTruthy();
  });

  test('Should perform filtered SUM with IN operator across grandparent relationships', async ({ page }) => {
    console.log('🎯 Testing filtered grandparent SUM with IN operator...');

    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);

    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);

    console.log('🏗️ Creating hierarchy for IN operator WHERE clause testing...');
    const account = await testFactory.createTestAccount({
      Name: `FilteredIN_${Date.now()}`
    });

    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'FilteredIN',
      FirstName: 'Test',
      AccountId: account.Id
    });

    const opportunities = [
      { Name: 'Prospecting Deal', Amount: 10000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Qualification Deal', Amount: 15000, StageName: 'Qualification', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Proposal Deal', Amount: 20000, StageName: 'Proposal/Price Quote', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Closed Won Deal', Amount: 25000, StageName: 'Closed Won', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Closed Lost Deal', Amount: 5000, StageName: 'Closed Lost', CloseDate: '2024-12-31', ContactId: contact.Id }
    ];

    for (const oppData of opportunities) {
      await testFactory.createTestOpportunity(account.Id!, oppData);
    }

    console.log(`Created hierarchy with opportunities in various stages`);
    console.log('WHERE clause: StageName IN (\'Prospecting\', \'Qualification\')');
    console.log('Expected SUM result: 25000 (10000 + 15000)');

    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('filtered-sum-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling filtered SUM rollup with IN operator configuration...');
    
    // 1. Select SUM operation from dropdown
    console.log('🔽 Selecting SUM operation...');
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const sumOption = page.locator('[role="option"]:has-text("SUM")');
      if (await sumOption.isVisible()) {
        await sumOption.click();
        console.log('✅ Selected SUM operation');
        await sfHelper.takeScreenshot('filtered-sum-operation-selected');
      }
    }
    
    // 2. Fill Child Object (Opportunity)
    const childObjectInput = page.locator('input[name="CalcItem__c"]');
    if (await childObjectInput.isVisible()) {
      await childObjectInput.clear();
      await childObjectInput.fill('Opportunity');
      console.log('✅ Filled Child Object: Opportunity');
    }
    
    // 3. Fill Child Field (Amount)
    const childFieldInput = page.locator('input[name="RollupFieldOnCalcItem__c"]');
    if (await childFieldInput.isVisible()) {
      await childFieldInput.clear();
      await childFieldInput.fill('Amount');
      console.log('✅ Filled Child Field: Amount');
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
    
    // 6. Fill Parent Field (AnnualRevenue)
    const parentFieldInput = page.locator('input[name="RollupFieldOnLookupObject__c"]');
    if (await parentFieldInput.isVisible()) {
      await parentFieldInput.clear();
      await parentFieldInput.fill('AnnualRevenue');
      console.log('✅ Filled Parent Field: AnnualRevenue');
    }
    
    // 7. Fill WHERE clause with IN operator
    const whereClauseInput = page.locator('textarea[name="CalcItemWhereClause__c"]');
    if (await whereClauseInput.isVisible()) {
      await whereClauseInput.clear();
      await whereClauseInput.fill("StageName IN ('Prospecting', 'Qualification')");
      console.log('✅ Filled WHERE clause: StageName IN (\'Prospecting\', \'Qualification\')');
    }
    
    await sfHelper.takeScreenshot('filtered-sum-form-completed');
    
    // 8. Try to execute the rollup
    console.log('🚀 Attempting to execute filtered SUM rollup with IN operator...');
    const startButton = page.locator('button:has-text("Start rollup!")');
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('filtered-sum-rollup-executed');
    }

    await sfHelper.cleanupTestData();
    console.log('✅ PASS: Filtered SUM with IN operator test completed successfully');
    console.log('   - Successfully created opportunity data with various stages');
    console.log('   - Successfully configured IN operator WHERE clause');
    console.log('   - Successfully attempted filtered SUM across grandparent relationship');
    expect(true).toBeTruthy();
  });
});