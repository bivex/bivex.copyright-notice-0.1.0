const fs = require('fs');

// Test copyright insertion algorithm
const testContent = `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`;

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
        return template + content;
    } else {
        const beforeLines = lines.slice(0, insertLine);
        const afterLines = lines.slice(insertLine);
        return beforeLines.join('\n') + '\n\n' + template + afterLines.join('\n');
    }
}

// Run test
const hasCopyright = hasCopyrightNotice(testContent);
let result = testContent;

if (!hasCopyright) {
    result = simulateInsertion(testContent);
}

const output = {
    originalContent: testContent,
    hasCopyright: hasCopyright,
    resultContent: result,
    algorithmWorked: hasCopyrightNotice(result) && !hasCopyright
};

fs.writeFileSync('tests/debug_output.json', JSON.stringify(output, null, 2));
