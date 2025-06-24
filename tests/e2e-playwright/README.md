# Apex Rollup E2E Testing Framework

Comprehensive end-to-end testing suite for Apex Rollup using Playwright and TypeScript, with seamless scratch org integration.

## 🚀 Quick Start

### Option 1: Using Scratch Org (Recommended)

```bash
# Create scratch org and run E2E tests
npm run test:e2e:scratch

# Or run comprehensive test suite with existing scratch org
npm run test:e2e:comprehensive

# Just run E2E tests (uses existing scratch org or manual credentials)
npm run test:e2e
```

### Option 2: Manual Credentials

1. Copy the example environment file:

   ```bash
   cp tests/e2e-playwright/.env.example tests/e2e-playwright/.env
   ```

2. Update with your Salesforce credentials:

   ```env
   SF_USERNAME=your-username@salesforce.com
   SF_PASSWORD=your-password-and-security-token
   SF_LOGIN_URL=https://login.salesforce.com
   ```

3. Run the tests:
   ```bash
   npm run test:e2e
   ```

## 🏗️ Architecture

### Automatic Scratch Org Integration

The E2E framework automatically:

- Detects if a scratch org exists (`apex-rollup-scratch-org` alias)
- Creates and configures a new scratch org if needed
- Uses scratch org credentials for authentication
- Falls back to manual credentials if scratch org unavailable
- Cleans up test data efficiently using Apex scripts

### Test Structure

```
tests/e2e-playwright/
├── core-operations/          # Core rollup operations (SUM, COUNT, AVG, etc.)
├── advanced-features/        # Multi-currency, performance, async processing
├── cmdt-integration/         # Custom Metadata Type configuration
├── multi-object/            # Multi-object relationships and grandparent rollups
├── integration-workflows/    # Flow and trigger integration
├── ui-ux/                   # Lightning Web Component testing
├── error-handling/          # Error scenarios and recovery
├── plugin-architecture/     # Plugin system testing
├── utils/                   # Helper utilities and page objects
├── types/                   # TypeScript type definitions
├── fixtures/                # Test data and configuration
├── global-setup.ts          # Global test setup and authentication
└── global-teardown.ts       # Global cleanup and reporting
```

## 🧪 Test Categories

### Core Operations

- **SUM, COUNT, AVERAGE, MIN, MAX** - Standard aggregation operations
- **CONCAT, CONCAT_DISTINCT** - Text concatenation with/without duplicates
- **FIRST, LAST** - Ordered record selection
- **ALL, NONE, SOME** - Boolean operations for conditional logic

### Advanced Features

- **Multi-currency rollups** with automatic conversion
- **Performance testing** with large datasets
- **Async processing** validation
- **Complex where clauses** and filtering
- **Grandparent rollups** across multiple relationships
- **Custom field types** and validation

### Integration Testing

- **Custom Metadata Type** configuration workflow
- **Flow integration** and invocable actions
- **Trigger integration** with `Rollup.runFromTrigger()`
- **Plugin architecture** testing
- **Error handling** and recovery scenarios

## 🔧 Configuration

### Environment Variables

The framework supports multiple configuration methods:

| Variable       | Description                  | Required | Default                        |
| -------------- | ---------------------------- | -------- | ------------------------------ |
| `SF_USERNAME`  | Salesforce username          | No\*     | Auto-detected from scratch org |
| `SF_PASSWORD`  | Salesforce password          | No\*     | Auto-detected from scratch org |
| `SF_LOGIN_URL` | Salesforce login URL         | No       | `https://login.salesforce.com` |
| `HEADLESS`     | Run browser in headless mode | No       | `true`                         |
| `SLOW_MO`      | Slow down operations (ms)    | No       | `0`                            |

\*Required only if no scratch org is available

### Playwright Configuration

- **playwright.config.ts** - Standard configuration for regular test runs
- **playwright.comprehensive.config.ts** - Extended configuration for full test suite
- **TypeScript support** with strict type checking
- **Automatic screenshot/video** capture on failures
- **Test parallelization** with smart resource management

## 📊 Test Execution

### Available Scripts

| Script                           | Description                                              |
| -------------------------------- | -------------------------------------------------------- |
| `npm run test:e2e`               | Run all E2E tests with auto-detected credentials         |
| `npm run test:e2e:debug`         | Run tests with debugging enabled                         |
| `npm run test:e2e:headed`        | Run tests with visible browser                           |
| `npm run test:e2e:comprehensive` | Run complete test suite with extended timeouts           |
| `npm run test:e2e:scratch`       | Full workflow: create org → test → cleanup               |
| `npm run test:e2e:full`          | Create org → deploy → assign perms → comprehensive tests |
| `npm run test:e2e:report`        | Show detailed test report                                |

### Test Execution Flow

1. **Global Setup**

   - Auto-detect scratch org or validate manual credentials
   - Authenticate with Salesforce
   - Verify Rollup app availability
   - Clean up existing test data
   - Validate test environment

2. **Test Execution**

   - Each test suite runs independently
   - Automatic test data creation and cleanup
   - Screenshot capture on failures
   - Performance monitoring and validation

3. **Global Teardown**
   - Final test data cleanup
   - Generate test summary report
   - Archive screenshots and artifacts

## 🛠️ Utilities

### SalesforceHelper

Comprehensive helper class for Salesforce automation:

- **Authentication** - Standard login and access token support
- **Navigation** - App launcher, object navigation, record access
- **Data Management** - Create, read, update, delete operations
- **Rollup Configuration** - Setup and execution of rollup operations
- **Screenshot/Video** capture with automatic naming

### ScratchOrgHelper

Specialized utility for scratch org integration:

- **Org Management** - Create, validate, and manage scratch orgs
- **Credential Extraction** - Automatic authentication setup
- **Feature Detection** - Multi-currency, object availability
- **Bulk Operations** - Efficient data cleanup using Apex
- **CLI Integration** - Seamless Salesforce CLI interaction

## 📈 Performance

### Optimization Features

- **Parallel Test Execution** - Multiple tests run simultaneously when possible
- **Smart Resource Management** - Automatic browser pooling and cleanup
- **Efficient Data Cleanup** - Bulk operations via Apex scripts
- **Scratch Org Reuse** - Tests share scratch org for faster execution
- **Selective Test Running** - Category-based test execution

### Performance Benchmarks

| Test Category            | Typical Runtime | Record Count            |
| ------------------------ | --------------- | ----------------------- |
| Core Operations          | 2-3 minutes     | 10-50 records per test  |
| Advanced Features        | 5-8 minutes     | 50-100 records per test |
| Integration Workflows    | 3-5 minutes     | Variable                |
| Full Comprehensive Suite | 15-25 minutes   | 500+ records total      |

## 🐛 Debugging

### Debug Mode

```bash
# Run with visible browser and debug tools
npm run test:e2e:debug

# Run specific test file
npx playwright test core-operations/rollup-operations.test.ts --debug

# Run single test with headed browser
npx playwright test --headed --grep "SUM rollup operation"
```

### Common Issues

1. **Scratch Org Not Found**

   - Run `npm run create:org` to create a new scratch org
   - Verify `sf org list` shows `apex-rollup-scratch-org`

2. **Authentication Failures**

   - Check scratch org expiration: `sf org display`
   - Regenerate password: `sf org generate password`

3. **Test Data Conflicts**
   - Run cleanup manually: `npx playwright test --grep "cleanup"`
   - Use fresh scratch org: `npm run delete:org && npm run create:org`

## 🔍 Monitoring

### Test Reports

- **HTML Report** - Detailed results with screenshots at `test-results/reports/`
- **JUnit XML** - CI/CD integration at `test-results/junit-results.xml`
- **JSON Results** - Machine-readable format for analysis
- **Screenshots** - Failure captures at `test-results/screenshots/`

### Continuous Integration

The framework is designed for CI/CD integration:

- Headless execution by default
- Proper exit codes for build failures
- Artifact collection for debugging
- Parallel execution support
- Resource cleanup guarantees

## 📝 Contributing

### Adding New Tests

1. Choose appropriate test directory based on category
2. Follow existing test patterns and naming conventions
3. Use TypeScript types for better maintainability
4. Include cleanup in `test.afterEach()` hooks
5. Add meaningful screenshots and logging

### Best Practices

- **Independent Tests** - Each test should be able to run in isolation
- **Descriptive Names** - Test names should clearly describe what is being tested
- **Proper Cleanup** - Always clean up test data, even on failures
- **Meaningful Assertions** - Verify specific expected outcomes
- **Error Handling** - Graceful handling of expected failure scenarios
