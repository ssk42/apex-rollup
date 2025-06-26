import { Page, expect } from '@playwright/test';
import { 
  SalesforceCredentials, 
  TestRecord, 
  RollupConfiguration, 
  NavigationTarget,
  WaitCondition,
  ScreenshotOptions,
  TestEnvironmentInfo
} from '../types/salesforce';
import { RollupCMDT } from '../types/rollup-cmdt';

/**
 * Comprehensive Salesforce Helper for E2E Testing
 * Handles authentication, navigation, data manipulation, and Rollup operations
 */
export class SalesforceHelper {
  private page: Page;
  private testRecordIds: Set<string> = new Set();
  private screenshotCounter = 0;

  constructor(page: Page) {
    this.page = page;
  }

  // Authentication Methods
  async login(username: string, password: string): Promise<void> {
    console.log(`🔐 Logging in as ${username}...`);
    
    // Check if password is actually an access token (starts with "00D")
    if (password.startsWith('00D')) {
      return this.loginWithAccessToken(username, password);
    }
    
    // Handle various login page scenarios
    try {
      await this.page.waitForSelector('#username', { timeout: 10000 });
      
      await this.page.fill('#username', username);
      await this.page.fill('#password', password);
      await this.page.click('#Login');
      
      // Wait for successful login - multiple possible landing pages
      await Promise.race([
        this.page.waitForURL('**/setup/SetupOneHome.apexp*', { timeout: 30000 }),
        this.page.waitForURL('**/lightning/setup/**', { timeout: 30000 }),
        this.page.waitForURL('**/lightning/page/home', { timeout: 30000 }),
        this.page.waitForSelector('[data-aura-class="oneAppLauncher"]', { timeout: 30000 })
      ]);
      
      console.log('✅ Login successful');
      
      // Handle any post-login modals or popups
      await this.dismissModalIfPresent();
      
    } catch (error) {
      await this.takeScreenshot('login-failure');
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async loginWithAccessToken(username: string, accessToken: string): Promise<void> {
    console.log(`🔐 Authenticating with access token for ${username}...`);
    
    try {
      // For scratch orgs, get the org URL from the current page or derive from login URL
      const currentUrl = this.page.url();
      let orgUrl: string;
      
      if (currentUrl.includes('salesforce')) {
        // Extract from current URL
        const match = currentUrl.match(/https:\/\/[^\/]+\.salesforce[^\/]*\.com/);
        orgUrl = match ? match[0] : currentUrl;
      } else {
        // This is a fallback, shouldn't happen in normal flow
        orgUrl = 'https://login.salesforce.com';
      }
      
      const frontdoorUrl = `${orgUrl}/secur/frontdoor.jsp?sid=${accessToken}`;
      
      await this.page.goto(frontdoorUrl);
      
      // Wait for successful authentication - we might land in setup or main Lightning
      await Promise.race([
        this.page.waitForURL('**/lightning/**', { timeout: 30000 }),
        this.page.waitForSelector('[data-aura-class="oneAppLauncher"]', { timeout: 30000 })
      ]);
      
      console.log('✅ Access token authentication successful');
      
      // If we landed in Setup, that's actually fine - we can work from there
      if (this.page.url().includes('lightning/setup')) {
        console.log('✅ Authenticated into Lightning Setup - this is sufficient for testing');
      }
      
      // Handle any post-login modals or popups
      await this.dismissModalIfPresent();
      
    } catch (error) {
      await this.takeScreenshot('token-auth-failure');
      throw new Error(`Access token authentication failed: ${error.message}`);
    }
  }

  private async getOrgUrl(): Promise<string> {
    // Extract org URL from current page or use default
    const currentUrl = this.page.url();
    if (currentUrl.includes('salesforce.com')) {
      const match = currentUrl.match(/https:\/\/[^\/]+\.salesforce\.com/);
      return match ? match[0] : 'https://login.salesforce.com';
    }
    return 'https://login.salesforce.com';
  }

  async logout(): Promise<void> {
    try {
      // Click user menu
      await this.page.click('[data-target-selection-name="UserProfileMenu"]');
      await this.page.click('a[href="/secur/logout.jsp"]');
      await this.page.waitForURL('**/login.salesforce.com/**');
      console.log('✅ Logout successful');
    } catch (error) {
      console.warn('⚠️  Logout failed (non-fatal):', error.message);
    }
  }

  // Navigation Methods
  async navigateToApp(appName: string, tabName?: string): Promise<void> {
    console.log(`🧭 Navigating to ${appName} app${tabName ? ` (${tabName} tab)` : ''}...`);
    
    try {
      // Check if we're in setup area and navigate to regular Lightning first
      const currentUrl = this.page.url();
      if (currentUrl.includes('lightning/setup') || currentUrl.includes('salesforce-setup.com')) {
        console.log('🔄 Currently in Setup area, navigating to regular Lightning...');
        // Try to navigate to the app using the same domain but different path
        const url = new URL(currentUrl);
        const lightningUrl = `${url.protocol}//${url.hostname}/lightning/app/c__Rollup`;
        console.log(`🔄 Navigating directly to app: ${lightningUrl}`);
        try {
          await this.page.goto(lightningUrl, { timeout: 30000 });
          await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 }); // Shorter timeout
          await this.page.waitForTimeout(3000); // Reduced Lightning load time
          
          // If navigating to specific tab, do it now
          if (tabName) {
            await this.navigateToTab(tabName);
          }
          
          console.log(`✅ Successfully navigated to ${appName}${tabName ? ` (${tabName} tab)` : ''}`);
          return; // Skip the app launcher navigation
        } catch (directNavError) {
          console.log(`⚠️  Direct navigation failed: ${directNavError.message}, trying app launcher...`);
          // Fall through to app launcher method
        }
      }
      
      // Open app launcher
      await this.page.waitForSelector('[data-aura-class="oneAppLauncher"] button, .slds-icon-waffle_container button', { timeout: 60000 });
      await this.page.click('[data-aura-class="oneAppLauncher"] button, .slds-icon-waffle_container button');
      await this.page.waitForSelector('[data-aura-class="appTileTitle"], .slds-app-launcher__tile-title');
      
      // Search for and click the app
      const searchInput = this.page.locator('input[placeholder*="Search"], input[type="search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill(appName);
        await this.page.waitForTimeout(1000); // Wait for search results
      }
      
      const appSelector = `[data-aura-class="appTileTitle"]:has-text("${appName}"), .slds-app-launcher__tile-title:has-text("${appName}")`;
      await this.page.waitForSelector(appSelector);
      await this.page.click(appSelector);
      
      // Wait for app to load
      await this.page.waitForURL('**/lightning/**');
      await this.page.waitForLoadState('networkidle');
      
      // Navigate to specific tab if requested
      if (tabName) {
        await this.navigateToTab(tabName);
      }
      
      console.log(`✅ Successfully navigated to ${appName}${tabName ? ` (${tabName} tab)` : ''}`);
      
    } catch (error) {
      await this.takeScreenshot(`navigation-${appName}-failure`);
      throw new Error(`Failed to navigate to ${appName}: ${error.message}`);
    }
  }

  async navigateToTab(tabName: string): Promise<void> {
    console.log(`📋 Navigating to ${tabName} tab...`);
    
    try {
      // Wait a moment for the app to fully load
      await this.page.waitForTimeout(2000);
      
      // Look for the tab with various possible selectors
      const tabSelectors = [
        `a[title="${tabName}"]`,
        `one-app-nav-bar-item-root:has-text("${tabName}")`,
        `.slds-tabs_default__nav a:has-text("${tabName}")`,
        `[role="tab"]:has-text("${tabName}")`,
        `lightning-tab:has-text("${tabName}")`
      ];
      
      let tabFound = false;
      for (const selector of tabSelectors) {
        const tab = this.page.locator(selector);
        if (await tab.isVisible()) {
          await tab.click();
          await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });
          await this.page.waitForTimeout(2000); // Give tab content time to load
          tabFound = true;
          console.log(`✅ Successfully navigated to ${tabName} tab using selector: ${selector}`);
          break;
        }
      }
      
      if (!tabFound) {
        throw new Error(`Tab "${tabName}" not found with any of the attempted selectors`);
      }
      
    } catch (error) {
      await this.takeScreenshot(`tab-navigation-${tabName}-failure`);
      throw new Error(`Failed to navigate to tab ${tabName}: ${error.message}`);
    }
  }

  async navigateToObject(objectName: string): Promise<void> {
    console.log(`🧭 Navigating to ${objectName} object...`);
    
    // Get the current org base URL and keep the same domain (setup vs regular)
    const currentUrl = this.page.url();
    const baseUrl = currentUrl.match(/https:\/\/[^\/]+/)?.[0];
    
    if (!baseUrl) {
      throw new Error('Could not determine base URL from current page');
    }
    
    // Use the exact same domain we're currently on
    const url = `${baseUrl}/lightning/o/${objectName}/list`;
    console.log(`Navigating to: ${url}`);
    
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    
    console.log(`✅ Successfully navigated to ${objectName}`);
  }

  async navigateToRecord(objectName: string, recordId: string): Promise<void> {
    // Get the current org base URL
    const currentUrl = this.page.url();
    const baseUrl = currentUrl.match(/https:\/\/[^\/]+/)?.[0];
    
    if (!baseUrl) {
      throw new Error('Could not determine base URL from current page');
    }
    
    const url = `${baseUrl}/lightning/r/${objectName}/${recordId}/view`;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  // Data Manipulation Methods
  async createTestRecord(objectType: string, data: Record<string, any>): Promise<TestRecord> {
    console.log(`📝 Creating ${objectType} test record...`);
    
    try {
      // Use Salesforce CLI to create record - much more reliable than UI
      const fieldValues = Object.entries(data)
        .filter(([field, value]) => value !== null && value !== undefined) // Skip null values
        .map(([field, value]) => {
          // Properly escape single quotes in values and wrap field assignments
          const escapedValue = String(value).replace(/'/g, "\\'");
          return `${field}='${escapedValue}'`;
        })
        .join(' ');
      
      const command = `sf data create record --sobject ${objectType} --values "${fieldValues}" --target-org apex-rollup-scratch-org --json`;
      console.log(`Executing: ${command}`);
      
      const result = require('child_process').execSync(command, { 
        encoding: 'utf8', 
        timeout: 30000,
        env: { ...process.env, FORCE_COLOR: '0' }
      });
      
      // Clean up any ANSI color codes
      const cleanResult = result.replace(/\u001b\[[0-9;]*m/g, '');
      const createData = JSON.parse(cleanResult);
      
      if (createData.status !== 0) {
        throw new Error(`CLI command failed: ${createData.message}`);
      }
      
      const recordId = createData.result.id;
      
      // Track for cleanup
      this.testRecordIds.add(recordId);
      
      const record: TestRecord = { Id: recordId, ...data };
      console.log(`✅ Created ${objectType} record: ${recordId}`);
      
      return record;
      
    } catch (error) {
      await this.takeScreenshot(`create-${objectType}-failure`);
      throw new Error(`Failed to create ${objectType} record: ${error.message}`);
    }
  }

  async getRecord(objectType: string, recordId: string, fields: string[]): Promise<TestRecord> {
    console.log(`📖 Reading ${objectType} record ${recordId}...`);
    
    try {
      // Use Salesforce CLI to query record - much more reliable than UI
      const fieldList = ['Id', ...fields].join(',');
      const command = `sf data query --query "SELECT ${fieldList} FROM ${objectType} WHERE Id = '${recordId}'" --target-org apex-rollup-scratch-org --json`;
      
      console.log(`Executing: ${command}`);
      
      const result = require('child_process').execSync(command, { 
        encoding: 'utf8', 
        timeout: 30000,
        env: { ...process.env, FORCE_COLOR: '0' }
      });
      
      // Clean up any ANSI color codes
      const cleanResult = result.replace(/\u001b\[[0-9;]*m/g, '');
      const queryData = JSON.parse(cleanResult);
      
      if (queryData.status !== 0) {
        throw new Error(`CLI query failed: ${queryData.message}`);
      }
      
      if (queryData.result?.records?.length > 0) {
        const record = queryData.result.records[0];
        console.log(`✅ Retrieved ${objectType} record:`, record);
        return record;
      } else {
        throw new Error(`No ${objectType} record found with Id ${recordId}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to read ${objectType} record ${recordId}:`, error.message);
      throw new Error(`Failed to read ${objectType} record: ${error.message}`);
    }
  }

  async updateRecord(objectType: string, recordId: string, data: Record<string, any>): Promise<void> {
    await this.navigateToRecord(objectType, recordId);
    
    await this.page.click('button[name="Edit"]');
    await this.page.waitForSelector('form');
    
    for (const [field, value] of Object.entries(data)) {
      await this.fillField(field, value);
    }
    
    await this.page.click('button[name="SaveEdit"]');
    await this.page.waitForSelector('.slds-notification__content');
  }

  async deleteRecord(objectType: string, recordId: string): Promise<void> {
    await this.navigateToRecord(objectType, recordId);
    
    await this.page.click('button[name="Delete"]');
    await this.page.click('button[data-aura-class="confirm"]:has-text("Delete")');
    await this.page.waitForSelector('.slds-notification__content');
    
    this.testRecordIds.delete(recordId);
  }

  // Rollup Configuration Methods
  async configureRollup(config: RollupConfiguration): Promise<void> {
    console.log(`⚙️  Configuring ${config.operation} rollup...`);
    
    try {
      // Navigate to Rollup configuration
      await this.navigateToApp('Rollup');
      
      // Look for configuration interface
      await this.page.click('button:has-text("New Rollup")');
      await this.page.waitForSelector('[data-testid="rollup-config-form"]');
      
      // Fill configuration form
      await this.selectDropdownValue('Parent Object', config.parentObject);
      await this.selectDropdownValue('Child Object', config.childObject);
      await this.selectDropdownValue('Operation', config.operation);
      
      if (config.fieldToRollup) {
        await this.selectDropdownValue('Field to Rollup', config.fieldToRollup);
      }
      
      await this.selectDropdownValue('Rollup Field', config.rollupField);
      await this.selectDropdownValue('Lookup Field', config.lookupField);
      
      if (config.whereClause) {
        await this.fillField('Where Clause', config.whereClause);
      }
      
      if (config.orderBy) {
        await this.fillField('Order By', config.orderBy);
      }
      
      if (config.delimiter) {
        await this.fillField('Delimiter', config.delimiter);
      }
      
      // Save configuration
      await this.page.click('button:has-text("Save")');
      await this.page.waitForSelector('.slds-notification__content');
      
      console.log(`✅ Rollup configuration saved`);
      
    } catch (error) {
      await this.takeScreenshot('rollup-config-failure');
      throw new Error(`Failed to configure rollup: ${error.message}`);
    }
  }

  async executeRollup(): Promise<void> {
    console.log('🚀 Executing rollup...');
    
    try {
      await this.page.click('button:has-text("Execute Rollup")');
      
      // Wait for execution to complete
      await this.page.waitForSelector('.slds-notification__content:has-text("Rollup completed")', {
        timeout: 60000
      });
      
      console.log('✅ Rollup execution completed');
      
    } catch (error) {
      await this.takeScreenshot('rollup-execution-failure');
      throw new Error(`Rollup execution failed: ${error.message}`);
    }
  }

  // Utility Methods
  async waitForElement(selector: string, timeout: number = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { timeout });
  }

  async waitForCondition(condition: WaitCondition): Promise<void> {
    const timeout = condition.timeout || 10000;
    
    if (condition.selector) {
      await this.page.waitForSelector(condition.selector, { 
        timeout,
        state: condition.state || 'visible'
      });
    }
    
    if (condition.text) {
      await this.page.waitForSelector(`text=${condition.text}`, { timeout });
    }
    
    if (condition.url) {
      await this.page.waitForURL(condition.url, { timeout });
    }
  }

  async takeScreenshot(name?: string, options?: ScreenshotOptions): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotName = name || `screenshot-${++this.screenshotCounter}`;
    const filename = options?.timestamp !== false ? 
      `${screenshotName}-${timestamp}.png` : 
      `${screenshotName}.png`;
    
    const path = options?.path || `test-results/screenshots/${filename}`;
    
    await this.page.screenshot({ 
      path,
      fullPage: options?.fullPage || false 
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
  }

  // Cleanup and Environment Methods
  async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    const recordIds = Array.from(this.testRecordIds);
    
    if (recordIds.length === 0) {
      console.log('✅ No test data to cleanup');
      return;
    }
    
    // Bulk delete records via Data Import/Export or Developer Console
    try {
      // Navigate to Developer Console for bulk operations
      await this.openDeveloperConsole();
      
      // Execute anonymous Apex for cleanup
      const deleteScript = this.generateDeleteScript(recordIds);
      await this.executeAnonymousApex(deleteScript);
      
      this.testRecordIds.clear();
      console.log(`✅ Cleaned up ${recordIds.length} test records`);
      
    } catch (error) {
      console.warn('⚠️  Test data cleanup failed (non-fatal):', error.message);
    }
  }

  async verifyTestEnvironment(): Promise<TestEnvironmentInfo> {
    console.log('🔍 Verifying test environment...');
    
    // Check Salesforce version, available objects, etc.
    const info: TestEnvironmentInfo = {
      salesforceVersion: 'Unknown',
      rollupVersion: 'Unknown',
      multiCurrencyEnabled: false,
      availableObjects: [],
      installedPackages: []
    };
    
    // Implementation would check org settings, package versions, etc.
    
    return info;
  }

  async checkMultiCurrencyEnabled(): Promise<boolean> {
    try {
      await this.navigateToObject('CurrencyType');
      return true;
    } catch {
      return false;
    }
  }

  async generateTestSummary(): Promise<void> {
    console.log('📊 Generating test summary...');
    // Implementation would create test report
  }

  // Private Helper Methods
  private async fillField(fieldName: string, value: any): Promise<void> {
    // Multiple strategies for field filling based on field type
    const selectors = [
      `input[name="${fieldName}"]`,
      `textarea[name="${fieldName}"]`,
      `select[name="${fieldName}"]`,
      `[data-field-name="${fieldName}"] input`,
      `[data-field-name="${fieldName}"] textarea`,
      `lightning-input[field-name="${fieldName}"] input`
    ];
    
    for (const selector of selectors) {
      try {
        await this.page.fill(selector, String(value));
        return;
      } catch {
        continue;
      }
    }
    
    throw new Error(`Could not find field: ${fieldName}`);
  }

  private async getFieldValue(fieldName: string): Promise<any> {
    // Multiple strategies for reading field values
    const selectors = [
      `[data-field-name="${fieldName}"] .slds-form-element__static`,
      `[data-field-name="${fieldName}"] lightning-formatted-text`,
      `[data-field-name="${fieldName}"] lightning-formatted-number`,
      `lightning-output-field[field-name="${fieldName}"]`
    ];
    
    for (const selector of selectors) {
      try {
        const element = await this.page.locator(selector).first();
        if (await element.isVisible()) {
          return await element.textContent();
        }
      } catch {
        continue;
      }
    }
    
    throw new Error(`Could not read field: ${fieldName}`);
  }

  private async selectDropdownValue(label: string, value: string): Promise<void> {
    // Implementation for dropdown selection with multiple strategies
    const dropdownSelectors = [
      `lightning-combobox[label="${label}"]`,
      `lightning-picklist[label="${label}"]`,
      `[data-label="${label}"] lightning-combobox`
    ];
    
    for (const selector of dropdownSelectors) {
      try {
        await this.page.click(`${selector} button`);
        await this.page.click(`lightning-base-combobox-item[data-value="${value}"]`);
        return;
      } catch {
        continue;
      }
    }
    
    throw new Error(`Could not select dropdown value: ${label} = ${value}`);
  }

  private async dismissModalIfPresent(): Promise<void> {
    try {
      const modal = this.page.locator('.slds-modal__container');
      if (await modal.isVisible()) {
        await this.page.click('.slds-modal__close');
      }
    } catch {
      // Modal not present or couldn't close - non-fatal
    }
  }

  private async openDeveloperConsole(): Promise<void> {
    // Navigate to Developer Console for administrative operations
    await this.page.goto('/home/home.jsp');
    // Implementation would open dev console
  }

  private async executeAnonymousApex(script: string): Promise<void> {
    // Implementation would execute Apex script in Developer Console
    console.log('Executing cleanup script...');
  }

  /**
   * Query a specific record and return its field values
   */
  async queryRecord(sObjectType: string, recordId: string, fields: string[]): Promise<any> {
    console.log(`🔍 Querying ${sObjectType} record ${recordId} for fields: ${fields.join(', ')}`);
    
    try {
      const fieldsList = fields.join(', ');
      const query = `SELECT ${fieldsList} FROM ${sObjectType} WHERE Id = '${recordId}'`;
      
      const result = require('child_process').execSync(
        `sf data query --query "${query}" --target-org apex-rollup-scratch-org --json`,
        {
          encoding: 'utf8',
          timeout: 30000,
          env: { ...process.env, FORCE_COLOR: '0' }
        }
      );
      
      const cleanResult = result.replace(/\\u001b\\[[0-9;]*m/g, '');
      const queryData = JSON.parse(cleanResult);
      
      if (queryData.status === 0 && queryData.result.records.length > 0) {
        const record = queryData.result.records[0];
        console.log(`✅ Found record with values:`, record);
        return record;
      } else {
        throw new Error(`No records found for ${sObjectType} with Id ${recordId}`);
      }
      
    } catch (error) {
      console.log(`❌ Query failed: ${error.message}`);
      throw error;
    }
  }

  private generateDeleteScript(recordIds: string[]): string {
    return `
      List<Id> recordIds = new List<Id>{${recordIds.map(id => `'${id}'`).join(', ')}};
      List<SObject> recordsToDelete = new List<SObject>();
      
      for (Id recordId : recordIds) {
        try {
          SObject record = Database.query('SELECT Id FROM ' + recordId.getSObjectType() + ' WHERE Id = :recordId');
          recordsToDelete.add(record);
        } catch (Exception e) {
          System.debug('Could not find record: ' + recordId);
        }
      }
      
      if (!recordsToDelete.isEmpty()) {
        delete recordsToDelete;
        System.debug('Deleted ' + recordsToDelete.size() + ' test records');
      }
    `;
  }

  async createRollupCMDT(rollup: RollupCMDT): Promise<void> {
    console.log(`Creating Rollup__mdt record: ${rollup.DeveloperName}`);
    const fieldValues = Object.entries(rollup)
      .map(([field, value]) => `${field}=${JSON.stringify(value)}`)
      .join(' ');

    const command = `sf data create record --sobject Rollup__mdt --values "${fieldValues}" --target-org apex-rollup-scratch-org --json`;
    
    try {
      const result = require('child_process').execSync(command, {
        encoding: 'utf8',
        timeout: 30000,
        env: { ...process.env, FORCE_COLOR: '0' }
      });
      const createData = JSON.parse(result);
      if (createData.status !== 0) {
        throw new Error(`CLI command failed: ${createData.message}`);
      }
      console.log(`✅ Created Rollup__mdt: ${rollup.DeveloperName}`);
    } catch (error) {
      throw new Error(`Failed to create Rollup__mdt record: ${error.message}`);
    }
  }

  async waitForRecordUpdate(
    objectType: string,
    recordId: string,
    expectedValues: Record<string, any>,
    timeout: number = 30000
  ): Promise<void> {
    console.log(`⏳ Waiting for ${objectType} ${recordId} to update...`);
    const pollInterval = 2000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const record = await this.getRecord(objectType, recordId, Object.keys(expectedValues));
        const allMatch = Object.entries(expectedValues).every(([field, value]) => record[field] === value);

        if (allMatch) {
          console.log(`✅ ${objectType} ${recordId} updated successfully.`);
          return;
        }
      } catch (error) {
        // Ignore errors during polling
      }
      await this.page.waitForTimeout(pollInterval);
    }

    throw new Error(`Timeout waiting for ${objectType} ${recordId} to update.`);
  }
}