import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: [
        'tests/extension.test.js',
        'tests/integration.test.js',
        'tests/apply_to_all_test.js'
    ],
    mocha: {
        timeout: 10000,
        slow: 5000,
        grep: process.env.TEST_GREP
    }
});