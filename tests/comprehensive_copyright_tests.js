const path = require('path');

/**
 * Comprehensive Test Suite for CopyrightHandler
 * Tests the refactored insertion algorithm with real-world scenarios
 */

// ============================================================================
// Mock VS Code API - MUST BE DONE BEFORE REQUIRING CopyrightHandler
// ============================================================================

class MockPosition {
    constructor(line, character) {
        this.line = line;
        this.character = character;
    }
}

class MockRange {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}

class MockWorkspaceEdit {
    constructor() {
        this.operations = [];
    }

    insert(uri, position, text) {
        this.operations.push({
            type: 'insert',
            uri,
            position: { line: position.line, character: position.character },
            text
        });
    }

    replace(uri, range, text) {
        this.operations.push({
            type: 'replace',
            uri,
            range: {
                start: { line: range.start.line, character: range.start.character },
                end: { line: range.end.line, character: range.end.character }
            },
            text
        });
    }

    getOperations() {
        return this.operations;
    }

    getLastOperation() {
        return this.operations[this.operations.length - 1];
    }
}

class MockDocument {
    constructor(content, languageId = 'javascript', fileName = 'test.js') {
        this.content = content;
        this.languageId = languageId;
        this.fileName = fileName;
        this.uri = { fsPath: fileName };
    }

    getText() {
        return this.content;
    }

    positionAt(offset) {
        let line = 0;
        let character = 0;

        for (let i = 0; i < offset && i < this.content.length; i++) {
            if (this.content[i] === '\n') {
                line++;
                character = 0;
            } else {
                character++;
            }
        }

        return new MockPosition(line, character);
    }

    offsetAt(position) {
        const lines = this.content.split('\n');
        let offset = 0;

        for (let i = 0; i < position.line && i < lines.length; i++) {
            offset += lines[i].length + 1; // +1 for newline
        }

        offset += Math.min(position.character, lines[position.line]?.length || 0);
        return offset;
    }

    save() {
        return Promise.resolve(true);
    }
}

class MockEditor {
    constructor(document) {
        this.document = document;
    }
}

// Create mock vscode module and inject it BEFORE requiring CopyrightHandler
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
    if (id === 'vscode') {
        return {
            Position: MockPosition,
            Range: MockRange,
            WorkspaceEdit: MockWorkspaceEdit,
            workspace: {
                getConfiguration: (section) => ({
                    get: (key, defaultValue) => {
                        const config = {
                            'languages': ['*'],
                            'fileExtensions': ['*'],
                            'excludedFiles': [],
                            'template': '/* Copyright (c) {year} */\n\n',
                            'includeTimestamp': false,
                            'timestampFormat': 'YYYY-MM-DD HH:mm:ss',
                            'includeUpdateTime': false,
                            'updateTimeFormat': 'YYYY-MM-DD HH:mm:ss',
                            'autoRemoveEmojis': false
                        };
                        return config[key] !== undefined ? config[key] : defaultValue;
                    }
                }),
                applyEdit: (edit) => Promise.resolve(true)
            },
            window: {}
        };
    }
    return originalRequire.apply(this, arguments);
};

// NOW we can safely require CopyrightHandler
const { CopyrightHandler } = require('../out/CopyrightHandler.js');

// ============================================================================
// Test Utilities
// ============================================================================

function simulateInsertion(text, handler) {
    const config = handler.getConfig();
    const currentYear = new Date().getFullYear();
    let formattedTemplate = config.template.replace(/{year}/g, currentYear.toString());

    const lines = text.split('\n');
    let insertPosition = 0;
    let foundContent = false;
    let lineIndex = 0;

    const getOffsetForLine = (lineIdx) => {
        let offset = 0;
        for (let j = 0; j < lineIdx && j < lines.length; j++) {
            offset += lines[j].length + 1;
        }
        return offset;
    };

    let leadingEmptyLines = 0;
    let hasShebang = false;

    if (text.length === 0) {
        return formattedTemplate;
    }

    while (lineIndex < lines.length) {
        const line = lines[lineIndex];
        const trimmedLine = line.trim();

        // Track leading empty lines
        if (trimmedLine === '') {
            leadingEmptyLines++;
            lineIndex++;
            continue;
        }

        // Check for shebang - copyright should go AFTER shebang with blank line
        if (trimmedLine.startsWith('#!')) {
            hasShebang = true;
            leadingEmptyLines = 0; // Reset - empty lines after shebang are not "leading"
            lineIndex++;
            continue;
        }

        // Found first non-empty, non-shebang line
        insertPosition = getOffsetForLine(lineIndex);
        foundContent = true;
        break;
    }

    // If file has only whitespace/empty lines, insert at beginning
    if (!foundContent) {
        insertPosition = 0;
        foundContent = true;
    }

    let contentToInsert = formattedTemplate;
    if (!contentToInsert.endsWith('\n')) {
        contentToInsert += '\n';
    }

    // Handle different cases
    if (hasShebang) {
        // After shebang: add blank line before copyright if not already present
        const remainingText = text.substring(insertPosition);
        const templateEndsWithDoubleNewline = contentToInsert.endsWith('\n\n');

        if (!templateEndsWithDoubleNewline) {
            contentToInsert = '\n' + contentToInsert;
        }

        // Add spacing after copyright
        if (!remainingText.startsWith('\n')) {
            contentToInsert += '\n';
        }

        return text.slice(0, insertPosition) + contentToInsert + text.slice(insertPosition);
    } else if (leadingEmptyLines > 0 || insertPosition === 0) {
        // File has leading empty lines or only whitespace - replace from start
        const remainingText = text.substring(insertPosition);
        const templateEndsWithDoubleNewline = contentToInsert.endsWith('\n\n');

        if (!templateEndsWithDoubleNewline && remainingText && !remainingText.startsWith('\n')) {
            contentToInsert += '\n';
        }

        // Replace from position 0 to remove leading empty lines
        return contentToInsert + text.slice(insertPosition);
    } else {
        // Normal case - insert at current position
        const remainingText = text.substring(insertPosition);
        const templateEndsWithDoubleNewline = contentToInsert.endsWith('\n\n');
        const remainingStartsWithNewline = remainingText.startsWith('\n');

        if (!templateEndsWithDoubleNewline && !remainingStartsWithNewline) {
            contentToInsert += '\n';
        }

        return text.slice(0, insertPosition) + contentToInsert + text.slice(insertPosition);
    }
}

// ============================================================================
// Test Cases
// ============================================================================

const testCases = [
    {
        name: 'Empty file',
        input: '',
        expectedPattern: /^\/\* Copyright \(c\) \d{4} \*\/\n\n$/,
        shouldInsert: true,
        description: 'Should insert copyright at the beginning of empty file'
    },
    {
        name: 'Simple code without copyright',
        input: 'function test() {\n    return 42;\n}',
        expectedPattern: /^\/\* Copyright \(c\) \d{4} \*\/\n\nfunction test\(\)/,
        shouldInsert: true,
        description: 'Should insert copyright before code'
    },
    {
        name: 'File with existing well-formed copyright',
        input: '/* Copyright (c) 2024 */\n\nfunction test() {}',
        expectedPattern: null,
        shouldInsert: false,
        description: 'Should not insert if copyright already exists'
    },
    {
        name: 'File with shebang',
        input: '#!/usr/bin/env node\n\nfunction test() {}',
        expectedPattern: /^#!\/usr\/bin\/env node\n\n\/\* Copyright \(c\) \d{4} \*\/\n\nfunction test/,
        shouldInsert: true,
        description: 'Should insert copyright after shebang'
    },
    {
        name: 'File with single-line comments',
        input: '// This is a comment\n// Another comment\nfunction test() {}',
        expectedPattern: /^\/\* Copyright \(c\) \d{4} \*\/\n\n\/\/ This is a comment/,
        shouldInsert: true,
        description: 'Should insert copyright before single-line comments'
    },
    {
        name: 'File with multi-line comment',
        input: '/*\n * This is a description\n * of the file\n */\n\nfunction test() {}',
        expectedPattern: /^\/\* Copyright \(c\) \d{4} \*\/\n\n\/\*\n \* This is a description/,
        shouldInsert: true,
        description: 'Should insert copyright before multi-line comment'
    },
    {
        name: 'File with leading empty lines',
        input: '\n\n\nfunction test() {}',
        expectedPattern: /^\/\* Copyright \(c\) \d{4} \*\/\n\nfunction test/,
        shouldInsert: true,
        description: 'Should skip leading empty lines'
    },
    {
        name: 'File with only whitespace',
        input: '\n\n\n   \n\n',
        expectedPattern: /^\/\* Copyright \(c\) \d{4} \*\/\n$/,
        shouldInsert: true,
        description: 'Should insert at end if file has only whitespace'
    },
    {
        name: 'File with unclosed multi-line comment',
        input: '/* This comment is not closed\nfunction test() {}',
        expectedPattern: /^\/\* Copyright \(c\) \d{4} \*\/\n\n\/\* This comment is not closed/,
        shouldInsert: true,
        description: 'Should insert before unclosed comment'
    },
    {
        name: 'TypeScript file with imports',
        input: 'import { Component } from "@angular/core";\n\nexport class MyComponent {}',
        expectedPattern: /^\/\* Copyright \(c\) \d{4} \*\/\n\nimport { Component }/,
        shouldInsert: true,
        description: 'Should insert before imports in TypeScript'
    }
];

// ============================================================================
// Test Runner
// ============================================================================

function runTests() {
    console.log('🧪 Running Comprehensive CopyrightHandler Tests\n');
    console.log('='.repeat(80));
    console.log('\n');

    const handler = new CopyrightHandler();
    let passed = 0;
    let failed = 0;
    const failures = [];

    testCases.forEach((testCase, index) => {
        const testNumber = index + 1;
        console.log(`Test ${testNumber}/${testCases.length}: ${testCase.name}`);
        console.log(`Description: ${testCase.description}`);

        try {
            const document = new MockDocument(testCase.input);
            const editor = new MockEditor(document);

            // Check if copyright exists
            const hasCopyright = handler.hasCopyrightNotice(testCase.input);

            if (hasCopyright && !testCase.shouldInsert) {
                console.log('✅ PASS: Correctly detected existing copyright');
                passed++;
            } else if (!hasCopyright && testCase.shouldInsert) {
                // Simulate insertion
                const resultText = simulateInsertion(testCase.input, handler);

                // Check against pattern
                if (testCase.expectedPattern && !testCase.expectedPattern.test(resultText)) {
                    console.log(`❌ FAIL: Result doesn't match expected pattern`);
                    console.log(`Expected pattern: ${testCase.expectedPattern}`);
                    console.log(`Got:\n${resultText.substring(0, 200)}...`);
                    failures.push({
                        test: testCase.name,
                        reason: 'Pattern mismatch',
                        expected: testCase.expectedPattern.toString(),
                        got: resultText.substring(0, 200)
                    });
                    failed++;
                } else {
                    console.log('✅ PASS: Copyright inserted correctly');
                    passed++;
                }
            } else {
                console.log(`❌ FAIL: Unexpected insertion behavior`);
                failures.push({
                    test: testCase.name,
                    reason: `Expected ${testCase.shouldInsert ? 'insertion' : 'no insertion'}, got ${!hasCopyright ? 'insertion' : 'no insertion'}`
                });
                failed++;
            }
        } catch (error) {
            console.log(`❌ FAIL: Exception thrown: ${error.message}`);
            console.log(`Stack: ${error.stack}`);
            failures.push({
                test: testCase.name,
                reason: `Exception: ${error.message}`,
                stack: error.stack
            });
            failed++;
        }

        console.log('');
    });

    // Summary
    console.log('='.repeat(80));
    console.log('\n📊 Test Results Summary\n');
    console.log(`Total Tests: ${testCases.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(2)}%`);

    if (failed > 0) {
        console.log('\n⚠️  Failed Tests:\n');
        failures.forEach((failure, index) => {
            console.log(`${index + 1}. ${failure.test}`);
            console.log(`   Reason: ${failure.reason}`);
            if (failure.expected) {
                console.log(`   Expected: ${failure.expected}`);
            }
            if (failure.got) {
                console.log(`   Got: ${failure.got}`);
            }
            console.log('');
        });
    } else {
        console.log('\n🎉 All tests passed!\n');
    }

    return failed === 0;
}

// ============================================================================
// Main
// ============================================================================

if (require.main === module) {
    const success = runTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runTests, testCases };
