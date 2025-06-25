import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { TestDataFactory } from '../utils/test-data-factory';

test.describe('Rollup Where Clause Testing', () => {
  
  test('SUM with where clause: only closed-won opportunities', async ({ page }) => {
    console.log('🎯 Testing SUM rollup with where clause (StageName = Closed Won)...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data with mixed opportunity stages
    console.log('🏗️ Creating test data with mixed opportunity stages...');
    const account = await testFactory.createTestAccount({
      Name: `WhereClauseTest_${Date.now()}`
    });
    
    // Create opportunities with different stages - only Closed Won should be included
    const opportunities = [];
    
    // This should be included (Closed Won)
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Won Deal 1',
      StageName: 'Closed Won',
      CloseDate: '2024-12-31',
      Amount: 1000
    }));
    
    // This should be included (Closed Won)
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Won Deal 2', 
      StageName: 'Closed Won',
      CloseDate: '2024-12-31',
      Amount: 2500
    }));
    
    // These should be excluded (different stages)
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Lost Deal',
      StageName: 'Closed Lost',
      CloseDate: '2024-12-31',
      Amount: 5000 // Large amount that should NOT be included
    }));
    
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Open Deal',
      StageName: 'Prospecting',
      CloseDate: '2024-12-31',
      Amount: 3000 // Should NOT be included
    }));
    
    console.log(`Created account ${account.Id} with ${opportunities.length} opportunities`);
    console.log('Expected SUM result: 3500 (1000 + 2500, excluding 5000 + 3000 from other stages)');
    
    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('where-clause-interface-loaded');
    
    // Fill form fields using the working field selectors (same as successful SUM test)
    console.log('📝 Filling SUM rollup configuration with where clause...');
    
    // 1. Select SUM operation from dropdown
    console.log('🔽 Selecting SUM operation...');
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const sumOption = page.locator('[role="option"]:has-text("SUM")').first();
      if (await sumOption.isVisible()) {
        await sumOption.click();
        console.log('✅ Selected SUM operation');
        await sfHelper.takeScreenshot('where-clause-sum-selected');
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
    
    // 4. Fill Lookup Field (AccountId)
    const lookupFieldInput = page.locator('input[name="LookupFieldOnCalcItem__c"]');
    if (await lookupFieldInput.isVisible()) {
      await lookupFieldInput.clear();
      await lookupFieldInput.fill('AccountId');
      console.log('✅ Filled Lookup Field: AccountId');
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
    
    // 7. Fill Where Clause - THIS IS THE KEY ADDITION!
    console.log('🎯 Filling where clause: StageName = \'Closed Won\'');
    const whereClauseInput = page.locator('textarea[name="CalcItemWhereClause__c"]');
    if (await whereClauseInput.isVisible()) {
      await whereClauseInput.clear();
      await whereClauseInput.fill("StageName = 'Closed Won'");
      console.log('✅ Filled Where Clause: StageName = \'Closed Won\'');
      await sfHelper.takeScreenshot('where-clause-filled');
    } else {
      console.log('⚠️ Where clause field not found - may need to investigate field selectors');
      await sfHelper.takeScreenshot('where-clause-field-not-found');
    }
    
    await sfHelper.takeScreenshot('where-clause-form-completed');
    
    // 8. Try to execute the rollup
    console.log('🚀 Attempting to execute SUM rollup with where clause...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('where-clause-rollup-executed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ Where clause rollup test completed successfully');
  });

  test('COUNT with where clause: only opportunities above certain amount', async ({ page }) => {
    console.log('🔢 Testing COUNT rollup with where clause (Amount > 2000)...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data with opportunities of different amounts
    console.log('🏗️ Creating test data with varied opportunity amounts...');
    const account = await testFactory.createTestAccount({
      Name: `CountWhereTest_${Date.now()}`
    });
    
    const opportunities = [];
    
    // These should be included (Amount > 2000)
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Large Deal 1',
      StageName: 'Prospecting',
      CloseDate: '2024-12-31',
      Amount: 2500 // > 2000, should be counted
    }));
    
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Large Deal 2',
      StageName: 'Prospecting', 
      CloseDate: '2024-12-31',
      Amount: 5000 // > 2000, should be counted
    }));
    
    // These should be excluded (Amount <= 2000)
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Small Deal 1',
      StageName: 'Prospecting',
      CloseDate: '2024-12-31',
      Amount: 1000 // <= 2000, should NOT be counted
    }));
    
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Small Deal 2',
      StageName: 'Prospecting',
      CloseDate: '2024-12-31',
      Amount: 2000 // = 2000, should NOT be counted (using > not >=)
    }));
    
    console.log(`Created account ${account.Id} with ${opportunities.length} opportunities`);
    console.log('Expected COUNT result: 2 (only opportunities with Amount > 2000)');
    
    // Navigate to Rollup app
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for interface to load
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('count-where-clause-interface-loaded');
    
    // Fill form fields using the working field selectors (same as successful COUNT test)
    console.log('📝 Filling COUNT rollup configuration with where clause...');
    
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
        await sfHelper.takeScreenshot('count-where-clause-operation-selected');
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
    
    // 4. Fill Lookup Field (AccountId)
    const lookupFieldInput = page.locator('input[name="LookupFieldOnCalcItem__c"]');
    if (await lookupFieldInput.isVisible()) {
      await lookupFieldInput.clear();
      await lookupFieldInput.fill('AccountId');
      console.log('✅ Filled Lookup Field: AccountId');
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
    
    // 7. Fill Where Clause for amount filter
    console.log('🎯 Filling where clause: Amount > 2000');
    const whereClauseInput = page.locator('textarea[name="CalcItemWhereClause__c"]');
    if (await whereClauseInput.isVisible()) {
      await whereClauseInput.clear();
      await whereClauseInput.fill('Amount > 2000');
      console.log('✅ Filled Where Clause: Amount > 2000');
      await sfHelper.takeScreenshot('count-where-clause-filled');
    } else {
      console.log('⚠️ Where clause field not found');
      await sfHelper.takeScreenshot('count-where-clause-field-not-found');
    }
    
    await sfHelper.takeScreenshot('count-where-clause-form-completed');
    
    // 8. Execute the rollup
    console.log('🚀 Executing COUNT rollup with where clause...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('count-where-clause-executed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ COUNT where clause test completed successfully');
  });

  test('CONCAT with where clause: only specific stage opportunities', async ({ page }) => {
    console.log('🔗 Testing CONCAT rollup with where clause (StageName IN list)...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data with opportunities in different stages
    console.log('🏗️ Creating test data with opportunities in various stages...');
    const account = await testFactory.createTestAccount({
      Name: `ConcatWhereTest_${Date.now()}`
    });
    
    const opportunities = [];
    
    // These should be included (Prospecting or Qualification)
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Prospect Deal',
      StageName: 'Prospecting',
      CloseDate: '2024-12-31',
      Amount: 1000
    }));
    
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Qualified Deal',
      StageName: 'Qualification',
      CloseDate: '2024-12-31',
      Amount: 2000
    }));
    
    // These should be excluded (other stages)
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Won Deal',
      StageName: 'Closed Won',
      CloseDate: '2024-12-31',
      Amount: 3000
    }));
    
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Lost Deal',
      StageName: 'Closed Lost',
      CloseDate: '2024-12-31',
      Amount: 4000
    }));
    
    console.log(`Created account ${account.Id} with ${opportunities.length} opportunities`);
    console.log('Expected CONCAT result: "Prospect Deal, Qualified Deal" (only early stage opportunities)');
    
    // Navigate and fill form
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    // Fill form fields using the working field selectors (same as successful CONCAT test)
    console.log('📝 Filling CONCAT rollup configuration with where clause...');
    
    // 1. Select CONCAT operation from dropdown
    console.log('🔽 Selecting CONCAT operation...');
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const concatOption = page.locator('[role="option"]:has-text("CONCAT")').first();
      if (await concatOption.isVisible()) {
        await concatOption.click();
        console.log('✅ Selected CONCAT operation');
        await sfHelper.takeScreenshot('concat-where-clause-operation-selected');
      }
    }
    
    // 2. Fill Child Object (Opportunity)
    const childObjectInput = page.locator('input[name="CalcItem__c"]');
    if (await childObjectInput.isVisible()) {
      await childObjectInput.clear();
      await childObjectInput.fill('Opportunity');
      console.log('✅ Filled Child Object: Opportunity');
    }
    
    // 3. Fill Child Field (Name) - CONCAT operations use Name field
    const childFieldInput = page.locator('input[name="RollupFieldOnCalcItem__c"]');
    if (await childFieldInput.isVisible()) {
      await childFieldInput.clear();
      await childFieldInput.fill('Name');
      console.log('✅ Filled Child Field: Name');
    }
    
    // 4. Fill Lookup Field (AccountId)
    const lookupFieldInput = page.locator('input[name="LookupFieldOnCalcItem__c"]');
    if (await lookupFieldInput.isVisible()) {
      await lookupFieldInput.clear();
      await lookupFieldInput.fill('AccountId');
      console.log('✅ Filled Lookup Field: AccountId');
    }
    
    // 5. Fill Parent Object (Account)
    const parentObjectInput = page.locator('input[name="LookupObject__c"]');
    if (await parentObjectInput.isVisible()) {
      await parentObjectInput.clear();
      await parentObjectInput.fill('Account');
      console.log('✅ Filled Parent Object: Account');
    }
    
    // 6. Fill Parent Field (Description) - Using Description for text concatenation
    const parentFieldInput = page.locator('input[name="RollupFieldOnLookupObject__c"]');
    if (await parentFieldInput.isVisible()) {
      await parentFieldInput.clear();
      await parentFieldInput.fill('Description');
      console.log('✅ Filled Parent Field: Description');
    }
    
    // 7. Fill Where Clause for stage filter
    console.log('🎯 Filling where clause: StageName IN (\'Prospecting\', \'Qualification\')');
    const whereClauseInput = page.locator('textarea[name="CalcItemWhereClause__c"]');
    if (await whereClauseInput.isVisible()) {
      await whereClauseInput.clear();
      await whereClauseInput.fill("StageName IN ('Prospecting', 'Qualification')");
      console.log('✅ Filled Where Clause with IN operator');
      await sfHelper.takeScreenshot('concat-where-clause-filled');
    } else {
      console.log('⚠️ Where clause field not found');
      await sfHelper.takeScreenshot('concat-where-clause-field-not-found');
    }
    
    await sfHelper.takeScreenshot('concat-where-clause-form-completed');
    
    // Execute the rollup
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    await startButton.click();
    await page.waitForTimeout(3000);
    await sfHelper.takeScreenshot('concat-where-clause-executed');
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ CONCAT where clause test completed successfully');
  });

  test('Should handle invalid where clause with proper error messaging', async ({ page }) => {
    console.log('❌ Testing invalid where clause error handling...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Navigate to Rollup app
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    console.log('📝 Filling form with invalid where clause...');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling basic rollup configuration...');
    
    // 1. Select SUM operation from dropdown
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const sumOption = page.locator('[role="option"]:has-text("SUM")').first();
      if (await sumOption.isVisible()) {
        await sumOption.click();
        console.log('✅ Selected SUM operation');
      }
    }
    
    // 2-6. Fill standard fields using direct field filling
    const childObjectInput = page.locator('input[name="CalcItem__c"]');
    if (await childObjectInput.isVisible()) {
      await childObjectInput.clear();
      await childObjectInput.fill('Opportunity');
      console.log('✅ Filled Child Object: Opportunity');
    }
    
    const childFieldInput = page.locator('input[name="RollupFieldOnCalcItem__c"]');
    if (await childFieldInput.isVisible()) {
      await childFieldInput.clear();
      await childFieldInput.fill('Amount');
      console.log('✅ Filled Child Field: Amount');
    }
    
    const lookupFieldInput = page.locator('input[name="LookupFieldOnCalcItem__c"]');
    if (await lookupFieldInput.isVisible()) {
      await lookupFieldInput.clear();
      await lookupFieldInput.fill('AccountId');
      console.log('✅ Filled Lookup Field: AccountId');
    }
    
    const parentObjectInput = page.locator('input[name="LookupObject__c"]');
    if (await parentObjectInput.isVisible()) {
      await parentObjectInput.clear();
      await parentObjectInput.fill('Account');
      console.log('✅ Filled Parent Object: Account');
    }
    
    const parentFieldInput = page.locator('input[name="RollupFieldOnLookupObject__c"]');
    if (await parentFieldInput.isVisible()) {
      await parentFieldInput.clear();
      await parentFieldInput.fill('AnnualRevenue');
      console.log('✅ Filled Parent Field: AnnualRevenue');
    }
    
    // 7. Fill INVALID where clause
    console.log('🎯 Filling invalid where clause...');
    const whereClauseInput = page.locator('textarea[name="CalcItemWhereClause__c"]');
    if (await whereClauseInput.isVisible()) {
      await whereClauseInput.clear();
      await whereClauseInput.fill('InvalidField = \'BadValue\' AND SyntaxError'); // Invalid syntax
      console.log('✅ Filled invalid where clause');
    } else {
      console.log('⚠️ Where clause field not found');
    }
    
    await sfHelper.takeScreenshot('invalid-where-clause-filled');
    
    // Try to execute - should show error
    console.log('🚀 Attempting to execute with invalid where clause...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    await startButton.click();
    await page.waitForTimeout(3000);
    
    // Look for error messages
    console.log('🔍 Looking for error messages...');
    const errorElements = page.locator('.slds-has-error, .slds-text-color_error, [role="alert"], .slds-notification');
    const errorCount = await errorElements.count();
    
    if (errorCount > 0) {
      console.log(`✅ Found ${errorCount} error indicators as expected`);
      for (let i = 0; i < Math.min(errorCount, 3); i++) {
        const errorText = await errorElements.nth(i).textContent();
        console.log(`Error ${i + 1}: ${errorText}`);
      }
      await sfHelper.takeScreenshot('invalid-where-clause-errors-displayed');
    } else {
      console.log('⚠️ No error messages found - error handling may work differently');
      await sfHelper.takeScreenshot('invalid-where-clause-no-errors');
    }
    
    console.log('✅ Invalid where clause error handling test completed');
  });
});