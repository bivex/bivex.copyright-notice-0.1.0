const fs = require('fs');

// Diagnostic test for copyright extension issues
//console.log('🔍 Copyright Extension Diagnostic Test\n');

function analyzeFile(filePath, fileName) {
    //console.log(`📄 Analyzing: ${fileName}`);

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        //console.log(`   📏 Size: ${content.length} chars, ${lines.length} lines`);

        // Check first 10 lines for copyright
        const firstLines = lines.slice(0, Math.min(10, lines.length));
        const firstBlock = firstLines.join('\n');

        //console.log(`   📋 First 10 lines preview:`);
        firstLines.slice(0, 3).forEach((line, i) => {
            //console.log(`     ${i + 1}: ${line.substring(0, 60)}${line.length > 60 ? '...' : ''}`);
        });

        // Copyright analysis (using same logic as extension)
        const wellFormedCopyrightRegex = /\/\*\*?[\s\S]*?(Copyright|©)[\s\S]*?\d{4}[\s\S]*?\*\//;
        const hasWellFormed = wellFormedCopyrightRegex.test(firstBlock) && firstBlock.trim().startsWith('/*');
        const hasAnyCopyright = firstBlock.includes("Copyright") || firstBlock.includes("©");
        const hasMalformed = hasAnyCopyright && !hasWellFormed;
        const noCopyright = !hasAnyCopyright;

        //console.log(`   📝 Well-formed copyright: ${hasWellFormed ? '✅' : '❌'}`);
        //console.log(`   🚨 Malformed copyright: ${hasMalformed ? '⚠️' : '❌'}`);
        //console.log(`   ❓ No copyright: ${noCopyright ? '⚠️' : '✅'}`);

        // Eligibility check
        const isTsFile = fileName.endsWith('.ts');
        const isJsFile = fileName.endsWith('.js');
        const isEligible = isTsFile || isJsFile;

        //console.log(`   🎯 Eligible for processing: ${isEligible ? '✅' : '❌'} (${isTsFile ? 'TypeScript' : isJsFile ? 'JavaScript' : 'Other'})`);

        // Expected action
        let expectedAction = 'unknown';
        if (!isEligible) {
            expectedAction = 'skip - not eligible';
        } else if (hasMalformed) {
            expectedAction = 'fix malformed copyright';
        } else if (!hasWellFormed) {
            expectedAction = 'insert new copyright';
        } else {
            expectedAction = 'no action needed';
        }

        //console.log(`   🎬 Expected action: ${expectedAction}`);

        return {
            fileName,
            hasWellFormed,
            hasMalformed,
            hasAnyCopyright,
            isEligible,
            expectedAction,
            contentLength: content.length,
            lineCount: lines.length
        };

    } catch (error) {
        //console.log(`   ❌ Error reading file: ${error.message}`);
        return null;
    }
}

function testConfiguration() {
    //console.log('\n⚙️ Configuration Analysis:');

    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const configSection = packageJson.contributes.configuration.properties;

        //console.log('   🔇 Silent Mode:', configSection['copyright-notice.silentMode'].default ? 'ON' : 'OFF');
        //console.log('   ⏱️ Background Delay:', configSection['copyright-notice.backgroundUpdateDelay'].default + 'ms');
        //console.log('   📝 Template:', configSection['copyright-notice.template'].default.replace('\n', '\\n'));

        const languages = configSection['copyright-notice.languages'].default;
        const fileExtensions = configSection['copyright-notice.fileExtensions'].default;

        //console.log('   🌐 Languages:', Array.isArray(languages) ? languages.join(', ') : languages);
        //console.log('   📁 Extensions:', Array.isArray(fileExtensions) ? fileExtensions.join(', ') : fileExtensions);

    } catch (error) {
        //console.log('   ❌ Error reading config:', error.message);
    }
}

function main() {
    testConfiguration();

    //console.log('\n📊 File Analysis:');

    const testFiles = [
        'test_files/basic.ts',
        'test_files/basic.js',
        'test_files/with_copyright.ts',
        'test_files/with_copyright.js'
    ];

    const results = [];

    for (const filePath of testFiles) {
        if (fs.existsSync(filePath)) {
            const result = analyzeFile(filePath, filePath.split('/').pop());
            if (result) {
                results.push(result);
            }
        } else {
            //console.log(`📄 ${filePath}: File not found`);
        }
        //console.log('');
    }

    // Summary
    //console.log('📈 Summary:');
    const eligibleFiles = results.filter(r => r.isEligible);
    const filesNeedingAction = results.filter(r => r.expectedAction !== 'no action needed' && r.expectedAction !== 'skip - not eligible');

    //console.log(`   📂 Total files analyzed: ${results.length}`);
    //console.log(`   ✅ Eligible files: ${eligibleFiles.length}`);
    //console.log(`   🔧 Files needing copyright action: ${filesNeedingAction.length}`);

    if (filesNeedingAction.length > 0) {
        //console.log('   📋 Files that should be updated:');
        filesNeedingAction.forEach(file => {
            //console.log(`     • ${file.fileName}: ${file.expectedAction}`);
        });
    }

    //console.log('\n💡 Troubleshooting Tips:');
    //console.log('   • Check that VS Code extension is installed and enabled');
    //console.log('   • Verify "copyright-notice.silentMode" is set to true for quiet operation');
    //console.log('   • Try running the command manually: Ctrl+Shift+P → "Apply Copyright Notice"');
    //console.log('   • Check VS Code developer console (Help → Toggle Developer Tools) for errors');
    //console.log('   • Ensure files are not in excluded patterns');

    //console.log('\n✅ Diagnostic test completed!');
}

// Run diagnostic
main();
