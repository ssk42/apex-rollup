# Apex Rollup - Claude Development Guide

## Project Overview

**Apex Rollup** is a fast, configurable, elastically scaling custom rollup solution for Salesforce. It provides a comprehensive framework for creating rollups from any one object to another, supporting standard rollup operations (SUM, AVG, MIN, MAX) and advanced features like COUNT, FIRST, LAST, and CONCAT operations. The solution works across Apex, Custom Metadata, Flows, and Lightning Web Components.

**Key Features:**
- Custom Metadata-driven rollup configuration
- Flow/Process Builder integration
- Lightning Web Components for UI
- Full recalculation capabilities
- Plugin architecture with logging and callback support
- Scheduled job capabilities
- Comprehensive test coverage

## Tech Stack & Architecture

### Core Technologies
- **Salesforce Platform**: Apex, Lightning Web Components (LWC), Custom Metadata Types
- **API Version**: 56.0
- **Package Type**: Unlocked Package with plugin ecosystem
- **Testing**: Jest for LWC, Apex Unit Tests

### Development Tools
- **SFDX CLI**: Primary deployment and development tool
- **Node.js/NPM**: Build process and dependency management
- **ESLint**: JavaScript/LWC linting with Salesforce configurations
- **Prettier**: Code formatting (Apex and JavaScript)
- **PMD**: Static code analysis for Apex
- **Husky**: Git hooks for pre-commit validation
- **lint-staged**: Runs linting/formatting on staged files

## Project Structure

```
apex-rollup/
├── rollup/                          # Main package source
│   ├── core/                        # Core Apex classes and metadata
│   │   ├── classes/                 # Main Apex classes (30+ files)
│   │   ├── objects/                 # Custom Metadata Type definitions
│   │   └── customMetadata/          # Default configuration
│   ├── app/                         # Lightning components and UI
│   │   ├── lwc/                     # Lightning Web Components
│   │   └── applications/            # Salesforce applications
│   └── main/default/                # Additional components
├── plugins/                         # Plugin ecosystem
│   ├── CustomObjectRollupLogger/    # Custom logging plugin
│   ├── NebulaLogger/               # Nebula Logger integration
│   ├── RollupCallback/             # Callback/event plugin
│   └── ExtraCodeCoverage/          # Additional test coverage
├── extra-tests/                     # Extended test suite
├── scripts/                         # Build and deployment scripts
├── config/                          # Configuration files
└── media/                          # Documentation assets
```

### Key Files

**Configuration:**
- `sfdx-project.json` - Salesforce project configuration with multiple packages
- `package.json` - Node.js dependencies and build scripts
- `.prettierrc` - Code formatting rules
- `config/pmd-ruleset.xml` - Apex static analysis rules
- `lint-staged.config.js` - Pre-commit hook configuration

**Core Apex Classes:**
- `rollup/core/classes/Rollup.cls` - Main rollup engine
- `rollup/core/classes/RollupAsyncProcessor.cls` - Asynchronous processing
- `rollup/core/classes/RollupCalculator.cls` - Calculation logic
- `rollup/core/classes/RollupQueryBuilder.cls` - Dynamic SOQL generation

**Lightning Web Components:**
- `rollup/app/lwc/rollupForceRecalculation/` - Recalculation UI
- `rollup/app/lwc/rollupUtils/` - Shared utilities
- `rollup/app/lwc/rollupOrderBy/` - Ordering configuration

## Development Guidelines

### Code Style & Formatting

**Apex:**
- Follow Salesforce Apex best practices
- Use descriptive variable names and method names
- Include comprehensive JavaDoc comments for public methods
- Maintain test coverage above 75%

**JavaScript/LWC:**
- Use ESLint with Salesforce LWC configuration
- Follow Lightning Web Component conventions
- Use Jest for unit testing
- Maintain consistent naming conventions

**Formatting Rules:**
- Prettier configuration: 160 character line length, 2-space tabs, single quotes
- Trailing commas removed
- Arrow functions without parentheses for single parameters

### Testing Requirements

**Apex Testing:**
- All new Apex classes must have corresponding test classes
- Tests should be placed in `extra-tests/classes/` directory
- Use `@TestSetup` methods with `RollupSettings__c(IsEnabled__c = true)`
- Wrap asynchronous rollup calls in `Test.startTest()` and `Test.stopTest()`
- Test with multi-currency enabled scratch orgs

**LWC Testing:**
- Jest tests in `__tests__/` directories within each LWC
- Mock Apex methods using `@salesforce/apex` imports
- Test user interactions and data flow

### Build & Deployment

**Available NPM Scripts:**
```bash
npm run test              # Run all tests (Apex + LWC)
npm run test:apex         # Run Apex tests only
npm run test:lwc          # Run LWC tests only
npm run scan              # Run PMD static analysis
npm run lint:verify       # Run ESLint on LWC files
npm run prettier          # Format code
```

**Package Creation:**
```bash
npm run create:package:rollup           # Main package
npm run create:package:logger           # Custom logger plugin
npm run create:package:nebula:adapter   # Nebula logger adapter
npm run create:package:callback         # Callback plugin
```

### Git Workflow

**Pre-commit Hooks:**
- Automatic code formatting with Prettier
- ESLint validation for JavaScript files
- PMD static analysis for Apex files
- Automatic package generation for modified plugins

**Branch Protection:**
- Main branch requires PR reviews
- All tests must pass via GitHub Actions
- No direct commits to main branch

### Custom Metadata Configuration

The system uses several Custom Metadata Types:
- `Rollup__mdt` - Main rollup configuration
- `RollupControl__mdt` - Global control settings
- `RollupOrderBy__mdt` - Ordering specifications
- `RollupPlugin__mdt` - Plugin definitions

### Plugin Architecture

The system supports plugins for:
- **Logging**: Custom object logging, Nebula Logger integration
- **Callbacks**: Platform events and custom Apex callbacks
- **Testing**: Additional code coverage plugins

Each plugin is a separate unlocked package with dependencies on the main package.

## Setup for New Developers

1. **Prerequisites:**
   ```bash
   # Install Salesforce CLI
   npm install -g @salesforce/cli
   
   # Install project dependencies
   npm install
   ```

2. **Salesforce Org Setup:**
   ```bash
   # Create scratch org with multi-currency
   sfdx org:create:scratch -f config/project-scratch-def.json -a apex-rollup-dev
   
   # Deploy source
   sfdx project:deploy:start
   
   # Run tests
   npm run test
   ```

3. **Required Org Configuration:**
   - Create `RollupSettings__c` hierarchy custom setting
   - Set `IsEnabled__c = true` at Org Wide Default level
   - Install any required plugin dependencies

## Common Development Patterns

### Adding New Rollup Operations
1. Extend `RollupCalculator.cls` with new operation logic
2. Update `RollupMetaPicklists.cls` with new picklist values
3. Add corresponding test methods in `extra-tests/classes/`
4. Update documentation and examples

### Creating New Plugins
1. Create new directory under `plugins/`
2. Follow existing plugin structure with classes, metadata, and tests
3. Add plugin configuration to `sfdx-project.json`
4. Update `lint-staged.config.js` for automatic package generation

### Working with Custom Metadata
- Prefer configuration-driven approaches over hardcoded logic
- Use `RollupControl__mdt` for global settings
- Implement proper validation rules for metadata integrity

## Performance Considerations

- Leverage asynchronous processing for large data volumes
- Use selective queries and proper indexing
- Monitor governor limits and optimize SOQL queries
- Implement proper bulkification patterns
- Consider LDV (Large Data Volume) scenarios in design

## Troubleshooting

**Common Issues:**
- Ensure `RollupSettings__c` is properly configured
- Check Custom Metadata configuration for syntax errors
- Verify relationship field mappings are correct
- Monitor debug logs for governor limit issues

**Testing Issues:**
- Use scratch orgs with multi-currency for comprehensive testing
- Ensure all required trigger contexts are implemented
- Mock properly in unit tests to avoid external dependencies

This development guide provides the foundation for working effectively with the Apex Rollup codebase while maintaining code quality and following established patterns.