# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Testing

- `npm run test` - Run all tests (Apex, LWC, and E2E)
- `npm run test:apex` - Run Apex tests using `sh ./scripts/runLocalTests.sh`
- `npm run test:lwc` - Run Lightning Web Component tests with coverage
- `npm run test:e2e` - Run comprehensive end-to-end tests with Playwright
- `npm run test:e2e:debug` - Run E2E tests with visible browser for debugging
- `npm run test:e2e:comprehensive` - Run core, CMDT, components, and integration tests
- `npm run test:e2e:scratch` - Full workflow: create org, run tests, cleanup
- Run tests for specific classes: Check test files in `extra-tests/classes/` and `plugins/*/tests/`

### Code Quality & Scanning

- `npm run scan` - Run both ESLint and PMD scans
- `npm run lint:verify` - Run ESLint code analyzer
- `npm run scan:pmd` - Run PMD static analysis on Apex classes

### Salesforce Org Management

- `npm run create:org` - Create scratch org with sample data
- `npm run assign:perms` - Assign necessary permission sets
- `npm run delete:org` - Delete scratch org

### Package Creation

- `npm run create:package:rollup` - Generate main package
- `npm run create:package:logger` - Generate custom logger plugin package
- `npm run create:package:nebula:adapter` - Generate Nebula Logger adapter package

## Architecture Overview

### Core Structure

This is a Salesforce package that provides flexible, high-performance rollup functionality for aggregating data between related objects.

**Key Directories:**

- `rollup/core/` - Main rollup engine and business logic
- `rollup/app/` - Lightning Web Components and application UI
- `plugins/` - Extensible plugin system for logging and callbacks
- `extra-tests/` - Additional test metadata and objects for comprehensive testing

### Main Components

**Core Engine (`rollup/core/classes/`):**

- `Rollup.cls` - Main orchestrator class with global API surface
- `RollupCalculator.cls` - Handles different rollup operations (SUM, COUNT, CONCAT, etc.)
- `RollupAsyncProcessor.cls` - Manages asynchronous processing for large data volumes
- `RollupRepository.cls` - Data access layer and query management
- `RollupEvaluator.cls` - Handles where clause filtering and custom logic
- `RollupQueryBuilder.cls` - Dynamic SOQL query construction

**Configuration System:**

- Custom Metadata Types (`Rollup__mdt`, `RollupControl__mdt`, `RollupOrderBy__mdt`) for declarative setup
- Flow-based invocable actions for admin-friendly configuration
- Apex trigger integration with one-liner: `Rollup.runFromTrigger()`

**Plugin Architecture:**

- `plugins/CustomObjectRollupLogger/` - Custom object-based logging
- `plugins/NebulaLogger/` - Integration with Nebula Logger framework
- `plugins/RollupCallback/` - Post-processing hooks and platform events

### Key Features

- **Multiple Invocation Methods**: Apex triggers, Flow actions, Custom Metadata, scheduled jobs
- **Advanced Operations**: Standard aggregates plus FIRST/LAST, CONCAT_DISTINCT, ALL/NONE/SOME boolean operations
- **Grandparent Rollups**: Multi-hop relationship traversal (up to 5 levels)
- **Performance Optimizations**: Automatic batching, query optimization, async processing
- **Multi-Currency Support**: Automatic currency conversion using dated exchange rates
- **Extensibility**: Custom evaluators, plugins, and callback systems

### Integration Patterns

**Trigger Integration:**

```apex
trigger OpportunityTrigger on Opportunity(after insert, after update, before delete, after undelete) {
  Rollup.runFromTrigger();
}
```

**Flow Integration:**
Use "Perform Rollup on records" or "Perform Rollup\_\_mdt-based rollup" invocable actions

**Custom Metadata Configuration:**
Configure rollups declaratively using `Rollup__mdt` records with fields like:

- Child/Parent objects and lookup relationships
- Rollup operations and target fields
- Where clauses and filtering logic

### Testing Strategy

- Extensive test coverage in `extra-tests/classes/`
- Plugin-specific tests in respective `plugins/*/tests/` directories
- Integration tests covering trigger, Flow, and scheduled contexts
- Mock metadata and dependency injection for unit testing

### Development Workflow

1. Always run tests before committing: `npm run test`
2. Use code scanning to maintain quality: `npm run scan`
3. Test in scratch orgs for Salesforce metadata changes
4. Follow the modular plugin architecture for extensions
5. Respect the async processing patterns for large data volume scenarios

## Setup Requirements

**Custom Settings Configuration:**
Before any development, ensure `RollupSettings__c` custom setting is configured:

1. Setup → Custom Settings
2. Click `Manage` next to `Rollup Settings`
3. Click `New` for Org Wide Defaults
4. Mark `Is Enabled` as true and save

**Required Trigger Contexts:**
When using `Rollup.runFromTrigger()`, triggers MUST include these contexts:

```apex
trigger ExampleTrigger on Opportunity(after insert, after update, before delete, after undelete) {
  Rollup.runFromTrigger();
}
```

**Test Setup:**
For unit tests, always include in `@TestSetup`:

```apex
@TestSetup
static void setup() {
  upsert new RollupSettings__c(IsEnabled__c = true);
}
```

**Asynchronous Testing:**
Wrap rollup actions in tests with `Test.startTest()` and `Test.stopTest()` since rollups run asynchronously by default.

## E2E Testing Framework

A comprehensive Playwright-based E2E testing framework located in `tests/e2e-playwright/`:

**Key Components:**

- TypeScript configuration with strict settings
- Salesforce scratch org integration
- Test utilities for authentication and data creation
- Screenshot and video capture for debugging
- Multiple test configurations (simple, comprehensive)

**Test Structure:**

- `utils/` - Helper classes for Salesforce operations
- `types/` - TypeScript definitions for test objects
- Multiple test suites covering core operations, advanced features, and UI components

**Authentication:**
Uses scratch org access tokens via frontdoor.jsp for reliable authentication without manual login.
