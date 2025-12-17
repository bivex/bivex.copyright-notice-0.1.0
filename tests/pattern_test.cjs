const fs = require('fs');

// Test copyright detection patterns
console.log('🧪 Testing Copyright Detection Patterns\n');

function testPattern(text, label) {
    console.log(`📋 Testing: ${label}`);
    console.log(`   Text: "${text.replace(/\n/g, '\\n')}"`);

    // Current implementation
    const wellFormedCopyrightRegex = /\/\*\*?[\s\S]*?(Copyright|©)[\s\S]*?\d{4}[\s\S]*?\*\//;
    const isWellFormed = wellFormedCopyrightRegex.test(text) && text.trim().startsWith('/*');

    console.log(`   Well-formed: ${isWellFormed ? '✅' : '❌'}`);
    console.log('');
}

// Test cases
testPattern(`/**
 * Copyright (c) 2023 TypeScript Company
 * Created: 2023-01-01 12:00:00
 * Last Updated: 2023-01-15 14:30:00
 */`, 'with_copyright.ts content');

testPattern(`/**
 * Copyright (c) 2023 Test Company
 * All rights reserved.
 */`, 'with_copyright.js content');

testPattern(`/* Copyright (c) 2025 */`, 'expected format');

testPattern(`// Copyright 2024
function test() {}`, 'malformed comment');

testPattern(`function test() {}`, 'no copyright');

// Test real files
console.log('📂 Testing real files:');
const files = ['test_files/with_copyright.ts', 'test_files/with_copyright.js'];

files.forEach(filePath => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').slice(0, 6); // First 6 lines
        const firstBlock = lines.join('\n');

        console.log(`\n📄 ${filePath}:`);
        console.log(`   Content: "${firstBlock.replace(/\n/g, '\\n')}"`);

        const wellFormedCopyrightRegex = /\/\*\*?[\s\S]*?(Copyright|©)[\s\S]*?\d{4}[\s\S]*?\*\//;
        const isWellFormed = wellFormedCopyrightRegex.test(firstBlock) && firstBlock.trim().startsWith('/*');

        console.log(`   Well-formed: ${isWellFormed ? '✅' : '❌'}`);
        console.log(`   Starts with /*: ${firstBlock.trim().startsWith('/*') ? '✅' : '❌'}`);
        console.log(`   Regex match: ${wellFormedCopyrightRegex.test(firstBlock) ? '✅' : '❌'}`);

    } catch (error) {
        console.log(`   ❌ Error reading ${filePath}: ${error.message}`);
    }
});

console.log('\n✅ Pattern test completed!');
