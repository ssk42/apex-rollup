import { test, expect } from '@playwright/test';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { RollupConfiguration, TestRecord } from '../types/salesforce';

test.describe('Core Rollup Operations E2E Tests', () => {
  let sfHelper: SalesforceHelper;

  test.beforeEach(async ({ page }) => {
    sfHelper = new SalesforceHelper(page);
    
    // Login to Salesforce using credentials from global setup
    const loginUrl = process.env.E2E_SF_LOGIN_URL || 'https://login.salesforce.com';
    const username = process.env.E2E_SF_USERNAME!;
    const password = process.env.E2E_SF_PASSWORD!;
    
    await page.goto(loginUrl);
    await sfHelper.login(username, password);
    
    // Navigate to Rollup app
    await sfHelper.navigateToApp('Rollup');
  });

  test.afterEach(async () => {
    // Cleanup test data after each test
    await sfHelper.cleanupTestData();
  });

  test('SUM rollup operation aggregates numeric values correctly', async () => {
    console.log('🧮 Testing SUM rollup operation...');
    
    // Create test account
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account SUM ${Date.now()}`,
      AnnualRevenue: 0
    });
    
    // Create test opportunities with known amounts
    const expectedSum = 4500;
    const opportunities = [
      { Name: 'Opp 1', Amount: 1000, AccountId: account.Id },
      { Name: 'Opp 2', Amount: 2000, AccountId: account.Id },
      { Name: 'Opp 3', Amount: 1500, AccountId: account.Id }
    ];
    
    for (const oppData of opportunities) {
      await sfHelper.createTestRecord('Opportunity', {
        ...oppData,
        StageName: 'Prospecting',
        CloseDate: '2024-12-31'
      });
    }
    
    // Configure SUM rollup
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
    
    // Verify results
    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['AnnualRevenue']);
    expect(updatedAccount.AnnualRevenue).toBe(expectedSum);
    
    await sfHelper.takeScreenshot('sum-rollup-result');
    console.log(`✅ SUM rollup test passed - Expected: ${expectedSum}, Actual: ${updatedAccount.AnnualRevenue}`);
  });

  test('COUNT rollup operation counts related records correctly', async () => {
    console.log('🔢 Testing COUNT rollup operation...');
    
    // Create test account
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account COUNT ${Date.now()}`,
      NumberOfEmployees: 0
    });
    
    // Create test contacts
    const expectedCount = 3;
    const contacts = [
      { LastName: 'Contact 1', AccountId: account.Id },
      { LastName: 'Contact 2', AccountId: account.Id },
      { LastName: 'Contact 3', AccountId: account.Id }
    ];
    
    for (const contactData of contacts) {
      await sfHelper.createTestRecord('Contact', contactData);
    }
    
    // Configure COUNT rollup
    const rollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Contact',
      operation: 'COUNT',
      rollupField: 'NumberOfEmployees',
      lookupField: 'AccountId'
    };
    
    await sfHelper.configureRollup(rollupConfig);
    await sfHelper.executeRollup();
    
    // Verify results
    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['NumberOfEmployees']);
    expect(updatedAccount.NumberOfEmployees).toBe(expectedCount);
    
    await sfHelper.takeScreenshot('count-rollup-result');
    console.log(`✅ COUNT rollup test passed - Expected: ${expectedCount}, Actual: ${updatedAccount.NumberOfEmployees}`);
  });

  test('AVERAGE rollup operation calculates mean values correctly', async () => {
    console.log('📊 Testing AVERAGE rollup operation...');
    
    // Create test account
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account AVG ${Date.now()}`,
      AnnualRevenue: 0
    });
    
    // Create test opportunities with known amounts for easy average calculation
    const amounts = [1000, 2000, 3000];
    const expectedAverage = 2000; // (1000 + 2000 + 3000) / 3
    
    for (let i = 0; i < amounts.length; i++) {
      await sfHelper.createTestRecord('Opportunity', {
        Name: `Opp ${i + 1}`,
        Amount: amounts[i],
        AccountId: account.Id,
        StageName: 'Prospecting',
        CloseDate: '2024-12-31'
      });
    }
    
    // Configure AVERAGE rollup
    const rollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Opportunity',
      operation: 'AVERAGE',
      fieldToRollup: 'Amount',
      rollupField: 'AnnualRevenue',
      lookupField: 'AccountId'
    };
    
    await sfHelper.configureRollup(rollupConfig);
    await sfHelper.executeRollup();
    
    // Verify results
    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['AnnualRevenue']);
    expect(updatedAccount.AnnualRevenue).toBe(expectedAverage);
    
    await sfHelper.takeScreenshot('avg-rollup-result');
    console.log(`✅ AVERAGE rollup test passed - Expected: ${expectedAverage}, Actual: ${updatedAccount.AnnualRevenue}`);
  });

  test('MIN rollup operation finds minimum values correctly', async () => {
    console.log('📉 Testing MIN rollup operation...');
    
    // Create test account
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account MIN ${Date.now()}`,
      AnnualRevenue: 0
    });
    
    // Create test opportunities with varying amounts
    const amounts = [1500, 500, 3000, 1000]; // MIN = 500
    const expectedMin = 500;
    
    for (let i = 0; i < amounts.length; i++) {
      await sfHelper.createTestRecord('Opportunity', {
        Name: `Opp ${i + 1}`,
        Amount: amounts[i],
        AccountId: account.Id,
        StageName: 'Prospecting',
        CloseDate: '2024-12-31'
      });
    }
    
    // Configure MIN rollup
    const rollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Opportunity',
      operation: 'MIN',
      fieldToRollup: 'Amount',
      rollupField: 'AnnualRevenue',
      lookupField: 'AccountId'
    };
    
    await sfHelper.configureRollup(rollupConfig);
    await sfHelper.executeRollup();
    
    // Verify results
    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['AnnualRevenue']);
    expect(updatedAccount.AnnualRevenue).toBe(expectedMin);
    
    await sfHelper.takeScreenshot('min-rollup-result');
    console.log(`✅ MIN rollup test passed - Expected: ${expectedMin}, Actual: ${updatedAccount.AnnualRevenue}`);
  });

  test('MAX rollup operation finds maximum values correctly', async () => {
    console.log('📈 Testing MAX rollup operation...');
    
    // Create test account
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account MAX ${Date.now()}`,
      AnnualRevenue: 0
    });
    
    // Create test opportunities with varying amounts
    const amounts = [1500, 500, 3000, 1000]; // MAX = 3000
    const expectedMax = 3000;
    
    for (let i = 0; i < amounts.length; i++) {
      await sfHelper.createTestRecord('Opportunity', {
        Name: `Opp ${i + 1}`,
        Amount: amounts[i],
        AccountId: account.Id,
        StageName: 'Prospecting',
        CloseDate: '2024-12-31'
      });
    }
    
    // Configure MAX rollup
    const rollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Opportunity',
      operation: 'MAX',
      fieldToRollup: 'Amount',
      rollupField: 'AnnualRevenue',
      lookupField: 'AccountId'
    };
    
    await sfHelper.configureRollup(rollupConfig);
    await sfHelper.executeRollup();
    
    // Verify results
    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['AnnualRevenue']);
    expect(updatedAccount.AnnualRevenue).toBe(expectedMax);
    
    await sfHelper.takeScreenshot('max-rollup-result');
    console.log(`✅ MAX rollup test passed - Expected: ${expectedMax}, Actual: ${updatedAccount.AnnualRevenue}`);
  });

  test('CONCAT rollup operation concatenates text values correctly', async () => {
    console.log('🔗 Testing CONCAT rollup operation...');
    
    // Create test account
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account CONCAT ${Date.now()}`,
      Description: null
    });
    
    // Create test contacts with known last names
    const lastNames = ['Smith', 'Johnson', 'Williams'];
    
    for (const lastName of lastNames) {
      await sfHelper.createTestRecord('Contact', {
        LastName: lastName,
        FirstName: 'Test',
        AccountId: account.Id
      });
    }
    
    // Configure CONCAT rollup
    const rollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Contact',
      operation: 'CONCAT',
      fieldToRollup: 'LastName',
      rollupField: 'Description',
      lookupField: 'AccountId',
      delimiter: ', '
    };
    
    await sfHelper.configureRollup(rollupConfig);
    await sfHelper.executeRollup();
    
    // Verify results
    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['Description']);
    
    // Check that all names are present (order may vary)
    for (const lastName of lastNames) {
      expect(updatedAccount.Description).toContain(lastName);
    }
    
    await sfHelper.takeScreenshot('concat-rollup-result');
    console.log(`✅ CONCAT rollup test passed - Result: ${updatedAccount.Description}`);
  });

  test('CONCAT_DISTINCT rollup operation handles duplicate values correctly', async () => {
    console.log('🔗✨ Testing CONCAT_DISTINCT rollup operation...');
    
    // Create test account
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account CONCAT_DISTINCT ${Date.now()}`,
      Description: null
    });
    
    // Create test opportunities with some duplicate stages
    const stageData = [
      { Name: 'Opp 1', StageName: 'Prospecting' },
      { Name: 'Opp 2', StageName: 'Qualification' },
      { Name: 'Opp 3', StageName: 'Prospecting' }, // Duplicate
      { Name: 'Opp 4', StageName: 'Proposal' }
    ];
    
    for (const oppData of stageData) {
      await sfHelper.createTestRecord('Opportunity', {
        ...oppData,
        Amount: 1000,
        AccountId: account.Id,
        CloseDate: '2024-12-31'
      });
    }
    
    // Configure CONCAT_DISTINCT rollup
    const rollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Opportunity',
      operation: 'CONCAT_DISTINCT',
      fieldToRollup: 'StageName',
      rollupField: 'Description',
      lookupField: 'AccountId',
      delimiter: '; '
    };
    
    await sfHelper.configureRollup(rollupConfig);
    await sfHelper.executeRollup();
    
    // Verify results
    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['Description']);
    
    // Split result and verify uniqueness
    const stages = updatedAccount.Description.split('; ');
    const uniqueStages = [...new Set(stages)];
    
    expect(stages.length).toBe(uniqueStages.length); // All should be unique
    expect(updatedAccount.Description).toContain('Prospecting');
    expect(updatedAccount.Description).toContain('Qualification');
    expect(updatedAccount.Description).toContain('Proposal');
    
    await sfHelper.takeScreenshot('concat-distinct-rollup-result');
    console.log(`✅ CONCAT_DISTINCT rollup test passed - Result: ${updatedAccount.Description}`);
  });

  test('FIRST rollup operation retrieves first record correctly', async () => {
    console.log('🥇 Testing FIRST rollup operation...');
    
    // Create test account
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account FIRST ${Date.now()}`,
      Description: null
    });
    
    // Create test opportunities with deliberate timing
    const oppNames = ['First Opp', 'Second Opp', 'Third Opp'];
    
    for (let i = 0; i < oppNames.length; i++) {
      // Add small delay to ensure different creation times
      if (i > 0) await sfHelper.page.waitForTimeout(1000);
      
      await sfHelper.createTestRecord('Opportunity', {
        Name: oppNames[i],
        Amount: 1000 * (i + 1),
        AccountId: account.Id,
        StageName: 'Prospecting',
        CloseDate: '2024-12-31'
      });
    }
    
    // Configure FIRST rollup (should get the first created opportunity name)
    const rollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Opportunity',
      operation: 'FIRST',
      fieldToRollup: 'Name',
      rollupField: 'Description',
      lookupField: 'AccountId',
      orderBy: 'CreatedDate ASC'
    };
    
    await sfHelper.configureRollup(rollupConfig);
    await sfHelper.executeRollup();
    
    // Verify results
    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['Description']);
    expect(updatedAccount.Description).toBe('First Opp');
    
    await sfHelper.takeScreenshot('first-rollup-result');
    console.log(`✅ FIRST rollup test passed - Result: ${updatedAccount.Description}`);
  });

  test('LAST rollup operation retrieves last record correctly', async () => {
    console.log('🏁 Testing LAST rollup operation...');
    
    // Create test account
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account LAST ${Date.now()}`,
      Description: null
    });
    
    // Create test opportunities with deliberate timing
    const oppNames = ['First Opp', 'Second Opp', 'Last Opp'];
    
    for (let i = 0; i < oppNames.length; i++) {
      // Add small delay to ensure different creation times
      if (i > 0) await sfHelper.page.waitForTimeout(1000);
      
      await sfHelper.createTestRecord('Opportunity', {
        Name: oppNames[i],
        Amount: 1000 * (i + 1),
        AccountId: account.Id,
        StageName: 'Prospecting',
        CloseDate: '2024-12-31'
      });
    }
    
    // Configure LAST rollup (should get the last created opportunity name)
    const rollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Opportunity',
      operation: 'LAST',
      fieldToRollup: 'Name',
      rollupField: 'Description',
      lookupField: 'AccountId',
      orderBy: 'CreatedDate ASC'
    };
    
    await sfHelper.configureRollup(rollupConfig);
    await sfHelper.executeRollup();
    
    // Verify results
    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['Description']);
    expect(updatedAccount.Description).toBe('Last Opp');
    
    await sfHelper.takeScreenshot('last-rollup-result');
    console.log(`✅ LAST rollup test passed - Result: ${updatedAccount.Description}`);
  });

  test('Complex where clause filtering works correctly', async () => {
    console.log('🔍 Testing complex where clause rollup...');
    
    // Create test account
    const account = await sfHelper.createTestRecord('Account', {
      Name: `Test Account WHERE ${Date.now()}`,
      AnnualRevenue: 0
    });
    
    // Create test opportunities with different amounts and stages
    const opportunities = [
      { Name: 'Opp 1', Amount: 1000, StageName: 'Closed Won' },
      { Name: 'Opp 2', Amount: 2000, StageName: 'Closed Lost' },
      { Name: 'Opp 3', Amount: 1500, StageName: 'Closed Won' },
      { Name: 'Opp 4', Amount: 3000, StageName: 'Prospecting' }
    ];
    
    for (const oppData of opportunities) {
      await sfHelper.createTestRecord('Opportunity', {
        ...oppData,
        AccountId: account.Id,
        CloseDate: '2024-12-31'
      });
    }
    
    // Configure SUM rollup with WHERE clause for only closed won >= 1000
    const rollupConfig: RollupConfiguration = {
      parentObject: 'Account',
      childObject: 'Opportunity',
      operation: 'SUM',
      fieldToRollup: 'Amount',
      rollupField: 'AnnualRevenue',
      lookupField: 'AccountId',
      whereClause: "StageName = 'Closed Won' AND Amount >= 1000"
    };
    
    await sfHelper.configureRollup(rollupConfig);
    await sfHelper.executeRollup();
    
    // Verify results - should only sum Closed Won opps >= 1000 (1000 + 1500 = 2500)
    const expectedSum = 2500;
    const updatedAccount = await sfHelper.getRecord('Account', account.Id!, ['AnnualRevenue']);
    expect(updatedAccount.AnnualRevenue).toBe(expectedSum);
    
    await sfHelper.takeScreenshot('complex-where-clause-rollup');
    console.log(`✅ Complex where clause test passed - Expected: ${expectedSum}, Actual: ${updatedAccount.AnnualRevenue}`);
  });
});