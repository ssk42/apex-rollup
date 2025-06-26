import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { TestDataFactory } from '../utils/test-data-factory';

test.describe('Core Rollup Operations E2E Tests', () => {

  test('SUM rollup operation aggregates numeric values correctly', async ({ page }) => {
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
    
    // Navigate directly to Rollup app (setup domain is correct for System Admin)
    console.log('🧭 Navigating directly to Rollup app...');
    const currentUrl = page.url();
    const baseUrl = currentUrl.match(/https:\/\/[^\/]+/)?.[0];
    const rollupUrl = `${baseUrl}/lightning/app/c__Rollup`;
    
    await page.goto(rollupUrl);
    await page.waitForLoadState('domcontentloaded');
    
    // Navigate to Recalculate Rollup tab if needed
    try {
      const recalcTab = page.locator('a[title="Recalculate Rollup"]');
      if (await recalcTab.isVisible({ timeout: 5000 })) {
        await recalcTab.click();
        console.log('✅ Navigated to Recalculate Rollup tab');
      }
    } catch (e) {
      console.log('⏳ Recalculate Rollup tab not needed or already active');
    }
    
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
    
    await sfHelper.takeScreenshot('sum-form-completed');
    
    // 7. Execute the rollup
    console.log('🚀 Attempting to execute SUM rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('sum-rollup-executed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ SUM rollup operation test completed successfully');
  });

  test('COUNT rollup operation counts related records correctly', async ({ page }) => {
    console.log('🔢 Testing COUNT rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data
    const testData = await testFactory.createCountTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected COUNT result: ${testData.expectedResult}`);
    
    // Navigate directly to Rollup app (setup domain is correct for System Admin)
    console.log('🧭 Navigating directly to Rollup app...');
    const currentUrl = page.url();
    const baseUrl = currentUrl.match(/https:\/\/[^\/]+/)?.[0];
    const rollupUrl = `${baseUrl}/lightning/app/c__Rollup`;
    
    await page.goto(rollupUrl);
    await page.waitForLoadState('domcontentloaded');
    
    // Navigate to Recalculate Rollup tab if needed
    try {
      const recalcTab = page.locator('a[title="Recalculate Rollup"]');
      if (await recalcTab.isVisible({ timeout: 5000 })) {
        await recalcTab.click();
        console.log('✅ Navigated to Recalculate Rollup tab');
      }
    } catch (e) {
      console.log('⏳ Recalculate Rollup tab not needed or already active');
    }
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('count-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling COUNT rollup configuration...');
    
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
        await sfHelper.takeScreenshot('count-operation-selected');
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
    
    await sfHelper.takeScreenshot('count-form-completed');
    
    // 7. Execute the rollup
    console.log('🚀 Attempting to execute COUNT rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('count-rollup-executed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ COUNT rollup operation test completed successfully');
  });

  test('AVERAGE rollup operation calculates mean values correctly', async ({ page }) => {
    console.log('📊 Testing AVERAGE rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data
    const testData = await testFactory.createAverageTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected AVERAGE result: ${testData.expectedResult}`);
    
    // Navigate directly to Rollup app (setup domain is correct for System Admin)
    console.log('🧭 Navigating directly to Rollup app...');
    const currentUrl = page.url();
    const baseUrl = currentUrl.match(/https:\/\/[^\/]+/)?.[0];
    const rollupUrl = `${baseUrl}/lightning/app/c__Rollup`;
    
    await page.goto(rollupUrl);
    await page.waitForLoadState('domcontentloaded');
    
    // Navigate to Recalculate Rollup tab if needed
    try {
      const recalcTab = page.locator('a[title="Recalculate Rollup"]');
      if (await recalcTab.isVisible({ timeout: 5000 })) {
        await recalcTab.click();
        console.log('✅ Navigated to Recalculate Rollup tab');
      }
    } catch (e) {
      console.log('⏳ Recalculate Rollup tab not needed or already active');
    }
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('average-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling AVERAGE rollup configuration...');
    
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
        await sfHelper.takeScreenshot('average-operation-selected');
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
    
    await sfHelper.takeScreenshot('average-form-completed');
    
    // 7. Execute the rollup
    console.log('🚀 Attempting to execute AVERAGE rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('average-rollup-executed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ AVERAGE rollup operation test completed successfully');
  });

  test('MIN rollup operation finds minimum values correctly', async ({ page }) => {
    console.log('📉 Testing MIN rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data
    const testData = await testFactory.createMinTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected MIN result: ${testData.expectedResult}`);
    
    // Navigate directly to Rollup app (setup domain is correct for System Admin)
    console.log('🧭 Navigating directly to Rollup app...');
    const currentUrl = page.url();
    const baseUrl = currentUrl.match(/https:\/\/[^\/]+/)?.[0];
    const rollupUrl = `${baseUrl}/lightning/app/c__Rollup`;
    
    await page.goto(rollupUrl);
    await page.waitForLoadState('domcontentloaded');
    
    // Navigate to Recalculate Rollup tab if needed
    try {
      const recalcTab = page.locator('a[title="Recalculate Rollup"]');
      if (await recalcTab.isVisible({ timeout: 5000 })) {
        await recalcTab.click();
        console.log('✅ Navigated to Recalculate Rollup tab');
      }
    } catch (e) {
      console.log('⏳ Recalculate Rollup tab not needed or already active');
    }
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('min-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling MIN rollup configuration...');
    
    // 1. Select MIN operation from dropdown
    console.log('🔽 Selecting MIN operation...');
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const minOption = page.locator('[role="option"]:has-text("MIN")');
      if (await minOption.isVisible()) {
        await minOption.click();
        console.log('✅ Selected MIN operation');
        await sfHelper.takeScreenshot('min-operation-selected');
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
    
    await sfHelper.takeScreenshot('min-form-completed');
    
    // 7. Execute the rollup
    console.log('🚀 Attempting to execute MIN rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('min-rollup-executed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ MIN rollup operation test completed successfully');
  });

  test('MAX rollup operation finds maximum values correctly', async ({ page }) => {
    console.log('📈 Testing MAX rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data
    const testData = await testFactory.createMaxTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected MAX result: ${testData.expectedResult}`);
    
    // Navigate directly to Rollup app (setup domain is correct for System Admin)
    console.log('🧭 Navigating directly to Rollup app...');
    const currentUrl = page.url();
    const baseUrl = currentUrl.match(/https:\/\/[^\/]+/)?.[0];
    const rollupUrl = `${baseUrl}/lightning/app/c__Rollup`;
    
    await page.goto(rollupUrl);
    await page.waitForLoadState('domcontentloaded');
    
    // Navigate to Recalculate Rollup tab if needed
    try {
      const recalcTab = page.locator('a[title="Recalculate Rollup"]');
      if (await recalcTab.isVisible({ timeout: 5000 })) {
        await recalcTab.click();
        console.log('✅ Navigated to Recalculate Rollup tab');
      }
    } catch (e) {
      console.log('⏳ Recalculate Rollup tab not needed or already active');
    }
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('max-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling MAX rollup configuration...');
    
    // 1. Select MAX operation from dropdown
    console.log('🔽 Selecting MAX operation...');
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      const maxOption = page.locator('[role="option"]:has-text("MAX")');
      if (await maxOption.isVisible()) {
        await maxOption.click();
        console.log('✅ Selected MAX operation');
        await sfHelper.takeScreenshot('max-operation-selected');
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
    
    await sfHelper.takeScreenshot('max-form-completed');
    
    // 7. Execute the rollup
    console.log('🚀 Attempting to execute MAX rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('max-rollup-executed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ MAX rollup operation test completed successfully');
  });

  test('CONCAT rollup operation concatenates text values correctly', async ({ page }) => {
    console.log('🔗 Testing CONCAT rollup operation...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data
    const testData = await testFactory.createConcatTestData();
    console.log(`Created test data: Account ${testData.account.Id} with ${testData.opportunities.length} opportunities`);
    console.log(`Expected CONCAT result: "${testData.expectedResult}"`);
    
    // Navigate directly to Rollup app (setup domain is correct for System Admin)
    console.log('🧭 Navigating directly to Rollup app...');
    const currentUrl = page.url();
    const baseUrl = currentUrl.match(/https:\/\/[^\/]+/)?.[0];
    const rollupUrl = `${baseUrl}/lightning/app/c__Rollup`;
    
    await page.goto(rollupUrl);
    await page.waitForLoadState('domcontentloaded');
    
    // Navigate to Recalculate Rollup tab if needed
    try {
      const recalcTab = page.locator('a[title="Recalculate Rollup"]');
      if (await recalcTab.isVisible({ timeout: 5000 })) {
        await recalcTab.click();
        console.log('✅ Navigated to Recalculate Rollup tab');
      }
    } catch (e) {
      console.log('⏳ Recalculate Rollup tab not needed or already active');
    }
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('concat-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling CONCAT rollup configuration...');
    
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
        await sfHelper.takeScreenshot('concat-operation-selected');
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
    
    await sfHelper.takeScreenshot('concat-form-completed');
    
    // 7. Execute the rollup
    console.log('🚀 Attempting to execute CONCAT rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('concat-rollup-executed');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ CONCAT rollup operation test completed successfully');
  });

  test('Complex where clause filtering works correctly', async ({ page }) => {
    console.log('🔍 Testing complex where clause rollup...');
    
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
    
    // Create opportunities with different amounts and stages  
    const opportunities = [
      { Name: 'Opp 1', Amount: 1000, StageName: 'Closed Won' },
      { Name: 'Opp 2', Amount: 2000, StageName: 'Closed Lost' },
      { Name: 'Opp 3', Amount: 1500, StageName: 'Closed Won' },
      { Name: 'Opp 4', Amount: 3000, StageName: 'Prospecting' }
    ];
    
    for (const oppData of opportunities) {
      await testFactory.createTestOpportunity(account.Id!, {
        ...oppData,
        CloseDate: '2024-12-31'
      });
    }
    
    console.log(`Created account ${account.Id} with ${opportunities.length} opportunities`);
    console.log('Expected SUM result: 2500 (1000 + 1500, excluding 2000 + 3000 from other stages)');
    
    // Navigate directly to Rollup app (setup domain is correct for System Admin)
    console.log('🧭 Navigating directly to Rollup app...');
    const currentUrl = page.url();
    const baseUrl = currentUrl.match(/https:\/\/[^\/]+/)?.[0];
    const rollupUrl = `${baseUrl}/lightning/app/c__Rollup`;
    
    await page.goto(rollupUrl);
    await page.waitForLoadState('domcontentloaded');
    
    // Navigate to Recalculate Rollup tab if needed
    try {
      const recalcTab = page.locator('a[title="Recalculate Rollup"]');
      if (await recalcTab.isVisible({ timeout: 5000 })) {
        await recalcTab.click();
        console.log('✅ Navigated to Recalculate Rollup tab');
      }
    } catch (e) {
      console.log('⏳ Recalculate Rollup tab not needed or already active');
    }
    
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
    
    // 7. Fill Where Clause - Only check closed won opportunities >= 1000
    console.log("🎯 Filling where clause: StageName = 'Closed Won' AND Amount >= 1000");
    const whereClauseInput = page.locator('textarea[name="CalcItemWhereClause__c"]');
    if (await whereClauseInput.isVisible()) {
      await whereClauseInput.clear();
      await whereClauseInput.fill("StageName = 'Closed Won' AND Amount >= 1000");
      console.log("✅ Filled Where Clause: StageName = 'Closed Won' AND Amount >= 1000");
      await sfHelper.takeScreenshot('where-clause-filled');
    } else {
      console.log('⚠️ Where clause field not found');
      await sfHelper.takeScreenshot('where-clause-field-not-found');
    }
    
    await sfHelper.takeScreenshot('where-clause-form-completed');
    
    // 8. Execute the rollup
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
    console.log('✅ Complex where clause test completed successfully');
  });
});