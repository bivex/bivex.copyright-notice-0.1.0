// Test the copyright detection pattern
const fs = require('fs');

const testFileContent = `/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-17 08:04
 * Last Updated: 2025-12-17 08:04
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

let x=1;
let y=2;`;

console.log('Testing copyright detection pattern...');
console.log('File content:');
console.log(testFileContent);
console.log('---');

const lines = testFileContent.split('\n');
const firstLines = lines.slice(0, Math.min(20, lines.length)); // Now checking 20 lines
const firstBlock = firstLines.join('\n');

console.log('First 10 lines:');
console.log(firstBlock);
console.log('---');

// Test different regex patterns
const patterns = [
    /\/\*\*?[\s\S]*?(Copyright|©)[\s\S]*?\d{4}[\s\S]*?\*\//,
    /\/\*\*?[\s\S]*?Copyright[\s\S]*?\d{4}[\s\S]*?\*\//,
    /\/\*\*?[\s\S]*?\d{4}[\s\S]*?\*\//,
    /Copyright.*\d{4}/
];

patterns.forEach((pattern, i) => {
    console.log(`Pattern ${i + 1}: ${pattern}`);
    console.log(`  Result: ${pattern.test(firstBlock)}`);
});

// More detailed analysis
console.log('\nDetailed analysis:');
console.log('Contains /**:', firstBlock.includes('/**'));
console.log('Contains Copyright:', firstBlock.includes('Copyright'));
console.log('Contains 2025:', firstBlock.includes('2025'));
console.log('Contains */:', firstBlock.includes('*/'));

// Test the actual regex step by step
const step1 = /\/\*\*?/.test(firstBlock);
const step2 = /\/\*\*?[\s\S]*?(Copyright|©)/.test(firstBlock);
const step3 = /\/\*\*?[\s\S]*?(Copyright|©)[\s\S]*?\d{4}/.test(firstBlock);
const step4 = /\/\*\*?[\s\S]*?(Copyright|©)[\s\S]*?\d{4}[\s\S]*?\*\//.test(firstBlock);

console.log('\nStep by step:');
console.log('Step 1 (/**?):', step1);
console.log('Step 2 (+ Copyright):', step2);
console.log('Step 3 (+ year):', step3);
console.log('Step 4 (+ */):', step4);

const isWellFormed = patterns[0].test(firstBlock) && firstBlock.trim().startsWith('/*');

// Test hasMalformedCopyright logic
const hasAnyCopyright = firstBlock.includes("Copyright") || firstBlock.includes("©");
const hasMalformed = hasAnyCopyright && !isWellFormed;

console.log('Well-formed regex test:', patterns[0].test(firstBlock));
console.log('Starts with /*:', firstBlock.trim().startsWith('/*'));
console.log('Combined result (isWellFormed):', isWellFormed);

console.log('Has any copyright:', hasAnyCopyright);
console.log('Has malformed copyright:', hasMalformed);

console.log('\nFinal result:');
if (isWellFormed) {
    console.log('✅ File has WELL-FORMED copyright - no action needed');
} else if (hasMalformed) {
    console.log('🔧 File has MALFORMED copyright - needs fixing');
} else if (hasAnyCopyright) {
    console.log('❓ File has some copyright text but unclear status');
} else {
    console.log('📝 File has NO copyright - needs insertion');
}
