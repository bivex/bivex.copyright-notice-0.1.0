const fs = require('fs');
const path = require('path');

console.log('🔨 VSIX Rebuild Script');
console.log('=====================');

// Check current state
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
console.log(`📦 Current version: ${packageJson.version}`);
console.log(`🏷️  Publisher: ${packageJson.publisher}`);
console.log(`📝 Description: ${packageJson.description}`);

console.log('\n📁 Checking files...');
const requiredFiles = [
    './package.json',
    './out/extension.js',
    './out/CopyrightHandler.js',
    './README.md'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        console.log(`✅ ${file} (${stats.size} bytes)`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

console.log('\n🔧 Recent changes:');
console.log('✅ Enhanced profile selection with diagnostics');
console.log('✅ Added "Diagnose Copyright Profiles" command');
console.log('✅ Added Quick Switch option for profiles');
console.log('✅ Improved error handling and logging');
console.log('✅ Version bumped to 1.1.14');

if (allFilesExist) {
    console.log('\n📦 Ready for packaging!');
    console.log('\nTo create VSIX manually, run:');
    console.log('  npm install -g @vscode/vsce  # if not installed');
    console.log('  vsce package');
    console.log('\nOr use the bash script:');
    console.log('  bash scripts/pack.sh');
} else {
    console.log('\n❌ Some required files are missing!');
}

console.log('\n🎯 VSIX rebuild preparation completed!');
