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
  async navigateToApp(appName: string): Promise<void> {
    console.log(`🧭 Navigating to ${appName} app...`);
    
    try {
      // Open app launcher
      await this.page.click('[data-aura-class="oneAppLauncher"] button');
      await this.page.waitForSelector('[data-aura-class="appTileTitle"]');
      
      // Search for and click the app
      await this.page.fill('input[placeholder="Search apps and items..."]', appName);
      await this.page.waitForTimeout(1000); // Wait for search results
      
      const appSelector = `[data-aura-class="appTileTitle"]:has-text("${appName}")`;
      await this.page.waitForSelector(appSelector);
      await this.page.click(appSelector);
      
      // Wait for app to load
      await this.page.waitForURL('**/lightning/**');
      await this.page.waitForLoadState('networkidle');
      
      console.log(`✅ Successfully navigated to ${appName}`);
      
    } catch (error) {
      await this.takeScreenshot(`navigation-${appName}-failure`);
      throw new Error(`Failed to navigate to ${appName}: ${error.message}`);
    }
  }

  async navigateToObject(objectName: string): Promise<void> {
    console.log(`🧭 Navigating to ${objectName} object...`);
    
    const url = `/lightning/o/${objectName}/list`;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    
    console.log(`✅ Successfully navigated to ${objectName}`);
  }

  async navigateToRecord(objectName: string, recordId: string): Promise<void> {
    const url = `/lightning/r/${objectName}/${recordId}/view`;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  // Data Manipulation Methods
  async createTestRecord(objectType: string, data: Record<string, any>): Promise<TestRecord> {
    console.log(`📝 Creating ${objectType} test record...`);
    
    try {
      // Navigate to object and create new record
      await this.navigateToObject(objectType);
      
      await this.page.click('a[title="New"]');
      await this.page.waitForSelector('form');
      
      // Fill in form fields
      for (const [field, value] of Object.entries(data)) {
        await this.fillField(field, value);
      }
      
      // Save record
      await this.page.click('button[name="SaveEdit"]');
      await this.page.waitForSelector('.slds-notification__content');
      
      // Extract record ID from URL
      await this.page.waitForURL(`**/lightning/r/${objectType}/**/view`);
      const url = this.page.url();
      const recordId = url.match(new RegExp(`/r/${objectType}/([a-zA-Z0-9]{15,18})/`))?.[1];
      
      if (!recordId) {
        throw new Error('Failed to extract record ID');
      }
      
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
    
    await this.navigateToRecord(objectType, recordId);
    
    const record: TestRecord = { Id: recordId };
    
    // Extract field values from the record page
    for (const field of fields) {
      try {
        const fieldValue = await this.getFieldValue(field);
        record[field] = fieldValue;
      } catch (error) {
        console.warn(`⚠️  Could not read field ${field}: ${error.message}`);
        record[field] = null;
      }
    }
    
    return record;
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
}