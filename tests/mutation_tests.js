const fs = require('fs');

// Mutation Testing Suite for Copyright Insertion Algorithm
// Tests various edge cases and potential failure modes

class MutationTester {
    constructor() {
        this.testResults = [];
        this.DEFAULT_TEMPLATE = "/*\n * Copyright (c) 2025 bivex\n */\n\n";
    }

    // Mock VS Code objects
    createMockDocument(content) {
        return {
            getText: () => content,
            positionAt: (offset) => ({ line: 0, character: offset }),
            uri: 'test.js'
        };
    }

    createMockWorkspaceEdit() {
        const operations = [];
        return {
            insert: (uri, position, text) => operations.push({ type: 'insert', uri, position, text }),
            replace: (uri, range, text) => operations.push({ type: 'replace', uri, range, text }),
            getLastOperation: () => operations[operations.length - 1],
            getOperations: () => operations
        };
    }

    // Core algorithm implementation (copy from main code)
    hasCopyrightNotice(text) {
        if (!text || text.length === 0) {
            return false;
        }

        const lines = text.split('\n');
        const firstLines = lines.slice(0, Math.min(10, lines.length));
        const firstBlock = firstLines.join('\n');

        const wellFormedCopyrightRegex = /^\s*\/\*\n\s* \* Copyright \(c\) \d{4}.*\n\s* \*\/\s*\n\n/;
        
        const matchResult = wellFormedCopyrightRegex.test(firstBlock);

        return matchResult;
    }

    hasMalformedCopyright(text) {
        if (!text || text.length === 0) {
            return false;
        }

        const lines = text.split('\n');
        const firstLines = lines.slice(0, Math.min(10, lines.length)); // Check first 10 lines max
        const firstBlock = firstLines.join('\n');

        // A malformed copyright exists if 'Copyright (c)' or 'Copyright' is present
        // in the first block, AND it's not a well-formed copyright notice.
        const containsCopyrightKeyword = firstBlock.includes("Copyright (c)") || firstBlock.includes("Copyright");

        return containsCopyrightKeyword && !this.hasCopyrightNotice(text);
    }

    hasInsertedCopyrightNotice(text) {
        if (!text || text.length === 0) {
            return false;
        }

        const lines = text.split('\n');
        const firstLines = lines.slice(0, Math.min(10, lines.length));
        const firstBlock = firstLines.join('\n');
        
        const wellFormedCopyrightRegex = /\s*\/\*\s*(?:\*\s*)?Copyright \(c\) \d{4}[\s\S]*?\*\/\s*/;
        return wellFormedCopyrightRegex.test(firstBlock);
    }

    // Helper to check if a multi-line comment containing copyright exists at the very beginning.
    hasLeadingCopyrightComment(text) {
        const lines = text.split('\n');
        if (lines.length === 0) return false;

        const firstLineTrimmed = lines[0].trim();
        if (firstLineTrimmed.startsWith('/*')) {
            const firstBlock = lines.slice(0, Math.min(10, lines.length)).join('\n');
            return firstBlock.includes("Copyright (c)") || firstBlock.includes("Copyright");
        }
        return false;
    }

    findInsertionPoint(text) {
        if (text.length === 0) return { insertLine: 0, insertPosition: 0 };

        const lines = text.split('\\n');
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

        const insertPosition = insertLine === 0 ? 0 : text.indexOf(lines[insertLine]);
        return { insertLine, insertPosition };
    }

    simulateCopyrightInsertion(content, template = this.DEFAULT_TEMPLATE) {
        // Step 1: Check for a well-formed copyright. If found, skip.
        const wellFormedCopyrightExists = this.hasCopyrightNotice(content);
        if (wellFormedCopyrightExists) {
            return { action: 'skipped', reason: 'valid_copyright_exists', result: content };
        }

        // Step 2: Check for a malformed copyright. If found, fix it.
        if (this.hasMalformedCopyright(content)) {
            const formattedTemplate = template.replace(/{year}/g, '2025'); // Hardcode year for test
            const lines = content.split('\n');
            let endMalformedIndex = -1;

            let currentOffset = 0;
            for (let i = 0; i < Math.min(10, lines.length); i++) {
                const line = lines[i];
                const lineStartOffset = content.indexOf(line, currentOffset); // Get actual start of the line
                const trimmedLine = line.trim();

                if (line.includes("Copyright (c)") || line.includes("Copyright")) {
                    if (trimmedLine.startsWith("/*")) {
                        const closeIndex = content.indexOf("*/", lineStartOffset);
                        if (closeIndex !== -1) {
                            endMalformedIndex = closeIndex + 2;
                        } else {
                            endMalformedIndex = lineStartOffset + line.length;
                        }
                    } else if (trimmedLine.startsWith("//") || trimmedLine.startsWith("#")) {
                        endMalformedIndex = lineStartOffset + line.length;
                    }
                    // Include subsequent empty lines if any
                    if (endMalformedIndex !== -1) {
                        let nextLineIndex = i + 1;
                        while (nextLineIndex < lines.length && lines[nextLineIndex].trim() === '') {
                            endMalformedIndex = content.indexOf(lines[nextLineIndex]) + lines[nextLineIndex].length;
                            nextLineIndex++;
                        }
                    }
                    break;
                }
                currentOffset = lineStartOffset + line.length + 1; // Update currentOffset for next iteration
            }

            if (endMalformedIndex !== -1) {
                const afterCopyright = content.substring(endMalformedIndex).replace(/^\s*\n/, '');
                const result = formattedTemplate + afterCopyright;
                return { action: 'fixed', reason: 'malformed_copyright', result };
            }
            return { action: 'skipped', reason: 'could_not_fix', result: content };
        }

        // Step 3: No copyright found, insert at appropriate position.
        const formattedTemplate = template.replace(/{year}/g, '2025'); // Hardcode year for test

        if (content.length === 0) {
            return { action: 'inserted', reason: 'at_beginning', result: formattedTemplate };
        }

        const lines = content.split('\n');
        let currentOffset = 0;
        let insertPosition = 0;
        let foundContent = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            const lineLength = line.length;

            if (trimmedLine === '') {
                currentOffset += lineLength + 1;
                continue;
            }

            if (trimmedLine.startsWith('#!')) {
                currentOffset += lineLength + 1;
                continue;
            }

            // Skip single line comments
            if (trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) {
                currentOffset += lineLength + 1;
                continue;
            }

            // Skip multi-line comments that don't contain copyright
            if (trimmedLine.startsWith('/*')) {
                const closingCommentIndex = content.indexOf("*/", currentOffset);
                if (closingCommentIndex !== -1) {
                    currentOffset = closingCommentIndex + 2; // Move past the closing tag
                    // Also move past any immediate empty lines after the comment block
                    let nextLineIndex = i + 1;
                    while (nextLineIndex < lines.length && lines[nextLineIndex].trim() === '') {
                        currentOffset += lines[nextLineIndex].length + 1;
                        nextLineIndex++;
                    }
                    i = nextLineIndex - 1; // Adjust loop counter to skip processed lines
                    continue;
                } else {
                    // Unclosed multiline comment without copyright - treat as content to insert before
                    insertPosition = currentOffset;
                    foundContent = true;
                    break;
                }
            }

            // Found the first line with actual code or content
            insertPosition = currentOffset;
            foundContent = true;
            break;
        }

        let contentToInsert = formattedTemplate;

        if (foundContent) {
            // Ensure proper spacing between the inserted copyright and existing content
            if (!contentToInsert.endsWith('\n')) {
                contentToInsert += '\n';
            }
            // Add an extra newline if there isn't enough separation already
            const existingContentAfterInsertPoint = content.substring(insertPosition);
            if (!existingContentAfterInsertPoint.startsWith('\n\n')) {
                contentToInsert += '\n';
            }
        } else if (content.length > 0) {
            // If inserting into a file with only empty lines/comments, ensure a trailing newline
            contentToInsert += '\n';
        }

        const result = content.substring(0, insertPosition) + contentToInsert + content.substring(insertPosition);
        return { action: 'inserted', reason: (insertPosition > 0) ? 'before_code' : 'at_beginning', result };
    }

    // Test mutations
    runMutationTests() {
        console.log('🧬 Running Mutation Tests for Copyright Insertion Algorithm\\n');

        const mutations = [
            // Basic cases
            {
                name: 'Empty file',
                input: '',
                expectedAction: 'inserted',
                expectedReason: 'at_beginning'
            },
            {
                name: 'Simple code file',
                input: `function test() {\n    console.log("Hello");\n}`,
                expectedAction: 'inserted',
                expectedReason: 'at_beginning'
            },

            // Shebang cases
            {
                name: 'File with shebang',
                input: `#!/usr/bin/env node\nconsole.log("Hello");`,
                expectedAction: 'inserted',
                expectedReason: 'before_code'
            },
            {
                name: 'Shebang with empty line',
                input: `#!/usr/bin/env node\n\nconsole.log("Hello");`,
                expectedAction: 'inserted',
                expectedReason: 'before_code'
            },

            // Comment cases
            {
                name: 'File starting with single comment',
                input: `// This is a comment\nfunction test() {}`,
                expectedAction: 'inserted',
                expectedReason: 'before_code'
            },
            {
                name: 'File with license comment',
                input: `// License: MIT\nfunction test() {}`,
                expectedAction: 'inserted',
                expectedReason: 'before_code'
            },

            // Existing copyright cases
            {
                name: 'File with valid copyright',
                input: `/*\n * Copyright (c) 2025 bivex\n */\n\nfunction test() {}`,
                expectedAction: 'skipped',
                expectedReason: 'valid_copyright_exists'
            },
            {
                name: 'File with malformed copyright (missing */)',
                input: `/* Copyright (c) 2025 bivex\nfunction test() {}`,
                expectedAction: 'fixed',
                expectedReason: 'malformed_copyright'
            },
            {
                name: 'File with empty copyright comment',
                input: '/*',
                expectedAction: 'inserted',
                expectedReason: 'at_beginning'
            },
            {
                name: 'File with copyright syntax error',
                input: `/* Copyright (c 2025 bivex */\nfunction test() {}`,
                expectedAction: 'fixed',
                expectedReason: 'malformed_copyright'
            },
            {
                name: 'File with multiple malformed comments',
                input: `/* Copyright (c) 2025 bivex\n/* Another comment\nfunction test() {}`,
                expectedAction: 'fixed',
                expectedReason: 'malformed_copyright'
            },
            {
                name: 'File with copyright in middle',
                input: `/*\n * Header\n */\n/* Copyright (c) 2025 bivex */\nfunction test() {}`,
                expectedAction: 'fixed',
                expectedReason: 'malformed_copyright'
            },

            // Edge cases
            {
                name: 'Only whitespace',
                input: `   \n\t\n  `,
                expectedAction: 'inserted',
                expectedReason: 'at_beginning'
            },
            {
                name: 'Starts with numbers',
                input: `123\nfunction test() {}`,
                expectedAction: 'inserted',
                expectedReason: 'at_beginning'
            },
            {
                name: 'Multiline comment without copyright',
                input: `/*\n * This is just a comment\n * without copyright\n */\nfunction test() {}`,
                expectedAction: 'inserted',
                expectedReason: 'before_code'
            },

            // Complex cases
            {
                name: 'Mixed comments and code',
                input: `// Comment 1\n/* Comment 2 */\n// Comment 3\nfunction test() {}`,
                expectedAction: 'inserted',
                expectedReason: 'before_code'
            },
            {
                name: 'Very long first line',
                input: '/*' + 'x'.repeat(1000) + '*/\nfunction test() {}',
                expectedAction: 'inserted',
                expectedReason: 'before_code'
            }
        ];

        let passed = 0;
        let failed = 0;

        mutations.forEach((mutation, index) => {
            console.log(`Mutation ${index + 1}: ${mutation.name}`);
            console.log(`Input: "${mutation.input.replace(/\n/g, '\\n')}"`);

            try {
                const result = this.simulateCopyrightInsertion(mutation.input);

                if (result.action === mutation.expectedAction && result.reason === mutation.expectedReason) {
                    console.log(`✅ PASS: ${result.action} (${result.reason})`);
                    passed++;

                    // Additional validation for inserted content
                    if (result.action === 'inserted' || result.action === 'fixed') {
                        const hasCopyrightAfter = this.hasInsertedCopyrightNotice(result.result);
                        if (hasCopyrightAfter) {
                            console.log('   ✓ Copyright correctly added');
                        } else {
                            console.log('   ❌ Copyright not found after insertion');
                            failed++;
                        }
                    }
                } else {
                    console.log(`❌ FAIL: Expected ${mutation.expectedAction} (${mutation.expectedReason}), got ${result.action} (${result.reason})`);
                    failed++;
                }
            } catch (error) {
                console.log(`❌ ERROR: Exception thrown: ${error.message}`);
                failed++;
            }

            console.log('');
        });

        console.log(`📊 Mutation Test Results: ${passed} passed, ${failed} failed`);

        if (failed === 0) {
            console.log('🎉 All mutation tests passed! Algorithm is robust.');
        } else {
            console.log('⚠️  Some mutations exposed weaknesses in the algorithm.');
        }

        return { passed, failed, total: mutations.length };
    }

    // Stress tests
    runStressTests() {
        console.log('\n🏋️  Running Stress Tests...\n');

        let stressPassed = 0;
        let stressFailed = 0;

        // Test with very large files
        const largeContent = '/*\n * Header\n */\n' + 'line ' + 'x'.repeat(100) + '\n'.repeat(1000) + 'function test() {}';
        try {
            const result = this.simulateCopyrightInsertion(largeContent);
            if (result.action === 'inserted') {
                stressPassed++;
                console.log('✅ Large file test passed');
            } else {
                stressFailed++;
                console.log('❌ Large file test failed');
            }
        } catch (error) {
            stressFailed++;
            console.log(`❌ Large file test error: ${error.message}`);
        }

        // Test with Unicode content
        const unicodeContent = '/* 注释 */\nfunction test() {\n    console.log("Hello 🌍");\n}';
        try {
            const result = this.simulateCopyrightInsertion(unicodeContent);
            if (result.action === 'inserted') {
                stressPassed++;
                console.log('✅ Unicode content test passed');
            } else {
                stressFailed++;
                console.log('❌ Unicode content test failed');
            }
        } catch (error) {
            stressFailed++;
            console.log(`❌ Unicode content test error: ${error.message}`);
        }

        console.log(`\n🏋️  Stress Test Results: ${stressPassed} passed, ${stressFailed} failed`);
        return { stressPassed, stressFailed };
    }

    // Boundary tests
    runBoundaryTests() {
        console.log('\n🎯 Running Boundary Tests...\n');

        let boundaryPassed = 0;
        let boundaryFailed = 0;

        // Test boundary conditions
        const boundaryTests = [
            { name: 'Single character', input: 'x', expected: 'inserted' },
            { name: 'Single newline', input: '\n', expected: 'inserted' },
            { name: 'Only newlines', input: '\n\n\n', expected: 'inserted' },
            { name: 'Very long line', input: 'x'.repeat(10000), expected: 'inserted' },
            { name: 'Deep nesting', input: '{\n'.repeat(100) + 'code\n' + '}\n'.repeat(100), expected: 'inserted' }
        ];

        boundaryTests.forEach(test => {
            try {
                const result = this.simulateCopyrightInsertion(test.input);
                if (result.action === test.expected) {
                    boundaryPassed++;
                    console.log(`✅ ${test.name} passed`);
                } else {
                    boundaryFailed++;
                    console.log(`❌ ${test.name} failed: expected ${test.expected}, got ${result.action}`);
                }
            } catch (error) {
                boundaryFailed++;
                console.log(`❌ ${test.name} error: ${error.message}`);
            }
        });

        console.log(`\n🎯 Boundary Test Results: ${boundaryPassed} passed, ${boundaryFailed} failed`);
        return { boundaryPassed, boundaryFailed, totalBoundaryTests: boundaryTests.length };
    }

    // Run all test suites
    runAllTests() {
        const mutationResults = this.runMutationTests();
        const stressResults = this.runStressTests();
        const boundaryResults = this.runBoundaryTests();

        const totalPassed = mutationResults.passed + stressResults.stressPassed + boundaryResults.boundaryPassed;
        const totalFailed = mutationResults.failed + stressResults.stressFailed + boundaryResults.boundaryFailed;
        const totalTests = mutationResults.total + 2 + boundaryResults.totalBoundaryTests; // 2 stress tests

        console.log('\n' + '='.repeat(50));
        console.log('📈 COMPREHENSIVE TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`Mutation Tests: ${mutationResults.passed}/${mutationResults.total} passed`);
        console.log(`Stress Tests: ${stressResults.stressPassed}/2 passed`);
        console.log(`Boundary Tests: ${boundaryResults.boundaryPassed}/${boundaryResults.totalBoundaryTests} passed`);
        console.log(`TOTAL: ${totalPassed}/${totalTests} tests passed`);

        if (totalFailed === 0) {
            console.log('\n🎊 ALL TESTS PASSED! Algorithm is production-ready.');
        } else {
            console.log(`\n⚠️  ${totalFailed} tests failed. Review algorithm for improvements.`);
        }

        // Save results to file
        const summary = {
            timestamp: new Date().toISOString(),
            mutationTests: mutationResults,
            stressTests: stressResults,
            boundaryTests: boundaryResults,
            total: { passed: totalPassed, failed: totalFailed, total: totalTests }
        };

        fs.writeFileSync('tests/mutation_test_results.json', JSON.stringify(summary, null, 2));
        console.log('📝 Detailed results saved to tests/mutation_test_results.json');

        return summary;
    }
}

// Run all tests if this file is executed directly
if (require.main === module) {
    const tester = new MutationTester();
    tester.runAllTests();
}

module.exports = MutationTester;