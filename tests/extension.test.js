const assert = require('assert');
const vscode = require('vscode');
const path = require('path');

// Import the extension classes
const { CopyrightHandler } = require('../out/CopyrightHandler');

suite('Copyright Notice Extension Tests', () => {
    let handler;
    let testWorkspaceFolder;

    suiteSetup(async function() {
        // Set up test environment
        this.timeout(10000);

        // Get the workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            testWorkspaceFolder = workspaceFolders[0];
        }

        // Create handler instance
        handler = new CopyrightHandler();
    });

    suiteTeardown(async function() {
        // Clean up
        handler = null;
    });

    test('CopyrightHandler should be instantiated', () => {
        assert(handler instanceof CopyrightHandler, 'Handler should be instance of CopyrightHandler');
    });

    test('getConfig should return configuration object', () => {
        const config = handler.getConfig();
        assert(config, 'Config should be returned');
        assert(typeof config === 'object', 'Config should be an object');
        assert('languages' in config, 'Config should have languages property');
        assert('template' in config, 'Config should have template property');
    });

    test('hasCopyrightNotice should detect copyright', () => {
        const textWithCopyright = '/*\n * Copyright (c) 2025 Test\n */\n\nfunction test() {}';
        const textWithoutCopyright = 'function test() {}';

        assert(handler.hasCopyrightNotice(textWithCopyright), 'Should detect copyright in text with copyright');
        assert(!handler.hasCopyrightNotice(textWithoutCopyright), 'Should not detect copyright in text without copyright');
    });

    test('hasMalformedCopyright should detect malformed copyright', () => {
        const textWithMalformed = 'Copyright (c)\nfunction test() {}';
        const textWithoutMalformed = 'function test() {}';

        assert(handler.hasMalformedCopyright(textWithMalformed), 'Should detect malformed copyright');
        assert(!handler.hasMalformedCopyright(textWithoutMalformed), 'Should not detect malformed copyright in normal text');
    });

    test('formatTimestamp should format dates correctly', () => {
        const date = new Date('2025-01-15T10:30:45');
        const formatted = handler.formatTimestamp(date, 'YYYY-MM-DDTHH:mm:ss', false);

        assert.equal(formatted, '2025-01-15T10:30:45', 'Should format timestamp correctly');
    });

    test('matchesPattern should work with wildcards', () => {
        // Test patterns used for file exclusions
        assert(handler.matchesPattern('node_modules/package.json', 'node_modules/**'), 'Should match node_modules/** pattern');
        assert(handler.matchesPattern('test.min.js', '*.min.js'), 'Should match *.min.js pattern');
        assert(!handler.matchesPattern('test.js', '*.min.js'), 'Should not match *.min.js pattern for regular .js files');
    });

    test('isEnabled should check file eligibility', () => {
        // Mock document objects for testing
        const jsDoc = { languageId: 'javascript', fileName: 'test.js' };
        const pyDoc = { languageId: 'python', fileName: 'test.py' };
        const excludedDoc = { languageId: 'javascript', fileName: 'node_modules/test.js' };

        assert(handler.isEnabled(jsDoc), 'Should enable JavaScript files');
        assert(handler.isEnabled(pyDoc), 'Should enable Python files');

        // Note: Exclusion logic might need proper config mocking for full testing
    });

    test('findOptimalInsertPosition should find correct positions', () => {
        const emptyText = '';
        const normalText = 'function test() {\n    return true;\n}';
        const shebangText = '#!/usr/bin/env node\nconsole.log("test");';

        const emptyPos = handler.findOptimalInsertPosition(emptyText, 'javascript');
        const normalPos = handler.findOptimalInsertPosition(normalText, 'javascript');
        const shebangPos = handler.findOptimalInsertPosition(shebangText, 'javascript');

        assert.equal(emptyPos.insertPosition, 0, 'Empty file should insert at position 0');
        assert.equal(normalPos.insertPosition, 0, 'Normal file should insert at position 0');
        assert(shebangPos.hasShebang, 'Should detect shebang in shebang text');
    });

    test('formatCopyrightTemplate should replace placeholders', () => {
        const config = {
            template: '/* Copyright (c) {year} Company */\n\n',
            includeTimestamp: false,
            includeUpdateTime: false,
            useUtc: false
        };

        const result = handler.formatCopyrightTemplate(config, 'javascript');
        assert(result.includes('2025'), 'Should replace {year} with current year');
        assert(result.includes('Copyright (c)'), 'Should include copyright text');
    });

    test('analyzeCopyrightState should analyze text correctly', () => {
        const textWithCopyright = '/*\n * Copyright (c) 2025 Test\n */\n\nfunction test() {}';
        const textWithoutCopyright = 'function test() {}';
        const textWithMalformed = 'Copyright (c)\nfunction test() {}';

        const analysisWith = handler.analyzeCopyrightState(textWithCopyright);
        const analysisWithout = handler.analyzeCopyrightState(textWithoutCopyright);
        const analysisMalformed = handler.analyzeCopyrightState(textWithMalformed);

        assert.equal(analysisWith.type, 'well_formed', 'Should identify well-formed copyright');
        assert.equal(analysisWithout.type, 'missing', 'Should identify missing copyright');
        assert.equal(analysisMalformed.type, 'malformed', 'Should identify malformed copyright');
    });
});