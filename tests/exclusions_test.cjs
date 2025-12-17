// Test default exclusions functionality
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock VS Code API with default exclusions
const mockVscode = {
    workspace: {
        getConfiguration: (section) => ({
            get: (key, defaultValue) => {
                if (key === 'excludedFiles') return [
                    "**/node_modules/**",
                    "**/.git/**",
                    "**/.vscode/**",
                    "**/dist/**",
                    "**/build/**",
                    "**/.next/**",
                    "**/.nuxt/**",
                    "**/coverage/**",
                    "**/.nyc_output/**",
                    "**/*.log",
                    "**/package-lock.json",
                    "**/yarn.lock",
                    "**/.DS_Store",
                    "**/Thumbs.db"
                ];
                if (key === 'languages') return ['*'];
                if (key === 'fileExtensions') return ['*'];
                if (key === 'allowedFolders') return [];
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

// Glob matching function (same as in extension)
function matchesPattern(fileName, pattern) {
    // Simple glob pattern matching
    const regexPattern = pattern
        .replace(/\./g, '\\.')  // Escape dots
        .replace(/\*/g, '.*')   // Convert * to .*
        .replace(/\?/g, '.')    // Convert ? to .
        .replace(/\[/g, '\\[')  // Escape [
        .replace(/\]/g, '\\]')  // Escape ]
        .replace(/\(/g, '\\(')  // Escape (
        .replace(/\)/g, '\\)')  // Escape )
        .replace(/\|/g, '\\|')  // Escape |
        .replace(/\+/g, '\\+')  // Escape +
        .replace(/\^/g, '\\^')  // Escape ^
        .replace(/\$/g, '\\$')  // Escape $
        .replace(/\{/g, '\\{')  // Escape {
        .replace(/\}/g, '\\}')  // Escape }
        .replace(/\\/g, '\\\\'); // Escape backslashes

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(fileName);
}

// Mock the isEnabled method logic
function isEnabled(document, config) {
    if (!document) {
        return false;
    }

    const fileName = document.fileName;

    // Check if file is explicitly excluded
    if (config.excludedFiles && config.excludedFiles.length > 0) {
        // In the real extension, fileName is the full absolute path
        // and patterns like "**/node_modules/**" should match against it
        for (const pattern of config.excludedFiles) {
            if (matchesPattern(fileName, pattern)) {
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
                normalizedFolderPath = path.resolve(config.workspaceRoot, normalizedFolderPath);
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

// Run comprehensive test
//console.log('Testing default exclusions functionality...\n');

const config = {
    excludedFiles: [
        "**/node_modules/**",
        "**/.git/**",
        "**/.vscode/**",
        "**/dist/**",
        "**/build/**",
        "**/.next/**",
        "**/.nuxt/**",
        "**/coverage/**",
        "**/.nyc_output/**",
        "**/*.log",
        "**/package-lock.json",
        "**/yarn.lock",
        "**/.DS_Store",
        "**/Thumbs.db"
    ],
    allowedFolders: [],
    workspaceRoot: '/test/workspace'
};

// Test cases for various file types and locations
const exclusionTests = [
    // Dependencies and build artifacts
    { file: 'node_modules/lodash/index.js', expected: false, category: 'Dependencies' },
    { file: 'node_modules/react/package.json', expected: false, category: 'Dependencies' },
    { file: 'dist/bundle.js', expected: false, category: 'Build output' },
    { file: 'build/app.js', expected: false, category: 'Build output' },
    { file: '.next/static/chunks/main.js', expected: false, category: 'Framework builds' },
    { file: '.nuxt/dist/server.js', expected: false, category: 'Framework builds' },

    // Version control and IDE
    { file: '.git/config', expected: false, category: 'Version control' },
    { file: '.git/hooks/pre-commit', expected: false, category: 'Version control' },
    { file: '.vscode/settings.json', expected: false, category: 'IDE settings' },
    { file: '.vscode/extensions.json', expected: false, category: 'IDE settings' },

    // Test and coverage
    { file: 'coverage/lcov-report/index.html', expected: false, category: 'Test coverage' },
    { file: '.nyc_output/processinfo', expected: false, category: 'Coverage output' },

    // Lock files and logs
    { file: 'package-lock.json', expected: false, category: 'Lock files' },
    { file: 'yarn.lock', expected: false, category: 'Lock files' },
    { file: 'npm-debug.log', expected: false, category: 'Log files' },
    { file: 'server.log', expected: false, category: 'Log files' },

    // System files
    { file: '.DS_Store', expected: false, category: 'System files' },
    { file: 'Thumbs.db', expected: false, category: 'System files' },

    // Files that SHOULD be included
    { file: 'src/main.js', expected: true, category: 'Source code' },
    { file: 'lib/utils.js', expected: true, category: 'Source code' },
    { file: 'app/components/Button.tsx', expected: true, category: 'Source code' },
    { file: 'README.md', expected: true, category: 'Documentation' },
    { file: 'package.json', expected: true, category: 'Project config' },
];

let passed = 0;
let failed = 0;
const results = {};

exclusionTests.forEach(testCase => {
    const document = mockDocument(testCase.file);
    const result = isEnabled(document, config);
    const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';

    if (!results[testCase.category]) {
        results[testCase.category] = [];
    }
    results[testCase.category].push({ testCase, result, status });

    if (result === testCase.expected) {
        passed++;
    } else {
        failed++;
        //console.log(`${status} [${testCase.category}] ${testCase.file}`);
        //console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
    }
});

// Group results by category
//console.log('\n📊 **Default Exclusions Test Results by Category:**\n');

Object.keys(results).forEach(category => {
    //console.log(`🔍 **${category}:**`);
    results[category].forEach(({ testCase, result, status }) => {
        //console.log(`   ${status} ${testCase.file} → ${result ? 'ALLOWED' : 'EXCLUDED'}`);
    });
    //console.log('');
});

//console.log(`\n📈 **Overall Results:** ${passed} passed, ${failed} failed`);

if (failed === 0) {
    //console.log('🎉 All default exclusions working correctly!');
    //console.log('\n📋 **Summary of protected folders:**');
    //console.log('- Dependencies: node_modules, lock files');
    //console.log('- Build outputs: dist, build, .next, .nuxt');
    //console.log('- Version control: .git');
    //console.log('- IDE settings: .vscode');
    //console.log('- Test artifacts: coverage, .nyc_output');
    //console.log('- System files: .DS_Store, Thumbs.db, *.log');
} else {
    //console.log('❌ Some exclusions failed!');
    process.exit(1);
}
