import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from './utils/scratch-org-helper';
import { SalesforceHelper } from './utils/salesforce-helper';
import { TestDataFactory } from './utils/test-data-factory';

test.describe('Data Creation Test', () => {
  test('can create test data using patterns from Apex tests', async ({ page }) => {
    console.log('📝 Testing data creation with Apex test patterns...');
    
    // Get credentials and login
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    console.log('✅ Authenticated successfully');
    
    // Test 1: Standard objects (Account + Opportunities) - mirrors Apex test patterns
    console.log('🏢 Creating Account + Opportunities (standard objects)...');
    const { account, opportunities } = await testFactory.createAccountWithOpportunities(3, [1000, 2000, 1500]);
    
    expect(account.Id).toBeTruthy();
    expect(account.Name).toContain('RollupTests');
    expect(opportunities).toHaveLength(3);
    expect(opportunities[0].Amount).toBe(1000);
    expect(opportunities[1].Amount).toBe(2000);
    expect(opportunities[2].Amount).toBe(1500);
    
    // Test 2: Custom objects (RollupParent + RollupChild) - matches extra-tests objects
    console.log('👨‍👩‍👧‍👦 Creating RollupParent + RollupChild (custom objects)...');
    const { parent, children } = await testFactory.createParentWithChildren(3, [100, 200, 150]);
    
    expect(parent.Id).toBeTruthy();
    expect(parent.Name).toContain('RollupParent');
    expect(children).toHaveLength(3);
    expect(children[0].NumberField__c).toBe(100);
    expect(children[1].NumberField__c).toBe(200);
    expect(children[2].NumberField__c).toBe(150);
    
    // Test 3: ContactPointAddress - used in many Apex tests
    console.log('📍 Creating ContactPointAddress...');
    const cpa = await testFactory.createContactPointAddress(account.Id, {
      PreferenceRank: 500 // Standard value from Apex tests
    });
    
    expect(cpa.Id).toBeTruthy();
    expect(cpa.PreferenceRank).toBe(500);
    expect(cpa.Name).toContain('RollupTestsCpa');
    
    // Test 4: Application objects - for complex scenarios
    console.log('📱 Creating Application + ApplicationLog...');
    const application = await testFactory.createApplication();
    const appLog = await testFactory.createApplicationLog(application.Id!);
    
    expect(application.Id).toBeTruthy();
    expect(appLog.Id).toBeTruthy();
    expect(appLog.Application__c).toBe(application.Id);
    
    console.log('✅ All test data creation patterns successful');
    
    // Take a screenshot showing we're still authenticated
    await sfHelper.takeScreenshot('apex-pattern-data-creation-complete');
    
    // Test cleanup
    console.log('🧹 Testing data cleanup...');
    await sfHelper.cleanupTestData();
    console.log('✅ Cleanup completed');
  });

  test('can create grandparent rollup scenario', async ({ page }) => {
    console.log('👴 Testing grandparent rollup data creation...');
    
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create grandparent scenario: RollupGrandparent -> RollupParent -> RollupChild
    const { grandparent, parent, children } = await testFactory.createGrandparentScenario();
    
    expect(grandparent.Id).toBeTruthy();
    expect(parent.Id).toBeTruthy();
    expect(parent.RollupGrandparent__c).toBe(grandparent.Id);
    expect(children).toHaveLength(3);
    
    // Verify the chain of relationships
    for (const child of children) {
      expect(child.RollupParent__c).toBe(parent.Id);
    }
    
    console.log('✅ Grandparent rollup scenario created successfully');
    await sfHelper.takeScreenshot('grandparent-scenario-complete');
    await sfHelper.cleanupTestData();
  });
});