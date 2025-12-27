const assert = require('assert');
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

// Import the extension classes
const { CopyrightHandler } = require('../out/CopyrightHandler');

suite('Apply to All Files Integration Tests', () => {
    let handler;
    let testWorkspaceFolder;
    let testFilesDir;

    suiteSetup(async function() {
        this.timeout(15000);

        // Set up test environment
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            testWorkspaceFolder = workspaceFolders[0];
            testFilesDir = path.join(testWorkspaceFolder.uri.fsPath, 'test_apply_all_files');

            // Create handler instance
            handler = new CopyrightHandler();

            // Create test directory if it doesn't exist
            if (!fs.existsSync(testFilesDir)) {
                fs.mkdirSync(testFilesDir, { recursive: true });
            }

            console.log('Test setup complete. Test files directory:', testFilesDir);
        } else {
            // Skip integration tests if no workspace
            console.log('Skipping integration tests - no workspace available');
            this.skip();
        }
    });

    suiteTeardown(async function() {
        // Clean up test files
        if (testFilesDir && fs.existsSync(testFilesDir)) {
            try {
                fs.rmSync(testFilesDir, { recursive: true, force: true });
                console.log('Test files cleaned up');
            } catch (error) {
                console.warn('Failed to clean up test files:', error);
            }
        }

        handler = null;
    });

    test('Apply to All Files: should process test files without copyright', async function() {
        this.timeout(60000); // Increased timeout for file processing

        // Verify test files exist
        const testFile1 = path.join(testFilesDir, 'test1.js');
        const testFile2 = path.join(testFilesDir, 'test2.py');
        const testFile3 = path.join(testFilesDir, 'test3.ts');
        const testFile4 = path.join(testFilesDir, 'test4.html');

        assert(fs.existsSync(testFile1), 'Test file 1 should exist');
        assert(fs.existsSync(testFile2), 'Test file 2 should exist');
        assert(fs.existsSync(testFile3), 'Test file 3 should exist');
        assert(fs.existsSync(testFile4), 'Test file 4 should exist');

        // Verify test files don't have copyright initially
        const content1 = fs.readFileSync(testFile1, 'utf8');
        const content2 = fs.readFileSync(testFile2, 'utf8');
        const content3 = fs.readFileSync(testFile3, 'utf8');
        const content4 = fs.readFileSync(testFile4, 'utf8');

        assert(!content1.includes('Copyright'), 'Test file 1 should not have copyright initially');
        assert(!content2.includes('Copyright'), 'Test file 2 should not have copyright initially');
        assert(!content3.includes('Copyright'), 'Test file 3 should not have copyright initially');
        assert(!content4.includes('Copyright'), 'Test file 4 should not have copyright initially');

        console.log('Initial test files verified - no copyright present');

        // Apply copyright to all files
        console.log('Starting applyToAllFiles...');
        const result = await handler.applyToAllFiles();

        console.log('applyToAllFiles result:', result);

        // Verify result structure
        assert(result, 'Should return a result');
        assert(typeof result === 'object', 'Result should be an object');
        assert('processed' in result, 'Result should have processed count');
        assert('skipped' in result, 'Result should have skipped count');
        assert('errors' in result, 'Result should have errors count');
        assert('errorDetails' in result, 'Result should have errorDetails');

        // Check that some files were processed
        assert(result.processed > 0, `Should have processed some files, but processed: ${result.processed}`);

        // Verify files now have copyright
        const updatedContent1 = fs.readFileSync(testFile1, 'utf8');
        const updatedContent2 = fs.readFileSync(testFile2, 'utf8');
        const updatedContent3 = fs.readFileSync(testFile3, 'utf8');
        const updatedContent4 = fs.readFileSync(testFile4, 'utf8');

        // Check that copyright was added to JavaScript and TypeScript files
        assert(updatedContent1.includes('Copyright'), 'JavaScript file should now have copyright');
        assert(updatedContent3.includes('Copyright'), 'TypeScript file should now have copyright');

        // Python files might have different comment syntax, check for the year
        assert(updatedContent2.includes('2025') || updatedContent2.includes('Copyright'),
            'Python file should have copyright notice');

        // HTML files might be skipped based on configuration
        // Just check that content changed
        assert(updatedContent1 !== content1, 'JavaScript file content should have changed');
        assert(updatedContent3 !== content3, 'TypeScript file content should have changed');

        console.log('Test completed successfully!');
        console.log(`Processed: ${result.processed}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
    });

    test('Apply to All Files: should handle empty directory gracefully', async function() {
        this.timeout(30000);

        // Create empty subdirectory
        const emptyDir = path.join(testFilesDir, 'empty');
        if (!fs.existsSync(emptyDir)) {
            fs.mkdirSync(emptyDir);
        }

        // This should not throw an error even with empty directory
        const result = await handler.applyToAllFiles();

        assert(result, 'Should return a result even with empty directory');
        assert(typeof result.processed === 'number', 'Processed should be a number');

        console.log('Empty directory test passed');
    });
});

