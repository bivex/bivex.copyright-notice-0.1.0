const fs = require('fs');
const MutationTester = require('./mutation_tests');

// Advanced Mutation Testing with Edge Cases
// Tests that specifically target potential algorithm weaknesses

class AdvancedMutationTester extends MutationTester {
    constructor() {
        super();
        this.advancedResults = [];
    }

    // Test false positives in copyright detection
    testCopyrightDetectionEdgeCases() {
        console.log('🔍 Testing Copyright Detection Edge Cases...\n');

        const detectionTests = [
            // False positives that should NOT be detected as copyright
            {
                name: 'Comment with word "Copyright" but not actual copyright',
                input: '// This code is copyrighted by someone else\nfunction test() {}',
                shouldDetect: false
            },
            {
                name: 'String containing copyright text',
                input: 'const msg = "Copyright (c) 2025";\nfunction test() {}',
                shouldDetect: false
            },
            {
                name: 'Variable name with copyright',
                input: 'const copyright = "MIT";\nfunction test() {}',
                shouldDetect: false
            },
            {
                name: 'License comment without copyright',
                input: '/*\n * License: BSD-3-Clause\n */\nfunction test() {}',
                shouldDetect: false
            },

            // True positives that SHOULD be detected
            {
                name: 'Standard copyright block',
                input: '/*\n * Copyright (c) 2025 Company\n */\nfunction test() {}',
                shouldDetect: true
            },
            {
                name: 'Copyright in single line comment',
                input: '// Copyright (c) 2025 Author\nfunction test() {}',
                shouldDetect: true
            },
            {
                name: 'Copyright in first line',
                input: '/* Copyright (c) 2025 */\nfunction test() {}',
                shouldDetect: true
            },
            {
                name: 'Copyright with year variable',
                input: '/* Copyright (c) 2025 bivex */\nfunction test() {}',
                shouldDetect: true
            }
        ];

        let detectionPassed = 0;
        let detectionFailed = 0;

        detectionTests.forEach((test, index) => {
            const detected = this.hasCopyrightNotice(test.input);
            const correct = detected === test.shouldDetect;

            if (correct) {
                detectionPassed++;
                console.log(`✅ Detection ${index + 1} PASS: ${test.name}`);
            } else {
                detectionFailed++;
                console.log(`❌ Detection ${index + 1} FAIL: ${test.name}`);
                console.log(`   Expected: ${test.shouldDetect ? 'DETECT' : 'NOT DETECT'}`);
                console.log(`   Got: ${detected ? 'DETECTED' : 'NOT DETECTED'}`);
            }
        });

        console.log(`\n🔍 Detection Test Results: ${detectionPassed} passed, ${detectionFailed} failed`);
        return { detectionPassed, detectionFailed };
    }

    // Test insertion point calculation edge cases
    testInsertionPointEdgeCases() {
        console.log('\n📍 Testing Insertion Point Calculation...\n');

        const insertionTests = [
            {
                name: 'Empty file',
                input: '',
                expectedInsertLine: 0
            },
            {
                name: 'File starting with code',
                input: 'function test() {}',
                expectedInsertLine: 0
            },
            {
                name: 'File with shebang',
                input: '#!/usr/bin/env node\nfunction test() {}',
                expectedInsertLine: 1 // Should insert after shebang
            },
            {
                name: 'File with empty lines',
                input: '\n\n\nfunction test() {}',
                expectedInsertLine: 0 // Should insert at beginning
            },
            {
                name: 'File with license comment',
                input: '// License: MIT\nfunction test() {}',
                expectedInsertLine: 1 // Should skip license comment
            },
            {
                name: 'File with copyright comment',
                input: '// Copyright (c) 2025\nfunction test() {}',
                expectedInsertLine: 1 // Should skip copyright comment
            },
            {
                name: 'Complex file structure',
                input: '#!/usr/bin/env node\n// License: MIT\n/* Header */\n\nfunction test() {}',
                expectedInsertLine: 3 // Should skip shebang and comments
            }
        ];

        let insertionPassed = 0;
        let insertionFailed = 0;

        insertionTests.forEach((test, index) => {
            const { insertLine } = this.findInsertionPoint(test.input);
            const correct = insertLine === test.expectedInsertLine;

            if (correct) {
                insertionPassed++;
                console.log(`✅ Insertion ${index + 1} PASS: ${test.name} (line ${insertLine})`);
            } else {
                insertionFailed++;
                console.log(`❌ Insertion ${index + 1} FAIL: ${test.name}`);
                console.log(`   Expected line: ${test.expectedInsertLine}`);
                console.log(`   Got line: ${insertLine}`);
            }
        });

        console.log(`\n📍 Insertion Test Results: ${insertionPassed} passed, ${insertionFailed} failed`);
        return { insertionPassed, insertionFailed };
    }

    // Test malformed copyright repair
    testMalformedCopyrightRepair() {
        console.log('\n🔧 Testing Malformed Copyright Repair...\n');

        const repairTests = [
            {
                name: 'Missing closing comment',
                input: '/* Copyright (c) 2025 bivex\nfunction test() {}',
                shouldRepair: true
            },
            {
                name: 'Missing opening comment',
                input: 'Copyright (c) 2025 bivex */\nfunction test() {}',
                shouldRepair: false // Can't repair this
            },
            {
                name: 'Incomplete copyright',
                input: '/* Copyright (c)\nfunction test() {}',
                shouldRepair: true
            },
            {
                name: 'Copyright with extra text',
                input: '/* Copyright (c) 2025 bivex - All rights reserved\nfunction test() {}',
                shouldRepair: true
            },
            {
                name: 'Copyright spanning multiple lines',
                input: '/* Copyright (c) 2025 bivex\n * Additional info\nfunction test() {}',
                shouldRepair: true
            },
            {
                name: 'Empty copyright comment',
                input: '/*\nfunction test() {}',
                shouldRepair: false // No copyright text to detect
            },
            {
                name: 'Copyright with syntax error',
                input: '/* Copyright (c 2025 bivex */\nfunction test() {}',
                shouldRepair: true
            },
            {
                name: 'Copyright in middle of file',
                input: '/* Header */\n/* Copyright (c) 2025 bivex\nfunction test() {}',
                shouldRepair: true
            },
            {
                name: 'Multiple malformed comments',
                input: '/* Copyright (c) 2025 bivex\n/* Another comment\nfunction test() {}',
                shouldRepair: true
            },
            {
                name: 'Copyright with extra whitespace',
                input: '/*   Copyright (c) 2025 bivex   \nfunction test() {}',
                shouldRepair: true
            }
        ];

        let repairPassed = 0;
        let repairFailed = 0;

        repairTests.forEach((test, index) => {
            const result = this.simulateCopyrightInsertion(test.input);
            const repaired = result.action === 'fixed' && this.hasCopyrightNotice(result.result);

            if (repaired === test.shouldRepair) {
                repairPassed++;
                console.log(`✅ Repair ${index + 1} PASS: ${test.name}`);
            } else {
                repairFailed++;
                console.log(`❌ Repair ${index + 1} FAIL: ${test.name}`);
                console.log(`   Expected repair: ${test.shouldRepair}`);
                console.log(`   Got action: ${result.action}`);
            }
        });

        console.log(`\n🔧 Repair Test Results: ${repairPassed} passed, ${repairFailed} failed`);
        return { repairPassed, repairFailed };
    }

    // Test race conditions and concurrent modifications
    testConcurrencyEdgeCases() {
        console.log('\n🔄 Testing Concurrency Edge Cases...\n');

        // Test what happens when file changes during processing
        const baseContent = 'function test() {\n    console.log("Hello");\n}';

        // Simulate file that gets modified during processing
        const modifiedContent = '/* Existing copyright */\n' + baseContent;

        let concurrencyPassed = 0;
        let concurrencyFailed = 0;

        // Test 1: Content changes from no copyright to having copyright
        try {
            const result1 = this.simulateCopyrightInsertion(baseContent);
            const result2 = this.simulateCopyrightInsertion(modifiedContent);

            if (result1.action === 'inserted' && result2.action === 'skipped') {
                concurrencyPassed++;
                console.log('✅ Concurrency test 1 PASS: Handles content changes correctly');
            } else {
                concurrencyFailed++;
                console.log('❌ Concurrency test 1 FAIL: Incorrect handling of content changes');
            }
        } catch (error) {
            concurrencyFailed++;
            console.log(`❌ Concurrency test 1 ERROR: ${error.message}`);
        }

        console.log(`\n🔄 Concurrency Test Results: ${concurrencyPassed} passed, ${concurrencyFailed} failed`);
        return { concurrencyPassed, concurrencyFailed };
    }

    // Test with different template formats
    testTemplateVariations() {
        console.log('\n📝 Testing Template Variations...\n');

        const templates = [
            "/* Copyright (c) 2025 bivex */\n\n",
            "/*\n * Copyright (c) 2025 bivex\n */\n\n",
            "// Copyright (c) 2025 bivex\n\n",
            "# Copyright (c) 2025 bivex\n\n"
        ];

        const testContent = 'function test() {\n    console.log("Hello");\n}';

        let templatePassed = 0;
        let templateFailed = 0;

        templates.forEach((template, index) => {
            try {
                const result = this.simulateCopyrightInsertion(testContent, template);
                const hasCopyright = this.hasCopyrightNotice(result.result);

                if (result.action === 'inserted' && hasCopyright) {
                    templatePassed++;
                    console.log(`✅ Template ${index + 1} PASS: ${template.split('\n')[0]}...`);
                } else {
                    templateFailed++;
                    console.log(`❌ Template ${index + 1} FAIL: ${template.split('\n')[0]}...`);
                }
            } catch (error) {
                templateFailed++;
                console.log(`❌ Template ${index + 1} ERROR: ${error.message}`);
            }
        });

        console.log(`\n📝 Template Test Results: ${templatePassed} passed, ${templateFailed} failed`);
        return { templatePassed, templateFailed };
    }

    // Run comprehensive advanced tests
    runAdvancedTests() {
        console.log('🧬🧬 ADVANCED MUTATION TESTING SUITE 🧬🧬\n');
        console.log('Testing algorithm robustness with edge cases and mutations\n');

        const detection = this.testCopyrightDetectionEdgeCases();
        const insertion = this.testInsertionPointEdgeCases();
        const repair = this.testMalformedCopyrightRepair();
        const concurrency = this.testConcurrencyEdgeCases();
        const templates = this.testTemplateVariations();

        // Run basic mutation tests
        const basic = this.runMutationTests();

        // Calculate totals
        const totalPassed = detection.detectionPassed + insertion.insertionPassed +
                           repair.repairPassed + concurrency.concurrencyPassed +
                           templates.templatePassed + basic.passed;

        const totalFailed = detection.detectionFailed + insertion.insertionFailed +
                           repair.repairFailed + concurrency.concurrencyFailed +
                           templates.templateFailed + basic.failed;

        const totalTests = detection.detectionPassed + detection.detectionFailed +
                          insertion.insertionPassed + insertion.insertionFailed +
                          repair.repairPassed + repair.repairFailed +
                          concurrency.concurrencyPassed + concurrency.concurrencyFailed +
                          templates.templatePassed + templates.templateFailed +
                          basic.passed + basic.failed;

        console.log('\n' + '='.repeat(60));
        console.log('🎯 ADVANCED MUTATION TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`Copyright Detection: ${detection.detectionPassed}/${detection.detectionPassed + detection.detectionFailed} passed`);
        console.log(`Insertion Points: ${insertion.insertionPassed}/${insertion.insertionPassed + insertion.insertionFailed} passed`);
        console.log(`Copyright Repair: ${repair.repairPassed}/${repair.repairPassed + repair.repairFailed} passed`);
        console.log(`Concurrency: ${concurrency.concurrencyPassed}/${concurrency.concurrencyPassed + concurrency.concurrencyFailed} passed`);
        console.log(`Templates: ${templates.templatePassed}/${templates.templatePassed + templates.templateFailed} passed`);
        console.log(`Basic Mutations: ${basic.passed}/${basic.total} passed`);
        console.log(`TOTAL: ${totalPassed}/${totalTests} tests passed`);

        if (totalFailed === 0) {
            console.log('\n🎊 ALL ADVANCED TESTS PASSED! Algorithm is bulletproof.');
        } else {
            console.log(`\n⚠️  ${totalFailed} advanced tests failed. Algorithm needs hardening.`);
        }

        // Save comprehensive results
        const advancedSummary = {
            timestamp: new Date().toISOString(),
            detection,
            insertion,
            repair,
            concurrency,
            templates,
            basic,
            total: { passed: totalPassed, failed: totalFailed, total: totalTests }
        };

        fs.writeFileSync('tests/advanced_mutation_results.json', JSON.stringify(advancedSummary, null, 2));
        console.log('📝 Advanced results saved to tests/advanced_mutation_results.json');

        return advancedSummary;
    }
}

// Run advanced tests if this file is executed directly
if (require.main === module) {
    const advancedTester = new AdvancedMutationTester();
    advancedTester.runAdvancedTests();
}

module.exports = AdvancedMutationTester;
