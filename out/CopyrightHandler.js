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
            template: config.get('template', this.DEFAULT_TEMPLATE),
            includeTimestamp: config.get('includeTimestamp', false),
            timestampFormat: config.get('timestampFormat', this.DEFAULT_TIMESTAMP_FORMAT),
            includeUpdateTime: config.get('includeUpdateTime', false),
            updateTimeFormat: config.get('updateTimeFormat', this.DEFAULT_TIMESTAMP_FORMAT)
        };
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
        const trimmedText = text.trim();
        // More comprehensive check for various copyright notice formats
        return trimmedText.startsWith("/* Copyright") || 
               trimmedText.startsWith("/**") && trimmedText.includes("Copyright") ||
               trimmedText.startsWith("//") && trimmedText.includes("Copyright") ||
               trimmedText.startsWith("#") && trimmedText.includes("Copyright") ||
               trimmedText.includes("Copyright (c)");
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
        const copyrightBlockRegex = /\/\*\*[\s\S]*?\*\//;
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
            return this.updateTimestampIfNeeded(editor);
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
        edit.insert(document.uri, new vscode.Position(0, 0), formattedTemplate);
        
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
        
        const { languages, fileExtensions } = this.getConfig();
        
        const hasWildcardLanguage = languages.includes("*");
        const hasWildcardExtension = fileExtensions.includes("*");
        
        const languageEnabled = hasWildcardLanguage || languages.includes(languageId);
        const extensionEnabled = hasWildcardExtension || fileExtensions.includes(fileExtension);
        
        return languageEnabled && extensionEnabled;
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
     * Start listening to VS Code events
     * @returns {vscode.Disposable[]} Array of event subscriptions
     */
    run() {
        // Create disposables for event listeners
        const subscriptions = [
            vscode.workspace.onDidChangeTextDocument(this.handleTextChange),
            vscode.window.onDidChangeActiveTextEditor(this.handleEditorChange)
        ];
        
        return subscriptions;
    }
}

exports.CopyrightHandler = CopyrightHandler;
//# sourceMappingURL=CopyrightHandler.js.map 