const fs = require('fs');
const path = require('path');

// Mock VS Code objects for testing
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
        this.operations.push({ type: 'insert', uri, position, text });
    }

    replace(uri, range, text) {
        this.operations.push({ type: 'replace', uri, range, text });
    }

    getLastOperation() {
        return this.operations[this.operations.length - 1];
    }
}

class MockDocument {
    constructor(content, uri = 'test.js') {
        this.content = content;
        this.uri = uri;
        this.lines = content.split('\n');
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
}

// Test implementation of the copyright insertion algorithm
class CopyrightHandler {
    constructor() {
        this.DEFAULT_TEMPLATE = "/*\n * Copyright (c) 2025 bivex\n */\n\n";
    }

    getConfig() {
        return {
            template: this.DEFAULT_TEMPLATE,
            includeTimestamp: false,
            includeUpdateTime: false
        };
    }

    hasCopyrightNotice(text) {
        if (!text || text.length === 0) {
            return false;
        }

        // Get first few lines to check for copyright
        const lines = text.split('\n');
        const firstLines = lines.slice(0, Math.min(10, lines.length));
        const firstBlock = firstLines.join('\n');

        // Check for copyright notice patterns in the beginning of file
        return firstBlock.includes("Copyright (c)") ||
               (firstBlock.startsWith("/*") && firstBlock.includes("Copyright")) ||
               (firstBlock.startsWith("/**") && firstBlock.includes("Copyright")) ||
               (firstBlock.startsWith("//") && firstBlock.includes("Copyright")) ||
               (firstBlock.startsWith("#") && firstBlock.includes("Copyright"));
    }

    addCopyrightIfNeeded(document) {
        const text = document.getText();

        // If copyright already exists, try to update timestamp if enabled
        if (this.hasCopyrightNotice(text)) {
            return { added: false, reason: 'Copyright already exists' };
        }

        const config = this.getConfig();
        const currentYear = new Date().getFullYear();
        let formattedTemplate = config.template.replace(/{year}/g, currentYear.toString());

        const edit = new MockWorkspaceEdit();

        // If file is empty, just insert copyright
        if (text.length === 0) {
            edit.insert(document.uri, new MockPosition(0, 0), formattedTemplate);
        } else {
            // Find the first non-empty line to insert copyright before it
            const lines = text.split('\n');
            let insertPosition = 0;
            let insertLine = 0;

            // Find first non-empty, non-comment line (skip shebang and license comments)
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                // Skip empty lines, shebang, and license comments that don't contain actual code
                if (line === '' ||
                    line.startsWith('#!') ||
                    (line.startsWith('/*') && !line.includes('*/') && i < lines.length - 1) ||
                    (line.startsWith('//') && (line.includes('License') || line.includes('Copyright') || line.includes('license') || line.includes('copyright')))) {
                    continue;
                }
                // Found the insertion point
                insertLine = i;
                insertPosition = text.indexOf(lines[i]);
                break;
            }

            // If we found a good insertion point, insert before it
            if (insertLine > 0 || (insertLine === 0 && lines[0].trim() !== '')) {
                // Ensure proper spacing before existing content
                let contentToInsert = formattedTemplate;
                const lineBefore = insertLine > 0 ? lines[insertLine - 1] : '';
                const currentLine = lines[insertLine] || '';

                // Add newline if needed between copyright and existing content
                if (!contentToInsert.endsWith('\n')) {
                    contentToInsert += '\n';
                }

                // If inserting in the middle, ensure we have proper separation
                if (insertLine > 0 && !lineBefore.endsWith('\n') && lineBefore.trim() !== '') {
                    contentToInsert = '\n' + contentToInsert;
                }

                edit.insert(document.uri, document.positionAt(insertPosition), contentToInsert);
            } else {
                // Fallback: insert at the very beginning
                let contentToInsert = formattedTemplate;
                if (!contentToInsert.endsWith('\n') && text.length > 0) {
                    contentToInsert += '\n';
                }
                edit.insert(document.uri, new MockPosition(0, 0), contentToInsert);
            }
        }

        return { added: true, edit, document };
    }
}

// Test cases
const testCases = [
    {
        name: 'Empty file',
        input: '',
        expected: '/*\n * Copyright (c) 2025 bivex\n */\n\n',
        shouldAdd: true
    },
    {
        name: 'File without copyright',
        input: 'function test() {\n    console.log("Hello");\n}',
        expected: '/*\n * Copyright (c) 2025 bivex\n */\n\nfunction test() {\n    console.log("Hello");\n}',
        shouldAdd: true
    },
    {
        name: 'File with existing copyright',
        input: '/*\n * Copyright (c) 2025 bivex\n */\n\nfunction test() {\n    console.log("Hello");\n}',
        expected: null, // Should not add
        shouldAdd: false
    }
];

function runTests() {
    const handler = new CopyrightHandler();
    let passed = 0;
    let failed = 0;

    console.log('🧪 Running copyright insertion algorithm tests...\n');

    testCases.forEach((testCase, index) => {
        console.log(`Test ${index + 1}: ${testCase.name}`);

        try {
            const document = new MockDocument(testCase.input);
            const result = handler.addCopyrightIfNeeded(document);

            if (result.added !== testCase.shouldAdd) {
                console.log(`❌ FAIL: Expected ${testCase.shouldAdd ? 'to add' : 'not to add'} copyright, but ${result.added ? 'added' : 'did not add'}`);
                failed++;
                return;
            }

            if (!testCase.shouldAdd) {
                console.log('✅ PASS: Correctly skipped adding copyright');
                passed++;
                return;
            }

            // Check the result
            const operation = result.edit.getLastOperation();
            let resultText = testCase.input;

            if (operation.type === 'insert') {
                const insertPos = operation.position.line * 1000 + operation.position.character;
                const insertIndex = Math.min(insertPos, resultText.length);
                resultText = resultText.slice(0, insertIndex) + operation.text + resultText.slice(insertIndex);
            } else if (operation.type === 'replace') {
                resultText = operation.text;
            }

            if (resultText === testCase.expected) {
                console.log('✅ PASS: Copyright inserted correctly');
                passed++;
            } else {
                console.log('❌ FAIL: Unexpected result');
                console.log('Expected:');
                console.log(testCase.expected);
                console.log('Got:');
                console.log(resultText);
                failed++;
            }
        } catch (error) {
            console.log(`❌ FAIL: Exception thrown: ${error.message}`);
            failed++;
        }

        console.log('');
    });

    console.log(`📊 Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log('🎉 All tests passed!');
    } else {
        console.log('⚠️  Some tests failed. Please review the algorithm.');
    }
}

// Run the tests
if (require.main === module) {
    runTests();
}

module.exports = { CopyrightHandler, MockDocument, MockWorkspaceEdit };
