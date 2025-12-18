// Test Python docstring insertion logic
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

    // Special handling for Python files with module docstrings
    if (languageId === 'python') {
        // Check if file starts with a shebang followed by a docstring or just a docstring
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            // Check if first line is docstring or if second line after shebang is docstring
            if (firstLine.startsWith('"""') ||
                (lines.length > 1 && firstLine.startsWith('#!') && lines[1].trim().startsWith('"""'))) {
                // For Python files, insert copyright BEFORE the docstring, not after
                // This means inserting at the very beginning of the file
                insertPosition = 0;
                foundContent = true;
                return {
                    insertPosition,
                    foundContent,
                    leadingEmptyLines: 0,
                    hasShebang: firstLine.startsWith('#!'),
                    shebangEndPosition: firstLine.startsWith('#!') ? lines[0].length + 1 : 0
                };
            }
        }
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

// Test cases
const testCases = [
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
    }
];

console.log('Testing Python docstring insertion logic...\n');

testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    const result = findOptimalInsertPosition(testCase.content, testCase.languageId);
    console.log(`  Content preview: ${testCase.content.substring(0, 50).replace(/\n/g, '\\n')}...`);
    console.log(`  Insert position: ${result.insertPosition} (expected: ${testCase.expectedInsertPosition})`);
    console.log(`  Found content: ${result.foundContent}`);
    console.log(`  Has shebang: ${result.hasShebang}`);
    console.log(`  PASS: ${result.insertPosition === testCase.expectedInsertPosition ? 'YES' : 'NO'}\n`);
});

// Test with actual file
console.log('Testing with actual file:');
const testFile = 'test_files/test_docstring.py';
if (fs.existsSync(testFile)) {
    const content = fs.readFileSync(testFile, 'utf8');
    const result = findOptimalInsertPosition(content, 'python');
    console.log(`  File: ${testFile}`);
    console.log(`  Insert position: ${result.insertPosition}`);
    console.log(`  Found content: ${result.foundContent}`);
    console.log(`  Copyright should be inserted at the VERY beginning of the file (position 0)`);
} else {
    console.log(`  File ${testFile} not found`);
}