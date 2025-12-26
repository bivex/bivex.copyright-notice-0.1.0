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
                const result = await copyrightHandler.addCopyrightIfNeeded(editor);
                if (result.success) {
                    if (result.action === 'no_action') {
                        vscode.window.showInformationMessage('Copyright notice is already current.');
                    } else {
                        vscode.window.showInformationMessage(`Copyright notice ${result.action.replace('_', ' ')} successfully!`);
                    }
                } else {
                    vscode.window.showErrorMessage(`Could not apply copyright notice: ${result.details}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Error applying copyright notice: ${error.message}`);
                console.error('Error in copyright-notice.apply command:', error);
            }
        }
    );

    // Register remove emojis command
    const removeEmojisCommandDisposable = vscode.commands.registerCommand(
        'copyright-notice.remove-emojis',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor found to remove emojis from.');
                return;
            }

            try {
                const removed = await copyrightHandler.removeEmojis(editor);
                if (removed) {
                    vscode.window.showInformationMessage('All emojis have been removed from the file!');
                } else {
                    vscode.window.showInformationMessage('No emojis found in the file.');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Error removing emojis: ${error.message}`);
                console.error('Error in copyright-notice.remove-emojis command:', error);
            }
        }
    );

    // Register apply to all files command
    const applyToAllCommandDisposable = vscode.commands.registerCommand(
        'copyright-notice.apply-to-all',
        async () => {
            try {
                vscode.window.showInformationMessage('Starting to apply copyright notice to all files in the project. This may take a while...');

                const result = await copyrightHandler.applyToAllFiles();

                // Show results
                const message = `Copyright notice processing completed!\n` +
                    `✅ Processed: ${result.processed} files\n` +
                    `⏭️ Skipped: ${result.skipped} files\n` +
                    `❌ Errors: ${result.errors} files`;

                if (result.errors > 0) {
                    vscode.window.showWarningMessage(message);
                    console.log('Errors:', result.errorDetails);
                } else {
                    vscode.window.showInformationMessage(message);
                }

            } catch (error) {
                vscode.window.showErrorMessage(`Error applying copyright to all files: ${error.message}`);
                console.error('Error in copyright-notice.apply-to-all command:', error);
            }
        }
    );

    // Register select profile command
    const selectProfileCommandDisposable = vscode.commands.registerCommand(
        'copyright-notice.select-profile',
        async () => {
            try {
                const config = vscode.workspace.getConfiguration('copyright-notice');
                const profiles = config.get('profiles', []);
                const activeProfile = config.get('activeProfile', 'Open Source');

                if (profiles.length === 0) {
                    vscode.window.showWarningMessage('No copyright profiles configured. Please add profiles in your settings.');
                    return;
                }

                // Create quick pick items
                const profileItems = profiles.map(profile => ({
                    label: profile.name,
                    description: profile.description,
                    detail: activeProfile === profile.name ? '✓ Currently active' : '',
                    picked: activeProfile === profile.name
                }));

                // Show quick pick menu
                const selectedItem = await vscode.window.showQuickPick(profileItems, {
                    placeHolder: 'Select a copyright profile',
                    matchOnDescription: true,
                    matchOnDetail: false
                });

                if (selectedItem) {
                    // Update active profile
                    await config.update('activeProfile', selectedItem.label, vscode.ConfigurationTarget.Workspace);

                    const message = `Copyright profile changed to: ${selectedItem.label}`;
                    vscode.window.showInformationMessage(message);
                    console.log(`[Copyright] Active profile changed to: ${selectedItem.label}`);
                }

            } catch (error) {
                vscode.window.showErrorMessage(`Error selecting copyright profile: ${error.message}`);
                console.error('Error in copyright-notice.select-profile command:', error);
            }
        }
    );

    // Register all disposables
    context.subscriptions.push(
        commandDisposable,
        removeEmojisCommandDisposable,
        applyToAllCommandDisposable,
        selectProfileCommandDisposable,
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
