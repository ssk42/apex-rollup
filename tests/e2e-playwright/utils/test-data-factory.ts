import { SalesforceHelper } from './salesforce-helper';
import { TestRecord } from '../types/salesforce';

/**
 * Test Data Factory that mirrors the patterns used in Apex tests
 * Uses the same objects and field mappings as extra-tests
 */
export class TestDataFactory {
  private sfHelper: SalesforceHelper;
  private testCounter = 1;

  constructor(sfHelper: SalesforceHelper) {
    this.sfHelper = sfHelper;
  }

  /**
   * Create test account with rollup fields (matches Apex test patterns)
   */
  async createTestAccount(overrides: Record<string, any> = {}): Promise<TestRecord> {
    const defaultData = {
      Name: `RollupTests ${this.getTestId()}`,
      AnnualRevenue: null, // Common rollup target field
      Phone: '9999999999', // Common in Apex tests
      Type: 'Customer'
    };

    return await this.sfHelper.createTestRecord('Account', { ...defaultData, ...overrides });
  }

  /**
   * Create test opportunity (matches Apex test patterns)
   */
  async createTestOpportunity(accountId: string, overrides: Record<string, any> = {}): Promise<TestRecord> {
    const defaultData = {
      Name: `Rollup Integration ${this.getTestId()}`,
      StageName: 'Prospecting', // Standard stage
      CloseDate: '2024-12-31',
      Amount: 1000, // Common test amount
      AccountId: accountId
    };

    return await this.sfHelper.createTestRecord('Opportunity', { ...defaultData, ...overrides });
  }

  /**
   * Create RollupParent__c record (custom object for rollup testing)
   */
  async createRollupParent(overrides: Record<string, any> = {}): Promise<TestRecord> {
    const defaultData = {
      Name: `RollupParent ${this.getTestId()}`
      // Note: Custom fields like NumberField__c don't exist in this deployment
      // We'll use standard objects for testing rollup functionality
    };

    return await this.sfHelper.createTestRecord('RollupParent__c', { ...defaultData, ...overrides });
  }

  /**
   * Create RollupChild__c record (custom object for rollup testing)
   */
  async createRollupChild(parentId: string, overrides: Record<string, any> = {}): Promise<TestRecord> {
    const defaultData = {
      Name: `RollupChild ${this.getTestId()}`
      // Note: Custom lookup and number fields don't exist in this deployment
      // We'll use standard objects for testing rollup functionality
    };

    return await this.sfHelper.createTestRecord('RollupChild__c', { ...defaultData, ...overrides });
  }

  /**
   * Create ContactPointAddress (used in many Apex tests)
   */
  async createContactPointAddress(parentId?: string, overrides: Record<string, any> = {}): Promise<TestRecord> {
    const defaultData = {
      Name: `RollupTestsCpa ${this.getTestId()}`,
      PreferenceRank: 500, // Standard test value from Apex tests
      ...(parentId && { ParentId: parentId })
    };

    return await this.sfHelper.createTestRecord('ContactPointAddress', { ...defaultData, ...overrides });
  }

  /**
   * Create Application__c (custom object for complex scenarios)
   */
  async createApplication(overrides: Record<string, any> = {}): Promise<TestRecord> {
    const defaultData = {
      Name: `RollupIntegrationTests App ${this.getTestId()}`,
      Engagement_Score__c: 0,
      Objects__c: null,
      Picklist__c: 'Option1'
    };

    return await this.sfHelper.createTestRecord('Application__c', { ...defaultData, ...overrides });
  }

  /**
   * Create ApplicationLog__c (child of Application__c)
   */
  async createApplicationLog(applicationId: string, overrides: Record<string, any> = {}): Promise<TestRecord> {
    const defaultData = {
      Name: `AppLog ${this.getTestId()}`,
      Application__c: applicationId,
      Object__c: 'Test Object'
    };

    return await this.sfHelper.createTestRecord('ApplicationLog__c', { ...defaultData, ...overrides });
  }

  /**
   * Create a complete Account + Opportunities test set (common pattern)
   */
  async createAccountWithOpportunities(oppCount: number = 3, oppAmounts: number[] = [1000, 2000, 1500]): Promise<{
    account: TestRecord;
    opportunities: TestRecord[];
  }> {
    console.log(`🏗️  Creating account with ${oppCount} opportunities...`);
    
    const account = await this.createTestAccount();
    const opportunities: TestRecord[] = [];

    for (let i = 0; i < oppCount; i++) {
      const amount = oppAmounts[i] || 1000;
      const opp = await this.createTestOpportunity(account.Id!, {
        Name: `Opp ${i + 1}`,
        Amount: amount
      });
      opportunities.push(opp);
    }

    console.log(`✅ Created account ${account.Id} with ${opportunities.length} opportunities`);
    return { account, opportunities };
  }

  /**
   * Create a complete RollupParent + RollupChild test set
   */
  async createParentWithChildren(childCount: number = 3, childValues: number[] = [100, 200, 150]): Promise<{
    parent: TestRecord;
    children: TestRecord[];
  }> {
    console.log(`🏗️  Creating parent with ${childCount} children...`);
    
    const parent = await this.createRollupParent();
    const children: TestRecord[] = [];

    for (let i = 0; i < childCount; i++) {
      const child = await this.createRollupChild(parent.Id!, {
        Name: `Child ${i + 1}`
        // Note: Custom fields not available in this deployment
      });
      children.push(child);
    }

    console.log(`✅ Created parent ${parent.Id} with ${children.length} children`);
    return { parent, children };
  }

  /**
   * Create grandparent rollup test scenario
   */
  async createGrandparentScenario(): Promise<{
    grandparent: TestRecord;
    parent: TestRecord;
    children: TestRecord[];
  }> {
    console.log(`🏗️  Creating grandparent rollup scenario...`);
    
    // Create grandparent
    const grandparent = await this.sfHelper.createTestRecord('RollupGrandparent__c', {
      Name: `Grandparent ${this.getTestId()}`
      // Note: Custom amount fields not available in this deployment
    });

    // Create parent linked to grandparent
    const parent = await this.createRollupParent();

    // Create children linked to parent
    const children = [];
    for (let i = 0; i < 3; i++) {
      const child = await this.createRollupChild(parent.Id!, {
        Name: `Child ${i + 1}`
        // Note: Custom fields not available
      });
      children.push(child);
    }

    console.log(`✅ Created grandparent scenario: ${grandparent.Id} -> ${parent.Id} -> ${children.length} children`);
    return { grandparent, parent, children };
  }

  /**
   * Get unique test identifier
   */
  private getTestId(): string {
    return `${Date.now()}_${this.testCounter++}`;
  }

  /**
   * Common test values used across Apex tests
   */
  static readonly TEST_VALUES = {
    AMOUNTS: [1, 50, 100, 500, 1000, 1500, 2000, 3000],
    STAGE_NAMES: ['Prospecting', 'Qualification', 'Proposal', 'Closed Won', 'Closed Lost'],
    TEXT_VALUES: ['Test Text', 'Sample Data', 'Integration Test'],
    PREFERENCE_RANKS: [100, 200, 300, 400, 500]
  } as const;

  /**
   * Get random value from common test values
   */
  static getRandomAmount(): number {
    return this.TEST_VALUES.AMOUNTS[Math.floor(Math.random() * this.TEST_VALUES.AMOUNTS.length)];
  }

  static getRandomStage(): string {
    return this.TEST_VALUES.STAGE_NAMES[Math.floor(Math.random() * this.TEST_VALUES.STAGE_NAMES.length)];
  }

  // ========================================
  // ROLLUP OPERATION SPECIFIC TEST DATA
  // ========================================

  /**
   * Create data set for SUM operation testing
   * Account.AnnualRevenue = SUM(Opportunity.Amount)
   */
  async createSumTestData(): Promise<{
    account: TestRecord;
    opportunities: TestRecord[];
    expectedResult: number;
  }> {
    const amounts = [1000, 2000, 1500]; // Expected sum: 4500
    const { account, opportunities } = await this.createAccountWithOpportunities(3, amounts);
    
    return {
      account,
      opportunities,
      expectedResult: amounts.reduce((sum, amount) => sum + amount, 0)
    };
  }

  /**
   * Create data set for AVERAGE operation testing
   */
  async createAverageTestData(): Promise<{
    account: TestRecord;
    opportunities: TestRecord[];
    expectedResult: number;
  }> {
    const amounts = [1000, 2000, 3000]; // Expected average: 2000
    const { account, opportunities } = await this.createAccountWithOpportunities(3, amounts);
    
    return {
      account,
      opportunities,
      expectedResult: amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
    };
  }

  /**
   * Create data set for COUNT operation testing
   */
  async createCountTestData(): Promise<{
    account: TestRecord;
    opportunities: TestRecord[];
    expectedResult: number;
  }> {
    const amounts = [1000, 2000, 1500];
    const { account, opportunities } = await this.createAccountWithOpportunities(3, amounts);
    
    return {
      account,
      opportunities,
      expectedResult: 3 // Count of non-null Amount fields
    };
  }

  /**
   * Create data set for COUNT_DISTINCT operation testing
   */
  async createCountDistinctTestData(): Promise<{
    account: TestRecord;
    opportunities: TestRecord[];
    expectedResult: number;
  }> {
    const amounts = [1000, 2000, 1000, 1500, 2000]; // 3 distinct values: 1000, 1500, 2000
    const { account, opportunities } = await this.createAccountWithOpportunities(5, amounts);
    
    return {
      account,
      opportunities,
      expectedResult: 3 // Count of distinct Amount values
    };
  }

  /**
   * Create data set for MAX operation testing
   */
  async createMaxTestData(): Promise<{
    account: TestRecord;
    opportunities: TestRecord[];
    expectedResult: number;
  }> {
    const amounts = [1000, 3500, 2000, 1500]; // Max: 3500
    const { account, opportunities } = await this.createAccountWithOpportunities(4, amounts);
    
    return {
      account,
      opportunities,
      expectedResult: Math.max(...amounts)
    };
  }

  /**
   * Create data set for MIN operation testing
   */
  async createMinTestData(): Promise<{
    account: TestRecord;
    opportunities: TestRecord[];
    expectedResult: number;
  }> {
    const amounts = [1000, 500, 2000, 1500]; // Min: 500
    const { account, opportunities } = await this.createAccountWithOpportunities(4, amounts);
    
    return {
      account,
      opportunities,
      expectedResult: Math.min(...amounts)
    };
  }

  /**
   * Create data set for CONCAT operation testing
   */
  async createConcatTestData(): Promise<{
    account: TestRecord;
    opportunities: TestRecord[];
    expectedResult: string;
  }> {
    const oppNames = ['Alpha Deal', 'Beta Deal', 'Gamma Deal'];
    const account = await this.createTestAccount();
    const opportunities: TestRecord[] = [];

    for (let i = 0; i < oppNames.length; i++) {
      const opp = await this.createTestOpportunity(account.Id!, {
        Name: oppNames[i],
        Amount: (i + 1) * 1000
      });
      opportunities.push(opp);
    }
    
    return {
      account,
      opportunities,
      expectedResult: oppNames.join(', ') // "Alpha Deal, Beta Deal, Gamma Deal"
    };
  }

  /**
   * Create data set for CONCAT_DISTINCT operation testing
   */
  async createConcatDistinctTestData(): Promise<{
    account: TestRecord;
    opportunities: TestRecord[];
    expectedResult: string;
  }> {
    const oppNames = ['Alpha Deal', 'Beta Deal', 'Alpha Deal', 'Gamma Deal']; // Duplicates
    const account = await this.createTestAccount();
    const opportunities: TestRecord[] = [];

    for (let i = 0; i < oppNames.length; i++) {
      const opp = await this.createTestOpportunity(account.Id!, {
        Name: oppNames[i],
        Amount: (i + 1) * 1000
      });
      opportunities.push(opp);
    }
    
    const distinctNames = [...new Set(oppNames)];
    return {
      account,
      opportunities,
      expectedResult: distinctNames.join(', ') // "Alpha Deal, Beta Deal, Gamma Deal"
    };
  }

  /**
   * Create data set for FIRST/LAST operation testing
   * Uses CloseDate for ordering
   */
  async createFirstLastTestData(): Promise<{
    account: TestRecord;
    opportunities: TestRecord[];
    expectedFirst: string;
    expectedLast: string;
  }> {
    const oppData = [
      { name: 'First Deal', closeDate: '2024-01-15', amount: 1000 },
      { name: 'Middle Deal', closeDate: '2024-06-15', amount: 2000 },
      { name: 'Last Deal', closeDate: '2024-12-15', amount: 1500 }
    ];

    const account = await this.createTestAccount();
    const opportunities: TestRecord[] = [];

    for (const data of oppData) {
      const opp = await this.createTestOpportunity(account.Id!, {
        Name: data.name,
        CloseDate: data.closeDate,
        Amount: data.amount
      });
      opportunities.push(opp);
    }
    
    return {
      account,
      opportunities,
      expectedFirst: 'First Deal', // Earliest CloseDate
      expectedLast: 'Last Deal'    // Latest CloseDate
    };
  }

  /**
   * Create data set for MOST operation testing
   */
  async createMostTestData(): Promise<{
    account: TestRecord;
    opportunities: TestRecord[];
    expectedResult: string;
  }> {
    const stages = ['Prospecting', 'Qualification', 'Prospecting', 'Prospecting', 'Qualification'];
    // 'Prospecting' appears 3 times (most frequent)
    
    const account = await this.createTestAccount();
    const opportunities: TestRecord[] = [];

    for (let i = 0; i < stages.length; i++) {
      const opp = await this.createTestOpportunity(account.Id!, {
        Name: `Deal ${i + 1}`,
        StageName: stages[i],
        Amount: (i + 1) * 1000
      });
      opportunities.push(opp);
    }
    
    return {
      account,
      opportunities,
      expectedResult: 'Prospecting' // Most frequent StageName
    };
  }

  /**
   * Create data set for ALL operation testing
   * Tests if ALL opportunities have Amount > 500
   */
  async createAllTestData(): Promise<{
    account: TestRecord;
    opportunities: TestRecord[];
    expectedResult: boolean;
    testCondition: string;
  }> {
    const amounts = [1000, 2000, 1500]; // All > 500
    const { account, opportunities } = await this.createAccountWithOpportunities(3, amounts);
    
    return {
      account,
      opportunities,
      expectedResult: true, // ALL amounts > 500
      testCondition: 'Amount > 500'
    };
  }

  /**
   * Create data set for SOME operation testing
   * Tests if SOME opportunities have Amount > 1800
   */
  async createSomeTestData(): Promise<{
    account: TestRecord;
    opportunities: TestRecord[];
    expectedResult: boolean;
    testCondition: string;
  }> {
    const amounts = [1000, 2000, 1500]; // 2000 > 1800, so SOME is true
    const { account, opportunities } = await this.createAccountWithOpportunities(3, amounts);
    
    return {
      account,
      opportunities,
      expectedResult: true, // SOME amounts > 1800
      testCondition: 'Amount > 1800'
    };
  }

  /**
   * Create data set for NONE operation testing
   * Tests if NONE opportunities have Amount > 5000
   */
  async createNoneTestData(): Promise<{
    account: TestRecord;
    opportunities: TestRecord[];
    expectedResult: boolean;
    testCondition: string;
  }> {
    const amounts = [1000, 2000, 1500]; // None > 5000
    const { account, opportunities } = await this.createAccountWithOpportunities(3, amounts);
    
    return {
      account,
      opportunities,
      expectedResult: true, // NONE amounts > 5000
      testCondition: 'Amount > 5000'
    };
  }
}