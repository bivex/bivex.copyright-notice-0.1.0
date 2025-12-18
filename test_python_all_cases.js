// Test Python insertion logic for all cases
const fs = require('fs');

// Simulate the findOptimalInsertPosition method with our changes
function findOptimalInsertPosition(text, languageId) {
    const lines = text.split('\n');
    let insertPosition = 0;
    let foundContent = false;
    let lineIndex = 0;
    let leadingEmptyLines = 0;
    let hasShebang = false;
    let shebangEndPosition = 0;

    // Calculate byte offset for a line index
    const getOffsetForLine = (lineIdx) => {
        let offset = 0;
        for (let j = 0; j < lineIdx && j < lines.length; j++) {
            offset += lines[j].length + 1; // +1 for newline
        }
        return offset;
    };

    // Special handling for Python files - always insert at the beginning
    if (languageId === 'python') {
        // For all Python files, insert copyright at the very beginning
        // This ensures consistent behavior regardless of file structure
        insertPosition = 0;
        foundContent = true;
        // Check if file has shebang
        const hasShebangLine = lines.length > 0 && lines[0].trim().startsWith('#!');
        return {
            insertPosition,
            foundContent,
            leadingEmptyLines: 0,
            hasShebang: hasShebangLine,
            shebangEndPosition: hasShebangLine ? lines[0].length + 1 : 0
        };
    }

    while (lineIndex < lines.length) {
        const line = lines[lineIndex];
        const trimmedLine = line.trim();

        if (trimmedLine === '') {
            leadingEmptyLines++;
            lineIndex++;
            continue;
        }

        if (trimmedLine.startsWith('#!')) {
            hasShebang = true;
            leadingEmptyLines = 0; // Reset
            lineIndex++;
            shebangEndPosition = getOffsetForLine(lineIndex);
            continue;
        }

        // Found first content
        insertPosition = getOffsetForLine(lineIndex);
        foundContent = true;
        break;
    }

    // Handle files with only whitespace
    if (!foundContent) {
        insertPosition = 0;
        foundContent = true;
    }

    return {
        insertPosition,
        foundContent,
        leadingEmptyLines,
        hasShebang,
        shebangEndPosition
    };
}

// Test cases for Python files
const pythonTestCases = [
    {
        name: 'Python file with docstring',
        content: '"""Application service for Excel import operations."""\n\ndef hello():\n    print("Hello, World!")\n',
        languageId: 'python',
        expectedInsertPosition: 0
    },
    {
        name: 'Python file without docstring',
        content: 'def hello():\n    print("Hello, World!")\n',
        languageId: 'python',
        expectedInsertPosition: 0
    },
    {
        name: 'Python file with shebang and docstring',
        content: '#!/usr/bin/env python3\n"""Application service for Excel import operations."""\n\ndef hello():\n    print("Hello, World!")\n',
        languageId: 'python',
        expectedInsertPosition: 0
    },
    {
        name: 'Python file with shebang, no docstring',
        content: '#!/usr/bin/env python3\n\ndef hello():\n    print("Hello, World!")\n',
        languageId: 'python',
        expectedInsertPosition: 0
    },
    {
        name: 'Empty Python file',
        content: '',
        languageId: 'python',
        expectedInsertPosition: 0
    }
];

console.log('Testing Python insertion logic for ALL cases...\n');

pythonTestCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    const result = findOptimalInsertPosition(testCase.content, testCase.languageId);
    console.log(`  Content preview: ${testCase.content.substring(0, 50).replace(/\n/g, '\\n')}...`);
    console.log(`  Insert position: ${result.insertPosition} (expected: ${testCase.expectedInsertPosition})`);
    console.log(`  Found content: ${result.foundContent}`);
    console.log(`  Has shebang: ${result.hasShebang}`);
    console.log(`  PASS: ${result.insertPosition === testCase.expectedInsertPosition ? 'YES' : 'NO'}\n`);
});

console.log('Demo of copyright insertion for different Python files:');
console.log('========================================================');

// Simulate copyright template (Python format)
const copyrightTemplate = `# Copyright (c) ${new Date().getFullYear()}\n\n`;

pythonTestCases.slice(0, 4).forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}:`);
    console.log('Original:');
    console.log(testCase.content || '(empty file)');
    console.log('After copyright insertion:');
    const modifiedContent = copyrightTemplate + testCase.content;
    console.log(modifiedContent || '(empty file with copyright)');
});