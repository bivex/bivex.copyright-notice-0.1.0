const assert = require('assert');
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

// Import the extension classes
const { CopyrightHandler } = require('../out/CopyrightHandler');

suite('Copyright Notice Integration Tests', () => {
    let handler;
    let testWorkspaceFolder;
    let testDocument;
    let testEditor;

    suiteSetup(async function() {
        this.timeout(15000);

        // Set up test environment
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            testWorkspaceFolder = workspaceFolders[0];

            // Create handler instance
            handler = new CopyrightHandler();

            // Create a test file
            const testFilePath = path.join(testWorkspaceFolder.uri.fsPath, 'test_integration.js');
            const testContent = 'function testFunction() {\n    console.log("Hello World");\n    return true;\n}\n';

            // Write test file
            fs.writeFileSync(testFilePath, testContent);

            // Open the document
            testDocument = await vscode.workspace.openTextDocument(testFilePath);
            testEditor = await vscode.window.showTextDocument(testDocument);
        } else {
            // Skip integration tests if no workspace
            console.log('Skipping integration tests - no workspace available');
            this.skip();
        }
    });

    suiteTeardown(async function() {
        // Clean up
        if (testEditor) {
            await testEditor.document.save();
        }

        handler = null;

        // Close test document
        if (testDocument) {
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }
    });

    test('Integration: addCopyrightIfNeeded should work with real VS Code editor', async function() {
        this.timeout(10000);

        // Test with a file that doesn't have copyright
        const result = await handler.addCopyrightIfNeeded(testEditor);

        assert(result, 'Should return a result');
        assert(typeof result === 'object', 'Result should be an object');
        assert('success' in result, 'Result should have success property');
        assert('action' in result, 'Result should have action property');

        console.log('Integration test result:', result);
    });

    test('Integration: analyzeDocumentState should work with real document', () => {
        const analysis = handler.analyzeDocumentState(testEditor);

        assert(analysis, 'Should return analysis');
        assert(typeof analysis === 'object', 'Analysis should be an object');
        assert('shouldProcess' in analysis, 'Analysis should have shouldProcess property');
        assert('state' in analysis, 'Analysis should have state property');

        console.log('Document analysis:', analysis);
    });

    test('Integration: updateTimestampIfNeeded should work with real editor', async function() {
        this.timeout(5000);

        // This might not update anything if the file doesn't have copyright or update time is disabled
        const result = await handler.updateTimestampIfNeeded(testEditor);

        // Result should be boolean
        assert(typeof result === 'boolean', 'Should return boolean result');

        console.log('Timestamp update result:', result);
    });

    test('Integration: determineOptimalAction should return valid action', () => {
        const mockAnalysis = {
            state: {
                hasCopyright: false,
                isWellFormed: false,
                isMalformed: false,
                needsTimestampUpdate: false
            }
        };

        const action = handler.determineOptimalAction(mockAnalysis);

        assert(action, 'Should return an action');
        assert(typeof action === 'object', 'Action should be an object');
        assert('type' in action, 'Action should have type property');
        assert('priority' in action, 'Action should have priority property');

        console.log('Optimal action:', action);
    });

    test('Integration: getCachedFileState and setCachedFileState should work', () => {
        const testState = {
            hasCopyright: true,
            isWellFormed: true,
            cachedAt: Date.now()
        };

        // Set cache
        handler.setCachedFileState(testDocument, testState);

        // Get cache
        const cachedState = handler.getCachedFileState(testDocument);

        assert(cachedState, 'Should return cached state');
        assert.equal(cachedState.hasCopyright, true, 'Cached state should have correct hasCopyright');
        assert.equal(cachedState.isWellFormed, true, 'Cached state should have correct isWellFormed');

        console.log('Cache test successful');
    });

    test('Integration: handleEditorChange should work with real editor', async function() {
        this.timeout(3000);

        // This should not throw an error
        await handler.handleEditorChange(testEditor);

        assert(true, 'handleEditorChange should complete without error');
        console.log('Editor change handling test passed');
    });

    test('Integration: handleDocumentOpen should work with real document', async function() {
        this.timeout(3000);

        // This should not throw an error
        await handler.handleDocumentOpen(testDocument);

        assert(true, 'handleDocumentOpen should complete without error');
        console.log('Document open handling test passed');
    });
});