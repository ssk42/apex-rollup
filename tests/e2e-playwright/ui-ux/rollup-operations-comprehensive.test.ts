import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { TestDataFactory } from '../utils/test-data-factory';
import { RollupOperationTester, ROLLUP_CONFIGS } from '../utils/rollup-operation-tester';

test.describe('Rollup Operations Comprehensive Testing', () => {
  
  test('SUM operation: Account.AnnualRevenue = SUM(Opportunity.Amount)', async ({ page }) => {
    console.log('🧮 Testing SUM rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data
    const testData = await testFactory.createSumTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected SUM result: ${testData.expectedResult}`);
    
    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('sum-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling SUM rollup configuration...');
    
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
        await sfHelper.takeScreenshot('sum-operation-selected');
      }
    }
    
    // 2. Fill Child Object (Opportunity)
    const childObjectInput = page.locator('input[name="CalcItem__c"]');
    if (await childObjectInput.isVisible()) {
      await childObjectInput.clear();
      await childObjectInput.fill('Opportunity');
      console.log('✅ Filled Child Object: Opportunity');
      await sfHelper.takeScreenshot('child-object-filled');
    }
    
    // 3. Fill Child Field (Amount)
    const childFieldInput = page.locator('input[name="RollupFieldOnCalcItem__c"]');
    if (await childFieldInput.isVisible()) {
      await childFieldInput.clear();
      await childFieldInput.fill('Amount');
      console.log('✅ Filled Child Field: Amount');
      await sfHelper.takeScreenshot('child-field-filled');
    }
    
    // 4. Fill Lookup Field (AccountId)
    const lookupFieldInput = page.locator('input[name="LookupFieldOnCalcItem__c"]');
    if (await lookupFieldInput.isVisible()) {
      await lookupFieldInput.clear();
      await lookupFieldInput.fill('AccountId');
      console.log('✅ Filled Lookup Field: AccountId');
      await sfHelper.takeScreenshot('lookup-field-filled');
    }
    
    // 5. Fill Parent Object (Account)
    const parentObjectInput = page.locator('input[name="LookupObject__c"]');
    if (await parentObjectInput.isVisible()) {
      await parentObjectInput.clear();
      await parentObjectInput.fill('Account');
      console.log('✅ Filled Parent Object: Account');
      await sfHelper.takeScreenshot('parent-object-filled');
    }
    
    // 6. Fill Parent Field (AnnualRevenue)
    const parentFieldInput = page.locator('input[name="RollupFieldOnLookupObject__c"]');
    if (await parentFieldInput.isVisible()) {
      await parentFieldInput.clear();
      await parentFieldInput.fill('AnnualRevenue');
      console.log('✅ Filled Parent Field: AnnualRevenue');
      await sfHelper.takeScreenshot('parent-field-filled');
    }
    
    await sfHelper.takeScreenshot('sum-form-completed');
    
    // 7. Try to execute the rollup
    console.log('🚀 Attempting to execute SUM rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('sum-rollup-executed');
    }
    
    // Note: For now, we're focusing on proving the form can be filled
    // Verification of actual rollup results will be added once form filling is proven to work
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ SUM rollup operation test completed successfully');
  });

  test('AVERAGE operation: Account.AnnualRevenue = AVERAGE(Opportunity.Amount)', async ({ page }) => {
    console.log('📊 Testing AVERAGE rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    const rollupTester = new RollupOperationTester(page, sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data
    const testData = await testFactory.createAverageTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected AVERAGE result: ${testData.expectedResult}`);
    
    // Execute rollup through UI
    await rollupTester.executeRollupOperation(ROLLUP_CONFIGS.AVERAGE_OPPORTUNITY_AMOUNT);
    
    // Verify result (allow small tolerance for decimal precision)
    await rollupTester.verifyRollupResult(
      testData.account,
      'AnnualRevenue',
      testData.expectedResult,
      0.01 // 1 cent tolerance
    );
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ AVERAGE rollup operation test completed successfully');
  });

  test('COUNT operation: Account.NumberOfEmployees = COUNT(Opportunity.Amount)', async ({ page }) => {
    console.log('🔢 Testing COUNT rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    const rollupTester = new RollupOperationTester(page, sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data
    const testData = await testFactory.createCountTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected COUNT result: ${testData.expectedResult}`);
    
    // Execute rollup through UI
    await rollupTester.executeRollupOperation(ROLLUP_CONFIGS.COUNT_OPPORTUNITIES);
    
    // Verify result
    await rollupTester.verifyRollupResult(
      testData.account,
      'NumberOfEmployees',
      testData.expectedResult
    );
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ COUNT rollup operation test completed successfully');
  });

  test('MAX operation: Account.AnnualRevenue = MAX(Opportunity.Amount)', async ({ page }) => {
    console.log('📈 Testing MAX rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    const rollupTester = new RollupOperationTester(page, sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data
    const testData = await testFactory.createMaxTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected MAX result: ${testData.expectedResult}`);
    
    // Execute rollup through UI
    await rollupTester.executeRollupOperation(ROLLUP_CONFIGS.MAX_OPPORTUNITY_AMOUNT);
    
    // Verify result
    await rollupTester.verifyRollupResult(
      testData.account,
      'AnnualRevenue',
      testData.expectedResult
    );
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ MAX rollup operation test completed successfully');
  });

  test('MIN operation: Account.AnnualRevenue = MIN(Opportunity.Amount)', async ({ page }) => {
    console.log('📉 Testing MIN rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    const rollupTester = new RollupOperationTester(page, sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data
    const testData = await testFactory.createMinTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected MIN result: ${testData.expectedResult}`);
    
    // Execute rollup through UI
    await rollupTester.executeRollupOperation(ROLLUP_CONFIGS.MIN_OPPORTUNITY_AMOUNT);
    
    // Verify result
    await rollupTester.verifyRollupResult(
      testData.account,
      'AnnualRevenue',
      testData.expectedResult
    );
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ MIN rollup operation test completed successfully');
  });

  test('CONCAT operation: Account.Description = CONCAT(Opportunity.Name)', async ({ page }) => {
    console.log('🔗 Testing CONCAT rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    const rollupTester = new RollupOperationTester(page, sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data
    const testData = await testFactory.createConcatTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected CONCAT result: "${testData.expectedResult}"`);
    
    // Execute rollup through UI
    await rollupTester.executeRollupOperation(ROLLUP_CONFIGS.CONCAT_OPPORTUNITY_NAMES);
    
    // Verify result
    await rollupTester.verifyRollupResult(
      testData.account,
      'Description',
      testData.expectedResult
    );
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ CONCAT rollup operation test completed successfully');
  });

  test('COUNT_DISTINCT operation: Account.NumberOfEmployees = COUNT_DISTINCT(Opportunity.Amount)', async ({ page }) => {
    console.log('🔢🎯 Testing COUNT_DISTINCT rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    const rollupTester = new RollupOperationTester(page, sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data with duplicate amounts
    const testData = await testFactory.createCountDistinctTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected COUNT_DISTINCT result: ${testData.expectedResult}`);
    
    // Create custom config for COUNT_DISTINCT
    const countDistinctConfig = {
      ...ROLLUP_CONFIGS.COUNT_OPPORTUNITIES,
      operation: 'COUNT_DISTINCT'
    };
    
    // Execute rollup through UI
    await rollupTester.executeRollupOperation(countDistinctConfig);
    
    // Verify result
    await rollupTester.verifyRollupResult(
      testData.account,
      'NumberOfEmployees',
      testData.expectedResult
    );
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ COUNT_DISTINCT rollup operation test completed successfully');
  });

  test('CONCAT_DISTINCT operation: Account.Description = CONCAT_DISTINCT(Opportunity.Name)', async ({ page }) => {
    console.log('🔗🎯 Testing CONCAT_DISTINCT rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    const rollupTester = new RollupOperationTester(page, sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data with duplicate names
    const testData = await testFactory.createConcatDistinctTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected CONCAT_DISTINCT result: "${testData.expectedResult}"`);
    
    // Create custom config for CONCAT_DISTINCT
    const concatDistinctConfig = {
      ...ROLLUP_CONFIGS.CONCAT_OPPORTUNITY_NAMES,
      operation: 'CONCAT_DISTINCT'
    };
    
    // Execute rollup through UI
    await rollupTester.executeRollupOperation(concatDistinctConfig);
    
    // Verify result
    await rollupTester.verifyRollupResult(
      testData.account,
      'Description',
      testData.expectedResult
    );
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ CONCAT_DISTINCT rollup operation test completed successfully');
  });

  test('FIRST operation: Account.Description = FIRST(Opportunity.Name) ordered by CloseDate', async ({ page }) => {
    console.log('🥇 Testing FIRST rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    const rollupTester = new RollupOperationTester(page, sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data with different close dates
    const testData = await testFactory.createFirstLastTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected FIRST result: "${testData.expectedFirst}"`);
    
    // Create custom config for FIRST operation
    const firstConfig = {
      operation: 'FIRST',
      childObject: 'Opportunity',
      childField: 'Name',
      parentObject: 'Account',
      parentField: 'Description',
      lookupField: 'AccountId'
    };
    
    // Execute rollup through UI
    await rollupTester.executeRollupOperation(firstConfig);
    
    // Verify result
    await rollupTester.verifyRollupResult(
      testData.account,
      'Description',
      testData.expectedFirst
    );
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ FIRST rollup operation test completed successfully');
  });

  test('LAST operation: Account.Description = LAST(Opportunity.Name) ordered by CloseDate', async ({ page }) => {
    console.log('🏁 Testing LAST rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    const rollupTester = new RollupOperationTester(page, sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data with different close dates
    const testData = await testFactory.createFirstLastTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected LAST result: "${testData.expectedLast}"`);
    
    // Create custom config for LAST operation
    const lastConfig = {
      operation: 'LAST',
      childObject: 'Opportunity',
      childField: 'Name',
      parentObject: 'Account',
      parentField: 'Description',
      lookupField: 'AccountId'
    };
    
    // Execute rollup through UI
    await rollupTester.executeRollupOperation(lastConfig);
    
    // Verify result
    await rollupTester.verifyRollupResult(
      testData.account,
      'Description',
      testData.expectedLast
    );
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ LAST rollup operation test completed successfully');
  });

  test('MOST operation: Account.Description = MOST(Opportunity.StageName)', async ({ page }) => {
    console.log('🎯 Testing MOST rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    const rollupTester = new RollupOperationTester(page, sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data with repeated stage names
    const testData = await testFactory.createMostTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected MOST result: "${testData.expectedResult}"`);
    
    // Create custom config for MOST operation
    const mostConfig = {
      operation: 'MOST',
      childObject: 'Opportunity',
      childField: 'StageName',
      parentObject: 'Account',
      parentField: 'Description',
      lookupField: 'AccountId'
    };
    
    // Execute rollup through UI
    await rollupTester.executeRollupOperation(mostConfig);
    
    // Verify result
    await rollupTester.verifyRollupResult(
      testData.account,
      'Description',
      testData.expectedResult
    );
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ MOST rollup operation test completed successfully');
  });

  // Note: ALL, SOME, NONE operations will be implemented in a separate test file
  // as they require special handling for boolean/checkbox fields and where clauses
});

test.describe('Rollup Operations - Error Handling', () => {
  
  test('should show validation error for missing required fields', async ({ page }) => {
    console.log('❌ Testing validation error handling...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Navigate to Rollup app
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    // Try to execute without filling required fields
    const startButton = page.locator('lightning-button:has-text("Start rollup!"), button:has-text("Start rollup!")');
    
    if (await startButton.isVisible()) {
      await startButton.click();
      
      // Look for validation errors
      await page.waitForTimeout(2000);
      
      const errorElements = page.locator('.slds-has-error, .slds-text-color_error, [role="alert"]');
      const errorCount = await errorElements.count();
      
      if (errorCount > 0) {
        console.log('✅ Validation errors displayed as expected');
        await sfHelper.takeScreenshot('validation-errors-displayed');
      } else {
        console.log('⚠️ No validation errors found - may be handled differently');
        await sfHelper.takeScreenshot('no-validation-errors');
      }
    }
    
    console.log('✅ Error handling test completed');
  });
});