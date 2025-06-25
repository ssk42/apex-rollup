import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { TestDataFactory } from '../utils/test-data-factory';

test.describe('Rollup Boolean Operations Testing', () => {
  
  test('ALL operation: Account checkbox = ALL(Opportunity.IsPrivate)', async ({ page }) => {
    console.log('✅ Testing ALL rollup operation (boolean logic)...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data - ALL opportunities must have IsPrivate = true for result to be true
    console.log('🏗️ Creating test data for ALL operation (all opportunities private)...');
    const account = await testFactory.createTestAccount({
      Name: `AllBooleanTest_${Date.now()}`
    });
    
    const opportunities = [];
    
    // All opportunities are private - ALL should return TRUE
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Private Deal 1',
      StageName: 'Prospecting',
      CloseDate: '2024-12-31',
      Amount: 1000,
      IsPrivate: true
    }));
    
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Private Deal 2',
      StageName: 'Prospecting',
      CloseDate: '2024-12-31',
      Amount: 2000,
      IsPrivate: true
    }));
    
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Private Deal 3',
      StageName: 'Prospecting',
      CloseDate: '2024-12-31',
      Amount: 3000,
      IsPrivate: true
    }));
    
    console.log(`Created account ${account.Id} with ${opportunities.length} opportunities (all private)`);
    console.log('Expected ALL result: TRUE (all opportunities are private)');
    
    // Navigate to Rollup app using the working approach from successful tests
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('all-operation-interface-loaded');
    
    // Fill form fields using the working field selectors (same as successful SUM test)
    console.log('📝 Filling ALL rollup configuration...');
    
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
        await sfHelper.takeScreenshot('all-operation-selected');
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
    
    await sfHelper.takeScreenshot('all-operation-form-completed');
    
    // 7. Try to execute the rollup
    console.log('🚀 Attempting to execute ALL rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('all-operation-rollup-executed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ ALL boolean operation test completed successfully');
  });

  test('SOME operation: Account checkbox = SOME(Opportunity.IsPrivate)', async ({ page }) => {
    console.log('🔄 Testing SOME rollup operation (boolean logic)...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data - At least one opportunity must have IsPrivate = true for result to be true
    console.log('🏗️ Creating test data for SOME operation (mixed privacy)...');
    const account = await testFactory.createTestAccount({
      Name: `SomeBooleanTest_${Date.now()}`
    });
    
    const opportunities = [];
    
    // Mix of private and non-private opportunities - SOME should return TRUE
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Private Deal',
      StageName: 'Prospecting',
      CloseDate: '2024-12-31',
      Amount: 1000,
      IsPrivate: true // This one is private
    }));
    
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Public Deal 1',
      StageName: 'Prospecting',
      CloseDate: '2024-12-31',
      Amount: 2000,
      IsPrivate: false // This one is not private
    }));
    
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Public Deal 2',
      StageName: 'Prospecting',
      CloseDate: '2024-12-31',
      Amount: 3000,
      IsPrivate: false // This one is not private
    }));
    
    console.log(`Created account ${account.Id} with ${opportunities.length} opportunities (1 private, 2 public)`);
    console.log('Expected SOME result: TRUE (at least one opportunity is private)');
    
    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('some-operation-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling SOME rollup configuration...');
    
    // 1. Select SOME operation from dropdown
    console.log('🔽 Selecting SOME operation...');
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const someOption = page.locator('[role="option"]:has-text("SOME")').first();
      if (await someOption.isVisible()) {
        await someOption.click();
        console.log('✅ Selected SOME operation');
        await sfHelper.takeScreenshot('some-operation-selected');
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
    
    // 6. Fill Parent Field - Using Description for boolean result
    const parentFieldInput = page.locator('input[name="RollupFieldOnLookupObject__c"]');
    if (await parentFieldInput.isVisible()) {
      await parentFieldInput.clear();
      await parentFieldInput.fill('Description');
      console.log('✅ Filled Parent Field: Description');
    }
    
    await sfHelper.takeScreenshot('some-operation-form-completed');
    
    // 7. Try to execute the rollup
    console.log('🚀 Attempting to execute SOME rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('some-operation-rollup-executed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ SOME boolean operation test completed successfully');
  });

  test('NONE operation: Account checkbox = NONE(Opportunity.IsPrivate)', async ({ page }) => {
    console.log('❌ Testing NONE rollup operation (boolean logic)...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data - No opportunities should have IsPrivate = true for result to be true
    console.log('🏗️ Creating test data for NONE operation (all public)...');
    const account = await testFactory.createTestAccount({
      Name: `NoneBooleanTest_${Date.now()}`
    });
    
    const opportunities = [];
    
    // All opportunities are public (not private) - NONE should return TRUE
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Public Deal 1',
      StageName: 'Prospecting',
      CloseDate: '2024-12-31',
      Amount: 1000,
      IsPrivate: false
    }));
    
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Public Deal 2',
      StageName: 'Prospecting',
      CloseDate: '2024-12-31',
      Amount: 2000,
      IsPrivate: false
    }));
    
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Public Deal 3',
      StageName: 'Prospecting',
      CloseDate: '2024-12-31',
      Amount: 3000,
      IsPrivate: false
    }));
    
    console.log(`Created account ${account.Id} with ${opportunities.length} opportunities (all public)`);
    console.log('Expected NONE result: TRUE (no opportunities are private)');
    
    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('none-operation-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling NONE rollup configuration...');
    
    // 1. Select NONE operation from dropdown
    console.log('🔽 Selecting NONE operation...');
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const noneOption = page.locator('[role="option"]:has-text("NONE")').first();
      if (await noneOption.isVisible()) {
        await noneOption.click();
        console.log('✅ Selected NONE operation');
        await sfHelper.takeScreenshot('none-operation-selected');
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
    
    // 6. Fill Parent Field - Using Description for boolean result
    const parentFieldInput = page.locator('input[name="RollupFieldOnLookupObject__c"]');
    if (await parentFieldInput.isVisible()) {
      await parentFieldInput.clear();
      await parentFieldInput.fill('Description');
      console.log('✅ Filled Parent Field: Description');
    }
    
    await sfHelper.takeScreenshot('none-operation-form-completed');
    
    // 7. Try to execute the rollup
    console.log('🚀 Attempting to execute NONE rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('none-operation-rollup-executed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ NONE boolean operation test completed successfully');
  });

  test('ALL operation with where clause: check only closed opportunities', async ({ page }) => {
    console.log('✅🎯 Testing ALL rollup operation with where clause...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data - Mix of stages, but ALL closed opportunities should be private
    console.log('🏗️ Creating test data for ALL operation with where clause...');
    const account = await testFactory.createTestAccount({
      Name: `AllWhereTest_${Date.now()}`
    });
    
    const opportunities = [];
    
    // Closed opportunities (these will be evaluated) - all private
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Closed Private Deal 1',
      StageName: 'Closed Won',
      CloseDate: '2024-12-31',
      Amount: 1000,
      IsPrivate: true
    }));
    
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Closed Private Deal 2',
      StageName: 'Closed Won',
      CloseDate: '2024-12-31',
      Amount: 2000,
      IsPrivate: true
    }));
    
    // Open opportunities (these will be excluded by where clause) - can be public
    opportunities.push(await testFactory.createTestOpportunity(account.Id!, {
      Name: 'Open Public Deal',
      StageName: 'Prospecting',
      CloseDate: '2024-12-31',
      Amount: 3000,
      IsPrivate: false // This won't affect result due to where clause
    }));
    
    console.log(`Created account ${account.Id} with ${opportunities.length} opportunities`);
    console.log('Expected ALL result: TRUE (all closed opportunities are private)');
    
    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('all-where-operation-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling ALL rollup configuration with where clause...');
    
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
        await sfHelper.takeScreenshot('all-where-operation-selected');
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
    
    // 6. Fill Parent Field - Using Description for boolean result
    const parentFieldInput = page.locator('input[name="RollupFieldOnLookupObject__c"]');
    if (await parentFieldInput.isVisible()) {
      await parentFieldInput.clear();
      await parentFieldInput.fill('Description');
      console.log('✅ Filled Parent Field: Description');
    }
    
    // 7. Fill Where Clause - Only check closed opportunities
    console.log('🎯 Filling where clause: StageName = \'Closed Won\'');
    const whereClauseInput = page.locator('textarea[name="CalcItemWhereClause__c"]');
    if (await whereClauseInput.isVisible()) {
      await whereClauseInput.clear();
      await whereClauseInput.fill("StageName = 'Closed Won'");
      console.log('✅ Filled Where Clause: StageName = \'Closed Won\'');
      await sfHelper.takeScreenshot('all-where-clause-filled');
    } else {
      console.log('⚠️ Where clause field not found');
      await sfHelper.takeScreenshot('all-where-clause-field-not-found');
    }
    
    await sfHelper.takeScreenshot('all-where-operation-form-completed');
    
    // 8. Try to execute the rollup
    console.log('🚀 Attempting to execute ALL rollup with where clause...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('all-where-operation-rollup-executed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ ALL boolean operation with where clause test completed successfully');
  });
});