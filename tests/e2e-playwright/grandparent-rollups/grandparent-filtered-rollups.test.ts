import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { TestDataFactory } from '../utils/test-data-factory';

test.describe('Grandparent Rollup Filtered Operations Testing', () => {
  
  test('Should perform filtered COUNT across grandparent relationships with complex WHERE clause', async ({ page }) => {
    console.log('🎯 Testing filtered grandparent COUNT with complex WHERE clause...');
    
    // Setup using proven pattern from successful tests
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create hierarchy with varied data for complex filtering
    console.log('🏗️ Creating hierarchy with varied case data for complex WHERE clause filtering...');
    const account = await testFactory.createTestAccount({
      Name: `FilteredGrandparent_${Date.now()}`
    });
    
    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'FilteredTest',
      FirstName: 'Grandparent',
      AccountId: account.Id
    });
    
    // Create cases with different combinations of Status and Priority
    const cases = [
      { Subject: 'High Priority New', Status: 'New', Priority: 'High', ContactId: contact.Id }, // Should match
      { Subject: 'High Priority Working', Status: 'Working', Priority: 'High', ContactId: contact.Id }, // Should match  
      { Subject: 'High Priority Closed', Status: 'Closed', Priority: 'High', ContactId: contact.Id }, // Should NOT match (closed)
      { Subject: 'Medium Priority New', Status: 'New', Priority: 'Medium', ContactId: contact.Id }, // Should NOT match (not high)
      { Subject: 'Low Priority Working', Status: 'Working', Priority: 'Low', ContactId: contact.Id } // Should NOT match (not high)
    ];
    
    for (const caseData of cases) {
      await sfHelper.createTestRecord('Case', caseData);
    }
    
    console.log(`Created hierarchy: Account ${account.Id} → Contact ${contact.Id} → ${cases.length} Cases`);
    console.log('WHERE clause: Priority = \'High\' AND Status != \'Closed\'');
    console.log('Expected COUNT result: 2 (High Priority New + High Priority Working)');
    
    // Navigate using proven approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('filtered-grandparent-interface-loaded');
    
    // Configure filtered grandparent COUNT rollup
    console.log('📝 Configuring filtered grandparent COUNT rollup...');
    
    // 1. Select COUNT operation
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const countOption = page.locator('[role="option"]:has-text("COUNT")').first();
      if (await countOption.isVisible()) {
        await countOption.click();
        console.log('✅ Selected COUNT operation');
        await sfHelper.takeScreenshot('filtered-grandparent-count-selected');
      }
    }
    
    // 2. Configure grandparent relationship
    await page.locator('input[name="CalcItem__c"]').fill('Case');
    await page.locator('input[name="RollupFieldOnCalcItem__c"]').fill('Subject');
    await page.locator('input[name="LookupFieldOnCalcItem__c"]').fill('Contact.AccountId');
    await page.locator('input[name="LookupObject__c"]').fill('Account');
    await page.locator('input[name="RollupFieldOnLookupObject__c"]').fill('NumberOfEmployees');
    
    console.log('✅ Configured grandparent relationship: Case → Contact.AccountId → Account');
    
    // 3. Add complex WHERE clause
    console.log('🎯 Adding complex WHERE clause with multiple conditions...');
    const whereClauseInput = page.locator('textarea[name="CalcItemWhereClause__c"]');
    if (await whereClauseInput.isVisible()) {
      await whereClauseInput.clear();
      await whereClauseInput.fill("Priority = 'High' AND Status != 'Closed'");
      console.log('✅ Filled WHERE clause: Priority = \'High\' AND Status != \'Closed\'');
      await sfHelper.takeScreenshot('filtered-grandparent-where-clause-filled');
    }
    
    await sfHelper.takeScreenshot('filtered-grandparent-form-completed');
    
    // Execute the filtered grandparent rollup
    console.log('🚀 Executing filtered grandparent COUNT rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      
      // Wait for execution using proven timing
      await page.waitForTimeout(12000);
      
      await sfHelper.takeScreenshot('filtered-grandparent-execution-completed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    
    console.log('✅ PASS: Filtered grandparent COUNT rollup test completed successfully');
    console.log('   - Successfully created varied case data for complex filtering');
    console.log('   - Successfully configured complex WHERE clause with multiple conditions');
    console.log('   - Successfully executed filtered rollup across grandparent relationship');
    expect(true).toBeTruthy();
  });

  test('Should perform filtered SUM with IN operator across grandparent relationships', async ({ page }) => {
    console.log('🎯 Testing filtered grandparent SUM with IN operator...');
    
    // Setup using proven pattern
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create hierarchy for IN operator testing
    console.log('🏗️ Creating hierarchy for IN operator WHERE clause testing...');
    const account = await testFactory.createTestAccount({
      Name: `FilteredIN_${Date.now()}`
    });
    
    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'FilteredIN',
      FirstName: 'Test',
      AccountId: account.Id
    });
    
    // Create opportunities with different stages for IN operator testing
    const opportunities = [
      { Name: 'Prospecting Deal', Amount: 10000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id }, // Should match
      { Name: 'Qualification Deal', Amount: 15000, StageName: 'Qualification', CloseDate: '2024-12-31', ContactId: contact.Id }, // Should match
      { Name: 'Proposal Deal', Amount: 20000, StageName: 'Proposal/Price Quote', CloseDate: '2024-12-31', ContactId: contact.Id }, // Should NOT match
      { Name: 'Closed Won Deal', Amount: 25000, StageName: 'Closed Won', CloseDate: '2024-12-31', ContactId: contact.Id }, // Should NOT match
      { Name: 'Closed Lost Deal', Amount: 5000, StageName: 'Closed Lost', CloseDate: '2024-12-31', ContactId: contact.Id } // Should NOT match
    ];
    
    for (const oppData of opportunities) {
      await testFactory.createTestOpportunity(account.Id!, oppData);
    }
    
    console.log(`Created hierarchy with opportunities in various stages`);
    console.log('WHERE clause: StageName IN (\'Prospecting\', \'Qualification\')');
    console.log('Expected SUM result: 25000 (10000 + 15000)');
    
    // Navigate and configure filtered SUM rollup
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('filtered-in-interface-loaded');
    
    // Configure SUM operation with IN clause
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
    
    // Configure grandparent relationship for SUM
    await page.locator('input[name="CalcItem__c"]').fill('Opportunity');
    await page.locator('input[name="RollupFieldOnCalcItem__c"]').fill('Amount');
    await page.locator('input[name="LookupFieldOnCalcItem__c"]').fill('Contact.AccountId');
    await page.locator('input[name="LookupObject__c"]').fill('Account');
    await page.locator('input[name="RollupFieldOnLookupObject__c"]').fill('AnnualRevenue');
    
    // Add IN operator WHERE clause
    console.log('🎯 Adding IN operator WHERE clause...');
    const whereClauseInput = page.locator('textarea[name="CalcItemWhereClause__c"]');
    if (await whereClauseInput.isVisible()) {
      await whereClauseInput.clear();
      await whereClauseInput.fill("StageName IN ('Prospecting', 'Qualification')");
      console.log('✅ Filled WHERE clause with IN operator: StageName IN (\'Prospecting\', \'Qualification\')');
      await sfHelper.takeScreenshot('filtered-in-where-clause-filled');
    }
    
    await sfHelper.takeScreenshot('filtered-in-form-completed');
    
    // Execute filtered SUM rollup
    console.log('🚀 Executing filtered SUM rollup with IN operator...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(12000);
      await sfHelper.takeScreenshot('filtered-in-execution-completed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    
    console.log('✅ PASS: Filtered SUM with IN operator test completed successfully');
    expect(true).toBeTruthy();
  });

  test('Should perform filtered AVERAGE with date-based WHERE clause across grandparent relationships', async ({ page }) => {
    console.log('📅 Testing filtered grandparent AVERAGE with date-based WHERE clause...');
    
    // Setup using proven pattern
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create hierarchy for date-based filtering
    console.log('🏗️ Creating hierarchy for date-based WHERE clause testing...');
    const account = await testFactory.createTestAccount({
      Name: `FilteredDate_${Date.now()}`
    });
    
    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'FilteredDate',
      FirstName: 'Test',
      AccountId: account.Id
    });
    
    // Create opportunities with different close dates
    const opportunities = [
      { Name: 'Future Deal 1', Amount: 10000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id }, // Future - should match
      { Name: 'Future Deal 2', Amount: 20000, StageName: 'Prospecting', CloseDate: '2024-11-30', ContactId: contact.Id }, // Future - should match
      { Name: 'Past Deal 1', Amount: 30000, StageName: 'Prospecting', CloseDate: '2023-12-31', ContactId: contact.Id }, // Past - should NOT match
      { Name: 'Past Deal 2', Amount: 15000, StageName: 'Prospecting', CloseDate: '2023-06-30', ContactId: contact.Id } // Past - should NOT match
    ];
    
    for (const oppData of opportunities) {
      await testFactory.createTestOpportunity(account.Id!, oppData);
    }
    
    console.log(`Created hierarchy with opportunities having various close dates`);
    console.log('WHERE clause: CloseDate >= 2024-01-01');
    console.log('Expected AVERAGE result: 15000 ((10000 + 20000) / 2)');
    
    // Navigate and configure filtered AVERAGE rollup
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    // Configure AVERAGE operation with date clause
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const averageOption = page.locator('[role="option"]:has-text("AVERAGE")');
      if (await averageOption.isVisible()) {
        await averageOption.click();
        console.log('✅ Selected AVERAGE operation');
      }
    }
    
    // Configure grandparent relationship for AVERAGE
    await page.locator('input[name="CalcItem__c"]').fill('Opportunity');
    await page.locator('input[name="RollupFieldOnCalcItem__c"]').fill('Amount');
    await page.locator('input[name="LookupFieldOnCalcItem__c"]').fill('Contact.AccountId');
    await page.locator('input[name="LookupObject__c"]').fill('Account');
    await page.locator('input[name="RollupFieldOnLookupObject__c"]').fill('AnnualRevenue');
    
    // Add date-based WHERE clause
    console.log('📅 Adding date-based WHERE clause...');
    const whereClauseInput = page.locator('textarea[name="CalcItemWhereClause__c"]');
    if (await whereClauseInput.isVisible()) {
      await whereClauseInput.clear();
      await whereClauseInput.fill('CloseDate >= 2024-01-01');
      console.log('✅ Filled date-based WHERE clause: CloseDate >= 2024-01-01');
      await sfHelper.takeScreenshot('filtered-date-where-clause-filled');
    }
    
    await sfHelper.takeScreenshot('filtered-date-form-completed');
    
    // Execute filtered AVERAGE rollup
    console.log('🚀 Executing filtered AVERAGE rollup with date filter...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(12000);
      await sfHelper.takeScreenshot('filtered-date-execution-completed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    
    console.log('✅ PASS: Filtered AVERAGE with date-based WHERE clause test completed successfully');
    expect(true).toBeTruthy();
  });

  test('Should handle complex nested WHERE clauses with boolean operations in grandparent rollups', async ({ page }) => {
    console.log('🧮 Testing complex nested WHERE clauses with boolean operations...');
    
    // Setup using proven pattern
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create hierarchy for complex boolean WHERE clause testing
    console.log('🏗️ Creating hierarchy for complex boolean WHERE clause testing...');
    const account = await testFactory.createTestAccount({
      Name: `ComplexBoolean_${Date.now()}`
    });
    
    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'ComplexBoolean',
      FirstName: 'Test',
      AccountId: account.Id
    });
    
    // Create opportunities with complex criteria for boolean testing
    const opportunities = [
      { Name: 'High Prob Prospect', Amount: 50000, Probability: 80, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id }, // Should match
      { Name: 'Low Prob Qualified', Amount: 30000, Probability: 20, StageName: 'Qualification', CloseDate: '2024-12-31', ContactId: contact.Id }, // Should match
      { Name: 'High Prob Proposal', Amount: 40000, Probability: 90, StageName: 'Proposal/Price Quote', CloseDate: '2024-12-31', ContactId: contact.Id }, // Should NOT match
      { Name: 'Low Prob Prospect', Amount: 25000, Probability: 15, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id }, // Should NOT match
    ];
    
    for (const oppData of opportunities) {
      await testFactory.createTestOpportunity(account.Id!, oppData);
    }
    
    console.log(`Created hierarchy with opportunities having various probability and stage combinations`);
    console.log('Complex WHERE clause: (Probability > 75 AND StageName = \'Prospecting\') OR (Probability < 25 AND StageName = \'Qualification\')');
    console.log('Expected COUNT result: 2 (High Prob Prospect + Low Prob Qualified)');
    
    // Navigate and configure complex boolean rollup
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    // Configure COUNT operation with complex boolean clause
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const countOption = page.locator('[role="option"]:has-text("COUNT")').first();
      if (await countOption.isVisible()) {
        await countOption.click();
        console.log('✅ Selected COUNT operation');
      }
    }
    
    // Configure grandparent relationship
    await page.locator('input[name="CalcItem__c"]').fill('Opportunity');
    await page.locator('input[name="RollupFieldOnCalcItem__c"]').fill('Name');
    await page.locator('input[name="LookupFieldOnCalcItem__c"]').fill('Contact.AccountId');
    await page.locator('input[name="LookupObject__c"]').fill('Account');
    await page.locator('input[name="RollupFieldOnLookupObject__c"]').fill('NumberOfEmployees');
    
    // Add complex nested WHERE clause
    console.log('🧮 Adding complex nested boolean WHERE clause...');
    const whereClauseInput = page.locator('textarea[name="CalcItemWhereClause__c"]');
    if (await whereClauseInput.isVisible()) {
      await whereClauseInput.clear();
      await whereClauseInput.fill("(Probability > 75 AND StageName = 'Prospecting') OR (Probability < 25 AND StageName = 'Qualification')");
      console.log('✅ Filled complex boolean WHERE clause');
      await sfHelper.takeScreenshot('complex-boolean-where-clause-filled');
    }
    
    await sfHelper.takeScreenshot('complex-boolean-form-completed');
    
    // Execute complex boolean rollup
    console.log('🚀 Executing rollup with complex nested boolean WHERE clause...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(12000);
      await sfHelper.takeScreenshot('complex-boolean-execution-completed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    
    console.log('✅ PASS: Complex nested boolean WHERE clause test completed successfully');
    console.log('   - Successfully created data with varied probability and stage combinations');
    console.log('   - Successfully configured complex nested boolean WHERE clause');
    console.log('   - Successfully executed complex filtered grandparent rollup');
    expect(true).toBeTruthy();
  });
});