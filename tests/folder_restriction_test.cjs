// Test allowedFolders functionality
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock VS Code API
const mockVscode = {
    workspace: {
        getConfiguration: (section) => ({
            get: (key, defaultValue) => {
                if (key === 'allowedFolders') return ['src', 'lib'];
                if (key === 'languages') return ['*'];
                if (key === 'fileExtensions') return ['*'];
                if (key === 'excludedFiles') return [
                    '**/node_modules/**',
                    '**/.git/**',
                    '**/.vscode/**',
                    '**/dist/**',
                    '**/build/**'
                ];
                return defaultValue;
            }
        }),
        workspaceFolders: [{
            uri: {
                fsPath: '/test/workspace'
            }
        }]
    }
};

// Mock the extension module
const mockDocument = (filePath, languageId = 'javascript') => ({
    fileName: path.resolve('/test/workspace', filePath),
    languageId: languageId
});

// Import and test the logic
//console.log('Testing allowedFolders functionality...\n');

// Test cases
const testCases = [
    { file: 'src/main.js', expected: true, description: 'File in allowed folder src' },
    { file: 'lib/utils.js', expected: true, description: 'File in allowed folder lib' },
    { file: 'app/main.js', expected: false, description: 'File in non-allowed folder app' },
    { file: 'test/main.js', expected: false, description: 'File in non-allowed folder test' },
    { file: 'README.md', expected: false, description: 'File in root (not in allowed folders)' },
    { file: 'node_modules/lodash/index.js', expected: false, description: 'File in excluded node_modules' },
    { file: '.git/config', expected: false, description: 'File in excluded .git folder' },
    { file: '.vscode/settings.json', expected: false, description: 'File in excluded .vscode folder' },
    { file: 'dist/bundle.js', expected: false, description: 'File in excluded dist folder' },
    { file: 'build/app.js', expected: false, description: 'File in excluded build folder' },
];

// Simple glob matching function
function matchesPattern(fileName, pattern) {
    // Simple implementation - convert ** to .* and * to [^/]*
    const regex = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*');
    return new RegExp(`^${regex}$`).test(fileName);
}

// Mock the isEnabled method logic
function isEnabled(document, config) {
    if (!document) {
        return false;
    }

    const fileName = document.fileName;

    // Check if file is explicitly excluded
    if (config.excludedFiles && config.excludedFiles.length > 0) {
        for (const pattern of config.excludedFiles) {
            if (matchesPattern(fileName.replace(path.resolve('/test/workspace'), '').replace(/^\//, ''), pattern)) {
                return false;
            }
        }
    }

    // Check if file is in allowed folders (if specified)
    if (config.allowedFolders && config.allowedFolders.length > 0) {
        const filePath = fileName;
        let isInAllowedFolder = false;

        for (const folderPath of config.allowedFolders) {
            // Normalize folder path - make it relative to workspace if not absolute
            let normalizedFolderPath = folderPath.trim();

            // If folder path doesn't start with '/', consider it relative to workspace
            if (!normalizedFolderPath.startsWith('/')) {
                // Get workspace folder
                const workspaceFolder = mockVscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    normalizedFolderPath = path.resolve(workspaceFolder.uri.fsPath, normalizedFolderPath);
                }
            }

            // Check if file path starts with allowed folder path
            if (filePath.startsWith(normalizedFolderPath)) {
                isInAllowedFolder = true;
                break;
            }
        }

        if (!isInAllowedFolder) {
            return false;
        }
    }

    return true;
}

// Run tests
let passed = 0;
let failed = 0;

const config = {
    allowedFolders: ['src', 'lib'],
    excludedFiles: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.vscode/**',
        '**/dist/**',
        '**/build/**'
    ]
};

testCases.forEach(testCase => {
    const document = mockDocument(testCase.file);
    const result = isEnabled(document, config);
    const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';

    //console.log(`${status} ${testCase.description}`);
    //console.log(`   File: ${testCase.file}`);
    //console.log(`   Expected: ${testCase.expected}, Got: ${result}`);

    if (result === testCase.expected) {
        passed++;
    } else {
        failed++;
        //console.log(`   ERROR: Expected ${testCase.expected} but got ${result}`);
    }
    //console.log('');
});

//console.log(`Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    //console.log('🎉 All tests passed!');
} else {
    //console.log('❌ Some tests failed!');
    process.exit(1);
}
