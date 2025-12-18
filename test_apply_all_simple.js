// Simple test script to verify applyToAllFiles functionality
// Run this in VS Code Developer Console or as a command

const vscode = require('vscode');
const { CopyrightHandler } = require('./out/CopyrightHandler');

async function testApplyToAllFiles() {
    console.log('🧪 Testing applyToAllFiles functionality...');

    try {
        const handler = new CopyrightHandler();
        const result = await handler.applyToAllFiles();

        console.log('✅ applyToAllFiles completed:', result);

        // Show notification
        if (result.processed > 0) {
            vscode.window.showInformationMessage(
                `Copyright applied to ${result.processed} files (${result.skipped} skipped, ${result.errors} errors)`
            );
        } else {
            vscode.window.showWarningMessage('No files were processed. Check console for details.');
        }

        return result;
    } catch (error) {
        console.error('❌ Error in test:', error);
        vscode.window.showErrorMessage(`Test failed: ${error.message}`);
        throw error;
    }
}

// Export for use in VS Code
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testApplyToAllFiles };
}

// Auto-run if executed directly
if (typeof window === 'undefined') {
    testApplyToAllFiles().then(result => {
        console.log('Test completed successfully');
    }).catch(error => {
        console.error('Test failed:', error);
    });
}