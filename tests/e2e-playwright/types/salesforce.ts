/**
 * TypeScript type definitions for Salesforce E2E testing
 */

export interface SalesforceCredentials {
  username: string;
  password: string;
  loginUrl: string;
  orgId?: string;
}

export interface TestRecord {
  Id?: string;
  [field: string]: any;
}

export interface RollupConfiguration {
  parentObject: string;
  childObject: string;
  operation: RollupOperation;
  fieldToRollup?: string;
  rollupField: string;
  lookupField: string;
  whereClause?: string;
  orderBy?: string;
  delimiter?: string;
  limitAmount?: number;
  sharingMode?: 'System' | 'User';
}

export type RollupOperation = 
  | 'SUM' 
  | 'COUNT' 
  | 'AVERAGE' 
  | 'MIN' 
  | 'MAX' 
  | 'CONCAT' 
  | 'CONCAT_DISTINCT'
  | 'FIRST'
  | 'LAST'
  | 'ALL'
  | 'NONE'
  | 'SOME'
  | 'COUNT_DISTINCT';

export interface TestDataFactory {
  createAccount(data?: Partial<TestRecord>): Promise<TestRecord>;
  createOpportunity(data?: Partial<TestRecord>): Promise<TestRecord>;
  createContact(data?: Partial<TestRecord>): Promise<TestRecord>;
  createCase(data?: Partial<TestRecord>): Promise<TestRecord>;
  createCustomObject(objectType: string, data?: Partial<TestRecord>): Promise<TestRecord>;
}

export interface TestSuite {
  name: string;
  description: string;
  category: TestCategory;
  tests: TestCase[];
}

export interface TestCase {
  name: string;
  description: string;
  steps: TestStep[];
  expectedResult: string;
  timeout?: number;
}

export interface TestStep {
  action: string;
  selector?: string;
  value?: string;
  waitFor?: string;
  screenshot?: boolean;
}

export type TestCategory = 
  | 'core-operations'
  | 'cmdt-integration' 
  | 'advanced-features'
  | 'multi-object'
  | 'integration-workflows'
  | 'ui-ux'
  | 'error-handling'
  | 'plugin-architecture'
  | 'performance';

export interface NavigationTarget {
  app?: string;
  object?: string;
  recordId?: string;
  tab?: string;
  subtab?: string;
}

export interface WaitCondition {
  selector?: string;
  text?: string;
  url?: string;
  timeout?: number;
  state?: 'visible' | 'hidden' | 'attached' | 'detached';
}

export interface ScreenshotOptions {
  name: string;
  fullPage?: boolean;
  timestamp?: boolean;
  path?: string;
}

export interface TestEnvironmentInfo {
  salesforceVersion: string;
  rollupVersion: string;
  multiCurrencyEnabled: boolean;
  availableObjects: string[];
  installedPackages: string[];
}