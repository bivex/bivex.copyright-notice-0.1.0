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
        this.debounceInterval = 2000; // Default debounce, will be updated from config

        // Bind methods to maintain 'this' context
        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleEditorChange = this.handleEditorChange.bind(this);
        this.handleDocumentOpen = this.handleDocumentOpen.bind(this);
        this.handleDocumentSave = this.handleDocumentSave.bind(this);
        this.updateTimestampIfNeeded = this.updateTimestampIfNeeded.bind(this);

        // File state cache for background processing optimization
        this.fileStateCache = new Map();
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
            allowedFolders: config.get('allowedFolders', []),
            template: config.get('template', this.DEFAULT_TEMPLATE),
            includeTimestamp: config.get('includeTimestamp', false),
            timestampFormat: config.get('timestampFormat', this.DEFAULT_TIMESTAMP_FORMAT),
            includeUpdateTime: config.get('includeUpdateTime', false),
            updateTimeFormat: config.get('updateTimeFormat', this.DEFAULT_TIMESTAMP_FORMAT),
            autoRemoveEmojis: config.get('autoRemoveEmojis', false),
            silentMode: config.get('silentMode', true),
            backgroundUpdateDelay: config.get('backgroundUpdateDelay', 1500),
            smartDebouncing: config.get('smartDebouncing', true),
            smartDebounceMultiplier: config.get('smartDebounceMultiplier', 2.0),
            smartDebounceThreshold: config.get('smartDebounceThreshold', 300000)
        };
    }

    /**
     * Check if file should be updated immediately (inactive file detection)
     * @param {vscode.TextDocument} document - The document to check
     * @param {Object} config - Extension configuration
     * @returns {boolean} True if file should be updated immediately
     */
    shouldUpdateInactiveFile(document, config) {
        if (!config.smartDebouncing) {
            return false;
        }

        // Get cached state for this file
        const cachedState = this.getCachedFileState(document);
        if (!cachedState) {
            return false;
        }

        const timeSinceCache = Date.now() - cachedState.cachedAt;
        const threshold = config.smartDebounceThreshold * 2; // More aggressive threshold for immediate updates

        // If file hasn't been processed for a while, update immediately when user switches to it
        return timeSinceCache > threshold;
    }

    /**
     * Calculate dynamic debounce delay based on file activity
     * @returns {number} Debounce delay in milliseconds
     */
    getDebounceDelay() {
        const config = this.getConfig();
        const baseDelay = config.backgroundUpdateDelay || this.debounceInterval;

        if (!config.smartDebouncing) {
            return baseDelay;
        }

        const timeSinceLastEdit = Date.now() - this.lastEditTime;
        const threshold = config.smartDebounceThreshold;

        if (timeSinceLastEdit < threshold) {
            // Normal delay for recently edited files
            return baseDelay;
        }

        // Calculate multiplier based on how long file has been inactive
        const multiplier = Math.min(
            config.smartDebounceMultiplier +
            Math.floor(timeSinceLastEdit / threshold) * 0.5, // Additional 0.5x per threshold period
            5.0 // Max multiplier of 5.0
        );

        const smartDelay = Math.min(baseDelay * multiplier, 10000); // Max 10 seconds

        console.log(`[Copyright] Smart debouncing: ${timeSinceLastEdit}ms since last edit → multiplier: ${multiplier.toFixed(1)}x → ${smartDelay}ms delay`);
        return smartDelay;
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
        const firstLines = lines.slice(0, Math.min(20, lines.length)); // Check first 20 lines max
        const firstBlock = firstLines.join('\n');

        // Check for a well-formed copyright block at the very beginning of the file.
        // Supports multiple formats: multiline comments, single-line comments, HTML entities
        const multilineCopyrightRegex = /\/\*\*?[\s\S]*?(Copyright|©)[\s\S]*?\d{4}[\s\S]*?\*\//;
        const singleLineCopyrightRegex = /(?!.*(?:\{|\}|\);))(?:(copyright)[\s\t]*(?:(&copy;|\(c\)|&#(?:169|xa9;)|©)[\s\t]+)?)(?:((?:((?:(?:19|20)[\d]{2}))[^\w\n]*)*)([\s\t,\w]*))/i;

        // Check both multiline (primary) and single-line formats
        const hasWellFormedCopyright = multilineCopyrightRegex.test(firstBlock) ||
            (singleLineCopyrightRegex.test(firstBlock) && (firstBlock.includes('//') || firstBlock.includes('#')));
        return hasWellFormedCopyright;
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
        const firstLines = lines.slice(0, Math.min(20, lines.length)); // Check first 20 lines max
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
     * Format copyright template with current date/time values
     * @param {Object} config - Extension configuration
     * @param {string} languageId - Language ID of the file
     * @returns {string} Formatted template
     */
    formatCopyrightTemplate(config, languageId) {
        console.log(`[Copyright] formatCopyrightTemplate called with languageId: ${languageId}`);
        console.log(`[Copyright] Original template: "${config.template}"`);
            const currentYear = new Date().getFullYear();
            let formattedTemplate = config.template.replace(/{year}/g, currentYear.toString());
        console.log(`[Copyright] After year replacement: "${formattedTemplate}"`);

            const now = new Date();
            if (config.includeTimestamp) {
                const timestamp = this.formatTimestamp(now, config.timestampFormat);
                formattedTemplate = formattedTemplate.replace(/{timestamp}/g, timestamp);
            }
            if (config.includeUpdateTime) {
                const updateTime = this.formatTimestamp(now, config.updateTimeFormat);
                formattedTemplate = formattedTemplate.replace(/{updatetime}/g, updateTime);
            }

            // Convert JavaScript-style comments to appropriate format for the language
            if (languageId === 'python' || languageId === 'shellscript') {
                console.log(`[Copyright] Converting JavaScript comments to # style for ${languageId}`);
                // Convert /** */ style comments to # style comments
                const originalLines = formattedTemplate.split('\n');
                console.log(`[Copyright] Original lines:`, originalLines);
                formattedTemplate = formattedTemplate
                    .split('\n')
                    .map(line => {
                        if (line.startsWith('/**')) {
                            console.log(`[Copyright] Removing opening /** line: "${line}"`);
                            return ''; // Remove opening /**
                        } else if (line.startsWith(' */')) {
                            console.log(`[Copyright] Removing closing */ line: "${line}"`);
                            return ''; // Remove closing */
                        } else if (line.startsWith(' * ')) {
                            const converted = line.replace(/^ \* /, '# ');
                            console.log(`[Copyright] Converting " * " to "# ": "${line}" → "${converted}"`);
                            return converted; // Convert " * " to "# "
                        } else if (line === ' *') {
                            console.log(`[Copyright] Converting empty comment line " * " to "#": "${line}" → "#"`);
                            return '#'; // Convert empty comment line to "#"
                        }
                        console.log(`[Copyright] Leaving line unchanged: "${line}"`);
                        return line;
                    })
                    .filter(line => line !== '') // Remove empty lines
                    .join('\n');
                console.log(`[Copyright] Final converted template: "${formattedTemplate}"`);
            } else {
                console.log(`[Copyright] No comment conversion needed for languageId: ${languageId}`);
            }

        return formattedTemplate;
    }

    /**
     * Handle existing well-formed copyright notice
     * @param {vscode.TextEditor} editor - The active text editor
     * @returns {Promise<boolean>} Promise resolving to true if timestamp was updated
     */
    async handleExistingCopyright(editor) {
        const updated = await this.updateTimestampIfNeeded(editor);
        return updated; // Return whether update was successful
    }

    /**
     * Fix malformed copyright notice by replacing it with proper copyright
     * @param {vscode.TextEditor} editor - The active text editor
     * @returns {Promise<boolean>} Promise resolving to true if malformed copyright was fixed
     */
    async fixMalformedCopyright(editor) {
        console.log(`[Copyright] fixMalformedCopyright called for ${editor.document.fileName}`);
        const config = this.getConfig();
        const document = editor.document;
        const formattedTemplate = this.formatCopyrightTemplate(config, document.languageId);
        console.log(`[Copyright] Formatted template: "${formattedTemplate}"`);
        const text = document.getText();
        console.log(`[Copyright] Original text length: ${text.length}`);
            const lines = text.split('\n');
            let endMalformedIndex = -1;

            // Find the end of the malformed comment block
            console.log(`[Copyright] Searching for malformed copyright in first ${Math.min(20, lines.length)} lines`);
            for (let i = 0; i < Math.min(20, lines.length); i++) {
                const line = lines[i];
                console.log(`[Copyright] Line ${i + 1}: "${line}"`);
                if (line.includes("Copyright (c)") || line.includes("Copyright")) {
                    console.log(`[Copyright] Found copyright keyword in line ${i + 1}`);
                    // Handle multiline comments
                    if (line.trim().startsWith("/*")) {
                        const closeIndex = text.indexOf("*/", text.indexOf(line));
                        console.log(`[Copyright] Multiline comment detected, closeIndex: ${closeIndex}`);
                        endMalformedIndex = closeIndex !== -1 ? closeIndex + 2 : text.indexOf(line) + line.length;
                        console.log(`[Copyright] Set endMalformedIndex to: ${endMalformedIndex}`);
                    }
                    // Handle single line comments
                    else if (line.trim().startsWith("//") || line.trim().startsWith("#")) {
                        endMalformedIndex = text.indexOf(line) + line.length;
                        console.log(`[Copyright] Single line comment detected, endMalformedIndex: ${endMalformedIndex}`);
                    } else {
                        console.log(`[Copyright] Copyright found but not in recognized comment format`);
                    }

                    // Include subsequent empty lines
                    if (endMalformedIndex !== -1) {
                        let nextLineIndex = i + 1;
                        while (nextLineIndex < lines.length && lines[nextLineIndex].trim() === '') {
                            endMalformedIndex = text.indexOf(lines[nextLineIndex]) + lines[nextLineIndex].length;
                            nextLineIndex++;
                        }
                        console.log(`[Copyright] After including empty lines, endMalformedIndex: ${endMalformedIndex}`);
                    }
                    break;
                }
            }

        if (endMalformedIndex === -1) {
            console.log(`[Copyright] Could not find malformed copyright end - returning false`);
            return false; // Could not find malformed copyright end
        }

        console.log(`[Copyright] Found malformed copyright end at index: ${endMalformedIndex}`);
                const afterCopyright = text.substring(endMalformedIndex).replace(/^\s*\n/, '');
        console.log(`[Copyright] Text after copyright: "${afterCopyright.substring(0, 50)}..."`);
                const newContent = formattedTemplate + afterCopyright;
        console.log(`[Copyright] New content length: ${newContent.length}`);

                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(text.length)
                ), newContent);

                try {
            console.log(`[Copyright] Applying edit...`);
                    const success = await vscode.workspace.applyEdit(edit);
            console.log(`[Copyright] Edit applied: ${success}`);
                    if (success) {
                console.log(`[Copyright] Saving document...`);
                        await document.save();
                console.log(`[Copyright] Document saved successfully`);
                        return true;
            } else {
                console.log(`[Copyright] Edit was not successful`);
                    }
                } catch (error) {
            console.error('[Copyright] Failed to fix malformed copyright:', error);
        }

        console.log(`[Copyright] fixMalformedCopyright returning false`);
        return false;
    }

    /**
     * Insert new copyright notice at optimal position in document
     * @param {vscode.TextEditor} editor - The active text editor
     * @returns {Promise<boolean>} Promise resolving to true if copyright was inserted
     */
    async insertNewCopyright(editor) {
        console.log(`[Copyright] insertNewCopyright called for ${editor.document.fileName}`);
        const config = this.getConfig();
        const document = editor.document;
        const formattedTemplate = this.formatCopyrightTemplate(config, document.languageId);
        console.log(`[Copyright] Using formatted template: "${formattedTemplate}"`);
        const text = document.getText();
        console.log(`[Copyright] Original document text length: ${text.length}`);
            const edit = new vscode.WorkspaceEdit();

            if (text.length === 0) {
                console.log(`[Copyright] Empty file detected, inserting at beginning`);
            // Empty file - insert at beginning
                edit.insert(document.uri, new vscode.Position(0, 0), formattedTemplate);
            } else {
                console.log(`[Copyright] Finding optimal insertion position`);
            // Find optimal insertion position
            const insertInfo = this.findOptimalInsertPosition(text, document.languageId);
            console.log(`[Copyright] Insert info:`, insertInfo);

            let contentToInsert = formattedTemplate;

            // Ensure template ends with newline
            if (!contentToInsert.endsWith('\n')) {
                contentToInsert += '\n';
            }
            console.log(`[Copyright] Content to insert (after newline check): "${contentToInsert}"`);

            if (insertInfo.hasShebang) {
                console.log(`[Copyright] Inserting after shebang`);
                // Insert after shebang
                if (!contentToInsert.endsWith('\n\n')) {
                    contentToInsert = '\n' + contentToInsert;
                }
                console.log(`[Copyright] Final content to insert after shebang: "${contentToInsert}"`);
                edit.replace(document.uri, new vscode.Range(
                    document.positionAt(insertInfo.shebangEndPosition),
                    document.positionAt(insertInfo.insertPosition)
                ), contentToInsert);
            } else if (insertInfo.leadingEmptyLines > 0 || insertInfo.insertPosition === 0) {
                console.log(`[Copyright] Handling leading empty lines or insert at beginning`);
                // Handle leading empty lines
                const remainingText = text.substring(insertInfo.insertPosition);
                const remainingIsOnlyWhitespace = remainingText.trim().length === 0;

                if (!remainingIsOnlyWhitespace && !contentToInsert.endsWith('\n\n') &&
                    remainingText && !remainingText.startsWith('\n')) {
                    contentToInsert += '\n';
                }

                const endPosition = remainingIsOnlyWhitespace ? text.length : insertInfo.insertPosition;
                console.log(`[Copyright] Replacing range from 0 to ${endPosition}`);
                edit.replace(document.uri, new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(endPosition)
                ), contentToInsert);
            } else {
                console.log(`[Copyright] Normal insertion at position ${insertInfo.insertPosition}`);
                // Normal insertion
                const remainingText = text.substring(insertInfo.insertPosition);
                if (!contentToInsert.endsWith('\n\n') && !remainingText.startsWith('\n')) {
                    contentToInsert += '\n';
                }
                console.log(`[Copyright] Final content for normal insertion: "${contentToInsert}"`);
                edit.insert(document.uri, document.positionAt(insertInfo.insertPosition), contentToInsert);
            }
        }

        try {
            console.log(`[Copyright] Applying edit...`);
            const success = await vscode.workspace.applyEdit(edit);
            console.log(`[Copyright] Edit applied: ${success}`);
            if (success) {
                console.log(`[Copyright] Saving document...`);
                await document.save();
                console.log(`[Copyright] Document saved successfully`);
                return true;
            } else {
                console.log(`[Copyright] Edit was not successful`);
            }
        } catch (error) {
            console.error('[Copyright] Failed to apply copyright notice:', error);
        }

        return false;
    }

    /**
     * Find the optimal position to insert copyright notice
     * @param {string} text - Document text
     * @param {string} languageId - Language ID of the file
     * @returns {Object} Insertion information
     */
    findOptimalInsertPosition(text, languageId) {
                const lines = text.split('\n');
                let insertPosition = 0;
                let foundContent = false;
                let lineIndex = 0;
        let leadingEmptyLines = 0;
        let hasShebang = false;
        let shebangEndPosition = 0;

        // Special handling for Python files with module docstrings
        if (languageId === 'python') {
            // Check if file starts with a module docstring (triple-quoted string)
            if (lines.length > 0 && lines[0].trim().startsWith('\"\"\"')) {
                let docstringEndLine = 0;

                // Check if docstring is on the same line (single line docstring)
                if (lines[0].trim().endsWith('\"\"\"')) {
                    docstringEndLine = 1; // Insert after this line
                } else {
                    // Multi-line docstring - find the closing quotes
                    for (let i = 1; i < lines.length; i++) {
                        if (lines[i].trim().endsWith('\"\"\"')) {
                            docstringEndLine = i + 1; // Insert after this line
                            break;
                        }
                    }
                }

                if (docstringEndLine > 0) {
                    insertPosition = getOffsetForLine(docstringEndLine);
                    foundContent = true;
                    return {
                        insertPosition,
                        foundContent,
                        leadingEmptyLines: 0,
                        hasShebang: false,
                        shebangEndPosition: 0
                    };
                }
            }
        }

        // Calculate byte offset for a line index
                const getOffsetForLine = (lineIdx) => {
                    let offset = 0;
                    for (let j = 0; j < lineIdx && j < lines.length; j++) {
                offset += lines[j].length + 1; // +1 for newline
                    }
                    return offset;
                };

                while (lineIndex < lines.length) {
                    const line = lines[lineIndex];
                    const trimmedLine = line.trim();

                    if (trimmedLine === '') {
                        leadingEmptyLines++;
                        lineIndex++;
                        continue;
                    }

                    if (trimmedLine.startsWith('#!')) {
                        hasShebang = true;
                leadingEmptyLines = 0; // Reset
                        lineIndex++;
                        shebangEndPosition = getOffsetForLine(lineIndex);
                        continue;
                    }

                    // Handle PHP opening tags
                    if (trimmedLine.startsWith('<?php')) {
                        hasShebang = true; // Treat PHP tags like shebang for insertion logic
                leadingEmptyLines = 0; // Reset
                        lineIndex++;
                        shebangEndPosition = getOffsetForLine(lineIndex);
                        continue;
                    }

            // Found first content
                    insertPosition = getOffsetForLine(lineIndex);
                    foundContent = true;
                    break;
                }

        // Handle files with only whitespace
                if (!foundContent) {
                    insertPosition = 0;
                    foundContent = true;
                }

        return {
            insertPosition,
            foundContent,
            leadingEmptyLines,
            hasShebang,
            shebangEndPosition
        };
    }

    /**
     * Get cached file state or analyze if not cached
     * @param {vscode.TextDocument} document - The document to check
     * @returns {Object|null} Cached state or null if not cached
     */
    getCachedFileState(document) {
        const cacheKey = `${document.uri.fsPath}:${document.version}`;
        return this.fileStateCache.get(cacheKey) || null;
    }

    /**
     * Cache file state for future use
     * @param {vscode.TextDocument} document - The document
     * @param {Object} state - State to cache
     */
    setCachedFileState(document, state) {
        const cacheKey = `${document.uri.fsPath}:${document.version}`;
        this.fileStateCache.set(cacheKey, Object.assign({}, state, {
            cachedAt: Date.now()
        }));

        // Clean old cache entries (keep only last 50)
        if (this.fileStateCache.size > 50) {
            const entries = Array.from(this.fileStateCache.entries());
            entries.sort((a, b) => b[1].cachedAt - a[1].cachedAt);
            this.fileStateCache = new Map(entries.slice(0, 50));
        }
    }

    /**
     * Smart copyright management with comprehensive file analysis
     * @param {vscode.TextEditor} editor - The active text editor
     * @returns {Promise<Object>} Promise resolving to action result with details
     */
    async addCopyrightIfNeeded(editor) {
        console.log(`[Copyright] addCopyrightIfNeeded called for ${editor.document.fileName}`);
        const analysis = this.analyzeDocumentState(editor);
        console.log(`[Copyright] Document analysis:`, analysis);

        if (!analysis.shouldProcess) {
            console.log(`[Copyright] Skipping processing: ${analysis.skipReason}`);
            return {
                success: false,
                action: 'skipped',
                reason: analysis.skipReason
            };
        }

        const action = this.determineOptimalAction(analysis);
        const result = await this.executeAction(editor, action, analysis);

        return {
            success: result.success,
            action: action.type,
            details: result.details,
            fileState: analysis.state
        };
    }

    /**
     * Comprehensive document state analysis
     * @param {vscode.TextEditor} editor - The active text editor
     * @returns {Object} Analysis results with file state and recommendations
     */
    analyzeDocumentState(editor) {
        const document = editor.document;
        const config = this.getConfig();

        console.log(`[Copyright] Analyzing document: ${document.fileName}`);
        console.log(`[Copyright] Document language: ${document.languageId}`);
        console.log(`[Copyright] Config: silentMode=${config.silentMode}, backgroundUpdateDelay=${config.backgroundUpdateDelay}`);

        // Quick eligibility check
        if (!this.isEnabled(document)) {
            console.log(`[Copyright] Document not eligible for processing`);
            return {
                shouldProcess: false,
                skipReason: 'file_not_eligible',
                state: null
            };
        }
        console.log(`[Copyright] Document is eligible for processing`);

        // Try to use cached state for background processing optimization
        // But don't skip processing for files that need copyright insertion
        const cachedState = this.getCachedFileState(document);
        if (cachedState && config.silentMode) {
            // In silent mode, we can trust recent cache (less than 30 seconds old)
            // But only for files that already have copyright or don't need action
            const cacheAge = Date.now() - cachedState.cachedAt;
            if (cacheAge < 30000 && cachedState.hasCopyright) {
                return {
                    shouldProcess: false,
                    skipReason: 'cached_no_changes_needed',
                    state: cachedState
                };
            }
        }

        const text = document.getText();

        // Empty file check
        if (!text || text.trim().length === 0) {
            return {
                shouldProcess: true,
                skipReason: null,
                state: {
                    type: 'empty',
                    hasCopyright: false,
                    isMalformed: false,
                    needsTimestampUpdate: false,
                    confidence: 1.0
                }
            };
        }

        // Analyze copyright state with confidence scoring
        const copyrightAnalysis = this.analyzeCopyrightState(text);
        const timestampAnalysis = this.analyzeTimestampState(text, copyrightAnalysis);

        return {
            shouldProcess: true,
            skipReason: null,
            state: Object.assign({}, copyrightAnalysis, timestampAnalysis, {
                fileSize: text.length,
                lineCount: text.split('\n').length,
                lastModified: document.isDirty ? 'unsaved' : 'saved'
            })
        };
    }

    /**
     * Analyze copyright presence and quality
     * @param {string} text - Document content
     * @returns {Object} Copyright analysis results
     */
    analyzeCopyrightState(text) {
        const lines = text.split('\n');
        const firstTenLines = lines.slice(0, Math.min(10, lines.length)).join('\n');

        const hasWellFormed = this.hasCopyrightNotice(text);
        const hasMalformed = this.hasMalformedCopyright(text);

        // Calculate confidence based on pattern strength
        let confidence = 0.5;
        if (hasWellFormed) {
            confidence = 0.95;
        } else if (hasMalformed) {
            confidence = 0.8;
        } else if (firstTenLines.includes('Copyright') || firstTenLines.includes('©')) {
            confidence = 0.6;
        }

        return {
            type: hasWellFormed ? 'well_formed' : hasMalformed ? 'malformed' : 'missing',
            hasCopyright: hasWellFormed || hasMalformed,
            isWellFormed: hasWellFormed,
            isMalformed: hasMalformed,
            copyrightLine: hasWellFormed || hasMalformed ? this.findCopyrightLine(lines) : null,
            confidence: confidence
        };
    }

    /**
     * Analyze timestamp update requirements
     * @param {string} text - Document content
     * @param {Object} copyrightAnalysis - Copyright analysis results
     * @returns {Object} Timestamp analysis results
     */
    analyzeTimestampState(text, copyrightAnalysis) {
        console.log(`[Copyright] analyzeTimestampState called, isWellFormed: ${copyrightAnalysis.isWellFormed}`);

        if (!copyrightAnalysis.isWellFormed) {
            console.log(`[Copyright] Skipping timestamp analysis - copyright not well-formed`);
            return { needsTimestampUpdate: false };
        }

        const config = this.getConfig();
        console.log(`[Copyright] includeUpdateTime config: ${config.includeUpdateTime}`);

        if (!config.includeUpdateTime) {
            console.log(`[Copyright] Skipping timestamp analysis - update time disabled in config`);
            return { needsTimestampUpdate: false };
        }

        // Check if timestamp exists and is current
        const lines = text.split('\n');
        const copyrightBlock = this.extractCopyrightBlock(lines);
        console.log(`[Copyright] Extracted copyright block: "${copyrightBlock.substring(0, 100)}..."`);

        const updateLineRegex = /(.*Last\s+Updated:)([^]*?)(\n\s*\*|$)/i;
        const lineMatch = copyrightBlock.match(updateLineRegex);

        console.log(`[Copyright] Timestamp line match:`, lineMatch ? 'found' : 'not found');

        if (!lineMatch) {
            console.log(`[Copyright] No timestamp found - needs update`);
            return { needsTimestampUpdate: true, reason: 'missing_timestamp' };
        }

        // Check if timestamp is outdated (more than 1 day old)
        const timestampText = lineMatch[2].trim();
        console.log(`[Copyright] Found timestamp: "${timestampText}"`);

        const isOutdated = this.isTimestampOutdated(timestampText);
        console.log(`[Copyright] Timestamp outdated: ${isOutdated}`);

        return {
            needsTimestampUpdate: isOutdated,
            reason: isOutdated ? 'outdated' : 'current',
            currentTimestamp: timestampText
        };
    }

    /**
     * Determine the optimal action based on analysis
     * @param {Object} analysis - Document analysis results
     * @returns {Object} Recommended action
     */
    determineOptimalAction(analysis) {
        const state = analysis.state;
        const config = this.getConfig();

        console.log(`[Copyright] Determining optimal action for state:`, state);

        // Priority order: update timestamp > fix malformed > insert new
        if (state.needsTimestampUpdate) {
            return {
                type: 'update_timestamp',
                priority: 'high',
                reason: state.reason
            };
        }

        if (state.isMalformed) {
            return {
                type: 'fix_malformed',
                priority: 'high',
                reason: 'malformed_copyright_detected'
            };
        }

        if (!state.hasCopyright) {
            return {
                type: 'insert_new',
                priority: 'medium',
                reason: 'copyright_missing'
            };
        }

        // Copyright is well-formed and up-to-date
        return {
            type: 'no_action',
            priority: 'low',
            reason: 'copyright_current'
        };
    }

    /**
     * Execute the determined action
     * @param {vscode.TextEditor} editor - The active text editor
     * @param {Object} action - Action to execute
     * @param {Object} analysis - Analysis results
     * @returns {Promise<Object>} Action execution result
     */
    async executeAction(editor, action, analysis) {
        console.log(`[Copyright] Executing action:`, action);
        try {
            switch (action.type) {
                case 'update_timestamp': {
                    const updated = await this.updateTimestampIfNeeded(editor);
                    const result = {
                        success: updated,
                        details: updated ? 'timestamp_updated' : 'timestamp_update_failed'
                    };
                    if (result.success) {
                        this.setCachedFileState(editor.document, Object.assign({}, analysis.state, {
                            lastAction: action.type,
                            lastActionTime: Date.now()
                        }));
                    }
                    return result;
                }

                case 'fix_malformed': {
                    const fixed = await this.fixMalformedCopyright(editor);
                    const result = {
                        success: fixed,
                        details: fixed ? 'malformed_copyright_fixed' : 'malformed_copyright_fix_failed'
                    };
                    if (result.success) {
                        this.setCachedFileState(editor.document, Object.assign({}, analysis.state, {
                            lastAction: action.type,
                            lastActionTime: Date.now()
                        }));
                    }
                    return result;
                }

                case 'insert_new': {
                    const inserted = await this.insertNewCopyright(editor);
                    const result = {
                        success: inserted,
                        details: inserted ? 'copyright_inserted' : 'copyright_insertion_failed'
                    };
                    if (result.success) {
                        this.setCachedFileState(editor.document, Object.assign({}, analysis.state, {
                            lastAction: action.type,
                            lastActionTime: Date.now()
                        }));
                    }
                    return result;
                }

                case 'no_action':
                default:
                    return {
                        success: true,
                        details: 'no_action_needed'
                    };
                }
            } catch (error) {
            if (!this.getConfig().silentMode) {
                console.error(`Error executing action ${action.type}:`, error);
            }
            return {
                success: false,
                details: `error: ${error.message}`,
                error: error
            };
        }
    }

    /**
     * Find the line number containing copyright
     * @param {string[]} lines - Document lines
     * @returns {number|null} Line number or null
     */
    findCopyrightLine(lines) {
        for (let i = 0; i < Math.min(10, lines.length); i++) {
            if (lines[i].includes("Copyright (c)") || lines[i].includes("Copyright")) {
                return i + 1; // 1-based line numbering
            }
        }
        return null;
    }

    /**
     * Extract the copyright block from document lines
     * @param {string[]} lines - Document lines
     * @returns {string} Copyright block text
     */
    extractCopyrightBlock(lines) {
        const copyrightRegex = /\/\*[\s\S]*?\*\//;
        const text = lines.join('\n');
        const blockMatch = text.match(copyrightRegex);
        return blockMatch ? blockMatch[0] : '';
    }

    /**
     * Check if timestamp is outdated
     * @param {string} timestampText - Timestamp string
     * @returns {boolean} True if outdated
     */
    isTimestampOutdated(timestampText) {
        console.log(`[Copyright] Checking if timestamp outdated: "${timestampText}"`);
        try {
            // Parse the full timestamp (YYYY-MM-DD HH:mm)
            const fullTimestampMatch = timestampText.match(/(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})/);

            if (!fullTimestampMatch) {
                // Fallback to date-only matching
                const dateMatch = timestampText.match(/(\d{4}-\d{2}-\d{2})/);
                if (!dateMatch) {
                    console.log(`[Copyright] No timestamp pattern found - considering outdated`);
                    return true;
                }
                // If only date is found, update it (old format)
                console.log(`[Copyright] Found date-only format - needs update to include time`);
                return true;
            }

            const [, dateStr, timeStr] = fullTimestampMatch;
            const [hours, minutes] = timeStr.split(':').map(Number);

            const timestampDate = new Date(dateStr);
            timestampDate.setHours(hours, minutes, 0, 0);

            const now = new Date();

            console.log(`[Copyright] Parsed timestamp: ${timestampDate}`);
            console.log(`[Copyright] Current time: ${now}`);

            // Update if timestamp is older than 2 minutes OR from a different day
            const diffMs = now - timestampDate;
            const diffMinutes = diffMs / (1000 * 60);
            const isDifferentDay = timestampDate.toDateString() !== now.toDateString();

            const needsUpdate = diffMinutes > 2 || isDifferentDay;
            console.log(`[Copyright] Time difference: ${diffHours.toFixed(2)} hours`);
            console.log(`[Copyright] Different day: ${isDifferentDay}`);
            console.log(`[Copyright] Needs update: ${needsUpdate}`);

            return needsUpdate;
        } catch (error) {
            console.log(`[Copyright] Error parsing timestamp: ${error.message}`);
            // If we can't parse the timestamp, consider it outdated
            return true;
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

        const { languages, fileExtensions, excludedFiles, allowedFolders } = this.getConfig();

        // Check if file is explicitly excluded
        for (const pattern of excludedFiles) {
            if (this.matchesPattern(fileName, pattern)) {
                return false;
            }
        }

        // Check if file is in allowed folders (if specified)
        if (allowedFolders && allowedFolders.length > 0) {
            const filePath = fileName;
            let isInAllowedFolder = false;

            for (const folderPath of allowedFolders) {
                // Normalize folder path - make it relative to workspace if not absolute
                let normalizedFolderPath = folderPath.trim();

                // If folder path doesn't start with '/', consider it relative to workspace
                if (!normalizedFolderPath.startsWith('/')) {
                    // Get workspace folder
                    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                    if (workspaceFolder) {
                        normalizedFolderPath = vscode.Uri.joinPath(workspaceFolder.uri, normalizedFolderPath).fsPath;
                    }
                }

                // Check if file path starts with allowed folder path
                if (filePath.startsWith(normalizedFolderPath)) {
                    isInAllowedFolder = true;
                    break;
                }
            }

            if (!isInAllowedFolder) {
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
        console.log(`[Copyright] handleTextChange called for ${event.document.fileName}`);
        const now = Date.now();
        const config = this.getConfig();

        // Use dynamic debounce delay (smart debouncing)
        const debounceInterval = this.getDebounceDelay();
        console.log(`[Copyright] Debounce interval: ${debounceInterval}ms, time since last edit: ${now - this.lastEditTime}ms`);

        // Only proceed if enough time has passed since last edit
        if (now - this.lastEditTime > debounceInterval) {
            console.log(`[Copyright] Debounce threshold passed, processing...`);
            this.lastEditTime = now;

            // Debounce to avoid processing during rapid typing
            setTimeout(() => {
                console.log(`[Copyright] Executing debounced action after ${debounceInterval}ms delay`);
                const editor = vscode.window.activeTextEditor;
                console.log(`[Copyright] Active editor: ${editor ? editor.document.fileName : 'none'}`);
                console.log(`[Copyright] Event document: ${event.document.fileName}`);
                console.log(`[Copyright] Documents match: ${editor && editor.document === event.document}`);

                if (editor && editor.document === event.document) {
                    console.log(`[Copyright] Processing document: ${event.document.fileName}`);
                    console.log(`[Copyright] includeUpdateTime: ${config.includeUpdateTime}`);
                    console.log(`[Copyright] silentMode: ${config.silentMode}`);

                    // If we have an existing copyright with updatetime enabled,
                    // update the timestamp
                    if (config.includeUpdateTime) {
                        console.log(`[Copyright] Updating timestamp for existing copyright...`);
                        this.updateTimestampIfNeeded(editor).then(result => {
                            console.log(`[Copyright] Timestamp update result: ${result}`);
                        }).catch(error => {
                            console.error('[Copyright] Error updating timestamp:', error);
                        });
                    } else {
                        console.log(`[Copyright] Checking if copyright needed...`);
                        // Otherwise just check if we need to add a copyright
                        this.addCopyrightIfNeeded(editor).then(result => {
                            console.log(`[Copyright] addCopyrightIfNeeded result:`, result);
                            // Only log in non-silent mode for debugging
                            if (!config.silentMode && result.success && result.action !== 'no_action') {
                                console.log(`Copyright ${result.action} applied: ${result.details}`);
                            }
                        }).catch(error => {
                            console.error('[Copyright] Error in automatic copyright update:', error);
                        });
                    }
                } else {
                    console.log(`[Copyright] Skipping - no matching editor or document`);
                }
            }, debounceInterval);
        } else {
            console.log(`[Copyright] Skipping due to debounce - too soon since last edit`);
        }
    }

    /**
     * Handle editor change events
     * @param {vscode.TextEditor} editor - The new active editor
     */
    handleEditorChange(editor) {
        console.log(`[Copyright] handleEditorChange called${editor ? ` for ${editor.document.fileName}` : ' with no editor'}`);
        if (editor) {
            const config = this.getConfig();
            console.log(`[Copyright] Processing editor change for ${editor.document.fileName}`);

            // Check if this is an inactive file that needs immediate update
            const shouldUpdateImmediately = this.shouldUpdateInactiveFile(editor.document, config);

            if (shouldUpdateImmediately) {
                console.log(`[Copyright] Inactive file detected, updating immediately`);
                this.addCopyrightIfNeeded(editor).then(result => {
                    console.log(`[Copyright] Immediate update result:`, result);
                    if (!config.silentMode && result.success && result.action !== 'no_action') {
                        console.log(`Copyright ${result.action} applied immediately to ${editor.document.fileName}`);
                    }
                }).catch(error => {
                    console.error('[Copyright] Error in immediate copyright update:', error);
                });
            } else {
                // Normal processing with debouncing
                this.addCopyrightIfNeeded(editor).then(result => {
                    console.log(`[Copyright] handleEditorChange result:`, result);
                    // Only log successful actions in non-silent mode
                    if (!config.silentMode && result.success && result.action !== 'no_action') {
                        console.log(`Copyright ${result.action} applied to ${editor.document.fileName}: ${result.details}`);
                    }
                }).catch(error => {
                    console.error('[Copyright] Error in editor change copyright handling:', error);
                });
            }
        } else {
            console.log(`[Copyright] handleEditorChange called with null editor`);
        }
    }

    /**
     * Handle document open events - ensure copyright is added when file is first opened
     * @param {vscode.TextDocument} document - The opened document
     */
    handleDocumentOpen(document) {
        console.log(`[Copyright] handleDocumentOpen called for ${document.fileName}`);
        // Only process if we have an active editor for this document
        const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
        console.log(`[Copyright] Found editor for document: ${editor ? 'yes' : 'no'}`);

        if (editor) {
            const config = this.getConfig();
            console.log(`[Copyright] Processing document open for ${document.fileName}`);
            this.addCopyrightIfNeeded(editor).then(result => {
                console.log(`[Copyright] handleDocumentOpen result:`, result);
                // Only log successful actions in non-silent mode
                if (!config.silentMode && result.success && result.action !== 'no_action') {
                    console.log(`Copyright ${result.action} applied to ${document.fileName}: ${result.details}`);
                }
            }).catch(error => {
                console.error('[Copyright] Error in document open copyright handling:', error);
            });
        } else {
            console.log(`[Copyright] Skipping document open - no active editor for ${document.fileName}`);
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
            vscode.workspace.onDidOpenTextDocument(this.handleDocumentOpen),
            vscode.workspace.onDidSaveTextDocument(this.handleDocumentSave)
        ];

        return subscriptions;
    }
}

exports.CopyrightHandler = CopyrightHandler;
//# sourceMappingURL=CopyrightHandler.js.map 
