import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: [
        'out/tests/**/*.js',
        'tests/**/*.js'
    ]
});