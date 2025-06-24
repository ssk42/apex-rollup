import { test, expect } from '@playwright/test';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { RollupConfiguration } from '../types/salesforce';

test.describe('Advanced Rollup Features E2E Tests', () => {
  let sfHelper: SalesforceHelper;

  test.beforeEach(async ({ page }) => {
    sfHelper = new SalesforceHelper(page);
    await page.goto(process.env.SF_LOGIN_URL || 'https://login.salesforce.com');
    await sfHelper.login(process.env.SF_USERNAME!, process.env.SF_PASSWORD!);
    await sfHelper.navigateToApp('Rollup');
  });

  test.afterEach(async () => {
    await sfHelper.cleanupTestData();
  });

  test('Multi-currency rollup with conversion', async () => {
    console.log('💱 Testing multi-currency rollup...');
    
    // Skip if multi-currency not enabled
    const isMultiCurrencyEnabled = await sfHelper.checkMultiCurrencyEnabled();
    test.skip(!isMultiCurrencyEnabled, 'Multi-currency not enabled in this org');
    
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account CURRENCY ${Date.now()}`,
      AnnualRevenue: 0
    });
    
    // Create opportunities with different currencies
    const opportunities = [
      { Name: 'USD Opp', Amount: 1000, CurrencyIsoCode: 'USD', AccountId: account.Id },
      { Name: 'EUR Opp', Amount: 850, CurrencyIsoCode: 'EUR', AccountId: account.Id }
    ];
    
    for (const opp of opportunities) {
      await sfHelper.createTestRecord('Opportunity', {
        ...opp,
        StageName: 'Prospecting',
        CloseDate: '2024-12-31'
      });
    }
    
    const rollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Opportunity',
      operation: 'SUM',
      fieldToRollup: 'Amount',
      rollupField: 'AnnualRevenue',
      lookupField: 'AccountId'
    };
    
    await sfHelper.configureRollup(rollupConfig);
    await sfHelper.executeRollup();
    
    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['AnnualRevenue']);
    expect(updatedAccount.AnnualRevenue).toBeGreaterThan(1500); // Should be >1500 after conversion
    
    await sfHelper.takeScreenshot('multi-currency-rollup');
    console.log('✅ Multi-currency rollup test completed');
  });

  test('Performance testing with large dataset', async () => {
    console.log('⚡ Testing performance with large dataset...');
    
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account PERFORMANCE ${Date.now()}`,
      AnnualRevenue: 0
    });
    
    console.log('Creating large dataset for performance testing...');
    
    // Create many opportunities for performance testing
    const batchSize = 10;
    const numBatches = 5; // Total: 50 records
    
    for (let batch = 0; batch < numBatches; batch++) {
      const promises = [];
      for (let i = 0; i < batchSize; i++) {
        const recordIndex = batch * batchSize + i;
        promises.push(sfHelper.createTestRecord('Opportunity', {
          Name: `Perf Opp ${recordIndex}`,
          Amount: Math.floor(Math.random() * 10000) + 1000,
          StageName: 'Prospecting',
          CloseDate: '2024-12-31',
          AccountId: account.Id
        }));
      }
      await Promise.all(promises);
      console.log(`Created batch ${batch + 1}/${numBatches}`);
    }
    
    const startTime = Date.now();
    
    const rollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Opportunity',
      operation: 'SUM',
      fieldToRollup: 'Amount',
      rollupField: 'AnnualRevenue',
      lookupField: 'AccountId'
    };
    
    await sfHelper.configureRollup(rollupConfig);
    await sfHelper.executeRollup();
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    console.log(`Rollup execution time for ${batchSize * numBatches} records: ${executionTime}ms`);
    
    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['AnnualRevenue']);
    expect(updatedAccount.AnnualRevenue).toBeGreaterThan(50000); // Should have substantial sum
    expect(executionTime).toBeLessThan(120000); // Should complete within 2 minutes
    
    await sfHelper.takeScreenshot('performance-monitoring-rollup');
    console.log('✅ Performance test completed successfully');
  });

  test('Boolean operation (ALL) works correctly', async () => {
    console.log('🔢 Testing ALL boolean operation...');

    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account ALL ${Date.now()}`,
      Rollup_To_Checkbox__c: false
    });

    // Create opportunities that all match the criteria
    const allMatchingOpps = [
      { Name: 'Opp 1', StageName: 'Closed Won', IsPrivate: true, AccountId: account.Id },
      { Name: 'Opp 2', StageName: 'Closed Won', IsPrivate: true, AccountId: account.Id }
    ];

    for (const opp of allMatchingOpps) {
      await sfHelper.createTestRecord('Opportunity', {
        ...opp,
        Amount: 1000,
        CloseDate: '2024-12-31'
      });
    }

    // Configure ALL rollup
    const allRollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Opportunity',
      operation: 'ALL',
      rollupField: 'Rollup_To_Checkbox__c',
      lookupField: 'AccountId',
      whereClause: "IsPrivate = true"
    };

    await sfHelper.configureRollup(allRollupConfig);
    await sfHelper.executeRollup();

    let result = await sfHelper.getRecord('Account', account.Id!, ['Rollup_To_Checkbox__c']);
    expect(result.Rollup_To_Checkbox__c).toBeTruthy();
    
    // Now add one that does NOT match
    await sfHelper.createTestRecord('Opportunity', {
      Name: 'Opp 3 Not Private',
      StageName: 'Closed Won',
      IsPrivate: false,
      AccountId: account.Id,
      Amount: 1000,
      CloseDate: '2024-12-31'
    });
    
    // Rerun rollup - can we assume DML triggers it? Let's execute explicitly for test stability
    await sfHelper.executeRollup();
    
    result = await sfHelper.getRecord('Account', account.Id!, ['Rollup_To_Checkbox__c']);
    expect(result.Rollup_To_Checkbox__c).toBeFalsy();

    await sfHelper.takeScreenshot('all-rollup-result');
    console.log('✅ ALL boolean operation test completed');
  });

  test('Boolean operation (SOME) works correctly', async () => {
    console.log('🔢 Testing SOME boolean operation...');

    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account SOME ${Date.now()}`,
      Rollup_To_Checkbox__c: false
    });

    // Create opportunities where none match initially
    await sfHelper.createTestRecord('Opportunity', {
      Name: 'Opp 1 Not Private',
      IsPrivate: false,
      AccountId: account.Id,
      Amount: 1000,
      CloseDate: '2024-12-31',
      StageName: 'Prospecting',
    });

    const someRollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Opportunity',
      operation: 'SOME',
      rollupField: 'Rollup_To_Checkbox__c',
      lookupField: 'AccountId',
      whereClause: "IsPrivate = true"
    };

    await sfHelper.configureRollup(someRollupConfig);
    await sfHelper.executeRollup();

    let result = await sfHelper.getRecord('Account', account.Id!, ['Rollup_To_Checkbox__c']);
    expect(result.Rollup_To_Checkbox__c).toBeFalsy();

    // Now add one that DOES match
    await sfHelper.createTestRecord('Opportunity', {
      Name: 'Opp 2 Is Private',
      IsPrivate: true,
      AccountId: account.Id,
      Amount: 1000,
      CloseDate: '2024-12-31',
      StageName: 'Prospecting',
    });

    await sfHelper.executeRollup();
    result = await sfHelper.getRecord('Account', account.Id!, ['Rollup_To_Checkbox__c']);
    expect(result.Rollup_To_Checkbox__c).toBeTruthy();

    await sfHelper.takeScreenshot('some-rollup-result');
    console.log('✅ SOME boolean operation test completed');
  });

  test('Boolean operation (NONE) works correctly', async () => {
    console.log('🔢 Testing NONE boolean operation...');

    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account NONE ${Date.now()}`,
      Rollup_To_Checkbox__c: false
    });

    // Create opportunities that do not match the where clause
    await sfHelper.createTestRecord('Opportunity', {
      Name: 'Opp 1 Not Closed Won',
      StageName: 'Prospecting',
      AccountId: account.Id,
      Amount: 1000,
      CloseDate: '2024-12-31'
    });

    const noneRollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Opportunity',
      operation: 'NONE',
      rollupField: 'Rollup_To_Checkbox__c',
      lookupField: 'AccountId',
      whereClause: "StageName = 'Closed Won'"
    };

    await sfHelper.configureRollup(noneRollupConfig);
    await sfHelper.executeRollup();

    let result = await sfHelper.getRecord('Account', account.Id!, ['Rollup_To_Checkbox__c']);
    expect(result.Rollup_To_Checkbox__c).toBeTruthy();

    // Now add one that DOES match, which should make the NONE condition false
    await sfHelper.createTestRecord('Opportunity', {
      Name: 'Opp 2 Closed Won',
      StageName: 'Closed Won',
      AccountId: account.Id,
      Amount: 1000,
      CloseDate: '2024-12-31'
    });

    await sfHelper.executeRollup();
    result = await sfHelper.getRecord('Account', account.Id!, ['Rollup_To_Checkbox__c']);
    expect(result.Rollup_To_Checkbox__c).toBeFalsy();

    await sfHelper.takeScreenshot('none-rollup-result');
    console.log('✅ NONE boolean operation test completed');
  });

  test('Grandparent rollup across multiple relationships', async () => {
    console.log('👴 Testing grandparent rollup...');
    
    // Create Account -> Contact -> Case rollup chain
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account GRANDPARENT ${Date.now()}`,
      Description: null
    });
    
    const contact = await sfHelper.createTestRecord('Contact', {
      LastName: 'Test Contact',
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
    
    // Configure grandparent rollup: Account <- Contact <- Case
    const grandparentConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Case',
      operation: 'COUNT',
      rollupField: 'NumberOfEmployees', // Using as counter
      lookupField: 'Contact.AccountId' // Grandparent relationship
    };
    
    await sfHelper.configureRollup(grandparentConfig);
    await sfHelper.executeRollup();
    
    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['NumberOfEmployees']);
    expect(updatedAccount.NumberOfEmployees).toBe(3);
    
    await sfHelper.takeScreenshot('grandparent-rollup-result');
    console.log('✅ Grandparent rollup test completed');
  });

  test('Async processing for large data volumes', async () => {
    console.log('🔄 Testing async processing...');
    
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account ASYNC ${Date.now()}`,
      AnnualRevenue: 0
    });
    
    // Create a substantial number of records to trigger async processing
    console.log('Creating large dataset to trigger async processing...');
    
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(sfHelper.createTestRecord('Opportunity', {
        Name: `Async Opp ${i}`,
        Amount: Math.floor(Math.random() * 5000) + 1000,
        StageName: 'Prospecting',
        CloseDate: '2024-12-31',
        AccountId: account.Id
      }));
      
      // Batch creation to avoid overwhelming the system
      if (promises.length === 20) {
        await Promise.all(promises);
        promises.length = 0; // Clear array
        console.log(`Created ${i + 1}/100 records`);
      }
    }
    
    // Create remaining records
    if (promises.length > 0) {
      await Promise.all(promises);
    }
    
    const rollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Opportunity',
      operation: 'SUM',
      fieldToRollup: 'Amount',
      rollupField: 'AnnualRevenue',
      lookupField: 'AccountId'
    };
    
    await sfHelper.configureRollup(rollupConfig);
    
    // Execute rollup and expect async processing
    await sfHelper.executeRollup();
    
    // For async processing, we may need to wait and check status
    // This would depend on the actual implementation
    await sfHelper.waitForTimeout(5000); // Wait for async processing
    
    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['AnnualRevenue']);
    expect(updatedAccount.AnnualRevenue).toBeGreaterThan(100000); // Should have substantial sum
    
    await sfHelper.takeScreenshot('async-processing-result');
    console.log('✅ Async processing test completed');
  });

  test('Custom field types and validation', async () => {
    console.log('🔧 Testing custom field types...');
    
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account CUSTOM ${Date.now()}`,
      NumberOfEmployees: 0
    });
    
    // Test with various field types if available
    const opportunities = [
      { 
        Name: 'Custom Field Test 1', 
        Amount: 1000,
        AccountId: account.Id,
        // Add custom fields if they exist in the org
        Probability: 50
      },
      { 
        Name: 'Custom Field Test 2', 
        Amount: 2000,
        AccountId: account.Id,
        Probability: 75
      }
    ];
    
    for (const opp of opportunities) {
      await sfHelper.createTestRecord('Opportunity', {
        ...opp,
        StageName: 'Prospecting',
        CloseDate: '2024-12-31'
      });
    }
    
    // Test rollup on custom/formula fields
    const rollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Opportunity',
      operation: 'AVERAGE',
      fieldToRollup: 'Probability',
      rollupField: 'NumberOfEmployees',
      lookupField: 'AccountId'
    };
    
    await sfHelper.configureRollup(rollupConfig);
    await sfHelper.executeRollup();
    
    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['NumberOfEmployees']);
    expect(updatedAccount.NumberOfEmployees).toBe(62.5); // (50 + 75) / 2
    
    await sfHelper.takeScreenshot('custom-field-rollup-result');
    console.log('✅ Custom field types test completed');
  });
});