# Apex Rollup Codebase Analysis (by Gemini)

## Project Name: Apex Rollup

## Purpose

Apex Rollup provides a flexible and high-performance solution for aggregating data between related Salesforce objects. It aims to extend and enhance the standard Salesforce rollup summary field capabilities by supporting lookup relationships, advanced rollup operations, multi-level relationships (grandparent rollups), and a robust plugin architecture.

## Core Technologies

- **Apex:** The primary language for the core business logic and engine.
- **Salesforce Custom Metadata Types (CMDT):** Used extensively for declarative configuration of rollups (`Rollup__mdt`, `RollupControl__mdt`, `RollupOrderBy__mdt`).
- **Salesforce Flows:** Integrates with Flows via invocable actions, enabling administrators to configure and schedule rollups without Apex code.
- **Lightning Web Components (LWC):** Utilized for user interface components, such as the "Recalc Rollups Button" and the Apex Rollup application.
- **Playwright:** Employed for comprehensive End-to-End (E2E) testing of the application's functionality and UI.

## Key Directories/Modules

- `rollup/core/`: Contains the fundamental rollup engine and core business logic, including classes like `Rollup.cls`, `RollupCalculator.cls`, and `RollupRepository.cls`.
- `rollup/app/`: Houses Lightning Web Components and other application UI elements.
- `plugins/`: Implements an extensible plugin system, allowing for custom logging (e.g., `CustomObjectRollupLogger`, `NebulaLogger`) and callback mechanisms (`RollupCallback`).
- `extra-tests/`: Stores additional test metadata and objects crucial for comprehensive testing of the rollup functionality.
- `tests/e2e-playwright/`: Dedicated directory for the Playwright-based E2E testing framework.
- `scripts/`: Contains various utility scripts for build processes, testing, and migration tasks (e.g., scripts for migrating from DLRS).

## Invocation Methods

Apex Rollup can be triggered and configured through multiple avenues:

- **Apex Triggers:** The primary method for real-time rollups, typically using the `Rollup.runFromTrigger()` one-liner.
- **Salesforce Flows:** Utilizes invocable actions like "Perform Rollup on records" and "Perform Rollup\_\_mdt-based rollup" for declarative automation.
- **Custom Metadata:** Rollups are declaratively defined and managed using `Rollup__mdt` records.
- **Scheduled Jobs:** Can be scheduled via Apex (`Rollup.schedule()`) or, more commonly, through Scheduled Flows.
- **LWC Button:** A "Recalc Rollups Button" LWC can be embedded on parent record flexipages for on-demand recalculations.
- **Apex Rollup App:** A dedicated single-page application allows for manual full recalculations of rollups.
- **Custom Apex:** Provides an extensive global API surface for developers to programmatically control and integrate rollup operations.

## Key Features

- **Diverse Operations:** Supports a wide range of aggregation operations including SUM, COUNT, CONCAT, CONCAT_DISTINCT, FIRST, LAST, MAX, MIN, MOST, ALL, NONE, and SOME.
- **Grandparent Rollups:** Enables aggregation across multi-level relationships, supporting up to 5 levels of relationship traversal.
- **Performance Optimizations:** Incorporates features like automatic batching, SOQL query optimization, and asynchronous processing to handle large data volumes efficiently.
- **Multi-Currency Support:** Automatically handles currency conversion for rollup values in multi-currency Salesforce organizations.
- **Extensibility:** Designed with a modular architecture that allows for custom evaluators, plugins, and callback systems to extend its functionality.
- **DLRS Migration:** Includes utility scripts to facilitate the migration of existing DLRS (Declarative Lookup Rollup Summaries) rules to Apex Rollup configurations.

## Testing Strategy

The project employs a multi-faceted testing approach to ensure reliability and correctness:

- **Apex Unit Tests:** Extensive test coverage is provided through Apex unit tests located in `extra-tests/classes/` and within individual plugin directories (`plugins/*/tests/`).
- **Integration Tests:** Covers various integration points, including trigger-based, Flow-based, and scheduled contexts.
- **Playwright E2E Tests:** A comprehensive Playwright framework is used for end-to-end testing, validating UI interactions and overall system behavior.

## Development Workflow & Best Practices

- **Pre-Commit Checks:** Developers are encouraged to run `npm run test` (all tests) and `npm run scan` (code quality) before committing changes.
- **Scratch Org Testing:** All Salesforce metadata changes and new features should be thoroughly tested in Salesforce scratch orgs.
- **Asynchronous Processing:** When dealing with large data volumes, developers should adhere to the project's asynchronous processing patterns.
- **Configuration & Testing Setup:** Proper configuration of `RollupSettings__c` and wrapping rollup actions within `Test.startTest()` and `Test.stopTest()` are crucial for accurate unit testing.

## Important Considerations

- **Trigger Contexts:** Specific trigger contexts (`after insert`, `after update`, `before delete`, `after undelete`, and optionally `after delete` for merges) are mandatory when using `Rollup.runFromTrigger()`.
- **Parent-Level Merges:** Special handling is required for merges on standard objects like Account, Case, Contact, and Lead if they serve as parent records in rollups.
- **Change Data Capture (CDC):** Supported via `Rollup.runFromCDCTrigger()`, but with specific limitations regarding reparenting and event data.
- **Picklist & Recalculations:** Unique behaviors and considerations apply to rollup operations involving picklists and scenarios that trigger full recalculations.
- **Multi-Currency:** Advanced currency management and dated exchange rates require careful configuration, especially for specific objects like Opportunity Splits.
