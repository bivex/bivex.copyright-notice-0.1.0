const fs = require('fs');
const path = require('path');

// Test for background mode functionality
console.log('🧪 Testing Background Mode Copyright Extension...\n');

// Mock VS Code classes for testing
class MockWorkspaceEdit {
    constructor() {
        this.operations = [];
    }

    insert(uri, position, content) {
        this.operations.push({ type: 'insert', uri, position, content });
    }

    replace(uri, range, content) {
        this.operations.push({ type: 'replace', uri, range, content });
    }

    applyEdit() {
        return Promise.resolve(true);
    }
}

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

class MockDocument {
    constructor(content, fileName = 'test.js') {
        this.content = content;
        this.fileName = fileName;
        this.languageId = 'javascript';
        this.uri = { fsPath: fileName };
        this.version = 1;
        this.isDirty = false;
    }

    getText() {
        return this.content;
    }

    positionAt(offset) {
        const lines = this.content.substring(0, offset).split('\n');
        return new MockPosition(lines.length - 1, lines[lines.length - 1].length);
    }
}

class MockEditor {
    constructor(document) {
        this.document = document;
    }
}

// Import the compiled extension code
const CopyrightHandler = require('../out/CopyrightHandler.js').CopyrightHandler;

async function runBackgroundModeTest() {
    console.log('📋 Test 1: Basic file without copyright');
    const testFile1 = `function hello() {
    console.log("Hello World");
    return true;
}`;

    const document1 = new MockDocument(testFile1, 'test1.js');
    const editor1 = new MockEditor(document1);
    const handler = new CopyrightHandler();

    // Override applyEdit for testing
    const originalApplyEdit = vscode.workspace.applyEdit;
    vscode.workspace.applyEdit = (edit) => {
        console.log('   📝 Edit operations:', edit.operations.length);
        edit.operations.forEach((op, i) => {
            console.log(`     ${i + 1}. ${op.type}: ${op.content ? op.content.substring(0, 50) + '...' : 'replace'}`);
        });
        return Promise.resolve(true);
    };

    try {
        const result = await handler.addCopyrightIfNeeded(editor1);
        console.log('   ✅ Result:', result);
        console.log('   📊 Action:', result.action);
        console.log('   📝 Details:', result.details);
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }

    console.log('\n📋 Test 2: File with existing copyright');
    const testFile2 = `/* Copyright (c) 2024 bivex */

function hello() {
    console.log("Hello World");
    return true;
}`;

    const document2 = new MockDocument(testFile2, 'test2.js');
    const editor2 = new MockEditor(document2);

    try {
        const result = await handler.addCopyrightIfNeeded(editor2);
        console.log('   ✅ Result:', result);
        console.log('   📊 Action:', result.action);
        console.log('   📝 Details:', result.details);
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }

    console.log('\n📋 Test 3: Silent mode behavior');
    // Test with silent mode enabled (default)
    console.log('   🔇 Silent mode: ON (default)');

    console.log('\n📋 Test 4: Cache functionality');
    // Test caching
    console.log('   💾 Testing cache...');
    const cachedState = handler.getCachedFileState(document1);
    console.log('   📦 Cache state:', cachedState ? 'EXISTS' : 'EMPTY');

    console.log('\n📋 Test 5: Malformed copyright detection');
    const testFile3 = `// Copyright 2024
// Some old license

function test() {
    return "malformed";
}`;

    const document3 = new MockDocument(testFile3, 'test3.js');
    const editor3 = new MockEditor(document3);

    try {
        const result = await handler.addCopyrightIfNeeded(editor3);
        console.log('   ✅ Result:', result);
        console.log('   📊 Action:', result.action);
        console.log('   📝 Details:', result.details);
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }

    // Restore original applyEdit
    vscode.workspace.applyEdit = originalApplyEdit;

    console.log('\n🎉 Background mode tests completed!');
}

// Mock VS Code API for testing
global.vscode = {
    workspace: {
        getConfiguration(section) {
            // Return mock configuration with silent mode enabled
            if (section === 'copyright-notice') {
                return {
                    get: (key, defaultValue) => {
                        const defaults = {
                            languages: ['*'],
                            fileExtensions: ['*'],
                            excludedFiles: [],
                            template: '/* Copyright (c) {year} */\n\n',
                            includeTimestamp: false,
                            timestampFormat: 'YYYY-MM-DD HH:mm:ss',
                            includeUpdateTime: false,
                            updateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
                            autoRemoveEmojis: false,
                            silentMode: true,
                            backgroundUpdateDelay: 1500
                        };
                        return defaults[key] !== undefined ? defaults[key] : defaultValue;
                    }
                };
            }
            return { get: () => defaultValue };
        },
        applyEdit: () => Promise.resolve(true),
        onDidChangeTextDocument: () => ({ dispose: () => {} }),
        onDidChangeActiveTextEditor: () => ({ dispose: () => {} }),
        onDidSaveTextDocument: () => ({ dispose: () => {} })
    },
    window: {
        activeTextEditor: null,
        onDidChangeActiveTextEditor: () => ({ dispose: () => {} })
    },
    commands: {
        registerCommand: () => ({ dispose: () => {} })
    }
};

// Run the test
runBackgroundModeTest().catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
