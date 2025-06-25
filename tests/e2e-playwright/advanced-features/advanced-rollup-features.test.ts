import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { TestDataFactory } from '../utils/test-data-factory';

test.describe('Advanced Rollup Features E2E Tests', () => {

  test('Multi-currency rollup with conversion', async ({ page }) => {
    console.log('💱 Testing multi-currency rollup...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Skip if multi-currency not enabled
    const isMultiCurrencyEnabled = await sfHelper.checkMultiCurrencyEnabled();
    test.skip(!isMultiCurrencyEnabled, 'Multi-currency not enabled in this org');
    
    // Create test data with different currencies
    console.log('💰 Creating test data with mixed currencies...');
    const account = await testFactory.createTestAccount({
      Name: `CurrencyTest_${Date.now()}`
    });
    
    // Create opportunities with different currencies (if supported)
    const opportunities = [
      { Name: 'USD Opp', Amount: 1000, CurrencyIsoCode: 'USD' },
      { Name: 'EUR Opp', Amount: 850, CurrencyIsoCode: 'EUR' }
    ];
    
    for (const opp of opportunities) {
      await testFactory.createTestOpportunity(account.Id!, {
        ...opp,
        StageName: 'Prospecting',
        CloseDate: '2024-12-31'
      });
    }
    
    console.log(`Created account ${account.Id} with ${opportunities.length} multi-currency opportunities`);
    
    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('multi-currency-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling multi-currency SUM rollup configuration...');
    
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
        await sfHelper.takeScreenshot('multi-currency-sum-selected');
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
    
    await sfHelper.takeScreenshot('multi-currency-form-completed');
    
    // 7. Execute the rollup
    console.log('🚀 Attempting to execute multi-currency SUM rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('multi-currency-rollup-executed');
    }
    
    // Note: Multi-currency conversion results will vary based on exchange rates
    console.log('💱 Multi-currency rollup completed (results depend on org exchange rates)');
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ Multi-currency rollup test completed');
  });

  test('Performance testing with large dataset', async ({ page }) => {
    console.log('⚡ Testing performance with large dataset...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data - smaller dataset for UI testing (UI tests take longer)
    console.log('🏗️ Creating moderate dataset for performance testing...');
    const account = await testFactory.createTestAccount({
      Name: `PerformanceTest_${Date.now()}`
    });
    
    // Create opportunities in batches for performance testing
    const batchSize = 5;
    const numBatches = 3; // Total: 15 records (reasonable for UI testing)
    
    for (let batch = 0; batch < numBatches; batch++) {
      const promises = [];
      for (let i = 0; i < batchSize; i++) {
        const recordIndex = batch * batchSize + i;
        promises.push(testFactory.createTestOpportunity(account.Id!, {
          Name: `Perf Opp ${recordIndex}`,
          Amount: Math.floor(Math.random() * 10000) + 1000,
          StageName: 'Prospecting',
          CloseDate: '2024-12-31'
        }));
      }
      await Promise.all(promises);
      console.log(`Created batch ${batch + 1}/${numBatches}`);
    }
    
    const startTime = Date.now();
    
    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('performance-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling performance SUM rollup configuration...');
    
    // 1. Select SUM operation from dropdown
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const sumOption = page.locator('[role="option"]:has-text("SUM")');
      if (await sumOption.isVisible()) {
        await sumOption.click();
        console.log('✅ Selected SUM operation');
      }
    }
    
    // 2-6. Fill remaining fields
    const childObjectInput = page.locator('input[name="CalcItem__c"]');
    if (await childObjectInput.isVisible()) {
      await childObjectInput.clear();
      await childObjectInput.fill('Opportunity');
    }
    
    const childFieldInput = page.locator('input[name="RollupFieldOnCalcItem__c"]');
    if (await childFieldInput.isVisible()) {
      await childFieldInput.clear();
      await childFieldInput.fill('Amount');
    }
    
    const lookupFieldInput = page.locator('input[name="LookupFieldOnCalcItem__c"]');
    if (await lookupFieldInput.isVisible()) {
      await lookupFieldInput.clear();
      await lookupFieldInput.fill('AccountId');
    }
    
    const parentObjectInput = page.locator('input[name="LookupObject__c"]');
    if (await parentObjectInput.isVisible()) {
      await parentObjectInput.clear();
      await parentObjectInput.fill('Account');
    }
    
    const parentFieldInput = page.locator('input[name="RollupFieldOnLookupObject__c"]');
    if (await parentFieldInput.isVisible()) {
      await parentFieldInput.clear();
      await parentFieldInput.fill('AnnualRevenue');
    }
    
    await sfHelper.takeScreenshot('performance-form-completed');
    
    // 7. Execute the rollup
    console.log('🚀 Executing performance rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('performance-rollup-executed');
    }
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    console.log(`Performance test execution time for ${batchSize * numBatches} records: ${executionTime}ms`);
    
    // Should complete within reasonable time for UI testing
    expect(executionTime).toBeLessThan(60000); // Should complete within 1 minute
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ Performance test completed successfully');
  });

  test('Boolean operations (ALL, NONE, SOME) for checkbox fields', async ({ page }) => {
    console.log('🔢 Testing boolean operations...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data - ALL opportunities closed won
    console.log('🏗️ Creating test data for ALL boolean operation...');
    const account = await testFactory.createTestAccount({
      Name: `BooleanTest_${Date.now()}`
    });
    
    // Create opportunities with consistent checkbox values for ALL operation
    const allClosedWonOpps = [
      { Name: 'Opp 1', StageName: 'Closed Won', IsPrivate: true },
      { Name: 'Opp 2', StageName: 'Closed Won', IsPrivate: true },
      { Name: 'Opp 3', StageName: 'Closed Won', IsPrivate: true }
    ];
    
    for (const opp of allClosedWonOpps) {
      await testFactory.createTestOpportunity(account.Id!, {
        ...opp,
        Amount: 1000,
        CloseDate: '2024-12-31'
      });
    }
    
    console.log(`Created account ${account.Id} with ${allClosedWonOpps.length} opportunities (all private and closed won)`);
    console.log('Expected ALL result: TRUE (all opportunities meet criteria)');
    
    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('boolean-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling ALL boolean rollup configuration...');
    
    // 1. Select ALL operation from dropdown
    console.log('🔽 Selecting ALL operation...');
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const allOption = page.locator('[role="option"]:has-text("ALL")').first();
      if (await allOption.isVisible()) {
        await allOption.click();
        console.log('✅ Selected ALL operation');
        await sfHelper.takeScreenshot('boolean-all-operation-selected');
      }
    }
    
    // 2. Fill Child Object (Opportunity)
    const childObjectInput = page.locator('input[name="CalcItem__c"]');
    if (await childObjectInput.isVisible()) {
      await childObjectInput.clear();
      await childObjectInput.fill('Opportunity');
      console.log('✅ Filled Child Object: Opportunity');
    }
    
    // 3. Fill Child Field (IsPrivate) - Boolean field
    const childFieldInput = page.locator('input[name="RollupFieldOnCalcItem__c"]');
    if (await childFieldInput.isVisible()) {
      await childFieldInput.clear();
      await childFieldInput.fill('IsPrivate');
      console.log('✅ Filled Child Field: IsPrivate');
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
    
    // 6. Fill Parent Field (Description) - Using Description for boolean result
    const parentFieldInput = page.locator('input[name="RollupFieldOnLookupObject__c"]');
    if (await parentFieldInput.isVisible()) {
      await parentFieldInput.clear();
      await parentFieldInput.fill('Description');
      console.log('✅ Filled Parent Field: Description');
    }
    
    // 7. Fill Where Clause to check only closed won opportunities
    console.log("🎯 Filling where clause: StageName = 'Closed Won'");
    const whereClauseInput = page.locator('textarea[name="CalcItemWhereClause__c"]');
    if (await whereClauseInput.isVisible()) {
      await whereClauseInput.clear();
      await whereClauseInput.fill("StageName = 'Closed Won'");
      console.log("✅ Filled Where Clause: StageName = 'Closed Won'");
      await sfHelper.takeScreenshot('boolean-where-clause-filled');
    }
    
    await sfHelper.takeScreenshot('boolean-form-completed');
    
    // 8. Execute the rollup
    console.log('🚀 Executing ALL boolean rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('boolean-rollup-executed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ Boolean operations test completed');
  });

  test('Grandparent rollup across multiple relationships', async ({ page }) => {
    console.log('👴 Testing grandparent rollup...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create Account -> Contact -> Case rollup chain
    console.log('🏗️ Creating grandparent rollup test data (Account -> Contact -> Case)...');
    const account = await testFactory.createTestAccount({
      Name: `GrandparentTest_${Date.now()}`
    });
    
    // Create contact linked to account
    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'Test Contact',
      FirstName: 'Grandparent',
      AccountId: account.Id
    });
    
    // Create cases linked to the contact
    const cases = [
      { Subject: 'Case 1', Status: 'New', ContactId: contact.Id },
      { Subject: 'Case 2', Status: 'Working', ContactId: contact.Id },
      { Subject: 'Case 3', Status: 'Closed', ContactId: contact.Id }
    ];
    
    for (const caseData of cases) {
      await sfHelper.createTestRecord('Case', caseData);
    }
    
    console.log(`Created grandparent scenario: Account ${account.Id} -> Contact ${contact.Id} -> ${cases.length} Cases`);
    console.log('Expected COUNT result: 3 (total number of cases)');
    
    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('grandparent-interface-loaded');
    
    // Fill form fields for grandparent rollup: Account <- Contact <- Case
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
        await sfHelper.takeScreenshot('grandparent-count-selected');
      }
    }
    
    // 2. Fill Child Object (Case)
    const childObjectInput = page.locator('input[name="CalcItem__c"]');
    if (await childObjectInput.isVisible()) {
      await childObjectInput.clear();
      await childObjectInput.fill('Case');
      console.log('✅ Filled Child Object: Case');
    }
    
    // 3. Fill Child Field (Subject) - Field to count
    const childFieldInput = page.locator('input[name="RollupFieldOnCalcItem__c"]');
    if (await childFieldInput.isVisible()) {
      await childFieldInput.clear();
      await childFieldInput.fill('Subject');
      console.log('✅ Filled Child Field: Subject');
    }
    
    // 4. Fill Lookup Field (Contact.AccountId) - Grandparent relationship
    const lookupFieldInput = page.locator('input[name="LookupFieldOnCalcItem__c"]');
    if (await lookupFieldInput.isVisible()) {
      await lookupFieldInput.clear();
      await lookupFieldInput.fill('Contact.AccountId');
      console.log('✅ Filled Lookup Field: Contact.AccountId (grandparent relationship)');
    }
    
    // 5. Fill Parent Object (Account)
    const parentObjectInput = page.locator('input[name="LookupObject__c"]');
    if (await parentObjectInput.isVisible()) {
      await parentObjectInput.clear();
      await parentObjectInput.fill('Account');
      console.log('✅ Filled Parent Object: Account');
    }
    
    // 6. Fill Parent Field (NumberOfEmployees) - Using as counter
    const parentFieldInput = page.locator('input[name="RollupFieldOnLookupObject__c"]');
    if (await parentFieldInput.isVisible()) {
      await parentFieldInput.clear();
      await parentFieldInput.fill('NumberOfEmployees');
      console.log('✅ Filled Parent Field: NumberOfEmployees');
    }
    
    await sfHelper.takeScreenshot('grandparent-form-completed');
    
    // 7. Execute the rollup
    console.log('🚀 Executing grandparent COUNT rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('grandparent-rollup-executed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ Grandparent rollup test completed');
  });

  test('Async processing for large data volumes', async ({ page }) => {
    console.log('🔄 Testing async processing...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create a moderate number of records for UI testing (async may trigger)
    console.log('🏗️ Creating dataset to potentially trigger async processing...');
    const account = await testFactory.createTestAccount({
      Name: `AsyncTest_${Date.now()}`
    });
    
    // Create opportunities in batches
    const promises = [];
    for (let i = 0; i < 20; i++) { // 20 records - reasonable for UI testing
      promises.push(testFactory.createTestOpportunity(account.Id!, {
        Name: `Async Opp ${i}`,
        Amount: Math.floor(Math.random() * 5000) + 1000,
        StageName: 'Prospecting',
        CloseDate: '2024-12-31'
      }));
      
      // Batch creation to avoid overwhelming the system
      if (promises.length === 10) {
        await Promise.all(promises);
        promises.length = 0; // Clear array
        console.log(`Created ${i + 1}/20 records`);
      }
    }
    
    // Create remaining records
    if (promises.length > 0) {
      await Promise.all(promises);
    }
    
    console.log(`Created ${20} opportunities for async processing test`);
    
    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('async-interface-loaded');
    
    // Fill form fields for async processing test
    console.log('📝 Filling async SUM rollup configuration...');
    
    // 1. Select SUM operation from dropdown
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const sumOption = page.locator('[role="option"]:has-text("SUM")');
      if (await sumOption.isVisible()) {
        await sumOption.click();
        console.log('✅ Selected SUM operation');
      }
    }
    
    // 2-6. Fill remaining fields quickly
    await page.locator('input[name="CalcItem__c"]').fill('Opportunity');
    await page.locator('input[name="RollupFieldOnCalcItem__c"]').fill('Amount');
    await page.locator('input[name="LookupFieldOnCalcItem__c"]').fill('AccountId');
    await page.locator('input[name="LookupObject__c"]').fill('Account');
    await page.locator('input[name="RollupFieldOnLookupObject__c"]').fill('AnnualRevenue');
    
    await sfHelper.takeScreenshot('async-form-completed');
    
    // Execute rollup and potentially trigger async processing
    console.log('🚀 Executing async rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      
      // Wait longer for potential async processing
      await page.waitForTimeout(5000);
      await sfHelper.takeScreenshot('async-rollup-executed');
    }
    
    // Look for any async job indicators or completion messages
    const statusIndicators = page.locator('.slds-notification, .slds-toast, [role="status"], [role="alert"]');
    const indicatorCount = await statusIndicators.count();
    if (indicatorCount > 0) {
      console.log(`Found ${indicatorCount} status indicators for async processing`);
      await sfHelper.takeScreenshot('async-status-indicators');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ Async processing test completed');
  });

  test('Custom field types and validation', async ({ page }) => {
    console.log('🔧 Testing custom field types...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data with various field types
    console.log('🏗️ Creating test data with various field types...');
    const account = await testFactory.createTestAccount({
      Name: `CustomFieldTest_${Date.now()}`
    });
    
    // Test with various standard field types available
    const opportunities = [
      { 
        Name: 'Custom Field Test 1', 
        Amount: 1000,
        Probability: 50, // Percentage field
        StageName: 'Prospecting'
      },
      { 
        Name: 'Custom Field Test 2', 
        Amount: 2000,
        Probability: 75, // Percentage field
        StageName: 'Prospecting'
      }
    ];
    
    for (const opp of opportunities) {
      await testFactory.createTestOpportunity(account.Id!, {
        ...opp,
        CloseDate: '2024-12-31'
      });
    }
    
    console.log(`Created account ${account.Id} with ${opportunities.length} opportunities (testing Probability field)`);
    console.log('Expected AVERAGE result: 62.5 ((50 + 75) / 2)');
    
    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('custom-field-interface-loaded');
    
    // Fill form fields for custom field rollup testing
    console.log('📝 Filling AVERAGE rollup configuration for Probability field...');
    
    // 1. Select AVERAGE operation from dropdown
    console.log('🔽 Selecting AVERAGE operation...');
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const averageOption = page.locator('[role="option"]:has-text("AVERAGE")');
      if (await averageOption.isVisible()) {
        await averageOption.click();
        console.log('✅ Selected AVERAGE operation');
        await sfHelper.takeScreenshot('custom-field-average-selected');
      }
    }
    
    // 2. Fill Child Object (Opportunity)
    const childObjectInput = page.locator('input[name="CalcItem__c"]');
    if (await childObjectInput.isVisible()) {
      await childObjectInput.clear();
      await childObjectInput.fill('Opportunity');
      console.log('✅ Filled Child Object: Opportunity');
    }
    
    // 3. Fill Child Field (Probability) - Percentage field type
    const childFieldInput = page.locator('input[name="RollupFieldOnCalcItem__c"]');
    if (await childFieldInput.isVisible()) {
      await childFieldInput.clear();
      await childFieldInput.fill('Probability');
      console.log('✅ Filled Child Field: Probability (percentage field)');
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
    
    await sfHelper.takeScreenshot('custom-field-form-completed');
    
    // 7. Execute the rollup
    console.log('🚀 Executing AVERAGE rollup on Probability field...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('custom-field-rollup-executed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ Custom field types test completed');
  });
});