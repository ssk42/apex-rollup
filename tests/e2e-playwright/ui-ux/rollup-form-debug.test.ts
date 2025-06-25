import { test, expect } from '@playwright/test';
import { ScratchOrgHelper } from '../utils/scratch-org-helper';
import { SalesforceHelper } from '../utils/salesforce-helper';

test.describe('Rollup Form Debug', () => {
  
  test('debug form fields and their actual state', async ({ page }) => {
    console.log('🔍 Debugging rollup form fields...');
    
    // Setup
    const credentials = await ScratchOrgHelper.getScratchOrgCredentials();
    const sfHelper = new SalesforceHelper(page);
    
    await page.goto(credentials.loginUrl);
    await sfHelper.login(credentials.username, credentials.password);
    
    // Navigate to Rollup app
    await sfHelper.navigateToApp('Rollup', 'Recalculate Rollup');
    
    // Wait for the rollup force recalculation component to load
    const rollupComponent = page.locator('c-rollup-force-recalculation');
    await expect(rollupComponent).toBeVisible({ timeout: 15000 });
    
    await sfHelper.takeScreenshot('rollup-form-initial-state');
    
    console.log('📋 Getting all input and form elements...');
    
    // Get all inputs and their current values
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    console.log(`Found ${inputCount} input elements`);
    
    for (let i = 0; i < inputCount; i++) {
      try {
        const input = inputs.nth(i);
        const tagName = await input.evaluate(el => el.tagName);
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        const value = await input.inputValue();
        const required = await input.getAttribute('required');
        const visible = await input.isVisible();
        
        console.log(`Input ${i+1}: ${tagName}[type="${type}"] name="${name}" placeholder="${placeholder}" value="${value}" required="${required}" visible="${visible}"`);
      } catch (e) {
        console.log(`Input ${i+1}: Error inspecting - ${e.message}`);
      }
    }
    
    console.log('🎯 Testing rollup operation dropdown...');
    
    // Find and test the rollup operation dropdown
    const operationDropdown = page.locator('lightning-combobox').first();
    if (await operationDropdown.isVisible()) {
      console.log('Found operation dropdown, clicking it...');
      await operationDropdown.click();
      await page.waitForTimeout(2000);
      
      // Get all options
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();
      console.log(`Found ${optionCount} rollup operations:`);
      
      for (let i = 0; i < Math.min(optionCount, 15); i++) {
        try {
          const option = options.nth(i);
          const text = await option.textContent();
          console.log(`  Option ${i+1}: "${text}"`);
        } catch (e) {
          console.log(`  Option ${i+1}: Error reading`);
        }
      }
      
      // Try to select SUM
      const sumOption = page.locator('[role="option"]:has-text("SUM")');
      if (await sumOption.isVisible()) {
        console.log('Selecting SUM option...');
        await sumOption.click();
        await page.waitForTimeout(1000);
        await sfHelper.takeScreenshot('after-selecting-sum');
      }
    }
    
    console.log('📝 Testing field filling...');
    
    // Test filling specific fields one by one
    const fieldTests = [
      { name: 'Child Object', selector: 'input[name*="CalcItem"]', value: 'Opportunity' },
      { name: 'Child Field', selector: 'input[name*="RollupField"]', value: 'Amount' },
      { name: 'Lookup Field', selector: 'input[name*="LookupField"]', value: 'AccountId' }
    ];
    
    for (const fieldTest of fieldTests) {
      console.log(`Testing ${fieldTest.name} field...`);
      const field = page.locator(fieldTest.selector);
      
      if (await field.isVisible()) {
        console.log(`  ${fieldTest.name} field is visible`);
        try {
          await field.clear();
          await field.fill(fieldTest.value);
          const newValue = await field.inputValue();
          console.log(`  ${fieldTest.name} filled with: "${newValue}"`);
          await sfHelper.takeScreenshot(`after-filling-${fieldTest.name.toLowerCase().replace(' ', '-')}`);
        } catch (e) {
          console.log(`  Error filling ${fieldTest.name}: ${e.message}`);
        }
      } else {
        console.log(`  ${fieldTest.name} field not visible or not found`);
      }
    }
    
    console.log('🔍 Final form state check...');
    
    // Check if Start rollup button is enabled
    const startButtons = page.locator('button:has-text("Start rollup!")');
    const buttonCount = await startButtons.count();
    console.log(`Found ${buttonCount} "Start rollup!" buttons`);
    
    for (let i = 0; i < buttonCount; i++) {
      const button = startButtons.nth(i);
      const disabled = await button.getAttribute('disabled');
      const ariaDisabled = await button.getAttribute('aria-disabled');
      console.log(`  Button ${i+1}: disabled="${disabled}" aria-disabled="${ariaDisabled}"`);
    }
    
    await sfHelper.takeScreenshot('final-form-state');
    
    console.log('✅ Form debugging completed');
  });
});