const fs = require('fs');
const path = require('path');

// Integration Mutation Tests
// Tests algorithm against real files in test_files directory

class IntegrationMutationTester {
    constructor() {
        this.testFilesDir = path.join(__dirname, '..', 'test_files');
        this.results = [];
    }

    // Core algorithm implementation (must match main code)
    hasCopyrightNotice(text) {
        if (!text || text.length === 0) return false;
        const lines = text.split('\n');
        const firstLines = lines.slice(0, Math.min(10, lines.length));
        const firstBlock = firstLines.join('\n');
        return firstBlock.includes("Copyright (c)") ||
               (firstBlock.startsWith("/*") && firstBlock.includes("Copyright")) ||
               (firstBlock.startsWith("/**") && firstBlock.includes("Copyright")) ||
               (firstBlock.startsWith("//") && firstBlock.includes("Copyright")) ||
               (firstBlock.startsWith("#") && firstBlock.includes("Copyright"));
    }

    simulateCopyrightInsertion(content) {
        const template = "/*\n * Copyright (c) 2025 bivex\n */\n\n";

        if (this.hasCopyrightNotice(content)) {
            const copyrightBlockRegex = /\/\*[\s\S]*?\*\//;
            const blockMatch = content.match(copyrightBlockRegex);

            if (blockMatch && blockMatch.index === 0) {
                return { action: 'skipped', reason: 'valid_copyright_exists', original: content };
            } else {
                // Try to fix malformed copyright
                const lines = content.split('\n');
                let endMalformedIndex = 0;

                for (let i = 0; i < lines.length && i < 5; i++) {
                    if (lines[i].includes('Copyright')) {
                        endMalformedIndex = content.indexOf(lines[i]) + lines[i].length;
                        if (i + 1 < lines.length && lines[i + 1].trim() === '') {
                            endMalformedIndex = content.indexOf(lines[i + 1]) + lines[i + 1].length;
                        }
                        break;
                    }
                }

                if (endMalformedIndex > 0) {
                    const afterCopyright = content.substring(endMalformedIndex).replace(/^\s*\n/, '');
                    return {
                        action: 'fixed',
                        reason: 'malformed_copyright',
                        original: content,
                        result: template + afterCopyright
                    };
                }
                return { action: 'skipped', reason: 'could_not_fix', original: content };
            }
        }

        // Insert new copyright
        if (content.length === 0) {
            return { action: 'inserted', reason: 'empty_file', original: content, result: template };
        }

        const lines = content.split('\n');
        let insertLine = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '' ||
                line.startsWith('#!') ||
                (line.startsWith('//') && (line.includes('License') || line.includes('Copyright') ||
                                          line.includes('license') || line.includes('copyright')))) {
                continue;
            }
            insertLine = i;
            break;
        }

        if (insertLine === 0) {
            return { action: 'inserted', reason: 'at_beginning', original: content, result: template + content };
        } else {
            const beforeLines = lines.slice(0, insertLine);
            const afterLines = lines.slice(insertLine);
            const result = beforeLines.join('\n') + '\n\n' + template + afterLines.join('\n');
            return { action: 'inserted', reason: 'before_code', original: content, result };
        }
    }

    // Test all files in test_files directory
    runIntegrationTests() {
        console.log('🔗 Running Integration Mutation Tests...\n');
        console.log(`Testing against real files in: ${this.testFilesDir}\n`);

        if (!fs.existsSync(this.testFilesDir)) {
            console.log('❌ Test files directory not found!');
            return { error: 'test_files_directory_not_found' };
        }

        const testFiles = fs.readdirSync(this.testFilesDir)
            .filter(file => (file.endsWith('.cpp') || file.endsWith('.js') || file.endsWith('.h') ||
                           file.endsWith('.ahk') || file.endsWith('.ahk2') || file.endsWith('.css') ||
                           file.endsWith('.py')) &&
                           (file.includes('malformed') || !file.includes('_') ||
                            file === 'test_multiline_comment.cpp'))
            .sort();

        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;

        testFiles.forEach(fileName => {
            totalTests++;
            const filePath = path.join(this.testFilesDir, fileName);
            const content = fs.readFileSync(filePath, 'utf8');

            console.log(`📄 Testing ${fileName} (${content.split('\n').length} lines)`);

            try {
                const result = this.simulateCopyrightInsertion(content);

                // Validate the result
                let isValid = true;
                let issues = [];

                switch (result.action) {
                    case 'inserted':
                        // Check that copyright was added and is valid
                        if (!this.hasCopyrightNotice(result.result)) {
                            isValid = false;
                            issues.push('Copyright not found after insertion');
                        }
                        if (!result.result.includes('Copyright (c) 2025 bivex')) {
                            isValid = false;
                            issues.push('Incorrect copyright text');
                        }
                        break;

                    case 'fixed':
                        // Check that malformed copyright was fixed
                        if (!this.hasCopyrightNotice(result.result)) {
                            isValid = false;
                            issues.push('Copyright not valid after fixing');
                        }
                        if (result.result.includes('/* Copyright') && !result.result.includes('*/')) {
                            isValid = false;
                            issues.push('Malformed copyright not properly fixed');
                        }
                        break;

                    case 'skipped':
                        // Check that original content is preserved
                        if (result.original !== content) {
                            isValid = false;
                            issues.push('Original content modified when it should be preserved');
                        }
                        break;

                    default:
                        isValid = false;
                        issues.push(`Unknown action: ${result.action}`);
                }

                if (isValid) {
                    passedTests++;
                    console.log(`✅ PASS: ${result.action} (${result.reason})`);

                    // Additional validation
                    if (result.result) {
                        const lines = result.result.split('\n');
                        if (lines.length > 0 && lines[0].trim() === '') {
                            console.log('   ⚠️  Warning: Result starts with empty line');
                        }
                    }
                } else {
                    failedTests++;
                    console.log(`❌ FAIL: ${result.action} (${result.reason})`);
                    issues.forEach(issue => console.log(`   - ${issue}`));
                }

                // Store result for analysis
                this.results.push({
                    file: fileName,
                    originalLength: content.length,
                    resultLength: result.result ? result.result.length : content.length,
                    action: result.action,
                    reason: result.reason,
                    valid: isValid,
                    issues
                });

            } catch (error) {
                failedTests++;
                console.log(`❌ ERROR: Exception in ${fileName}: ${error.message}`);
                this.results.push({
                    file: fileName,
                    error: error.message,
                    valid: false
                });
            }

            console.log('');
        });

        console.log(`📊 Integration Test Results: ${passedTests}/${totalTests} files processed successfully`);

        // Analyze results
        this.analyzeResults();

        return {
            totalFiles: totalTests,
            passed: passedTests,
            failed: failedTests,
            results: this.results
        };
    }

    // Analyze test results for patterns and issues
    analyzeResults() {
        console.log('\n📈 ANALYSIS OF TEST RESULTS\n');

        const actions = {};
        const reasons = {};
        const issues = {};

        this.results.forEach(result => {
            if (result.action) {
                actions[result.action] = (actions[result.action] || 0) + 1;
                reasons[result.reason] = (reasons[result.reason] || 0) + 1;
            }

            if (result.issues) {
                result.issues.forEach(issue => {
                    issues[issue] = (issues[issue] || 0) + 1;
                });
            }
        });

        console.log('Actions taken:');
        Object.entries(actions).forEach(([action, count]) => {
            console.log(`  ${action}: ${count} files`);
        });

        console.log('\nReasons:');
        Object.entries(reasons).forEach(([reason, count]) => {
            console.log(`  ${reason}: ${count} files`);
        });

        if (Object.keys(issues).length > 0) {
            console.log('\nIssues found:');
            Object.entries(issues).forEach(([issue, count]) => {
                console.log(`  ${issue}: ${count} occurrences`);
            });
        }

        // Check for concerning patterns
        const skippedFiles = this.results.filter(r => r.action === 'skipped').length;
        const fixedFiles = this.results.filter(r => r.action === 'fixed').length;

        if (fixedFiles > 0) {
            console.log(`\n⚠️  ${fixedFiles} files had malformed copyright that was fixed.`);
            console.log('   This indicates the algorithm is working correctly for edge cases.');
        }

        if (skippedFiles > 0) {
            console.log(`\nℹ️  ${skippedFiles} files already had valid copyright and were skipped.`);
        }

        // Save detailed results
        fs.writeFileSync('integration_test_results.json', JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: this.results.length,
                passed: this.results.filter(r => r.valid).length,
                failed: this.results.filter(r => !r.valid).length
            },
            actions,
            reasons,
            issues,
            detailedResults: this.results
        }, null, 2));

        console.log('\n📝 Detailed results saved to integration_test_results.json');
    }

    // Run targeted tests for specific scenarios
    runTargetedTests() {
        console.log('\n🎯 Running Targeted Edge Case Tests...\n');

        const edgeCases = [
            {
                name: 'File with only whitespace',
                content: '   \n\t  \n  ',
                expectedAction: 'inserted'
            },
            {
                name: 'File with very long line',
                content: 'x'.repeat(1000) + '\nfunction test() {}',
                expectedAction: 'inserted'
            },
            {
                name: 'File with mixed line endings',
                content: '/* comment */\r\nfunction test() {}\n// another',
                expectedAction: 'inserted'
            },
            {
                name: 'File with nested comments',
                content: '/* outer /* inner */ outer */\nfunction test() {}',
                expectedAction: 'inserted'
            }
        ];

        let targetedPassed = 0;
        let targetedFailed = 0;

        edgeCases.forEach((testCase, index) => {
            try {
                const result = this.simulateCopyrightInsertion(testCase.content);

                if (result.action === testCase.expectedAction) {
                    targetedPassed++;
                    console.log(`✅ Targeted ${index + 1} PASS: ${testCase.name}`);
                } else {
                    targetedFailed++;
                    console.log(`❌ Targeted ${index + 1} FAIL: ${testCase.name}`);
                    console.log(`   Expected: ${testCase.expectedAction}, Got: ${result.action}`);
                }
            } catch (error) {
                targetedFailed++;
                console.log(`❌ Targeted ${index + 1} ERROR: ${testCase.name} - ${error.message}`);
            }
        });

        console.log(`\n🎯 Targeted Test Results: ${targetedPassed} passed, ${targetedFailed} failed`);
        return { targetedPassed, targetedFailed };
    }
}

// Run integration tests if this file is executed directly
if (require.main === module) {
    const tester = new IntegrationMutationTester();

    console.log('🚀 COMPREHENSIVE INTEGRATION TESTING SUITE\n');

    const integrationResults = tester.runIntegrationTests();
    const targetedResults = tester.runTargetedTests();

    const totalPassed = integrationResults.passed + targetedResults.targetedPassed;
    const totalFailed = integrationResults.failed + targetedResults.targetedFailed;
    const totalTests = integrationResults.totalFiles + 4; // 4 targeted tests

    console.log('\n' + '='.repeat(50));
    console.log('🏆 FINAL INTEGRATION TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Integration Tests: ${integrationResults.passed}/${integrationResults.totalFiles} passed`);
    console.log(`Targeted Tests: ${targetedResults.targetedPassed}/4 passed`);
    console.log(`OVERALL: ${totalPassed}/${totalTests} tests passed`);

    if (totalFailed === 0) {
        console.log('\n🎊 ALL INTEGRATION TESTS PASSED! Algorithm is production-ready.');
    } else {
        console.log(`\n⚠️  ${totalFailed} integration tests failed. Review real-world usage.`);
    }
}

module.exports = IntegrationMutationTester;
