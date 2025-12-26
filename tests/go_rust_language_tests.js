const path = require('path');
const fs = require('fs');

/**
 * Go and Rust Language-Specific Tests
 * Tests copyright insertion for Go and Rust programming languages
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

    getLastOperation() {
        return this.operations[this.operations.length - 1];
    }
}

class MockDocument {
    constructor(content, languageId = 'javascript', uri = 'test.js') {
        this.content = content;
        this.languageId = languageId;
        this.uri = uri;
        this.lines = content.split('\n');
    }

    getText() {
        return this.content;
    }

    positionAt(offset) {
        let line = 0;
        let character = 0;
        let currentOffset = 0;

        while (line < this.lines.length && currentOffset + this.lines[line].length + 1 <= offset) {
            currentOffset += this.lines[line].length + 1; // +1 for newline
            line++;
        }

        if (line < this.lines.length) {
            character = offset - currentOffset;
        }

        return new MockPosition(line, character);
    }

    getWordRangeAtPosition(position) {
        return new MockRange(position, position);
    }

    lineAt(line) {
        return {
            lineNumber: line,
            text: this.lines[line] || '',
            range: new MockRange(
                new MockPosition(line, 0),
                new MockPosition(line, (this.lines[line] || '').length)
            ),
            rangeIncludingLineBreak: new MockRange(
                new MockPosition(line, 0),
                new MockPosition(line + 1, 0)
            )
        };
    }

    validateRange(range) {
        return range;
    }
}

class MockEditor {
    constructor(document) {
        this.document = document;
    }
}

// ============================================================================
// Mock VS Code API - MUST BE DONE BEFORE REQUIRING CopyrightHandler
// ============================================================================

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
                            'allowedFolders': [],
                            'template': '/* Copyright (c) {year} */\n\n',
                            'includeTimestamp': false,
                            'timestampFormat': 'YYYY-MM-DDTHH:mm:ss',
                            'includeUpdateTime': false,
                            'updateTimeFormat': 'YYYY-MM-DDTHH:mm:ss',
                            'useUtc': false,
                            'autoRemoveEmojis': false,
                            'silentMode': true,
                            'backgroundUpdateDelay': 1500,
                            'smartDebouncing': true,
                            'smartDebounceMultiplier': 2.0,
                            'smartDebounceThreshold': 300000
                        };
                        return config[key] !== undefined ? config[key] : defaultValue;
                    }
                }),
                applyEdit: (edit) => Promise.resolve(true),
                workspaceFolders: undefined // No workspace for these tests
            },
            window: {
                onDidChangeActiveTextEditor: () => ({ dispose: () => {} }),
                visibleTextEditors: [],
                activeTextEditor: undefined
            },
            commands: {
                registerCommand: () => ({ dispose: () => {} })
            }
        };
    }
    return originalRequire.apply(this, arguments);
};

// ============================================================================
// Import CopyrightHandler after mocks are set up
// ============================================================================

const { CopyrightHandler } = require('../out/CopyrightHandler');

console.log('🧪 Go and Rust Language-Specific Tests\n');

// Create handler instance
const handler = new CopyrightHandler();

// Test cases for Go and Rust
const languageTestCases = [
    {
        name: 'Go - Basic function without copyright',
        languageId: 'go',
        input: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
        expectedContains: '/* Copyright (c)',
        shouldInsert: true,
        description: 'Should insert copyright at the beginning of Go file'
    },
    {
        name: 'Go - File with existing copyright',
        languageId: 'go',
        input: `/*
 * Copyright (c) 2024 Bivex
 */

package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
        expectedContains: null,
        shouldInsert: false,
        description: 'Should not insert if copyright already exists in Go file'
    },
    {
        name: 'Rust - Basic function without copyright',
        languageId: 'rust',
        input: `fn main() {
    println!("Hello, World!");
}`,
        expectedContains: '/* Copyright (c)',
        shouldInsert: true,
        description: 'Should insert copyright at the beginning of Rust file'
    },
    {
        name: 'Rust - File with existing copyright',
        languageId: 'rust',
        input: `/*
 * Copyright (c) 2024 Bivex
 */

fn main() {
    println!("Hello, World!");
}`,
        expectedContains: null,
        shouldInsert: false,
        description: 'Should not insert if copyright already exists in Rust file'
    },
    {
        name: 'Go - File with shebang (rare but possible)',
        languageId: 'go',
        input: `#!/usr/bin/env gorun

package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
        expectedContains: '/* Copyright (c)',
        shouldInsert: true,
        description: 'Should handle shebang in Go file'
    },
    {
        name: 'Rust - Complex module structure',
        languageId: 'rust',
        input: `mod utils {
    pub fn helper() -> String {
        "helper".to_string()
    }
}

fn main() {
    println!("Hello, {}", utils::helper());
}`,
        expectedContains: '/* Copyright (c)',
        shouldInsert: true,
        description: 'Should insert copyright before complex Rust code'
    },
    {
        name: 'Go - With struct and methods',
        languageId: 'go',
        input: `package main

import "fmt"

type Person struct {
    name string
    age  int
}

func (p Person) greet() string {
    return fmt.Sprintf("Hello, my name is %s", p.name)
}

func main() {
    person := Person{name: "Alice", age: 30}
    fmt.Println(person.greet())
}`,
        expectedContains: '/* Copyright (c)',
        shouldInsert: true,
        description: 'Should insert copyright before Go struct and methods'
    },
    {
        name: 'Rust - With struct and impl',
        languageId: 'rust',
        input: `struct Person {
    name: String,
    age: u32,
}

impl Person {
    fn new(name: String, age: u32) -> Person {
        Person { name, age }
    }

    fn greet(&self) -> String {
        format!("Hello, my name is {}", self.name)
    }
}

fn main() {
    let person = Person::new("Alice".to_string(), 30);
    println!("{}", person.greet());
}`,
        expectedContains: '/* Copyright (c)',
        shouldInsert: true,
        description: 'Should insert copyright before Rust struct and impl'
    }
];

// Helper function to simulate insertion
function simulateInsertion(input, languageId, handler) {
    const document = new MockDocument(input, languageId);
    const editor = new MockEditor(document);

    // Get the insertion position
    const text = document.getText();
    const insertInfo = handler.findOptimalInsertPosition(text, languageId);

    // Format the copyright template
    const config = handler.getConfig();
    const copyrightText = handler.formatCopyrightTemplate(config, languageId);

    let resultText;
    if (text.length === 0) {
        resultText = copyrightText;
    } else {
        if (insertInfo.hasShebang) {
            // Insert after shebang
            const beforeShebang = text.substring(0, insertInfo.shebangEndPosition);
            const afterShebang = text.substring(insertInfo.shebangEndPosition);
            resultText = beforeShebang + copyrightText + (copyrightText.endsWith('\n') ? '' : '\n') + afterShebang;
        } else {
            // Insert at the beginning
            resultText = copyrightText + (copyrightText.endsWith('\n') ? '' : '\n') + text;
        }
    }

    return resultText;
}

// Run tests
let passed = 0;
let failed = 0;
const failures = [];

languageTestCases.forEach((testCase, index) => {
    const testNumber = index + 1;
    console.log(`Test ${testNumber}/${languageTestCases.length}: ${testCase.name}`);
    console.log(`Language: ${testCase.languageId}`);
    console.log(`Description: ${testCase.description}`);

    try {
        const document = new MockDocument(testCase.input, testCase.languageId);
        const editor = new MockEditor(document);

        // Check if copyright exists
        const hasCopyright = handler.hasCopyrightNotice(testCase.input);

        if (hasCopyright && !testCase.shouldInsert) {
            console.log('✅ PASS: Correctly detected existing copyright');
            passed++;
        } else if (!hasCopyright && testCase.shouldInsert) {
            // Simulate insertion
            const resultText = simulateInsertion(testCase.input, testCase.languageId, handler);

            // Check if copyright was inserted
            const hasCopyrightAfter = handler.hasCopyrightNotice(resultText);

            if (hasCopyrightAfter && (!testCase.expectedContains || resultText.includes(testCase.expectedContains))) {
                console.log('✅ PASS: Copyright inserted correctly');
                console.log(`   Result preview: ${resultText.substring(0, 100).replace(/\n/g, '\\n')}...`);
                passed++;
            } else {
                console.log(`❌ FAIL: Copyright not inserted properly`);
                console.log(`   Has copyright after: ${hasCopyrightAfter}`);
                console.log(`   Expected contains: ${testCase.expectedContains}`);
                console.log(`   Result preview: ${resultText.substring(0, 200).replace(/\n/g, '\\n')}...`);
                failures.push({
                    test: testCase.name,
                    reason: 'Insertion failed',
                    hasCopyrightAfter,
                    expectedContains: testCase.expectedContains
                });
                failed++;
            }
        } else {
            console.log(`❌ FAIL: Unexpected behavior`);
            console.log(`   Has copyright: ${hasCopyright}`);
            console.log(`   Should insert: ${testCase.shouldInsert}`);
            failures.push({
                test: testCase.name,
                reason: `Unexpected behavior: hasCopyright=${hasCopyright}, shouldInsert=${testCase.shouldInsert}`
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

// Report results
console.log('='.repeat(60));
console.log('📊 GO & RUST LANGUAGE TEST RESULTS');
console.log('='.repeat(60));
console.log(`Tests run: ${languageTestCases.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success rate: ${((passed / languageTestCases.length) * 100).toFixed(1)}%`);

if (failures.length > 0) {
    console.log('\n❌ Failed Tests:');
    failures.forEach((failure, index) => {
        console.log(`${index + 1}. ${failure.test}: ${failure.reason}`);
    });
} else {
    console.log('\n🎉 All Go and Rust language tests passed!');
}

console.log('\n📝 Test completed!');

// Save results to file
const results = {
    timestamp: new Date().toISOString(),
    language: 'go_rust',
    summary: {
        totalTests: languageTestCases.length,
        passed,
        failed,
        successRate: ((passed / languageTestCases.length) * 100).toFixed(1)
    },
    failures
};

fs.writeFileSync('go_rust_test_results.json', JSON.stringify(results, null, 2));
console.log('📄 Results saved to go_rust_test_results.json');

// Return success status
process.exit(failed === 0 ? 0 : 1);
