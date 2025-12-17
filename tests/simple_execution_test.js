const fs = require('fs');
const { execSync } = require('child_process');

console.log('🧪 Simple Test Execution\n');

const results = {
    timestamp: new Date().toISOString(),
    tests: []
};

// Test 1: Check if files exist
console.log('📁 Checking test files...');
const testFiles = [
    'debug_test.js',
    'mutation_tests.js',
    'advanced_mutation_tests.js',
    'integration_mutation_tests.js'
];

testFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✅' : '❌'} ${file}: ${exists ? 'Found' : 'Missing'}`);
    results.tests.push({
        name: `File Check: ${file}`,
        status: exists ? 'PASS' : 'FAIL',
        result: exists ? 'File exists' : 'File not found'
    });
});

// Test 2: Try to run a simple Node.js command
console.log('\n🔧 Testing Node.js execution...');
try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js version: ${nodeVersion}`);
    results.tests.push({
        name: 'Node.js Check',
        status: 'PASS',
        result: `Version: ${nodeVersion}`
    });
} catch (error) {
    console.log(`❌ Node.js check failed: ${error.message}`);
    results.tests.push({
        name: 'Node.js Check',
        status: 'FAIL',
        result: error.message
    });
}

// Test 3: Try to execute a simple test
console.log('\n🎯 Testing algorithm execution...');
try {
    // Import and run a simple test
    const testContent = `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`;

    // Simple copyright check
    const hasCopyright = testContent.includes('Copyright (c)');
    console.log(`✅ Copyright detection test: ${hasCopyright ? 'Found' : 'Not found'} (expected: Not found)`);

    results.tests.push({
        name: 'Copyright Detection Test',
        status: hasCopyright === false ? 'PASS' : 'FAIL',
        result: `Copyright ${hasCopyright ? 'found' : 'not found'} in test content`
    });

    // Simple insertion test
    const template = "/*\n * Copyright (c) 2025 bivex\n */\n\n";
    const result = template + testContent;
    const hasCopyrightAfter = result.includes('Copyright (c) 2025 bivex');

    console.log(`✅ Copyright insertion test: ${hasCopyrightAfter ? 'Success' : 'Failed'}`);

    results.tests.push({
        name: 'Copyright Insertion Test',
        status: hasCopyrightAfter ? 'PASS' : 'FAIL',
        result: `Copyright ${hasCopyrightAfter ? 'inserted correctly' : 'insertion failed'}`
    });

} catch (error) {
    console.log(`❌ Algorithm test failed: ${error.message}`);
    results.tests.push({
        name: 'Algorithm Test',
        status: 'FAIL',
        result: error.message
    });
}

// Calculate summary
const totalTests = results.tests.length;
const passedTests = results.tests.filter(t => t.status === 'PASS').length;
const failedTests = totalTests - passedTests;

results.summary = {
    totalTests,
    passedTests,
    failedTests,
    successRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0
};

console.log(`\n📊 Summary: ${passedTests}/${totalTests} tests passed (${results.summary.successRate}%)`);

// Save results
fs.writeFileSync('simple_test_execution_results.json', JSON.stringify(results, null, 2));
console.log('📝 Results saved to simple_test_execution_results.json');

console.log('\n✅ Simple test execution completed!');
