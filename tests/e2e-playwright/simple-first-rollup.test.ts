import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from './utils/scratch-org-helper';
import { SalesforceHelper } from './utils/salesforce-helper';
import { TestDataFactory } from './utils/test-data-factory';

test.describe('First Rollup Operation Test', () => {
  test('SUM rollup: Account.AnnualRevenue = SUM(Opportunity.Amount)', async ({ page }) => {
    console.log('🧮 Testing SUM rollup operation...');
    
    // Get credentials and login
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    console.log('✅ Authenticated successfully');
    
    // Step 1: Create Account with Opportunities
    console.log('📊 Creating test data for SUM rollup...');
    const { account, opportunities } = await testFactory.createAccountWithOpportunities(3, [1000, 2000, 1500]);
    
    // Verify initial state: Account.AnnualRevenue should be null
    expect(account.Id).toBeTruthy();
    expect(opportunities).toHaveLength(3);
    
    // Step 2: Execute rollup via Apex (simulating trigger)
    console.log('⚡ Executing SUM rollup operation...');
    
    // Use Salesforce CLI to execute anonymous Apex for rollup
    const rollupScript = `
      // Query the opportunities we just created
      List<Opportunity> opps = [SELECT Id, Amount, AccountId FROM Opportunity WHERE AccountId = '${account.Id}'];
      System.debug('Found ' + opps.size() + ' opportunities');
      
      // Execute rollup using the Rollup library
      Rollup.sumFromApex(
        Opportunity.Amount,           // Field to rollup
        Opportunity.AccountId,        // Lookup field on child
        Account.Id,                  // Lookup field on parent
        Account.AnnualRevenue,       // Target field on parent
        Account.SObjectType          // Parent object type
      )
      .setRecords(opps)               // Set the records to process
      .runCalc();                     // Execute the calculation
      
      // Verify the result
      Account updatedAccount = [SELECT Id, AnnualRevenue FROM Account WHERE Id = '${account.Id}'];
      System.debug('Account AnnualRevenue after rollup: ' + updatedAccount.AnnualRevenue);
    `;
    
    try {
      const result = require('child_process').execSync(
        `sf apex run --target-org apex-rollup-scratch-org --file /dev/stdin`, 
        { 
          input: rollupScript,
          encoding: 'utf8',
          timeout: 30000,
          env: { ...process.env, FORCE_COLOR: '0' }
        }
      );
      
      console.log('Rollup execution result:', result);
    } catch (error) {
      console.error('Rollup execution failed:', error.message);
      throw error;
    }
    
    // Step 3: Verify the rollup worked
    console.log('✅ Verifying rollup results...');
    
    // Query the account to check the rolled-up value
    const verifyResult = require('child_process').execSync(
      `sf data query --query "SELECT Id, AnnualRevenue FROM Account WHERE Id = '${account.Id}'" --target-org apex-rollup-scratch-org --json`,
      {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' }
      }
    );
    
    const cleanResult = verifyResult.replace(/\\u001b\\[[0-9;]*m/g, '');
    const queryData = JSON.parse(cleanResult);
    
    if (queryData.status === 0 && queryData.result.records.length > 0) {
      const updatedAccount = queryData.result.records[0];
      const expectedSum = 1000 + 2000 + 1500; // 4500
      
      console.log(`Account AnnualRevenue: ${updatedAccount.AnnualRevenue}`);
      console.log(`Expected sum: ${expectedSum}`);
      
      expect(updatedAccount.AnnualRevenue).toBe(expectedSum);
      console.log('✅ SUM rollup operation successful!');
    } else {
      throw new Error('Failed to query updated account');
    }
    
    // Take screenshot showing successful rollup
    await sfHelper.takeScreenshot('sum-rollup-result');
    
    // Cleanup
    await sfHelper.cleanupTestData();
    console.log('✅ First rollup test completed successfully');
  });
});