const fs = require('fs');

// Quick test of copyright insertion logic
console.error('Starting quick test...');

// Test data
const testContent = `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`;

console.error('Original content:');
console.error(testContent);
console.error('---');

// Simulate algorithm
function hasCopyrightNotice(text) {
    if (!text || text.length === 0) return false;
    const lines = text.split('\n');
    const firstLines = lines.slice(0, Math.min(10, lines.length));
    const firstBlock = firstLines.join('\n');
    return firstBlock.includes("Copyright (c)") ||
           (firstBlock.startsWith("/*") && firstBlock.includes("Copyright"));
}

function simulateInsertion(content) {
    const template = "/*\n * Copyright (c) 2025 bivex\n */\n\n";

    if (content.length === 0) return template;

    const lines = content.split('\n');
    let insertLine = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '' || line.startsWith('#!') ||
            (line.startsWith('/*') && !line.includes('*/') && i < lines.length - 1)) {
            continue;
        }
        insertLine = i;
        break;
    }

    if (insertLine === 0) {
        return template + content;
    } else {
        const beforeLines = lines.slice(0, insertLine);
        const afterLines = lines.slice(insertLine);
        return beforeLines.join('\n') + '\n\n' + template + afterLines.join('\n');
    }
}

const hasCopyright = hasCopyrightNotice(testContent);
console.error('Has copyright:', hasCopyright);

if (!hasCopyright) {
    const result = simulateInsertion(testContent);
    console.error('After insertion:');
    console.error(result);

    const hasCopyrightAfter = hasCopyrightNotice(result);
    console.error('Has copyright after insertion:', hasCopyrightAfter);

    // Write to file
    fs.writeFileSync('tests/test_output.txt', result);
    console.error('Result written to tests/test_output.txt');
} else {
    console.error('Copyright already exists, skipping insertion');
}

console.error('Test completed.');
