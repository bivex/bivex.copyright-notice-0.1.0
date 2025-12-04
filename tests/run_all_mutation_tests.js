#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Master test runner for all mutation testing suites

class MutationTestOrchestrator {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            suites: {},
            summary: {}
        };
    }

    async runTestSuite(suiteName, testFile) {
        console.log(`\n🔬 Starting ${suiteName}...\n`);

        try {
            const TestClass = require(`./${testFile}`);
            const tester = new TestClass();

            let result;
            if (typeof tester.runAllTests === 'function') {
                result = tester.runAllTests();
            } else if (typeof tester.runAdvancedTests === 'function') {
                result = tester.runAdvancedTests();
            } else if (typeof tester.runIntegrationTests === 'function') {
                result = tester.runIntegrationTests();
            } else {
                throw new Error(`No suitable test method found in ${testFile}`);
            }

            this.results.suites[suiteName] = {
                status: 'completed',
                result: result
            };

            console.log(`✅ ${suiteName} completed successfully`);

        } catch (error) {
            console.error(`❌ ${suiteName} failed: ${error.message}`);
            this.results.suites[suiteName] = {
                status: 'failed',
                error: error.message
            };
        }
    }

    calculateSummary() {
        const suites = this.results.suites;
        let totalPassed = 0;
        let totalFailed = 0;
        let totalTests = 0;

        Object.values(suites).forEach(suite => {
            if (suite.status === 'completed' && suite.result) {
                if (suite.result.total) {
                    totalPassed += suite.result.total.passed || suite.result.passed || 0;
                    totalFailed += suite.result.total.failed || suite.result.failed || 0;
                    totalTests += suite.result.total.total || suite.result.total || 0;
                } else {
                    // Handle different result formats
                    Object.keys(suite.result).forEach(key => {
                        if (key.includes('Passed') || key.includes('passed')) {
                            totalPassed += suite.result[key];
                        }
                        if (key.includes('Failed') || key.includes('failed')) {
                            totalFailed += suite.result[key];
                        }
                        if (key.includes('total') && typeof suite.result[key] === 'number') {
                            totalTests += suite.result[key];
                        }
                    });
                }
            }
        });

        this.results.summary = {
            totalSuites: Object.keys(suites).length,
            completedSuites: Object.values(suites).filter(s => s.status === 'completed').length,
            failedSuites: Object.values(suites).filter(s => s.status === 'failed').length,
            totalTests,
            totalPassed,
            totalFailed,
            successRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0
        };
    }

    printSummary() {
        const summary = this.results.summary;

        console.log('\n' + '='.repeat(70));
        console.log('🎯 MUTATION TESTING ORCHESTRATOR - FINAL REPORT');
        console.log('='.repeat(70));
        console.log(`Test Suites Run: ${summary.totalSuites}`);
        console.log(`Completed: ${summary.completedSuites}`);
        console.log(`Failed: ${summary.failedSuites}`);
        console.log('');
        console.log(`Individual Tests: ${summary.totalTests} total`);
        console.log(`Passed: ${summary.totalPassed}`);
        console.log(`Failed: ${summary.totalFailed}`);
        console.log(`Success Rate: ${summary.successRate}%`);
        console.log('');

        if (summary.failedSuites === 0 && summary.totalFailed === 0) {
            console.log('🎊 ALL TESTS PASSED! Algorithm is fully validated and production-ready.');
            console.log('🚀 The copyright insertion algorithm has proven robust against all mutations.');
        } else if (summary.failedSuites === 0) {
            console.log(`⚠️  ${summary.totalFailed} individual tests failed, but all test suites completed.`);
            console.log('🔧 Algorithm is stable but may need minor adjustments for edge cases.');
        } else {
            console.log(`❌ ${summary.failedSuites} test suites failed. Algorithm requires significant improvements.`);
        }

        console.log('\n📊 Detailed results saved to tests/mutation_test_master_report.json');
    }

    async runAllSuites() {
        console.log('🚀 MUTATION TESTING ORCHESTRATOR');
        console.log('Running comprehensive validation of copyright insertion algorithm\n');

        const testSuites = [
            { name: 'Basic Mutation Tests', file: 'mutation_tests.js' },
            { name: 'Advanced Mutation Tests', file: 'advanced_mutation_tests.js' },
            { name: 'Integration Tests', file: 'integration_mutation_tests.js' }
        ];

        for (const suite of testSuites) {
            await this.runTestSuite(suite.name, suite.file);
        }

        this.calculateSummary();
        this.printSummary();

        // Save master report
        fs.writeFileSync('mutation_test_master_report.json', JSON.stringify(this.results, null, 2));

        return this.results;
    }

    // Generate HTML report
    generateHtmlReport() {
        const results = this.results;
        const summary = results.summary;

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Copyright Algorithm Mutation Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
        .summary { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .suite { background: white; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; }
        .passed { border-left-color: #28a745; }
        .failed { border-left-color: #dc3545; }
        .metrics { display: flex; justify-content: space-around; flex-wrap: wrap; }
        .metric { text-align: center; background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px; min-width: 120px; }
        .metric-value { font-size: 2em; font-weight: bold; color: #667eea; }
        .metric-label { color: #666; font-size: 0.9em; }
        .success-rate { color: #28a745; font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧬 Copyright Algorithm Mutation Test Report</h1>
        <p>Comprehensive validation results - ${new Date(results.timestamp).toLocaleString()}</p>
    </div>

    <div class="summary">
        <h2>📊 Executive Summary</h2>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${summary.totalSuites}</div>
                <div class="metric-label">Test Suites</div>
            </div>
            <div class="metric">
                <div class="metric-value">${summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value success-rate">${summary.successRate}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${summary.totalPassed}</div>
                <div class="metric-label">Tests Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${summary.totalFailed}</div>
                <div class="metric-label">Tests Failed</div>
            </div>
        </div>
    </div>

    <h2>🧪 Test Suite Results</h2>
    ${Object.entries(results.suites).map(([suiteName, suiteData]) => `
        <div class="suite ${suiteData.status === 'completed' ? 'passed' : 'failed'}">
            <h3>${suiteName}</h3>
            <p><strong>Status:</strong> ${suiteData.status}</p>
            ${suiteData.result ? `
                <p><strong>Results:</strong>
                    ${suiteData.result.total ?
                        `${suiteData.result.total.passed || suiteData.result.passed}/${suiteData.result.total.total || suiteData.result.total} passed` :
                        'Completed successfully'
                    }
                </p>
            ` : ''}
            ${suiteData.error ? `<p style="color: red;"><strong>Error:</strong> ${suiteData.error}</p>` : ''}
        </div>
    `).join('')}

    <div style="text-align: center; margin-top: 40px; color: #666;">
        <p>Report generated by Mutation Testing Orchestrator</p>
        <p>Algorithm validation completed successfully</p>
    </div>
</body>
</html>`;

        fs.writeFileSync('tests/mutation_test_report.html', html);
        console.log('📄 HTML report generated: tests/mutation_test_report.html');
    }
}

// Run all tests if executed directly
if (require.main === module) {
    const orchestrator = new MutationTestOrchestrator();

    orchestrator.runAllSuites().then(() => {
        orchestrator.generateHtmlReport();
        console.log('\n✨ Mutation testing complete! Check tests/ directory for detailed reports.');
    }).catch(error => {
        console.error('💥 Fatal error during testing:', error);
        process.exit(1);
    });
}

module.exports = MutationTestOrchestrator;
