// Test the new copyright pattern suggested by user
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

//console.log('Testing NEW copyright detection pattern...');
//console.log('Suggested pattern:');
//console.log('/(?!.*(?:\\{|\\}|\\);))(?:(copyright)[ \\t]*(?:(&copy;|\\(c\\)|&#(?:169|xa9;)|©)[ \\t]+)?)(?:((?:((?:(?:19|20)[0-9]{2}))[^\\w\\n]*)*)([ \\t,\\w]*))/i');

const lines = testFileContent.split('\n');
const firstLines = lines.slice(0, Math.min(20, lines.length));
const firstBlock = firstLines.join('\n');

//console.log('\nFile content:');
//console.log(firstBlock);

// Current working pattern
const currentPattern = /\/\*\*?[\s\S]*?(Copyright|©)[\s\S]*?\d{4}[\s\S]*?\*\//;
//console.log('\nCurrent pattern result:', currentPattern.test(firstBlock));

// New suggested pattern (corrected escaping)
const newPattern = /(?!.*(?:\{|\}|\);))(?:(copyright)[\s\t]*(?:(&copy;|\(c\)|&#(?:169|xa9;)|©)[\s\t]+)?)(?:((?:((?:(?:19|20)[\d]{2}))[^\w\n]*)*)([\s\t,\w]*))/i;
//console.log('New pattern result:', newPattern.test(firstBlock));

// Test various copyright formats
const testCases = [
    '/* Copyright (c) 2025 */',
    '/* Copyright © 2025 */',
    '/* © 2025 Company */',
    '// Copyright 2025',
    '# Copyright (c) 2025',
    '/*\n * Copyright (c) 2025 Company\n * All rights reserved.\n */',
    '/* Copyright &copy; 2025 */',
    '/* Copyright &#169; 2025 */',
    '/* Copyright &#xa9; 2025 */'
];

//console.log('\nTesting various copyright formats:');
testCases.forEach(testCase => {
    const currentResult = currentPattern.test(testCase);
    const newResult = newPattern.test(testCase);
    //console.log(`"${testCase.replace(/\n/g, '\\n')}": Current=${currentResult}, New=${newResult}`);
});
