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

        // Check for a well-formed multiline copyright block at the very beginning of the file.
        // It must start with /* or /**, contain 'Copyright (c) YYYY', and end with */
        const wellFormedCopyrightRegex = /^\s*\/\*\*?[\s\S]*?Copyright \(c\) \d{4}[\s\S]*?\*\/\s*/;
        return wellFormedCopyrightRegex.test(firstBlock);
    }

    /**
     * Check if a malformed copyright notice exists in document
     * A malformed copyright is one that contains "Copyright (c)" or "Copyright"
     * but is not a well-formed multiline block at the beginning of the file.
     * @param {string} text - Document text content
     * @returns {boolean} True if a malformed copyright notice exists
     */
    hasMalformedCopyright(text) {
        if (!text || text.length === 0) {
            return false;
        }

        const lines = text.split('\n');
        const firstLines = lines.slice(0, Math.min(10, lines.length)); // Check first 10 lines max
        const firstBlock = firstLines.join('\n');

        // A malformed copyright exists if 'Copyright (c)' or 'Copyright' is present
        // in the first block, AND it's not a well-formed copyright notice.
        const containsCopyrightKeyword = firstBlock.includes("Copyright (c)") || firstBlock.includes("Copyright");

        return containsCopyrightKeyword && !this.hasCopyrightNotice(text);
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

        // If well-formed copyright already exists, try to update timestamp if enabled
        const wellFormedCopyrightExists = this.hasCopyrightNotice(text);
        if (wellFormedCopyrightExists) {
            const updated = this.updateTimestampIfNeeded(editor);
            if (updated) {
                return true; // Successfully updated
            }
            return false; // Valid copyright, but timestamp update failed or not enabled
        } else if (this.hasMalformedCopyright(text)) {
            // Malformed copyright detected, replace with proper copyright
            const config = this.getConfig();
            const currentYear = new Date().getFullYear();
            let formattedTemplate = config.template.replace(/{year}/g, currentYear.toString());

            const now = new Date();
            if (config.includeTimestamp) {
                const timestamp = this.formatTimestamp(now, config.timestampFormat);
                formattedTemplate = formattedTemplate.replace(/{timestamp}/g, timestamp);
            }
            if (config.includeUpdateTime) {
                const updateTime = this.formatTimestamp(now, config.updateTimeFormat);
                formattedTemplate = formattedTemplate.replace(/{updatetime}/g, updateTime);
            }

            const lines = text.split('\n');
            let endMalformedIndex = -1;

            // Find the end of the malformed comment block
            // This logic needs to be robust for various malformed comment types.
            // Prioritize finding the end of /* ... */ or // ... or # ...
            for (let i = 0; i < Math.min(10, lines.length); i++) {
                const line = lines[i];
                if (line.includes("Copyright (c)") || line.includes("Copyright")) {
                    // If it's a multiline comment start, look for its end
                    if (line.trim().startsWith("/*")) {
                        const closeIndex = text.indexOf("*/", text.indexOf(line));
                        if (closeIndex !== -1) {
                            endMalformedIndex = closeIndex + 2; // Include */
                        } else {
                            // Unclosed multiline comment, assume it ends at the end of the line
                            endMalformedIndex = text.indexOf(line) + line.length;
                        }
                    } else if (line.trim().startsWith("//") || line.trim().startsWith("#")) {
                        // Single line comment, end at the end of this line
                        endMalformedIndex = text.indexOf(line) + line.length;
                    }
                    // If endMalformedIndex is found, we might need to include subsequent empty lines
                    if (endMalformedIndex !== -1) {
                        let nextLineIndex = i + 1;
                        while (nextLineIndex < lines.length && lines[nextLineIndex].trim() === '') {
                            endMalformedIndex = text.indexOf(lines[nextLineIndex]) + lines[nextLineIndex].length;
                            nextLineIndex++;
                        }
                    }
                    break;
                }
            }

            if (endMalformedIndex !== -1) {
                const afterCopyright = text.substring(endMalformedIndex).replace(/^\s*\n/, '');
                const newContent = formattedTemplate + afterCopyright;

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
            return false;
        } else {
            // No copyright found, insert at an appropriate position.
            const config = this.getConfig();
            const currentYear = new Date().getFullYear();
            let formattedTemplate = config.template.replace(/{year}/g, currentYear.toString());

            const now = new Date();
            if (config.includeTimestamp) {
                const timestamp = this.formatTimestamp(now, config.timestampFormat);
                formattedTemplate = formattedTemplate.replace(/{timestamp}/g, timestamp);
            }
            if (config.includeUpdateTime) {
                const updateTime = this.formatTimestamp(now, config.updateTimeFormat);
                formattedTemplate = formattedTemplate.replace(/{updatetime}/g, updateTime);
            }

            const edit = new vscode.WorkspaceEdit();

            if (text.length === 0) {
                edit.insert(document.uri, new vscode.Position(0, 0), formattedTemplate);
            } else {
                const lines = text.split('\n');
                let insertPosition = 0;
                let foundContent = false;
                let lineIndex = 0;

                // Calculate byte offset for a given line index
                const getOffsetForLine = (lineIdx) => {
                    let offset = 0;
                    for (let j = 0; j < lineIdx && j < lines.length; j++) {
                        offset += lines[j].length + 1; // +1 for newline character
                    }
                    return offset;
                };

                let leadingEmptyLines = 0;
                let hasShebang = false;

                while (lineIndex < lines.length) {
                    const line = lines[lineIndex];
                    const trimmedLine = line.trim();

                    // Track leading empty lines
                    if (trimmedLine === '') {
                        leadingEmptyLines++;
                        lineIndex++;
                        continue;
                    }

                    // Check for shebang - copyright should go AFTER shebang with blank line
                    if (trimmedLine.startsWith('#!')) {
                        hasShebang = true;
                        leadingEmptyLines = 0; // Reset - empty lines after shebang are not "leading"
                        lineIndex++;
                        continue;
                    }

                    // Found first non-empty, non-shebang line
                    insertPosition = getOffsetForLine(lineIndex);
                    foundContent = true;
                    break;
                }

                // If file has only whitespace/empty lines, insert at beginning
                if (!foundContent) {
                    insertPosition = 0;
                    foundContent = true;
                }

                // Prepare content to insert
                let contentToInsert = formattedTemplate;

                if (foundContent) {
                    // Ensure the template ends with at least one newline
                    if (!contentToInsert.endsWith('\n')) {
                        contentToInsert += '\n';
                    }

                    // Handle different cases
                    if (hasShebang) {
                        // After shebang: add blank line before copyright if not already present
                        const remainingText = text.substring(insertPosition);
                        const templateEndsWithDoubleNewline = contentToInsert.endsWith('\n\n');

                        if (!templateEndsWithDoubleNewline) {
                            contentToInsert = '\n' + contentToInsert;
                        }

                        // Add spacing after copyright
                        if (!remainingText.startsWith('\n')) {
                            contentToInsert += '\n';
                        }

                        edit.insert(document.uri, document.positionAt(insertPosition), contentToInsert);
                    } else if (leadingEmptyLines > 0 || insertPosition === 0) {
                        // File has leading empty lines or only whitespace - replace from start
                        const remainingText = text.substring(insertPosition);
                        const templateEndsWithDoubleNewline = contentToInsert.endsWith('\n\n');

                        if (!templateEndsWithDoubleNewline && remainingText && !remainingText.startsWith('\n')) {
                            contentToInsert += '\n';
                        }

                        // Replace from position 0 to remove leading empty lines
                        edit.replace(document.uri, new vscode.Range(
                            document.positionAt(0),
                            document.positionAt(insertPosition)
                        ), contentToInsert);
                    } else {
                        // Normal case - insert at current position
                        const remainingText = text.substring(insertPosition);
                        const templateEndsWithDoubleNewline = contentToInsert.endsWith('\n\n');
                        const remainingStartsWithNewline = remainingText.startsWith('\n');

                        if (!templateEndsWithDoubleNewline && !remainingStartsWithNewline) {
                            contentToInsert += '\n';
                        }

                        edit.insert(document.uri, document.positionAt(insertPosition), contentToInsert);
                    }
                } else {
                    // Fallback - should not reach here
                    if (!contentToInsert.endsWith('\n')) {
                        contentToInsert += '\n';
                    }
                    edit.insert(document.uri, document.positionAt(0), contentToInsert);
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
