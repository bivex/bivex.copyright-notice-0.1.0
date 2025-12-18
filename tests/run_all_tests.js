const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Running Complete Copyright Notice Test Suite\n');

const results = {
    timestamp: new Date().toISOString(),
    suites: [],
    summary: {}
};

// Test suites to run
const testSuites = [
    {
        name: 'Simple Execution Tests',
        command: 'node tests/simple_execution_test.js',
        description: 'Basic file and algorithm checks'
    },
    {
        name: 'Copyright Algorithm Tests',
        command: 'node tests/test_copyright_algorithm.js',
        description: 'Core algorithm functionality'
    },
    {
        name: 'Comprehensive Tests',
        command: 'node tests/comprehensive_copyright_tests.js',
        description: 'Comprehensive algorithm validation'
    },
    {
        name: 'Mutation Tests',
        command: 'node tests/mutation_tests.js',
        description: 'Algorithm robustness testing'
    },
    {
        name: 'Advanced Mutation Tests',
        command: 'node tests/advanced_mutation_tests.js',
        description: 'Advanced mutation scenarios'
    },
    {
        name: 'Integration Mutation Tests',
        command: 'node tests/integration_mutation_tests.js',
        description: 'Integration mutation testing'
    },
    // Background mode tests require VS Code environment and are run via npm test
    // {
    //     name: 'Background Mode Tests',
    //     command: 'node tests/background_mode_test.js',
    //     description: 'Background processing tests'
    // },
    {
        name: 'Quick Tests',
        command: 'node tests/quick_test.js',
        description: 'Fast algorithm verification'
    },
    {
        name: 'Go & Rust Language Tests',
        command: 'node tests/go_rust_language_tests.js',
        description: 'Go and Rust language-specific copyright insertion tests'
    }
];

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;

for (const suite of testSuites) {
    console.log(`\n📋 Running ${suite.name}...`);
    console.log(`   ${suite.description}`);

    const suiteResult = {
        name: suite.name,
        description: suite.description,
        status: 'unknown',
        output: '',
        error: null,
        tests: []
    };

    try {
        const output = execSync(suite.command, {
            encoding: 'utf8',
            timeout: 30000,
            cwd: process.cwd()
        });

        suiteResult.status = 'completed';
        suiteResult.output = output;

        // Try to parse test results from output
        const passMatches = output.match(/(\d+)\/(\d+) tests passed/g);
        if (passMatches) {
            passMatches.forEach(match => {
                const [passed, total] = match.replace(' tests passed', '').split('/').map(Number);
                totalTests += total;
                totalPassed += passed;
                totalFailed += total - passed;
            });
        }

        console.log(`   ✅ ${suite.name} completed successfully`);

    } catch (error) {
        suiteResult.status = 'failed';
        suiteResult.error = error.message;
        totalFailed++;

        console.log(`   ❌ ${suite.name} failed: ${error.message}`);
    }

    results.suites.push(suiteResult);
}

// Generate summary
results.summary = {
    totalSuites: testSuites.length,
    completedSuites: results.suites.filter(s => s.status === 'completed').length,
    failedSuites: results.suites.filter(s => s.status === 'failed').length,
    totalTests: totalTests,
    passedTests: totalPassed,
    failedTests: totalFailed,
    successRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0
};

console.log('\n' + '='.repeat(60));
console.log('📊 FINAL TEST RESULTS SUMMARY');
console.log('='.repeat(60));
console.log(`Test Suites: ${results.summary.completedSuites}/${results.summary.totalSuites} completed`);
console.log(`Individual Tests: ${results.summary.passedTests}/${results.summary.totalTests} passed (${results.summary.successRate}%)`);

if (results.summary.failedSuites > 0) {
    console.log('\n❌ Failed Test Suites:');
    results.suites.filter(s => s.status === 'failed').forEach(suite => {
        console.log(`   - ${suite.name}: ${suite.error}`);
    });
}

console.log('\n✅ All test suites completed!');

// Save detailed results
const resultsPath = 'test_execution_results.json';
fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
console.log(`📝 Detailed results saved to ${resultsPath}`);

// Generate HTML report
const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Copyright Notice Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .suite { margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .passed { border-color: #4CAF50; background: #e8f5e8; }
        .failed { border-color: #f44336; background: #ffebee; }
        .completed { border-color: #2196F3; background: #e3f2fd; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Copyright Notice Extension - Test Results</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Test Suites:</strong> ${results.summary.completedSuites}/${results.summary.totalSuites} completed</p>
        <p><strong>Individual Tests:</strong> ${results.summary.passedTests}/${results.summary.totalTests} passed (${results.summary.successRate}%)</p>
        <p><strong>Generated:</strong> ${new Date(results.timestamp).toLocaleString()}</p>
    </div>

    <h2>Test Suite Results</h2>
    ${results.suites.map(suite => `
        <div class="suite ${suite.status}">
            <h3>${suite.name}</h3>
            <p><strong>Status:</strong> ${suite.status.toUpperCase()}</p>
            <p><strong>Description:</strong> ${suite.description}</p>
            ${suite.error ? `<p><strong>Error:</strong> ${suite.error}</p>` : ''}
            ${suite.output ? `<pre>${suite.output}</pre>` : ''}
        </div>
    `).join('')}
</body>
</html>
`;

fs.writeFileSync('test_results_report.html', htmlReport);
console.log('📄 HTML report saved to test_results_report.html');

console.log('\n🎉 Test execution complete!');
process.exit(results.summary.failedSuites > 0 ? 1 : 0);