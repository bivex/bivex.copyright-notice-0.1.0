# Testing Apply Copyright to All Files

## Overview
The new "Apply Copyright Notice to All Files in Project" feature has been implemented. This adds a command that processes all eligible files in the workspace and applies copyright notices in the background.

## Test Files Created
- `test_apply_all_files/test1.js` - JavaScript file
- `test_apply_all_files/test2.py` - Python file
- `test_apply_all_files/test3.ts` - TypeScript file
- `test_apply_all_files/test4.html` - HTML file

All test files initially have NO copyright notices.

## How to Test

### Method 1: VS Code Command Palette
1. Open VS Code with this project
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Apply Copyright Notice to All Files in Project"
4. Select and run the command
5. Check the notification and test files

### Method 2: Manual Test Script
Run this command in terminal:
```bash
node test_apply_all_manual.js
```

This will check if copyright was added to test files.

### Method 3: Debug Scripts
- `node debug_apply_all.js` - Debug file finding logic
- `node test_apply_all_unit.js` - Test core insertion logic
- `node test_apply_all_simple.js` - Simple integration test

## Expected Results
After running the command, test files should contain copyright notices like:
```javascript
/* Copyright (c) 2025 */

/* existing code */
```

## Troubleshooting
- If files are not updated, check VS Code developer console for errors
- Ensure the workspace contains the test files
- Check that the extension is activated

## Cleanup
Delete the `test_apply_all_files/` directory when done testing.