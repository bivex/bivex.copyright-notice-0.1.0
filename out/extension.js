'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const CopyrightHandler_1 = require("./CopyrightHandler");

/**
 * Activate the extension
 * @param {vscode.ExtensionContext} context - Extension context
 */
function activate(context) {
    // Create handler instance
    const copyrightHandler = new CopyrightHandler_1.CopyrightHandler();
    
    // Start the handler and collect disposables
    const handlerDisposables = copyrightHandler.run();
    
    // Register manual command
    const commandDisposable = vscode.commands.registerCommand(
        'copyright-notice.apply', 
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor found to apply copyright notice.');
                return;
            }
            
            try {
                const added = await copyrightHandler.addCopyrightIfNeeded(editor);
                if (added) {
                    vscode.window.showInformationMessage('Copyright notice applied!');
                } else {
                    vscode.window.showInformationMessage('No copyright notice needed or could not be applied.');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Error applying copyright notice: ${error.message}`);
                console.error('Error in copyright-notice.apply command:', error);
            }
        }
    );
    
    // Register all disposables
    context.subscriptions.push(
        commandDisposable,
        ...handlerDisposables
    );
    
    console.log('Copyright Notice extension activated');
}

/**
 * Deactivate the extension
 */
function deactivate() {
    // Nothing to clean up
    console.log('Copyright Notice extension deactivated');
}

exports.activate = activate;
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map 