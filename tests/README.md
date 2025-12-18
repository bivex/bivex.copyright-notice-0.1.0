# Copyright Notice Extension - Test Suite

This directory contains comprehensive tests for the Copyright Notice VS Code extension.

## Test Categories

### 1. VS Code Extension Tests (`npm test` or `npm run test:unit`)
- **extension.test.js**: Unit tests using VS Code test framework and Mocha
- **integration.test.js**: Integration tests with real VS Code APIs

### 2. Standalone Algorithm Tests
- **test_copyright_algorithm.js**: Core algorithm functionality tests
- **comprehensive_copyright_tests.js**: Comprehensive algorithm validation
- **quick_test.js**: Fast algorithm verification

### 3. Mutation Tests
- **mutation_tests.js**: Basic algorithm robustness testing
- **advanced_mutation_tests.js**: Advanced mutation scenarios
- **integration_mutation_tests.js**: Integration mutation testing
- **run_all_mutation_tests.js**: Complete mutation test suite runner

### 4. Background Processing Tests
- **background_mode_test.js**: Background processing functionality tests

### 5. Utility Tests
- **simple_execution_test.js**: Basic file existence and algorithm checks
- **run_all_tests.js**: Complete test suite runner with HTML reporting

## Running Tests

### Run All Tests
```bash
npm run test:all
```
This runs all test suites and generates comprehensive reports.

### Run VS Code Extension Tests Only
```bash
npm test
# or
npm run test:unit
```
Runs the VS Code extension tests using the VS Code test framework.

### Run Individual Test Suites

```bash
# Integration tests
npm run test:integration

# Mutation tests
npm run test:mutation

# Simple execution tests
npm run test:simple

# Background mode tests
npm run test:background

# Algorithm tests
npm run test:algorithm
```

### Run Tests Manually

```bash
# Run individual test files
node tests/simple_execution_test.js
node tests/test_copyright_algorithm.js
node tests/background_mode_test.js
node tests/mutation_tests.js
node tests/advanced_mutation_tests.js
node tests/integration_mutation_tests.js

# Run complete test suite
node tests/run_all_tests.js
```

## Test Reports

Tests generate several types of reports:

- **JSON Reports**: `test_execution_results.json`, `simple_test_execution_results.json`
- **HTML Reports**: `test_results_report.html`, `mutation_test_report.html`
- **Master Reports**: `mutation_test_master_report.json`

## Test Coverage

The test suite covers:

### ✅ Core Functionality
- Copyright detection algorithms
- Template formatting and placeholder replacement
- File type recognition and filtering
- Timestamp formatting and updating

### ✅ VS Code Integration
- Document analysis and state management
- Editor event handling
- Workspace edit operations
- Configuration management

### ✅ Edge Cases & Error Handling
- Empty files, malformed content, encoding issues
- File exclusions and folder restrictions
- Background processing and debouncing
- Cache management and performance optimization

### ✅ Algorithm Robustness
- Mutation testing with various input scenarios
- Boundary condition testing
- Performance validation
- Integration testing across file types

## Adding New Tests

### For VS Code Extension Tests
Add tests to `extension.test.js` or `integration.test.js` using Mocha syntax:

```javascript
test('test description', () => {
    // Test code using assert
    assert.equal(actual, expected);
});
```

### For Standalone Tests
Create new test files following the existing patterns, using Node.js and standard assertions.

### For Mutation Tests
Add new test cases to the mutation test files, focusing on edge cases and error conditions.

## Continuous Integration

The test suite is designed to run in CI/CD environments:

- All tests can run without VS Code GUI (headless mode)
- Comprehensive reporting for build systems
- Exit codes indicate test success/failure
- Parallel test execution support

## Troubleshooting

### Common Issues

1. **Tests failing due to missing files**: Ensure all test files exist in the `tests/` directory
2. **VS Code tests not running**: Make sure VS Code and test dependencies are installed
3. **Timeout errors**: Increase timeout values in test configurations
4. **Path issues**: Tests expect to run from project root directory

### Debug Mode

Run tests with debug output:
```bash
DEBUG=vscode-test:* npm test
```

### Test Development

To develop tests:
1. Make changes to test files
2. Run specific tests: `node tests/your_test.js`
3. Check console output and generated reports
4. Update test expectations as needed

## Contributing

When adding new functionality:
1. Add corresponding unit tests to `extension.test.js`
2. Add integration tests to `integration.test.js` if needed
3. Update algorithm tests for core logic changes
4. Add mutation tests for edge cases
5. Update this README with new test categories or commands