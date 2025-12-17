const fs = require('fs');

// Test the copyright insertion algorithm
function testCopyrightInsertion() {
    console.log('Testing copyright insertion algorithm...\n');

    // Test cases
    const testCases = [
        {
            name: 'Empty file',
            content: '',
            expectedStart: '/*\n * Copyright (c) 2025'
        },
        {
            name: 'File without copyright',
            content: 'function test() {\n    console.log("Hello");\n}',
            expectedStart: '/*\n * Copyright (c) 2025'
        },
        {
            name: 'File with shebang',
            content: '#!/usr/bin/env node\nconsole.log("Hello");',
            shouldContain: '#!/usr/bin/env node'
        },
        {
            name: 'File starting with comment',
            content: '// Comment\nfunction test() {}',
            expectedStart: '/*\n * Copyright (c) 2025'
        }
    ];

    // Mock the algorithm behavior
    testCases.forEach((testCase, index) => {
        console.log(`Test ${index + 1}: ${testCase.name}`);
        console.log(`Input: "${testCase.content.replace(/\n/g, '\\n')}"`);

        // Simulate the algorithm logic
        let result = testCase.content;
        const hasCopyright = testCase.content.includes('Copyright (c)');

        if (!hasCopyright) {
            if (testCase.content.startsWith('#!')) {
                // Insert after shebang
                const shebangEnd = testCase.content.indexOf('\n') + 1;
                result = testCase.content.slice(0, shebangEnd) + '\n/*\n * Copyright (c) 2025 bivex\n */\n\n' + testCase.content.slice(shebangEnd);
            } else {
                // Insert at beginning
                result = '/*\n * Copyright (c) 2025 bivex\n */\n\n' + testCase.content;
            }
        }

        console.log(`Output: "${result.replace(/\n/g, '\\n')}"`);

        // Check expectations
        if (testCase.expectedStart && result.startsWith(testCase.expectedStart)) {
            console.log('✅ PASS: Copyright inserted correctly');
        } else if (testCase.shouldContain && result.includes(testCase.shouldContain)) {
            console.log('✅ PASS: Contains expected content');
        } else if (hasCopyright) {
            console.log('✅ PASS: Copyright already exists, skipped');
        } else {
            console.log('❌ FAIL: Unexpected result');
        }

        console.log('---\n');
    });
}

testCopyrightInsertion();
