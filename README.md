# Copyright Notice Generator

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=bivex.copyright-notice)
[![Installs](https://img.shields.io/badge/installs-new-brightgreen.svg)](https://marketplace.visualstudio.com/items?itemName=bivex.copyright-notice)
[![Rating](https://img.shields.io/badge/rating-5%20stars-yellow.svg)](https://marketplace.visualstudio.com/items?itemName=bivex.copyright-notice)

Automatically add customizable copyright notices to your code files across multiple programming languages. Perfect for ensuring proper intellectual property protection in your projects.

## Key Features

- ✨ **Automatic Insertion**: Adds copyright notice when typing in a new file
- 🔄 **Manual Command**: Apply notice on demand with the Command Palette
- 🌐 **Multi-language Support**: Works with all programming languages
- 📝 **Customizable Templates**: Use your own copyright text with dynamic year insertion
- 🕒 **Timestamp Support**: Include creation date and time in your notices
- 🔄 **Update Time Tracking**: Automatically updates the "last modified" timestamp
- 🔍 **Smart Detection**: Avoids duplicate notices
- 🧩 **File Extension Filtering**: Target specific file types

## How It Works

While you are typing, this extension checks if there's a copyright notice at the beginning of the file. If not, it adds one automatically based on your custom template.

You can also manually trigger the extension by running the "Apply Copyright Notice" command from the Command Palette (Ctrl+Shift+P).

## Configuration Options

- `copyright-notice.languages`: Languages that the extension will be activated for (default: all languages)
- `copyright-notice.fileExtensions`: File extensions to which the copyright notice will be applied (e.g., ['.js', '.ts', '.py']). Use ['*'] for all files.
- `copyright-notice.template`: Copyright notice template. Use {year} for the current year, {timestamp} for creation time, and {updatetime} for last update time.
- `copyright-notice.includeTimestamp`: Whether to include timestamp when the copyright notice was added (default: false).
- `copyright-notice.timestampFormat`: Format for the timestamp (default: "YYYY-MM-DD HH:mm:ss").
- `copyright-notice.includeUpdateTime`: Whether to include and update the "last updated" timestamp (default: false).
- `copyright-notice.updateTimeFormat`: Format for the update timestamp (default: "YYYY-MM-DD HH:mm:ss").

## Example Settings

### JavaScript/TypeScript Development

```json
{
  "copyright-notice.languages": [
    "javascript", 
    "typescript"
  ],
  "copyright-notice.fileExtensions": [
    ".js",
    ".jsx",
    ".ts",
    ".tsx"
  ],
  "copyright-notice.template": "/**\n * Copyright (c) {year} Your Company Name\n * All rights reserved.\n */\n\n"
}
```

### With Creation and Update Timestamps

```json
{
  "copyright-notice.includeTimestamp": true,
  "copyright-notice.includeUpdateTime": true,
  "copyright-notice.template": "/**\n * Copyright (c) {year} Your Company Name\n * Created: {timestamp}\n * Last Updated: {updatetime}\n * All rights reserved.\n */\n\n"
}
```

### Custom Timestamp Formats

```json
{
  "copyright-notice.includeTimestamp": true,
  "copyright-notice.timestampFormat": "DD/MM/YYYY",
  "copyright-notice.template": "/**\n * Copyright (c) {year} Your Company Name\n * Date: {timestamp}\n * All rights reserved.\n */\n\n"
}
```

```json
{
  "copyright-notice.includeTimestamp": true,
  "copyright-notice.timestampFormat": "YYYY.MM.DD at HH:mm",
  "copyright-notice.template": "/**\n * Created on {timestamp}\n * Copyright (c) {year} Your Company Name\n * All rights reserved.\n */\n\n"
}
```

### C/C++ Development

```json
{
  "copyright-notice.languages": [
    "c",
    "cpp"
  ],
  "copyright-notice.fileExtensions": [
    ".c",
    ".cpp",
    ".h",
    ".hpp"
  ],
  "copyright-notice.template": "/**\n * Copyright (c) {year} Your Company Name\n * All rights reserved.\n */\n\n"
}
```

### Python Development

```json
{
  "copyright-notice.languages": [
    "python"
  ],
  "copyright-notice.fileExtensions": [
    ".py"
  ],
  "copyright-notice.template": "# Copyright (c) {year} Your Company Name\n# All rights reserved.\n\n"
}
```

### Individual Entrepreneur / Sole Proprietor

```json
{
  "copyright-notice.includeTimestamp": true,
  "copyright-notice.includeUpdateTime": true,
  "copyright-notice.template": "/**\n * Copyright (c) {year} [Your Name], Individual Entrepreneur\n * INN: [Your Tax ID Number]\n * Created: {timestamp}\n * Last Updated: {updatetime}\n * All rights reserved. Unauthorized copying, modification,\n * distribution, or use is strictly prohibited.\n */\n\n"
}
```

## Additional Template Examples

The extension comes with a variety of pre-configured templates for different scenarios, including:

- Corporate templates (standard and detailed)
- Individual templates (sole proprietor, freelancer)
- Open source license templates (MIT, GPL)
- Language-specific templates (Python, HTML, Shell)

See the [template-examples.json](https://github.com/bivex/copyright-notice/blob/main/template-examples.json) file for a complete list of examples that you can copy into your configuration.

## Why Use Copyright Notices?

Adding copyright notices to your source code:
- Establishes ownership of intellectual property
- Helps with licensing compliance
- Makes attribution clear in open-source projects
- Provides legal protection for your code

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Copyright Notice Generator"
4. Click Install

## Requirements

No additional requirements or dependencies needed.

## Known Issues

None currently reported. Please submit issues on our [GitHub repository](https://github.com/bivex/copyright-notice/issues).

## Release Notes

### 1.0.0

Full release with multiple improvements:
- Added timestamp support for creation and update times
- Added manual command to apply copyright notices
- Added file extension filtering
- Multiple predefined templates
- Improved formatting and error handling

### 0.1.0

Initial preview release 