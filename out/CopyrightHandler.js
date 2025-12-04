"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");

class CopyrightHandler {
    constructor() {
        // Configuration constants
        this.CONFIG_SECTION = 'copyright-notice';
        this.DEFAULT_TEMPLATE = "/* Copyright (c) {year} */\n\n";
        this.DEFAULT_WILDCARD = ["*"];
        this.DEFAULT_TIMESTAMP_FORMAT = "YYYY-MM-DD HH:mm:ss";
        
        // Debounce handling
        this.lastEditTime = Date.now();
        this.debounceInterval = 2000; // 2 seconds debounce
        
        // Bind methods to maintain 'this' context
        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleEditorChange = this.handleEditorChange.bind(this);
        this.updateTimestampIfNeeded = this.updateTimestampIfNeeded.bind(this);
    }

    /**
     * Get extension configuration
     * @returns {Object} The configuration object with all settings
     */
    getConfig() {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        return {
            languages: config.get('languages', this.DEFAULT_WILDCARD),
            fileExtensions: config.get('fileExtensions', this.DEFAULT_WILDCARD),
            excludedFiles: config.get('excludedFiles', []),
            template: config.get('template', this.DEFAULT_TEMPLATE),
            includeTimestamp: config.get('includeTimestamp', false),
            timestampFormat: config.get('timestampFormat', this.DEFAULT_TIMESTAMP_FORMAT),
            includeUpdateTime: config.get('includeUpdateTime', false),
            updateTimeFormat: config.get('updateTimeFormat', this.DEFAULT_TIMESTAMP_FORMAT),
            autoRemoveEmojis: config.get('autoRemoveEmojis', false)
        };
    }

    /**
     * Check if a filename matches a glob pattern
     * @param {string} fileName - The filename to check
     * @param {string} pattern - The glob pattern (e.g., "*.json", "*.config.js")
     * @returns {boolean} True if the filename matches the pattern
     */
    matchesPattern(fileName, pattern) {
        // Simple glob pattern matching
        const regexPattern = pattern
            .replace(/\./g, '\\.')  // Escape dots
            .replace(/\*/g, '.*')   // Convert * to .*
            .replace(/\?/g, '.')    // Convert ? to .
            .replace(/\[/g, '\\[')  // Escape [
            .replace(/\]/g, '\\]')  // Escape ]
            .replace(/\(/g, '\\(')  // Escape (
            .replace(/\)/g, '\\)')  // Escape )
            .replace(/\|/g, '\\|')  // Escape |
            .replace(/\+/g, '\\+')  // Escape +
            .replace(/\^/g, '\\^')  // Escape ^
            .replace(/\$/g, '\\$')  // Escape $
            .replace(/\{/g, '\\{')  // Escape {
            .replace(/\}/g, '\\}')  // Escape }
            .replace(/\\/g, '\\\\'); // Escape backslashes
        
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(fileName);
    }

    /**
     * Format a timestamp according to the specified format
     * @param {Date} date - The date to format
     * @param {string} format - The format string
     * @returns {string} The formatted timestamp
     */
    formatTimestamp(date, format) {
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        
        return format
            .replace(/YYYY/g, year)
            .replace(/MM/g, month)
            .replace(/DD/g, day)
            .replace(/HH/g, hours)
            .replace(/mm/g, minutes)
            .replace(/ss/g, seconds);
    }

    /**
     * Check if copyright notice already exists in document
     * @param {string} text - Document text content
     * @returns {boolean} True if copyright notice exists
     */
    hasCopyrightNotice(text) {
        if (!text || text.length === 0) {
            return false;
        }

        // Get first few lines to check for copyright
        const lines = text.split('\n');
        const firstLines = lines.slice(0, Math.min(10, lines.length)); // Check first 10 lines max
        const firstBlock = firstLines.join('\n');

        // Check for copyright notice patterns in the beginning of file
        return firstBlock.includes("Copyright (c)") ||
               (firstBlock.startsWith("/*") && firstBlock.includes("Copyright")) ||
               (firstBlock.startsWith("/**") && firstBlock.includes("Copyright")) ||
               (firstBlock.startsWith("//") && firstBlock.includes("Copyright")) ||
               (firstBlock.startsWith("#") && firstBlock.includes("Copyright"));
    }

    /**
     * Update the "Last Updated" timestamp in an existing copyright notice
     * @param {vscode.TextEditor} editor - The active text editor
     * @returns {Promise<boolean>} Promise resolving to true if notice was updated
     */
    async updateTimestampIfNeeded(editor) {
        const config = this.getConfig();
        
        // Skip if update time is not enabled
        if (!config.includeUpdateTime) {
            return false;
        }
        
        const document = editor.document;
        
        // Check if document is eligible for copyright notices
        if (!this.isEnabled(document)) {
            return false;
        }
        
        const text = document.getText();
        
        // Skip if no copyright exists
        if (!this.hasCopyrightNotice(text)) {
            return false;
        }

        // Find the copyright block at the beginning of the file
        const copyrightBlockRegex = /\/\*[\s\S]*?\*\//;
        const blockMatch = text.match(copyrightBlockRegex);
        
        if (!blockMatch) {
            return false;
        }

        const copyrightBlock = blockMatch[0];
        
        // Find the "Last Updated" line within the copyright block
        const updateLineRegex = /(.*Last\s+Updated:)([^]*?)(\n\s*\*|$)/i;
        const lineMatch = copyrightBlock.match(updateLineRegex);

        if (!lineMatch) {
            return false;
        }

        // Get the prefix and the content after the timestamp
        const prefix = lineMatch[1]; // "* Last Updated:"
        const oldContent = lineMatch[2]; // Timestamp and anything after it
        const suffix = lineMatch[3];  // Line ending and next line start
        
        // Format the new timestamp
        const now = new Date();
        const newTimestamp = this.formatTimestamp(now, config.updateTimeFormat);
        
        // Create new "Last Updated" line with proper spacing preserved
        const newContent = ` ${newTimestamp}`;
        
        // Replace entire "Last Updated" line to ensure proper formatting
        const startIndex = blockMatch.index + lineMatch.index;
        const oldLineLength = lineMatch[0].length;
        
        const startPosition = document.positionAt(startIndex);
        const endPosition = document.positionAt(startIndex + oldLineLength);
        
        const newLine = `${prefix}${newContent}${suffix}`;
        
        const edit = new vscode.WorkspaceEdit();
        const range = new vscode.Range(startPosition, endPosition);
        
        edit.replace(document.uri, range, newLine);
        
        try {
            const success = await vscode.workspace.applyEdit(edit);
            return success;
        } catch (error) {
            console.error('Failed to update timestamp:', error);
            return false;
        }
    }

    /**
     * Add copyright notice to document if needed
     * @param {vscode.TextEditor} editor - The active text editor
     * @returns {Promise<boolean>} Promise resolving to true if notice was added
     */
    async addCopyrightIfNeeded(editor) {
        if (!this.isEnabled(editor.document)) {
            return false;
        }

        const document = editor.document;
        const text = document.getText();
        
        // If copyright already exists, try to update timestamp if enabled
        if (this.hasCopyrightNotice(text)) {
            const updated = this.updateTimestampIfNeeded(editor);
            if (updated) {
                return true; // Successfully updated
            }
            // If update failed, the copyright might be malformed
            // Check if it's a valid copyright block
            const copyrightBlockRegex = /\/\*[\s\S]*?\*\//;
            const blockMatch = text.match(copyrightBlockRegex);

            if (blockMatch && blockMatch.index === 0) {
                // Valid copyright block exists, don't modify
                return false;
            } else {
                // Malformed copyright or false positive - replace with proper copyright
                // Remove the malformed copyright line(s) and insert proper one
                const lines = text.split('\n');
                let endMalformedIndex = 0;

                // Find where malformed copyright ends
                for (let i = 0; i < lines.length && i < 5; i++) { // Check first 5 lines
                    if (lines[i].includes('Copyright')) {
                        endMalformedIndex = text.indexOf(lines[i]) + lines[i].length;
                        if (i + 1 < lines.length && lines[i + 1].trim() === '') {
                            endMalformedIndex = text.indexOf(lines[i + 1]) + lines[i + 1].length;
                        }
                        break;
                    }
                }

                if (endMalformedIndex > 0) {
                    // Replace malformed copyright with proper one
                    const beforeCopyright = text.substring(0, endMalformedIndex);
                    const afterCopyright = text.substring(endMalformedIndex);

                    // Clean up extra whitespace
                    const cleanAfter = afterCopyright.replace(/^\s*\n/, '');

                    const newContent = formattedTemplate + cleanAfter;

                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(document.uri, new vscode.Range(
                        document.positionAt(0),
                        document.positionAt(text.length)
                    ), newContent);

                    try {
                        const success = await vscode.workspace.applyEdit(edit);
                        if (success) {
                            await document.save();
                            return true;
                        }
                    } catch (error) {
                        console.error('Failed to fix malformed copyright:', error);
                    }
                }
            }
            return false;
        }

        // Get configuration
        const config = this.getConfig();
        
        // Replace template placeholders
        const currentYear = new Date().getFullYear();
        let formattedTemplate = config.template.replace(/{year}/g, currentYear.toString());
        
        const now = new Date();
        
        // Add creation timestamp if enabled
        if (config.includeTimestamp) {
            const timestamp = this.formatTimestamp(now, config.timestampFormat);
            formattedTemplate = formattedTemplate.replace(/{timestamp}/g, timestamp);
        }
        
        // Add update timestamp if enabled
        if (config.includeUpdateTime) {
            const updateTime = this.formatTimestamp(now, config.updateTimeFormat);
            formattedTemplate = formattedTemplate.replace(/{updatetime}/g, updateTime);
        }

        // Add copyright to the beginning of the file
        const edit = new vscode.WorkspaceEdit();

        // If file is empty, just insert copyright
        if (text.length === 0) {
            edit.insert(document.uri, new vscode.Position(0, 0), formattedTemplate);
        } else {
            // Find the first non-empty line to insert copyright before it
            const lines = text.split('\n');
            let insertPosition = 0;
            let insertLine = 0;

            // Find first non-empty, non-comment line (skip shebang and license comments)
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                // Skip empty lines, shebang, and license comments that don't contain actual code
                if (line === '' ||
                    line.startsWith('#!') ||
                    (line.startsWith('//') && (line.includes('License') || line.includes('Copyright') || line.includes('license') || line.includes('copyright')))) {
                    continue;
                }
                // Found the insertion point
                insertLine = i;
                insertPosition = text.indexOf(lines[i]);
                break;
            }

            // If we found a good insertion point, insert before it
            if (insertLine > 0 || (insertLine === 0 && lines[0].trim() !== '')) {
                // Ensure proper spacing before existing content
                let contentToInsert = formattedTemplate;
                const lineBefore = insertLine > 0 ? lines[insertLine - 1] : '';
                const currentLine = lines[insertLine] || '';

                // Add newline if needed between copyright and existing content
                if (!contentToInsert.endsWith('\n')) {
                    contentToInsert += '\n';
                }

                // If inserting in the middle, ensure we have proper separation
                if (insertLine > 0 && !lineBefore.endsWith('\n') && lineBefore.trim() !== '') {
                    contentToInsert = '\n' + contentToInsert;
                }

                edit.insert(document.uri, document.positionAt(insertPosition), contentToInsert);
            } else {
                // Fallback: insert at the very beginning
                let contentToInsert = formattedTemplate;
                if (!contentToInsert.endsWith('\n') && text.length > 0) {
                    contentToInsert += '\n';
                }
                edit.insert(document.uri, new vscode.Position(0, 0), contentToInsert);
            }
        }
        
        try {
            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                await document.save();
                return true;
            }
        } catch (error) {
            console.error('Failed to apply copyright notice:', error);
        }
        
        return false;
    }

    /**
     * Check if extension should be enabled for this document
     * @param {vscode.TextDocument} document - The document to check
     * @returns {boolean} True if extension is enabled for this document
     */
    isEnabled(document) {
        if (!document) {
            return false;
        }
        
        const languageId = document.languageId;
        const fileName = document.fileName;
        const fileExtension = fileName.substring(fileName.lastIndexOf('.')) || '';
        
        const { languages, fileExtensions, excludedFiles } = this.getConfig();
        
        // Check if file is explicitly excluded
        for (const pattern of excludedFiles) {
            if (this.matchesPattern(fileName, pattern)) {
                return false;
            }
        }
        
        const hasWildcardLanguage = languages.includes("*");
        const hasWildcardExtension = fileExtensions.includes("*");
        
        // Check if language is enabled
        const languageEnabled = hasWildcardLanguage || languages.includes(languageId);
        
        // Check if file extension is enabled
        const extensionEnabled = hasWildcardExtension || fileExtensions.includes(fileExtension);
        
        // Enable if EITHER language OR extension is enabled (not both required)
        // This allows .ahk2 files to work even if VS Code doesn't recognize the language ID
        return languageEnabled || extensionEnabled;
    }

    /**
     * Handle text document changes with debouncing
     * @param {vscode.TextDocumentChangeEvent} event - The change event
     */
    handleTextChange(event) {
        const now = Date.now();
        
        // Only proceed if enough time has passed since last edit
        if (now - this.lastEditTime > this.debounceInterval) {
            this.lastEditTime = now;
            
            // Debounce to avoid processing during rapid typing
            setTimeout(() => {
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.document === event.document) {
                    const config = this.getConfig();
                    
                    // If we have an existing copyright with updatetime enabled,
                    // update the timestamp
                    if (config.includeUpdateTime) {
                        this.updateTimestampIfNeeded(editor);
                    } else {
                        // Otherwise just check if we need to add a copyright
                        this.addCopyrightIfNeeded(editor);
                    }
                }
            }, this.debounceInterval);
        }
    }

    /**
     * Handle editor change events
     * @param {vscode.TextEditor} editor - The new active editor
     */
    handleEditorChange(editor) {
        if (editor) {
            this.addCopyrightIfNeeded(editor);
        }
    }

    /**
     * Handle document save events - auto-remove emojis if enabled
     * @param {vscode.TextDocument} document - The saved document
     */
    async handleDocumentSave(document) {
        const config = this.getConfig();

        // Skip if auto-remove emojis is not enabled
        if (!config.autoRemoveEmojis) {
            return;
        }

        // Check if document is eligible for emoji removal
        if (!this.isEnabled(document)) {
            return;
        }

        const text = document.getText();

        // Regular expression to match various emoji ranges in Unicode
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1f926}-\u{1f937}]|[\u{10000}-\u{1fffd}]|[\u{1f1f2}-\u{1f1f4}]|[\u{1f1e6}-\u{1f1ff}]|[\u{1f191}-\u{1f19a}]|[\u{1f232}-\u{1f23c}]|[\u{1f250}-\u{1f251}]|[\u{1f21a}]|[\u{1f22f}]|[\u{1f190}]|[\u{1f18e}]|[\u{1f17e}]|[\u{1f17f}]|[\u{1f171}-\u{1f17a}]|[\u{1f17b}-\u{1f17d}]|[\u{1f0cf}]|[\u{1f93a}-\u{1f93c}]|[\u{1f946}]|[\u{1f985}-\u{1f994}]|[\u{1f9d0}-\u{1f9ff}]|[\u{1f9c0}]|[\u{1f9b0}-\u{1f9b3}]|[\u{1f9b4}-\u{1f9b7}]|[\u{1f9b8}-\u{1f9bf}]|[\u{1f9c1}-\u{1f9c2}]|[\u{1f9c3}-\u{1f9cf}]|[\u{1f9d0}-\u{1f9ff}]|[\u{1f9e0}-\u{1f9ff}]/gu;

        const cleanedText = text.replace(emojiRegex, '');

        // If text didn't change, no emojis were found
        if (cleanedText === text) {
            return;
        }

        // Find the active editor for this document
        const editors = vscode.window.visibleTextEditors;
        const editor = editors.find(e => e.document === document);

        if (!editor) {
            return;
        }

        // Replace the entire document content
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length)
        );

        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, fullRange, cleanedText);

        try {
            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                // Save the document after emoji removal
                await document.save();
            }
        } catch (error) {
            console.error('Failed to auto-remove emojis:', error);
        }
    }

    /**
     * Remove all emojis from the document
     * @param {vscode.TextEditor} editor - The active text editor
     * @returns {Promise<boolean>} Promise resolving to true if emojis were removed
     */
    async removeEmojis(editor) {
        if (!editor) {
            return false;
        }

        const document = editor.document;
        const text = document.getText();

        // Regular expression to match various emoji ranges in Unicode
        // This covers most emojis including skin tone modifiers, flags, etc.
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1f926}-\u{1f937}]|[\u{10000}-\u{1fffd}]|[\u{1f1f2}-\u{1f1f4}]|[\u{1f1e6}-\u{1f1ff}]|[\u{1f191}-\u{1f19a}]|[\u{1f232}-\u{1f23c}]|[\u{1f250}-\u{1f251}]|[\u{1f21a}]|[\u{1f22f}]|[\u{1f190}]|[\u{1f18e}]|[\u{1f17e}]|[\u{1f17f}]|[\u{1f171}-\u{1f17a}]|[\u{1f17b}-\u{1f17d}]|[\u{1f0cf}]|[\u{1f93a}-\u{1f93c}]|[\u{1f946}]|[\u{1f985}-\u{1f994}]|[\u{1f9d0}-\u{1f9ff}]|[\u{1f9c0}]|[\u{1f9b0}-\u{1f9b3}]|[\u{1f9b4}-\u{1f9b7}]|[\u{1f9b8}-\u{1f9bf}]|[\u{1f9c1}-\u{1f9c2}]|[\u{1f9c3}-\u{1f9cf}]|[\u{1f9d0}-\u{1f9ff}]|[\u{1f9e0}-\u{1f9ff}]/gu;

        const cleanedText = text.replace(emojiRegex, '');

        // If text didn't change, no emojis were found
        if (cleanedText === text) {
            return false;
        }

        // Replace the entire document content
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length)
        );

        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, fullRange, cleanedText);

        try {
            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                await document.save();
                return true;
            }
        } catch (error) {
            console.error('Failed to remove emojis:', error);
        }

        return false;
    }

    /**
     * Start listening to VS Code events
     * @returns {vscode.Disposable[]} Array of event subscriptions
     */
    run() {
        // Create disposables for event listeners
        const subscriptions = [
            vscode.workspace.onDidChangeTextDocument(this.handleTextChange),
            vscode.window.onDidChangeActiveTextEditor(this.handleEditorChange),
            vscode.workspace.onDidSaveTextDocument(this.handleDocumentSave)
        ];

        return subscriptions;
    }
}

exports.CopyrightHandler = CopyrightHandler;
//# sourceMappingURL=CopyrightHandler.js.map 
