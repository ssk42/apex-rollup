import { execSync } from 'child_process';
import { SalesforceCredentials } from '../types/salesforce';

/**
 * Utility for integrating E2E tests with Salesforce scratch orgs
 * Handles authentication and org management automatically
 */
export class ScratchOrgHelper {
  private static readonly SCRATCH_ORG_ALIAS = 'apex-rollup-scratch-org';
  private static orgInfo: any = null;

  /**
   * Get scratch org credentials for E2E testing
   */
  static async getScratchOrgCredentials(): Promise<SalesforceCredentials> {
    console.log('🔍 Getting scratch org credentials...');
    
    try {
      // Check if scratch org exists and is active
      const orgInfo = await this.getOrgInfo();
      
      if (!orgInfo) {
        throw new Error('No active scratch org found');
      }
      
      console.log(`✅ Found active scratch org: ${orgInfo.username}`);
      
      // Get or generate password for UI testing
      const password = await this.ensureOrgPassword();
      
      return {
        username: orgInfo.username,
        password: orgInfo.accessToken, // Use access token as "password" for frontdoor auth
        loginUrl: orgInfo.instanceUrl || 'https://login.salesforce.com',
        orgId: orgInfo.id
      };
      
    } catch (error) {
      console.error('❌ Failed to get scratch org credentials:', error.message);
      throw new Error(`Scratch org not available: ${error.message}`);
    }
  }

  /**
   * Create scratch org if it doesn't exist
   */
  static async ensureScratchOrg(): Promise<void> {
    console.log('🏗️  Ensuring scratch org exists...');
    
    try {
      // Check if org already exists
      const orgInfo = await this.getOrgInfo();
      if (orgInfo) {
        console.log(`✅ Scratch org already exists: ${orgInfo.username}`);
        return;
      }
    } catch {
      // Org doesn't exist, create it
    }
    
    console.log('🚀 Creating new scratch org...');
    
    try {
      // Create scratch org using existing npm script
      execSync('npm run create:org', { 
        stdio: 'inherit',
        timeout: 300000 // 5 minutes timeout
      });
      
      // Assign permissions
      execSync('npm run assign:perms', { 
        stdio: 'inherit',
        timeout: 60000 // 1 minute timeout
      });
      
      console.log('✅ Scratch org created and configured successfully');
      
    } catch (error) {
      throw new Error(`Failed to create scratch org: ${error.message}`);
    }
  }

  /**
   * Get org information using Salesforce CLI
   */
  private static async getOrgInfo(): Promise<any> {
    if (this.orgInfo) {
      return this.orgInfo;
    }
    
    try {
      const result = execSync(
        `sf org display --target-org ${this.SCRATCH_ORG_ALIAS} --json`,
        { encoding: 'utf8', timeout: 30000, env: { ...process.env, FORCE_COLOR: '0' } }
      );
      
      // Clean up any ANSI color codes that might have leaked through
      const cleanResult = result.replace(/\u001b\[[0-9;]*m/g, '');
      
      const orgData = JSON.parse(cleanResult);
      
      if (orgData.status !== 0) {
        throw new Error(`CLI command failed: ${orgData.message}`);
      }
      
      this.orgInfo = orgData.result;
      return this.orgInfo;
      
    } catch (error) {
      if (error.message.includes('No org configuration found')) {
        return null; // Org doesn't exist
      }
      throw error;
    }
  }

  /**
   * Ensure the scratch org has a password for UI testing
   */
  private static async ensureOrgPassword(): Promise<string> {
    try {
      // Try to generate a password (this will fail if password already exists)
      const result = execSync(
        `sf org generate password --target-org ${this.SCRATCH_ORG_ALIAS} --json`,
        { encoding: 'utf8', timeout: 30000, env: { ...process.env, FORCE_COLOR: '0' } }
      );
      
      const cleanResult = result.replace(/\u001b\[[0-9;]*m/g, '');
      const passwordData = JSON.parse(cleanResult);
      
      if (passwordData.status === 0 && passwordData.result?.password) {
        console.log('✅ Generated new password for scratch org');
        return passwordData.result.password;
      }
      
    } catch (error) {
      // Password might already exist, try to get existing one
      console.log('ℹ️  Password already exists or generation failed, using default');
    }
    
    // For scratch orgs, the default password is often the username + "123"
    // or we can use the access token for headless authentication
    const orgInfo = await this.getOrgInfo();
    
    // If we have an access token, we can use that for authentication
    if (orgInfo.accessToken) {
      console.log('✅ Using access token for authentication');
      return orgInfo.accessToken; // We'll handle this specially in the helper
    }
    
    // Default password pattern for scratch orgs
    const defaultPassword = orgInfo.username.split('@')[0] + '123';
    console.log('⚠️  Using default password pattern - may need manual setup');
    return defaultPassword;
  }

  /**
   * Check if org has specific features enabled
   */
  static async checkOrgFeatures(): Promise<{ multiCurrency: boolean; [key: string]: boolean }> {
    console.log('🔍 Checking org features...');
    
    try {
      const orgInfo = await this.getOrgInfo();
      
      // Check for multi-currency by querying CurrencyType
      let multiCurrency = false;
      try {
        execSync(
          `sf data query --query "SELECT Id FROM CurrencyType LIMIT 1" --target-org ${this.SCRATCH_ORG_ALIAS}`,
          { encoding: 'utf8', timeout: 30000, env: { ...process.env, FORCE_COLOR: '0' } }
        );
        multiCurrency = true;
      } catch {
        multiCurrency = false;
      }
      
      const features = {
        multiCurrency,
        // Add other feature checks as needed
      };
      
      console.log('✅ Org features checked:', features);
      return features;
      
    } catch (error) {
      console.warn('⚠️  Could not check org features:', error.message);
      return { multiCurrency: false };
    }
  }

  /**
   * Deploy source code to scratch org
   */
  static async deploySource(): Promise<void> {
    console.log('📦 Deploying source to scratch org...');
    
    try {
      execSync(
        `sf project deploy start --target-org ${this.SCRATCH_ORG_ALIAS}`,
        { stdio: 'inherit', timeout: 300000 }
      );
      
      console.log('✅ Source deployed successfully');
      
    } catch (error) {
      throw new Error(`Failed to deploy source: ${error.message}`);
    }
  }

  /**
   * Clean up test data in scratch org
   */
  static async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data in scratch org...');
    
    try {
      // Delete all records created today (test data)
      const cleanupScript = `
        Date today = Date.today();
        
        // Delete test accounts and related data
        List<Account> testAccounts = [
          SELECT Id FROM Account 
          WHERE Name LIKE 'Test Account%' 
          AND CreatedDate = TODAY
        ];
        
        if (!testAccounts.isEmpty()) {
          delete testAccounts;
          System.debug('Deleted ' + testAccounts.size() + ' test accounts');
        }
        
        // Clean up orphaned records
        List<Opportunity> orphanedOpps = [
          SELECT Id FROM Opportunity 
          WHERE Name LIKE '%Opp%' 
          AND CreatedDate = TODAY
          AND AccountId = null
        ];
        
        if (!orphanedOpps.isEmpty()) {
          delete orphanedOpps;
          System.debug('Deleted ' + orphanedOpps.size() + ' orphaned opportunities');
        }
      `;
      
      // Execute cleanup via anonymous Apex
      const tempFile = '/tmp/cleanup-script.apex';
      require('fs').writeFileSync(tempFile, cleanupScript);
      
      execSync(
        `sf apex run --file ${tempFile} --target-org ${this.SCRATCH_ORG_ALIAS}`,
        { timeout: 60000 }
      );
      
      console.log('✅ Test data cleanup completed');
      
    } catch (error) {
      console.warn('⚠️  Test data cleanup failed (non-fatal):', error.message);
    }
  }

  /**
   * Get org URL for direct navigation
   */
  static async getOrgUrl(): Promise<string> {
    const orgInfo = await this.getOrgInfo();
    return orgInfo.instanceUrl || `https://${orgInfo.username.split('@')[1]}`;
  }

  /**
   * Validate that org is ready for E2E testing
   */
  static async validateOrgForTesting(): Promise<void> {
    console.log('🔍 Validating scratch org for E2E testing...');
    
    const orgInfo = await this.getOrgInfo();
    
    if (!orgInfo) {
      throw new Error('Scratch org not found');
    }
    
    if (orgInfo.status !== 'Active') {
      throw new Error(`Scratch org is not active: ${orgInfo.status}`);
    }
    
    // Check that Rollup package is deployed
    try {
      execSync(
        `sf data query --query "SELECT Id FROM Rollup__mdt LIMIT 1" --target-org ${this.SCRATCH_ORG_ALIAS}`,
        { encoding: 'utf8', timeout: 30000 }
      );
      console.log('✅ Rollup package verified');
    } catch (error) {
      console.warn('⚠️  Rollup package may not be deployed');
      // Try to deploy
      await this.deploySource();
    }
    
    console.log('✅ Scratch org validation completed');
  }

  /**
   * Reset scratch org cache
   */
  static resetCache(): void {
    this.orgInfo = null;
  }
}