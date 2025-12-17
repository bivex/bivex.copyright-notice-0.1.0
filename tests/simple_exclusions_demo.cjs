// Simple demonstration of default exclusions
console.log('🛡️  **Copyright Notice Extension - Default Exclusions**\n');

console.log('📋 **Default excluded folders and files:**\n');

const defaultExclusions = [
    '**/node_modules/**     - Node.js dependencies',
    '**/dist/**            - Distribution/build output',
    '**/build/**           - Build artifacts',
    '**/coverage/**        - Test coverage reports',
    '**/.git/**            - Git repository',
    '**/.vscode/**         - VS Code settings',
    '**/.next/**           - Next.js build files',
    '**/.nuxt/**           - Nuxt.js build files',
    '**/.nyc_output/**     - NYC coverage output',
    '**/*.log              - Log files',
    '**/package-lock.json  - NPM lock file',
    '**/yarn.lock          - Yarn lock file',
    '**/.DS_Store          - macOS system files',
    '**/Thumbs.db          - Windows system files'
];

defaultExclusions.forEach(exclusion => {
    console.log(`   ❌ ${exclusion}`);
});

console.log('\n✅ **Files that WILL receive copyright notices:**');
console.log('   ✅ src/main.js');
console.log('   ✅ lib/utils.js');
console.log('   ✅ app/components/Button.tsx');
console.log('   ✅ README.md');
console.log('   ✅ package.json');

console.log('\n✅ **Files that will be SKIPPED:**');
console.log('   ❌ node_modules/lodash/index.js');
console.log('   ❌ dist/bundle.js');
console.log('   ❌ .git/config');
console.log('   ❌ .vscode/settings.json');
console.log('   ❌ coverage/lcov-report/index.html');

console.log('\n🔧 **How to customize exclusions:**');
console.log('   Add to your settings.json:');
console.log('   "copyright-notice.excludedFiles": [');
console.log('     "**/node_modules/**",');
console.log('     "**/.git/**",');
console.log('     "**/temp/**",');
console.log('     "**/cache/**"');
console.log('   ]');

console.log('\n🎯 **Result:** Clean, professional copyright management without touching dependencies or build artifacts!');
