import { Page, expect } from '@playwright/test';
import { SalesforceHelper } from './salesforce-helper';
import { TestRecord } from '../types/salesforce';

/**
 * Utility class for testing rollup operations through the UI
 * Handles form filling, execution, and result verification
 */
export class RollupOperationTester {
  private page: Page;
  private sfHelper: SalesforceHelper;

  constructor(page: Page, sfHelper: SalesforceHelper) {
    this.page = page;
    this.sfHelper = sfHelper;
  }

  /**
   * Configure and execute a rollup operation through the UI
   */
  async executeRollupOperation(config: RollupOperationConfig): Promise<void> {
    console.log(`🎯 Configuring ${config.operation} rollup operation...`);
    
    // Navigate to Rollup app and Recalculate tab
    await this.sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    const rollupComponent = this.page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await this.sfHelper.takeScreenshot(`${config.operation}-form-before-config`);
    
    // Fill out the form
    await this.fillRollupForm(config);
    
    await this.sfHelper.takeScreenshot(`${config.operation}-form-configured`);
    
    // Execute the rollup
    await this.executeRollup();
    
    await this.sfHelper.takeScreenshot(`${config.operation}-form-executed`);
    
    console.log(`✅ ${config.operation} rollup operation executed successfully`);
  }

  /**
   * Fill out the rollup configuration form
   */
  private async fillRollupForm(config: RollupOperationConfig): Promise<void> {
    console.log('📝 Filling rollup configuration form...');
    
    // Select Rollup Operation Name
    await this.selectRollupOperation(config.operation);
    
    // Fill Child Object SObject API Name
    await this.fillChildObject(config.childObject);
    
    // Fill Child Object Calc Field
    await this.fillChildField(config.childField);
    
    // Fill Parent Object SObject API Name (if different from child)
    if (config.parentObject && config.parentObject !== config.childObject) {
      await this.fillParentObject(config.parentObject);
    }
    
    // Fill Parent Object Field to Update
    await this.fillParentField(config.parentField);
    
    // Fill Lookup Field on Child Object
    await this.fillLookupField(config.lookupField);
    
    // Fill SOQL Where Clause if provided
    if (config.whereClause) {
      await this.fillWhereClause(config.whereClause);
    }
    
    console.log('✅ Form configuration completed');
  }

  /**
   * Select the rollup operation from the dropdown
   */
  private async selectRollupOperation(operation: string): Promise<void> {
    console.log(`🔽 Selecting rollup operation: ${operation}`);
    
    // Use the same approach as the working test - find the combobox with "Rollup Operation Name" label
    const operationCombobox = this.page.locator('lightning-combobox').first();
    
    if (await operationCombobox.isVisible()) {
      console.log('Found operation dropdown, clicking it...');
      await operationCombobox.click();
      await this.page.waitForTimeout(2000); // Wait for options to load
      
      // Look for the specific operation in the dropdown options
      const optionSelector = `[role="option"]:has-text("${operation}")`;
      const option = this.page.locator(optionSelector);
      
      if (await option.count() === 0) {
        await this.sfHelper.takeScreenshot(`operation-${operation}-not-found`);
        
        // Log all available options for debugging
        const allOptions = this.page.locator('[role="option"]');
        const optionCount = await allOptions.count();
        console.log(`Available options (${optionCount}):`);
        for (let i = 0; i < Math.min(optionCount, 15); i++) {
          const optionText = await allOptions.nth(i).textContent();
          console.log(`  Option ${i+1}: "${optionText}"`);
        }
        
        throw new Error(`Rollup operation "${operation}" not found in dropdown`);
      }
      
      await option.first().click();
      await this.page.waitForTimeout(500);
      
      console.log(`✅ Selected rollup operation: ${operation}`);
    } else {
      throw new Error('Could not find Rollup Operation Name combobox');
    }
  }

  /**
   * Fill the Child Object SObject API Name field
   */
  private async fillChildObject(childObject: string): Promise<void> {
    console.log(`📝 Filling Child Object: ${childObject}`);
    
    // Use the actual working selector from the successful test
    const childObjectInput = this.page.locator('input[name="CalcItem__c"]');
    
    if (await childObjectInput.isVisible()) {
      await childObjectInput.clear();
      await childObjectInput.fill(childObject);
      const filledValue = await childObjectInput.inputValue();
      console.log(`✅ Filled Child Object: ${filledValue}`);
    } else {
      console.log(`⚠️ Child Object input (CalcItem__c) not found`);
    }
  }

  /**
   * Fill the Child Object Calc Field
   */
  private async fillChildField(childField: string): Promise<void> {
    console.log(`📝 Filling Child Field: ${childField}`);
    
    // Use the actual working selector from the successful test
    const childFieldInput = this.page.locator('input[name="RollupFieldOnCalcItem__c"]');
    
    if (await childFieldInput.isVisible()) {
      await childFieldInput.clear();
      await childFieldInput.fill(childField);
      const filledValue = await childFieldInput.inputValue();
      console.log(`✅ Filled Child Field: ${filledValue}`);
    } else {
      console.log(`⚠️ Child Field input (RollupFieldOnCalcItem__c) not found`);
    }
  }

  /**
   * Fill the Parent Object SObject API Name field
   */
  private async fillParentObject(parentObject: string): Promise<void> {
    console.log(`📝 Filling Parent Object: ${parentObject}`);
    
    // Use the actual working selector from the successful test
    const parentObjectInput = this.page.locator('input[name="LookupObject__c"]');
    
    if (await parentObjectInput.isVisible()) {
      await parentObjectInput.clear();
      await parentObjectInput.fill(parentObject);
      const filledValue = await parentObjectInput.inputValue();
      console.log(`✅ Filled Parent Object: ${filledValue}`);
    } else {
      console.log(`⚠️ Parent Object input (LookupObject__c) not found`);
    }
  }

  /**
   * Fill the Parent Object Field to Update
   */
  private async fillParentField(parentField: string): Promise<void> {
    console.log(`📝 Filling Parent Field: ${parentField}`);
    
    // Use the actual working selector from the successful test
    const parentFieldInput = this.page.locator('input[name="RollupFieldOnLookupObject__c"]');
    
    if (await parentFieldInput.isVisible()) {
      await parentFieldInput.clear();
      await parentFieldInput.fill(parentField);
      const filledValue = await parentFieldInput.inputValue();
      console.log(`✅ Filled Parent Field: ${filledValue}`);
    } else {
      console.log(`⚠️ Parent Field input (RollupFieldOnLookupObject__c) not found`);
    }
  }

  /**
   * Fill the Lookup Field on Child Object
   */
  private async fillLookupField(lookupField: string): Promise<void> {
    console.log(`📝 Filling Lookup Field: ${lookupField}`);
    
    // Look for the specific "Child Object Lookup Field" input
    const lookupFieldSelectors = [
      'input[name="LookupFieldOnCalcItem__c"]',
      'lightning-input:has-text("Child Object Lookup Field") input',
      'input[aria-label*="Child Object Lookup Field"]'
    ];
    
    let filled = false;
    for (const selector of lookupFieldSelectors) {
      const input = this.page.locator(selector);
      if (await input.isVisible()) {
        await input.fill(lookupField);
        console.log(`✅ Filled Lookup Field: ${lookupField} using selector: ${selector}`);
        filled = true;
        break;
      }
    }
    
    if (!filled) {
      console.log(`⚠️ Lookup Field input not found, may be auto-populated`);
    }
  }

  /**
   * Fill the SOQL Where Clause field
   */
  private async fillWhereClause(whereClause: string): Promise<void> {
    console.log(`📝 Filling Where Clause: ${whereClause}`);
    
    // Use the actual working selector from the successful test
    const whereClauseInput = this.page.locator('textarea[name="CalcItemWhereClause__c"]');
    
    if (await whereClauseInput.isVisible()) {
      await whereClauseInput.clear();
      await whereClauseInput.fill(whereClause);
      const filledValue = await whereClauseInput.inputValue();
      console.log(`✅ Filled Where Clause: ${filledValue}`);
    } else {
      console.log(`⚠️ Where Clause input (CalcItemWhereClause__c) not found`);
    }
  }

  /**
   * Execute the rollup by clicking the "Start rollup!" button
   */
  private async executeRollup(): Promise<void> {
    console.log('🚀 Executing rollup operation...');
    
    // Look for the "Start rollup!" button - use first() to handle multiple matches
    const startButton = this.page.locator('button:has-text("Start rollup!")').first();
    
    if (await startButton.isVisible()) {
      await startButton.click();
      
      // Wait for execution to begin
      await this.page.waitForTimeout(2000);
      
      // Look for success indicators or progress
      const indicators = [
        '.slds-notification',
        '.slds-toast',
        '[role="status"]',
        '[role="alert"]',
        '.slds-spinner',
        'lightning-spinner'
      ];
      
      let foundIndicator = false;
      for (const indicator of indicators) {
        const element = this.page.locator(indicator);
        if (await element.isVisible()) {
          const text = await element.textContent();
          console.log(`📊 Execution indicator: ${text}`);
          foundIndicator = true;
        }
      }
      
      if (!foundIndicator) {
        console.log('ℹ️ No immediate execution indicators found - rollup may be running asynchronously');
      }
      
      console.log('✅ Rollup execution initiated');
    } else {
      throw new Error('Start rollup button not found');
    }
  }

  /**
   * Verify rollup results by querying the parent record
   */
  async verifyRollupResult(parentRecord: TestRecord, parentField: string, expectedValue: any, tolerance: number = 0): Promise<void> {
    console.log(`🔍 Verifying rollup result for ${parentRecord.Id}...`);
    
    // Wait a moment for async processing
    await this.page.waitForTimeout(5000);
    
    // Query the parent record to get the updated value
    const result = await this.sfHelper.queryRecord(parentRecord.sObjectType!, parentRecord.Id!, [parentField]);
    
    if (!result) {
      throw new Error(`Failed to query parent record ${parentRecord.Id}`);
    }
    
    const actualValue = result[parentField];
    console.log(`Expected: ${expectedValue}, Actual: ${actualValue}`);
    
    // Handle different data types
    if (typeof expectedValue === 'number' && typeof actualValue === 'number') {
      // Numeric comparison with tolerance
      const diff = Math.abs(actualValue - expectedValue);
      if (diff > tolerance) {
        throw new Error(`Rollup result mismatch. Expected: ${expectedValue}, Actual: ${actualValue}, Tolerance: ${tolerance}`);
      }
    } else if (typeof expectedValue === 'string' && typeof actualValue === 'string') {
      // String comparison
      if (actualValue.trim() !== expectedValue.trim()) {
        throw new Error(`Rollup result mismatch. Expected: "${expectedValue}", Actual: "${actualValue}"`);
      }
    } else if (typeof expectedValue === 'boolean') {
      // Boolean comparison (for ALL/SOME/NONE operations)
      const actualBoolean = actualValue === true || actualValue === 1 || actualValue === '1';
      if (actualBoolean !== expectedValue) {
        throw new Error(`Rollup result mismatch. Expected: ${expectedValue}, Actual: ${actualValue} (${actualBoolean})`);
      }
    } else {
      // Generic comparison
      if (actualValue !== expectedValue) {
        throw new Error(`Rollup result mismatch. Expected: ${expectedValue}, Actual: ${actualValue}`);
      }
    }
    
    console.log(`✅ Rollup result verified: ${parentField} = ${actualValue}`);
  }
}

/**
 * Configuration for a rollup operation test
 */
export interface RollupOperationConfig {
  operation: string;        // e.g., "SUM", "AVERAGE", "COUNT"
  childObject: string;      // e.g., "Opportunity"
  childField: string;       // e.g., "Amount"
  parentObject?: string;    // e.g., "Account" (defaults to same as lookup field object)
  parentField: string;      // e.g., "AnnualRevenue"
  lookupField: string;      // e.g., "AccountId"
  whereClause?: string;     // Optional SOQL where clause
}

/**
 * Pre-configured rollup operation configs for common scenarios
 */
export const ROLLUP_CONFIGS = {
  SUM_OPPORTUNITY_AMOUNT: {
    operation: 'SUM',
    childObject: 'Opportunity',
    childField: 'Amount',
    parentObject: 'Account',
    parentField: 'AnnualRevenue',
    lookupField: 'AccountId'
  } as RollupOperationConfig,
  
  COUNT_OPPORTUNITIES: {
    operation: 'COUNT',
    childObject: 'Opportunity',
    childField: 'Amount',
    parentObject: 'Account',
    parentField: 'NumberOfEmployees', // Using as a number field for count
    lookupField: 'AccountId'
  } as RollupOperationConfig,
  
  AVERAGE_OPPORTUNITY_AMOUNT: {
    operation: 'AVERAGE',
    childObject: 'Opportunity',
    childField: 'Amount',
    parentObject: 'Account',
    parentField: 'AnnualRevenue',
    lookupField: 'AccountId'
  } as RollupOperationConfig,
  
  CONCAT_OPPORTUNITY_NAMES: {
    operation: 'CONCAT',
    childObject: 'Opportunity',
    childField: 'Name',
    parentObject: 'Account',
    parentField: 'Description',
    lookupField: 'AccountId'
  } as RollupOperationConfig,
  
  MAX_OPPORTUNITY_AMOUNT: {
    operation: 'MAX',
    childObject: 'Opportunity',
    childField: 'Amount',
    parentObject: 'Account',
    parentField: 'AnnualRevenue',
    lookupField: 'AccountId'
  } as RollupOperationConfig,
  
  MIN_OPPORTUNITY_AMOUNT: {
    operation: 'MIN',
    childObject: 'Opportunity',
    childField: 'Amount',
    parentObject: 'Account',
    parentField: 'AnnualRevenue',
    lookupField: 'AccountId'
  } as RollupOperationConfig
} as const;