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
            console.log(`[Copyright] Select profile command triggered`);
            try {
                const config = vscode.workspace.getConfiguration('copyright-notice');
                let profiles = config.get('profiles', []);

                console.log(`[Copyright] Raw profiles from config:`, profiles);

                // If no profiles in user settings, try to get defaults from package.json
                if (profiles.length === 0) {
                    console.log(`[Copyright] No user profiles found, checking package.json defaults...`);
                    try {
                        // This is a fallback - in real VS Code, defaults should be loaded automatically
                        const packageJson = require('../package.json');
                        profiles = packageJson.contributes.configuration.properties['copyright-notice.profiles'].default || [];
                        console.log(`[Copyright] Loaded ${profiles.length} profiles from package.json defaults`);
                    } catch (error) {
                        console.error(`[Copyright] Error loading package.json:`, error);
                    }
                }

                const activeProfile = config.get('activeProfile', 'Open Source MIT');

                console.log(`[Copyright] Final profiles count: ${profiles.length}`);
                console.log(`[Copyright] Available profiles:`, profiles.map(p => p.name));
                console.log(`[Copyright] Active profile: ${activeProfile}`);

                if (profiles.length === 0) {
                    vscode.window.showErrorMessage('No copyright profiles configured. Please check your VS Code settings and package.json.');
                    console.log(`[Copyright] No profiles found anywhere. This is a configuration issue.`);
                    return;
                }

                // Create quick pick items
                const profileItems = profiles.map(profile => ({
                    label: profile.name,
                    description: profile.description,
                    detail: activeProfile === profile.name ? '✓ Currently active' : '',
                    picked: activeProfile === profile.name
                }));

                // Add option to skip author input
                const skipAuthorOption = {
                    label: '⚡ Quick Switch (keep current author)',
                    description: 'Switch profile without changing author name',
                    detail: 'Use existing author name for the selected profile'
                };

                const allItems = [skipAuthorOption, ...profileItems];

                // Show quick pick menu
                const selectedItem = await vscode.window.showQuickPick(allItems, {
                    placeHolder: 'Select a copyright profile (or quick switch)',
                    matchOnDescription: true,
                    matchOnDetail: false
                });

                if (selectedItem) {
                    // Handle quick switch option
                    if (selectedItem.label === '⚡ Quick Switch (keep current author)') {
                        const quickPickItems = profileItems.map(item => ({
                            ...item,
                            detail: item.detail || 'Switch to this profile'
                        }));

                        const profileToSwitch = await vscode.window.showQuickPick(quickPickItems, {
                            placeHolder: 'Select profile to switch to',
                            matchOnDescription: true
                        });

                        if (profileToSwitch) {
                            await config.update('activeProfile', profileToSwitch.label, vscode.ConfigurationTarget.Workspace);
                            const message = `Copyright profile switched to: ${profileToSwitch.label}`;
                            vscode.window.showInformationMessage(message);
                            console.log(`[Copyright] Quick switched to profile: ${profileToSwitch.label}`);
                        }
                        return;
                    }
                    // Get current author name for this profile
                    const profileAuthors = config.get('profileAuthors', {});
                    const currentAuthor = profileAuthors[selectedItem.label] || '';

                    // Ask user to enter author name
                    const authorName = await vscode.window.showInputBox({
                        prompt: `Enter author/company name for "${selectedItem.label}" profile`,
                        placeHolder: 'Your Name, Company Name, etc.',
                        value: currentAuthor,
                        validateInput: (value) => {
                            if (!value || value.trim().length === 0) {
                                return 'Author name cannot be empty';
                            }
                            return null;
                        }
                    });

                    if (authorName === undefined) { // User cancelled
                        vscode.window.showInformationMessage(`Profile selection cancelled. Profile not changed.`);
                        return;
                    }

                    if (authorName !== undefined) { // User entered a name
                        // Save author name for this profile
                        profileAuthors[selectedItem.label] = authorName.trim();
                        await config.update('profileAuthors', profileAuthors, vscode.ConfigurationTarget.Workspace);

                        // Update active profile
                        await config.update('activeProfile', selectedItem.label, vscode.ConfigurationTarget.Workspace);

                        const message = `Copyright profile changed to: ${selectedItem.label} (Author: ${authorName.trim()})`;
                        vscode.window.showInformationMessage(message);
                        console.log(`[Copyright] Active profile changed to: ${selectedItem.label} with author: ${authorName.trim()}`);
                    }
                }

            } catch (error) {
                vscode.window.showErrorMessage(`Error selecting copyright profile: ${error.message}`);
                console.error('Error in copyright-notice.select-profile command:', error);
            }
        }
    );

    // Register diagnose profiles command
    const diagnoseProfilesCommandDisposable = vscode.commands.registerCommand(
        'copyright-notice.diagnose-profiles',
        async () => {
            try {
                console.log(`[Copyright] Running profile diagnostics...`);

                const config = vscode.workspace.getConfiguration('copyright-notice');
                const profiles = config.get('profiles', []);
                const activeProfile = config.get('activeProfile', 'Open Source MIT');
                const profileAuthors = config.get('profileAuthors', {});

                let message = `🔍 Copyright Profiles Diagnostics\n\n`;
                message += `Active Profile: ${activeProfile}\n`;
                message += `Total Profiles: ${profiles.length}\n\n`;

                if (profiles.length === 0) {
                    message += `❌ No profiles found in user settings.\n`;
                    message += `This might be the issue - profiles should load from package.json defaults.\n\n`;

                    // Try to load defaults
                    try {
                        const packageJson = require('../package.json');
                        const defaultProfiles = packageJson.contributes.configuration.properties['copyright-notice.profiles'].default;
                        message += `📦 Found ${defaultProfiles.length} profiles in package.json:\n`;
                        defaultProfiles.forEach((profile, index) => {
                            message += `${index + 1}. ${profile.name}\n`;
                        });
                    } catch (error) {
                        message += `❌ Could not load package.json defaults: ${error.message}\n`;
                    }
                } else {
                    message += `✅ Profiles loaded successfully:\n`;
                    profiles.forEach((profile, index) => {
                        const author = profileAuthors[profile.name] || 'Not set';
                        const isActive = profile.name === activeProfile ? ' (ACTIVE)' : '';
                        message += `${index + 1}. ${profile.name}${isActive} - Author: ${author}\n`;
                    });
                }

                message += `\n💡 If you can't select profiles, try:\n`;
                message += `1. Reload VS Code window (Ctrl/Cmd + Shift + P → "Developer: Reload Window")\n`;
                message += `2. Check if you're in a workspace folder\n`;
                message += `3. Verify extension is properly installed\n`;

                console.log(message);
                vscode.window.showInformationMessage('Profile diagnostics logged to console. Check Developer Console (Help → Toggle Developer Tools).');

            } catch (error) {
                vscode.window.showErrorMessage(`Error running diagnostics: ${error.message}`);
                console.error('Error in copyright-notice.diagnose-profiles command:', error);
            }
        }
    );

    // Register all disposables
    context.subscriptions.push(
        commandDisposable,
        removeEmojisCommandDisposable,
        applyToAllCommandDisposable,
        selectProfileCommandDisposable,
        diagnoseProfilesCommandDisposable,
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
