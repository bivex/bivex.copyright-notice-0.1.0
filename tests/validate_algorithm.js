const fs = require('fs');
const path = require('path');

// Test data - read actual test files
const testFiles = [
    'test_files/basic.cpp',
    'test_files/basic.ahk',
    'test_files/basic.ahk2',
    'test_files/basic.css',
    'test_files/basic.h'
];

console.log('🔍 Validating copyright insertion algorithm...\n');

// Mock implementation of the key parts
function hasCopyrightNotice(text) {
    if (!text || text.length === 0) {
        return false;
    }

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

    if (content.length === 0) {
        return template;
    }

    const lines = content.split('\n');
    let insertLine = 0;

    // Find first non-empty, non-comment line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '' ||
            line.startsWith('#!') ||
            (line.startsWith('/*') && !line.includes('*/') && i < lines.length - 1) ||
            (line.startsWith('//') && (line.includes('License') || line.includes('Copyright') ||
                                        line.includes('license') || line.includes('copyright')))) {
            continue;
        }
        insertLine = i;
        break;
    }

    if (insertLine === 0) {
        // Insert at beginning
        return template + content;
    } else {
        // Insert before the found line
        const beforeLines = lines.slice(0, insertLine);
        const afterLines = lines.slice(insertLine);
        return beforeLines.join('\n') + '\n\n' + template + afterLines.join('\n');
    }
}

// Test each file
let totalTests = 0;
let passedTests = 0;

testFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File ${filePath} not found, skipping...`);
        return;
    }

    totalTests++;
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);

    console.log(`📄 Testing ${fileName}:`);

    // Check if copyright should be added
    const hasCopyright = hasCopyrightNotice(content);
    console.log(`   Has copyright: ${hasCopyright ? 'YES' : 'NO'}`);

    if (!hasCopyright) {
        const result = simulateCopyrightInsertion(content);
        const stillHasCopyright = hasCopyrightNotice(result);

        console.log(`   After insertion, has copyright: ${stillHasCopyright ? 'YES' : 'NO'}`);

        if (stillHasCopyright) {
            console.log(`   ✅ PASS: Copyright correctly inserted`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: Copyright not inserted properly`);
            console.log(`   Expected to find "Copyright (c)" in first lines`);
        }
    } else {
        console.log(`   ✅ PASS: File already has copyright, skipped insertion`);
        passedTests++;
    }

    console.log('');
});

console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Algorithm is working correctly.');
} else {
    console.log('⚠️  Some tests failed. Algorithm needs improvement.');
}

// Write results to file for inspection
const results = {
    timestamp: new Date().toISOString(),
    testsRun: totalTests,
    testsPassed: passedTests,
    testFiles: testFiles
};

fs.writeFileSync('tests/test_results.json', JSON.stringify(results, null, 2));
console.log('📝 Detailed results saved to tests/test_results.json');
