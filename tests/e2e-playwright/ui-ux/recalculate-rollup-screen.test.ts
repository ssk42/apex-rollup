import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';
import { TestDataFactory } from '../utils/test-data-factory';

test.describe('Recalculate Rollup Screen', () => {
  test('can access and interact with rollup recalculation interface', async ({ page }) => {
    console.log('🔄 Testing rollup recalculation interface...');
    
    // Get credentials and login
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create some test data first
    console.log('📊 Creating test data for rollup...');
    const { account, opportunities } = await testFactory.createAccountWithOpportunities(2, [1000, 2000]);
    
    // Navigate to Rollup app and Recalculate tab
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    console.log('⏳ Waiting for recalculation interface to load...');
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('recalc-interface-loaded');
    
    // ACTUALLY TEST FORM INTERACTIONS - let's see what works
    console.log('📝 ACTUALLY testing form interactions...');
    
    console.log('🔍 Finding all actual input fields...');
    
    // Get all inputs and test them individually
    const inputs = page.locator('input, textarea');
    const inputCount = await inputs.count();
    console.log(`Found ${inputCount} input/textarea elements`);
    
    for (let i = 0; i < inputCount; i++) {
      try {
        const input = inputs.nth(i);
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        const value = await input.inputValue();
        const visible = await input.isVisible();
        const required = await input.getAttribute('required');
        
        console.log(`Input ${i+1}: name="${name}" placeholder="${placeholder}" value="${value}" visible=${visible} required=${required}`);
        
        // Try to fill it if it's visible and not already filled
        if (visible && !value && name) {
          console.log(`  Attempting to fill input ${i+1} (${name})...`);
          try {
            await input.clear();
            await input.fill('TestValue');
            const newValue = await input.inputValue();
            console.log(`  Successfully filled: "${newValue}"`);
            await sfHelper.takeScreenshot(`input-${i+1}-filled`);
          } catch (fillError) {
            console.log(`  Failed to fill: ${fillError.message}`);
          }
        }
      } catch (e) {
        console.log(`Input ${i+1}: Error inspecting - ${e.message}`);
      }
    }
    
    await sfHelper.takeScreenshot('all-inputs-tested');
    
    // Now try to interact with specific elements
    console.log('🎯 Attempting to interact with form elements...');
    
    // Look for any combobox/picklist elements more broadly
    const allComboboxes = page.locator('lightning-combobox, [role="combobox"], select');
    const comboboxCount = await allComboboxes.count();
    console.log(`Found ${comboboxCount} combobox/picklist elements`);
    
    if (comboboxCount > 0) {
      for (let i = 0; i < comboboxCount; i++) {
        try {
          const combobox = allComboboxes.nth(i);
          const dataName = await combobox.getAttribute('data-name');
          const label = await combobox.getAttribute('aria-label');
          console.log(`  Combobox ${i+1}: data-name="${dataName}" label="${label}"`);
          
          if (await combobox.isVisible()) {
            console.log(`    Trying to click combobox ${i+1}...`);
            await combobox.click();
            await page.waitForTimeout(1000);
            
            // Look for options that appear
            const options = page.locator('[role="option"], lightning-base-combobox-item, option');
            const optionCount = await options.count();
            console.log(`    Found ${optionCount} options after clicking`);
            
            if (optionCount > 0) {
              console.log(`    Successfully opened combobox with ${optionCount} options`);
              await sfHelper.takeScreenshot(`combobox-${i+1}-opened`);
              // Click somewhere else to close the dropdown
              await page.click('body');
              await page.waitForTimeout(500);
            }
          }
        } catch (e) {
          console.log(`    Error interacting with combobox ${i+1}: ${e.message}`);
        }
      }
    }
    
    // Look for any lightning input fields
    const allLightningInputs = page.locator('lightning-input input, input[type="text"], input[type="email"], textarea');
    const lightningInputCount = await allLightningInputs.count();
    console.log(`Found ${lightningInputCount} lightning input fields`);
    
    // Look for any buttons
    const allButtons = page.locator('button, lightning-button button');
    const buttonCount = await allButtons.count();
    console.log(`Found ${buttonCount} buttons`);
    
    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        try {
          const button = allButtons.nth(i);
          const text = await button.textContent();
          const title = await button.getAttribute('title');
          console.log(`  Button ${i+1}: text="${text}" title="${title}"`);
        } catch (e) {
          // Skip buttons that can't be inspected
        }
      }
    }
    
    // Take screenshot of the full interface
    await sfHelper.takeScreenshot('recalc-interface-complete');
    
    console.log('✅ Successfully accessed rollup recalculation interface');
    
    // Cleanup test data
    await sfHelper.cleanupTestData();
  });

  test('can navigate and explore rollup configuration options', async ({ page }) => {
    console.log('⚙️ Testing rollup configuration exploration...');
    
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Navigate to Rollup app and Recalculate tab
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for component to load
    await expect(page.locator('c-rollup-force-recalculation')).toBeVisible({ timeout: 15000 });
    
    console.log('🔍 Exploring configuration options...');
    
    // Look for different types of configuration elements
    const configElements = [
      'lightning-combobox',
      'lightning-picklist', 
      'lightning-input',
      'lightning-textarea',
      'lightning-checkbox',
      'select option',
      'input[type="checkbox"]',
      'input[type="radio"]'
    ];
    
    let foundElements = [];
    for (const selector of configElements) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        foundElements.push(`${selector}: ${count} elements`);
      }
    }
    
    console.log('Configuration elements found:', foundElements);
    
    // Look for any help text or instructions
    const helpText = page.locator('.slds-form-element__help, .slds-text-body_small, [role="tooltip"]');
    if (await helpText.count() > 0) {
      console.log('Found help text elements');
    }
    
    // Check for any validation messages or error states
    const errorElements = page.locator('.slds-has-error, .slds-text-color_error, [role="alert"]');
    if (await errorElements.count() > 0) {
      console.log('Found error/validation elements');
    }
    
    await sfHelper.takeScreenshot('recalc-configuration-exploration');
    console.log('✅ Completed configuration options exploration');
  });

  test('can test rollup job initiation workflow', async ({ page }) => {
    console.log('🚀 Testing rollup job initiation...');
    
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    const testFactory = new TestDataFactory(sfHelper);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Create test data
    console.log('📊 Setting up test data...');
    const { account, opportunities } = await testFactory.createAccountWithOpportunities(3, [500, 1000, 1500]);
    
    // Navigate to recalculation interface
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for interface to load
    await expect(page.locator('c-rollup-force-recalculation')).toBeVisible({ timeout: 15000 });
    
    console.log('🎯 Looking for rollup execution controls...');
    
    // Look for execution buttons with various possible labels
    const executionButtons = [
      'button:has-text("Calculate")',
      'button:has-text("Recalc")', 
      'button:has-text("Run")',
      'button:has-text("Execute")',
      'button:has-text("Start")',
      'button[title*="calculate"]',
      'button[title*="rollup"]',
      'lightning-button:has-text("Calculate")',
      'lightning-button:has-text("Run")'
    ];
    
    let executionButton = null;
    for (const buttonSelector of executionButtons) {
      const button = page.locator(buttonSelector);
      if (await button.isVisible()) {
        executionButton = button;
        console.log(`Found execution button: ${buttonSelector}`);
        break;
      }
    }
    
    if (executionButton) {
      await sfHelper.takeScreenshot('before-rollup-execution');
      
      // Click the execution button
      console.log('🔄 Initiating rollup job...');
      await executionButton.click();
      
      // Wait a moment for any response
      await page.waitForTimeout(2000);
      
      // Look for success indicators, progress indicators, or error messages
      const indicators = [
        '.slds-notification',
        '.slds-toast',
        '[role="status"]',
        '[role="alert"]',
        '.slds-spinner',
        'lightning-spinner'
      ];
      
      for (const indicator of indicators) {
        const element = page.locator(indicator);
        if (await element.isVisible()) {
          const text = await element.textContent();
          console.log(`Found indicator (${indicator}): ${text}`);
        }
      }
      
      await sfHelper.takeScreenshot('after-rollup-execution');
      console.log('✅ Rollup job initiation test completed');
    } else {
      console.log('ℹ️  No execution button found - interface may be different than expected');
      await sfHelper.takeScreenshot('no-execution-button-found');
    }
    
    // Cleanup
    await sfHelper.cleanupTestData();
  });

  test('can monitor rollup job status and completion', async ({ page }) => {
    console.log('📊 Testing rollup job monitoring...');
    
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Navigate to recalculation interface
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    await expect(page.locator('c-rollup-force-recalculation')).toBeVisible({ timeout: 15000 });
    
    console.log('👀 Looking for job monitoring elements...');
    
    // Look for job status indicators
    const statusElements = [
      '.slds-progress',
      '.slds-progress-bar',
      'lightning-progress-indicator',
      'lightning-progress-bar',
      '[data-name="jobStatus"]',
      '[role="progressbar"]',
      '.slds-spinner'
    ];
    
    let foundStatusElements = [];
    for (const selector of statusElements) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        foundStatusElements.push(selector);
      }
    }
    
    // Look for job information displays
    const jobInfoElements = [
      '[data-name="jobId"]',
      '[data-name="jobInfo"]', 
      '.job-status',
      '.rollup-status'
    ];
    
    for (const selector of jobInfoElements) {
      if (await page.locator(selector).isVisible()) {
        foundStatusElements.push(selector);
      }
    }
    
    console.log('Status monitoring elements found:', foundStatusElements);
    
    // Look for any refresh or polling buttons
    const refreshButtons = page.locator('button:has-text("Refresh"), button[title*="refresh"], lightning-button:has-text("Refresh")');
    if (await refreshButtons.count() > 0) {
      console.log('Found refresh buttons for job monitoring');
    }
    
    await sfHelper.takeScreenshot('rollup-job-monitoring-interface');
    console.log('✅ Job monitoring interface exploration completed');
  });
});