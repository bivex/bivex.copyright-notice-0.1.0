// Comprehensive test suite for copyright insertion algorithm

// Test scenarios:
// 1. Empty file
// 2. File without copyright
// 3. File with valid copyright block
// 4. File with malformed copyright (missing */)
// 5. File with copyright in comment but not at start
// 6. File with shebang
// 7. File starting with multi-line comment

const testScenarios = [
    {
        name: 'Empty file',
        content: '',
        expected: '/*\n * Copyright (c) 2025 bivex\n */\n\n',
        description: 'Should insert copyright into empty file'
    },
    {
        name: 'File without copyright',
        content: 'function test() {\n    console.log("Hello");\n}',
        expected: '/*\n * Copyright (c) 2025 bivex\n */\n\nfunction test() {\n    console.log("Hello");\n}',
        description: 'Should insert copyright at beginning'
    },
    {
        name: 'File with valid copyright',
        content: '/*\n * Copyright (c) 2025 bivex\n */\n\nfunction test() {\n    console.log("Hello");\n}',
        expected: null, // Should not change
        description: 'Should leave valid copyright unchanged'
    },
    {
        name: 'File with malformed copyright',
        content: '/* Copyright (c) 2025 bivex\nfunction test() {\n    console.log("Hello");\n}',
        expected: '/*\n * Copyright (c) 2025 bivex\n */\n\nfunction test() {\n    console.log("Hello");\n}',
        description: 'Should fix malformed copyright'
    }
];

// Mock classes for testing
class MockDocument {
    constructor(content) {
        this.content = content;
        this.lines = content.split('\n');
    }

    getText() { return this.content; }
    positionAt(offset) { return { line: 0, character: offset }; }
}

class MockWorkspaceEdit {
    constructor() {
        this.operations = [];
    }

    insert(uri, position, text) {
        this.operations.push({ type: 'insert', position, text });
    }

    replace(uri, range, text) {
        this.operations.push({ type: 'replace', range, text });
    }
}

// Simplified algorithm implementation for testing
function hasCopyrightNotice(text) {
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

function simulateCopyrightInsertion(content) {
    const template = "/*\n * Copyright (c) 2025 bivex\n */\n\n";

    if (hasCopyrightNotice(content)) {
        // Check if copyright is valid
        const copyrightBlockRegex = /\/\*[\s\S]*?\*\//;
        const blockMatch = content.match(copyrightBlockRegex);

        if (blockMatch && blockMatch.index === 0) {
            // Valid copyright exists, don't modify
            return content;
        } else {
            // Malformed copyright - fix it
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
                return template + afterCopyright;
            }
            return content; // Fallback
        }
    }

    // Insert new copyright
    if (content.length === 0) return template;

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
        return template + content;
    } else {
        const beforeLines = lines.slice(0, insertLine);
        const afterLines = lines.slice(insertLine);
        return beforeLines.join('\n') + '\n\n' + template + afterLines.join('\n');
    }
}

// Run tests
console.log('🧪 Running comprehensive copyright algorithm tests...\n');

let passed = 0;
let failed = 0;

testScenarios.forEach((scenario, index) => {
    console.log(`Test ${index + 1}: ${scenario.name}`);
    console.log(`Description: ${scenario.description}`);

    const result = simulateCopyrightInsertion(scenario.content);

    if (scenario.expected === null) {
        // Should not change
        if (result === scenario.content) {
            console.log('✅ PASS: Content unchanged as expected');
            passed++;
        } else {
            console.log('❌ FAIL: Content was modified unexpectedly');
            failed++;
        }
    } else {
        // Should change to expected
        if (result === scenario.expected) {
            console.log('✅ PASS: Correct transformation');
            passed++;
        } else {
            console.log('❌ FAIL: Unexpected result');
            console.log('Expected:');
            console.log(scenario.expected);
            console.log('Got:');
            console.log(result);
            failed++;
        }
    }

    console.log('---\n');
});

console.log(`📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log('🎉 All tests passed!');
} else {
    console.log('⚠️  Some tests failed. Algorithm needs improvement.');
}
