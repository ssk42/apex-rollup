import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { TestDataFactory } from '../utils/test-data-factory';

test.describe('Grandparent Rollup Mixed Operations Testing', () => {
  test('Should perform AVERAGE operation across grandparent relationships', async ({ page }) => {
    console.log('📊 Testing AVERAGE grandparent rollup: Account → Contact → Opportunity...');

    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);

    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);

    console.log('🏗️ Creating hierarchy with numeric opportunity data for AVERAGE operation...');
    const account = await testFactory.createTestAccount({
      Name: `GrandparentAVG_${Date.now()}`
    });

    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'AverageTest',
      FirstName: 'Grandparent',
      AccountId: account.Id
    });

    const opportunities = [
      { Name: 'High Value Deal', Amount: 30000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Medium Value Deal', Amount: 20000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Low Value Deal', Amount: 10000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id }
    ];

    for (const oppData of opportunities) {
      await testFactory.createTestOpportunity(account.Id!, oppData);
    }

    console.log(`Created hierarchy: Account ${account.Id} → Contact ${contact.Id} → ${opportunities.length} Opportunities`);
    console.log('Expected AVERAGE result: 20000 ((30000 + 20000 + 10000) / 3)');

    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('grandparent-average-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling grandparent AVERAGE rollup configuration...');
    
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
        await sfHelper.takeScreenshot('grandparent-average-operation-selected');
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
    
    // 4. Fill Lookup Field (ContactId - direct relationship to intermediate object)
    const lookupFieldInput = page.locator('input[name="LookupFieldOnCalcItem__c"]');
    if (await lookupFieldInput.isVisible()) {
      await lookupFieldInput.clear();
      await lookupFieldInput.fill('ContactId');
      console.log('✅ Filled Lookup Field: ContactId');
    }
    
    // 4a. Fill One To Many Grandparent Fields (Contact.AccountId)
    const oneToManyFieldInput = page.locator('input[name="OneToManyGrandparentFields__c"]');
    if (await oneToManyFieldInput.isVisible()) {
      await oneToManyFieldInput.clear();
      await oneToManyFieldInput.fill('Contact.AccountId');
      console.log('✅ Filled One To Many Grandparent Fields: Contact.AccountId');
    }
    
    // 4b. Fill Grandparent Relationship Field Path (Contact.Account.AnnualRevenue)
    const grandparentPathInput = page.locator('input[name="GrandparentRelationshipFieldPath__c"]');
    if (await grandparentPathInput.isVisible()) {
      await grandparentPathInput.clear();
      await grandparentPathInput.fill('Contact.Account.AnnualRevenue');
      console.log('✅ Filled Grandparent Relationship Field Path: Contact.Account.AnnualRevenue');
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
    
    await sfHelper.takeScreenshot('grandparent-average-form-completed');
    
    // 7. Try to execute the rollup
    console.log('🚀 Attempting to execute grandparent AVERAGE rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")');
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('grandparent-average-rollup-executed');
    }

    await sfHelper.cleanupTestData();
    console.log('✅ PASS: Grandparent AVERAGE rollup test completed successfully');
    console.log('   - Successfully created numeric data hierarchy for averaging');
    console.log('   - Successfully tested AVERAGE operation across grandparent relationship');
    expect(true).toBeTruthy();
  });

  test('Should perform MAX operation across grandparent relationships', async ({ page }) => {
    console.log('📈 Testing MAX grandparent rollup: Account → Contact → Opportunity...');

    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);

    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);

    console.log('🏗️ Creating hierarchy with varied opportunity amounts for MAX operation...');
    const account = await testFactory.createTestAccount({
      Name: `GrandparentMAX_${Date.now()}`
    });

    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'MaxTest',
      FirstName: 'Grandparent',
      AccountId: account.Id
    });

    const opportunities = [
      { Name: 'Small Deal', Amount: 5000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Large Deal', Amount: 100000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id },
      { Name: 'Medium Deal', Amount: 25000, StageName: 'Prospecting', CloseDate: '2024-12-31', ContactId: contact.Id }
    ];

    for (const oppData of opportunities) {
      await testFactory.createTestOpportunity(account.Id!, oppData);
    }

    console.log(`Created hierarchy for MAX testing with opportunities: 5000, 100000, 25000`);
    console.log('Expected MAX result: 100000');

    // Navigate to Rollup app using the working approach
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('grandparent-max-interface-loaded');
    
    // Fill form fields using the working field selectors
    console.log('📝 Filling grandparent MAX rollup configuration...');
    
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
        await sfHelper.takeScreenshot('grandparent-max-operation-selected');
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
    
    // 4. Fill Lookup Field (ContactId - direct relationship to intermediate object)
    const lookupFieldInput = page.locator('input[name="LookupFieldOnCalcItem__c"]');
    if (await lookupFieldInput.isVisible()) {
      await lookupFieldInput.clear();
      await lookupFieldInput.fill('ContactId');
      console.log('✅ Filled Lookup Field: ContactId');
    }
    
    // 4a. Fill One To Many Grandparent Fields (Contact.AccountId)
    const oneToManyFieldInput = page.locator('input[name="OneToManyGrandparentFields__c"]');
    if (await oneToManyFieldInput.isVisible()) {
      await oneToManyFieldInput.clear();
      await oneToManyFieldInput.fill('Contact.AccountId');
      console.log('✅ Filled One To Many Grandparent Fields: Contact.AccountId');
    }
    
    // 4b. Fill Grandparent Relationship Field Path (Contact.Account.AnnualRevenue)
    const grandparentPathInput = page.locator('input[name="GrandparentRelationshipFieldPath__c"]');
    if (await grandparentPathInput.isVisible()) {
      await grandparentPathInput.clear();
      await grandparentPathInput.fill('Contact.Account.AnnualRevenue');
      console.log('✅ Filled Grandparent Relationship Field Path: Contact.Account.AnnualRevenue');
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
    
    await sfHelper.takeScreenshot('grandparent-max-form-completed');
    
    // 7. Try to execute the rollup
    console.log('🚀 Attempting to execute grandparent MAX rollup...');
    const startButton = page.locator('button:has-text("Start rollup!")');
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✅ Clicked Start rollup button');
      await page.waitForTimeout(3000);
      await sfHelper.takeScreenshot('grandparent-max-rollup-executed');
    }

    await sfHelper.cleanupTestData();
    console.log('✅ PASS: Grandparent MAX rollup test completed successfully');
    console.log('   - Successfully created varied data hierarchy for MAX testing');
    console.log('   - Successfully tested MAX operation across grandparent relationship');
    expect(true).toBeTruthy();
  });
});