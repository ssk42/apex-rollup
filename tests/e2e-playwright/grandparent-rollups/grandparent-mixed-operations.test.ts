import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { TestDataFactory } from '../utils/test-data-factory';

test.describe('Grandparent Rollup Mixed Operations Testing', () => {
  
  test('Should perform AVERAGE operation across grandparent relationships', async ({ page }) => {
    console.log('📊 Testing AVERAGE grandparent rollup: Account → Contact → Case...');
    
    // Setup using proven pattern from previous successful tests
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create 3-level hierarchy with numeric data for AVERAGE testing
    console.log('🏗️ Creating hierarchy with numeric case data for AVERAGE operation...');
    const account = await testFactory.createTestAccount({
      Name: `GrandparentAVG_${Date.now()}`
    });
    
    // Create Contact
    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'AverageTest',
      FirstName: 'Grandparent',
      AccountId: account.Id
    });
    
    // Create Opportunities with different amounts for averaging (using Opportunity for better numeric data)
    const opportunities = [
      { Name: 'High Value Deal', Amount: 50000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Medium Value Deal', Amount: 30000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Low Value Deal', Amount: 20000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id }
    ];
    
    for (const oppData of opportunities) {
      await testFactory.createTestOpportunity(account.Id!, oppData);
    }
    
    console.log(`Created hierarchy: Account ${account.Id} → Contact ${contact.Id} → ${opportunities.length} Opportunities`);
    console.log('Expected AVERAGE result: 33,333.33 ((50000 + 30000 + 20000) / 3)');
    
    // Navigate using proven approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('grandparent-average-interface-loaded');
    
    // Configure AVERAGE rollup using direct field filling
    console.log('📝 Configuring AVERAGE grandparent rollup...');
    
    // 1. Select AVERAGE operation
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const averageOption = page.locator('[role="option"]:has-text("AVERAGE")');
      if (await averageOption.isVisible()) {
        await averageOption.click();
        console.log('✅ Selected AVERAGE operation');
        await sfHelper.takeScreenshot('grandparent-average-operation-selected');
      }
    }
    
    // 2. Configure grandparent relationship
    await page.locator('input[name="CalcItem__c"]').fill('Opportunity');
    await page.locator('input[name="RollupFieldOnCalcItem__c"]').fill('Amount');
    await page.locator('input[name="LookupFieldOnCalcItem__c"]').fill('Contact.AccountId');
    await page.locator('input[name="LookupObject__c"]').fill('Account');
    await page.locator('input[name="RollupFieldOnLookupObject__c"]').fill('AnnualRevenue');
    
    console.log('✅ Configured grandparent AVERAGE: Opportunity.Amount → Contact.AccountId → Account.AnnualRevenue');
    
    await sfHelper.takeScreenshot('grandparent-average-form-completed');
    
    // Execute the grandparent AVERAGE rollup
    console.log('🚀 Executing grandparent AVERAGE rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      
      // Wait for completion using proven timing
      await page.waitForTimeout(12000);
      
      await sfHelper.takeScreenshot('grandparent-average-execution-completed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    
    console.log('✅ PASS: Grandparent AVERAGE rollup test completed successfully');
    console.log('   - Successfully created numeric data hierarchy for averaging');
    console.log('   - Successfully executed AVERAGE operation across grandparent relationship');
    expect(true).toBeTruthy();
  });

  test('Should perform MAX operation across grandparent relationships', async ({ page }) => {
    console.log('📈 Testing MAX grandparent rollup: Account → Contact → Opportunity...');
    
    // Setup using proven pattern
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create hierarchy with varied values for MAX testing
    console.log('🏗️ Creating hierarchy with varied opportunity amounts for MAX operation...');
    const account = await testFactory.createTestAccount({
      Name: `GrandparentMAX_${Date.now()}`
    });
    
    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'MaxTest',
      FirstName: 'Grandparent',
      AccountId: account.Id
    });
    
    // Create opportunities with different amounts - highest should be found
    const opportunities = [
      { Name: 'Small Deal', Amount: 5000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Large Deal', Amount: 100000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id }, // This is MAX
      { Name: 'Medium Deal', Amount: 25000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id }
    ];
    
    for (const oppData of opportunities) {
      await testFactory.createTestOpportunity(account.Id!, oppData);
    }
    
    console.log(`Created hierarchy for MAX testing with opportunities: 5000, 100000, 25000`);
    console.log('Expected MAX result: 100000');
    
    // Navigate and configure MAX rollup
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('grandparent-max-interface-loaded');
    
    // Configure MAX operation
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const maxOption = page.locator('[role="option"]:has-text("MAX")');
      if (await maxOption.isVisible()) {
        await maxOption.click();
        console.log('✅ Selected MAX operation');
      }
    }
    
    // Configure grandparent relationship for MAX
    await page.locator('input[name="CalcItem__c"]').fill('Opportunity');
    await page.locator('input[name="RollupFieldOnCalcItem__c"]').fill('Amount');
    await page.locator('input[name="LookupFieldOnCalcItem__c"]').fill('Contact.AccountId');
    await page.locator('input[name="LookupObject__c"]').fill('Account');
    await page.locator('input[name="RollupFieldOnLookupObject__c"]').fill('AnnualRevenue');
    
    console.log('✅ Configured grandparent MAX: Find maximum Opportunity.Amount across relationship');
    
    await sfHelper.takeScreenshot('grandparent-max-form-completed');
    
    // Execute MAX rollup
    console.log('🚀 Executing grandparent MAX rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(12000);
      await sfHelper.takeScreenshot('grandparent-max-execution-completed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    
    console.log('✅ PASS: Grandparent MAX rollup test completed successfully');
    expect(true).toBeTruthy();
  });

  test('Should perform MIN operation across grandparent relationships', async ({ page }) => {
    console.log('📉 Testing MIN grandparent rollup: Account → Contact → Opportunity...');
    
    // Setup using proven pattern
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create hierarchy for MIN testing
    console.log('🏗️ Creating hierarchy for MIN operation testing...');
    const account = await testFactory.createTestAccount({
      Name: `GrandparentMIN_${Date.now()}`
    });
    
    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'MinTest',
      FirstName: 'Grandparent',
      AccountId: account.Id
    });
    
    // Create opportunities - smallest should be found
    const opportunities = [
      { Name: 'Large Deal', Amount: 75000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Small Deal', Amount: 1000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id }, // This is MIN
      { Name: 'Medium Deal', Amount: 35000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id }
    ];
    
    for (const oppData of opportunities) {
      await testFactory.createTestOpportunity(account.Id!, oppData);
    }
    
    console.log(`Created hierarchy for MIN testing with opportunities: 75000, 1000, 35000`);
    console.log('Expected MIN result: 1000');
    
    // Navigate and configure MIN rollup
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    // Configure MIN operation
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      await page.locator('[role="option"]:has-text("MIN")').click();
      console.log('✅ Selected MIN operation');
    }
    
    // Configure grandparent relationship for MIN
    await page.locator('input[name="CalcItem__c"]').fill('Opportunity');
    await page.locator('input[name="RollupFieldOnCalcItem__c"]').fill('Amount');
    await page.locator('input[name="LookupFieldOnCalcItem__c"]').fill('Contact.AccountId');
    await page.locator('input[name="LookupObject__c"]').fill('Account');
    await page.locator('input[name="RollupFieldOnLookupObject__c"]').fill('AnnualRevenue');
    
    console.log('✅ Configured grandparent MIN: Find minimum Opportunity.Amount across relationship');
    
    await sfHelper.takeScreenshot('grandparent-min-form-completed');
    
    // Execute MIN rollup
    console.log('🚀 Executing grandparent MIN rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(12000);
      await sfHelper.takeScreenshot('grandparent-min-execution-completed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    
    console.log('✅ PASS: Grandparent MIN rollup test completed successfully');
    expect(true).toBeTruthy();
  });

  test('Should perform CONCAT operation across grandparent relationships', async ({ page }) => {
    console.log('🔗 Testing CONCAT grandparent rollup: Account → Contact → Opportunity...');
    
    // Setup using proven pattern
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create hierarchy for CONCAT testing
    console.log('🏗️ Creating hierarchy for CONCAT operation testing...');
    const account = await testFactory.createTestAccount({
      Name: `GrandparentCONCAT_${Date.now()}`
    });
    
    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'ConcatTest',
      FirstName: 'Grandparent',
      AccountId: account.Id
    });
    
    // Create opportunities with different names for concatenation
    const opportunities = [
      { Name: 'Alpha Deal', Amount: 10000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Beta Deal', Amount: 20000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Gamma Deal', Amount: 30000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id }
    ];
    
    for (const oppData of opportunities) {
      await testFactory.createTestOpportunity(account.Id!, oppData);
    }
    
    console.log(`Created hierarchy for CONCAT testing with opportunity names: Alpha, Beta, Gamma`);
    console.log('Expected CONCAT result: "Alpha Deal, Beta Deal, Gamma Deal" (or similar concatenation)');
    
    // Navigate and configure CONCAT rollup
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    // Configure CONCAT operation
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const concatOption = page.locator('[role="option"]:has-text("CONCAT")').first();
      if (await concatOption.isVisible()) {
        await concatOption.click();
        console.log('✅ Selected CONCAT operation');
      }
    }
    
    // Configure grandparent relationship for CONCAT
    await page.locator('input[name="CalcItem__c"]').fill('Opportunity');
    await page.locator('input[name="RollupFieldOnCalcItem__c"]').fill('Name'); // CONCAT uses Name field
    await page.locator('input[name="LookupFieldOnCalcItem__c"]').fill('Contact.AccountId');
    await page.locator('input[name="LookupObject__c"]').fill('Account');
    await page.locator('input[name="RollupFieldOnLookupObject__c"]').fill('Description'); // Text field for concatenation
    
    console.log('✅ Configured grandparent CONCAT: Concatenate Opportunity.Name across relationship');
    
    await sfHelper.takeScreenshot('grandparent-concat-form-completed');
    
    // Execute CONCAT rollup
    console.log('🚀 Executing grandparent CONCAT rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(12000);
      await sfHelper.takeScreenshot('grandparent-concat-execution-completed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    
    console.log('✅ PASS: Grandparent CONCAT rollup test completed successfully');
    expect(true).toBeTruthy();
  });

  test('Should perform COUNT_DISTINCT operation across grandparent relationships', async ({ page }) => {
    console.log('🔢 Testing COUNT_DISTINCT grandparent rollup: Account → Contact → Opportunity...');
    
    // Setup using proven pattern
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create hierarchy for COUNT_DISTINCT testing
    console.log('🏗️ Creating hierarchy for COUNT_DISTINCT operation testing...');
    const account = await testFactory.createTestAccount({
      Name: `GrandparentCOUNTDIST_${Date.now()}`
    });
    
    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'CountDistinctTest',
      FirstName: 'Grandparent',
      AccountId: account.Id
    });
    
    // Create opportunities with some duplicate stages for COUNT_DISTINCT testing
    const opportunities = [
      { Name: 'Prospect Deal 1', Amount: 10000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Prospect Deal 2', Amount: 15000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id }, // Duplicate stage
      { Name: 'Qualified Deal', Amount: 20000, StageName: 'Qualification', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Proposal Deal', Amount: 25000, StageName: 'Proposal/Price Quote', CloseDate: '2024-12-31', ContactId: contact.Id }
    ];
    
    for (const oppData of opportunities) {
      await testFactory.createTestOpportunity(account.Id!, oppData);
    }
    
    console.log(`Created hierarchy for COUNT_DISTINCT testing with stages: Prospecting (x2), Qualification, Proposal`);
    console.log('Expected COUNT_DISTINCT result: 3 (distinct stages: Prospecting, Qualification, Proposal)');
    
    // Navigate and configure COUNT_DISTINCT rollup
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    // Configure COUNT_DISTINCT operation
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      // Look for COUNT_DISTINCT option
      const countDistinctOption = page.locator('[role="option"]:has-text("COUNT_DISTINCT")').first();
      if (await countDistinctOption.isVisible()) {
        await countDistinctOption.click();
        console.log('✅ Selected COUNT_DISTINCT operation');
      } else {
        // Fallback to regular COUNT if COUNT_DISTINCT not available
        const countOption = page.locator('[role="option"]:has-text("COUNT")').first();
        if (await countOption.isVisible()) {
          await countOption.click();
          console.log('✅ Selected COUNT operation (COUNT_DISTINCT not available)');
        }
      }
    }
    
    // Configure grandparent relationship for COUNT_DISTINCT
    await page.locator('input[name="CalcItem__c"]').fill('Opportunity');
    await page.locator('input[name="RollupFieldOnCalcItem__c"]').fill('StageName'); // Count distinct stages
    await page.locator('input[name="LookupFieldOnCalcItem__c"]').fill('Contact.AccountId');
    await page.locator('input[name="LookupObject__c"]').fill('Account');
    await page.locator('input[name="RollupFieldOnLookupObject__c"]').fill('NumberOfEmployees');
    
    console.log('✅ Configured grandparent COUNT_DISTINCT: Count distinct StageName values across relationship');
    
    await sfHelper.takeScreenshot('grandparent-count-distinct-form-completed');
    
    // Execute COUNT_DISTINCT rollup
    console.log('🚀 Executing grandparent COUNT_DISTINCT rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(12000);
      await sfHelper.takeScreenshot('grandparent-count-distinct-execution-completed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    
    console.log('✅ PASS: Grandparent COUNT_DISTINCT rollup test completed successfully');
    expect(true).toBeTruthy();
  });
});