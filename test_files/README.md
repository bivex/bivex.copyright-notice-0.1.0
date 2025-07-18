# Test Files for Copyright Notice Extension

This directory contains test files to verify the copyright notice extension works correctly.

## File Types Generated

### JavaScript/TypeScript
- `basic.js` - Basic JS without copyright notice
- `with_copyright.js` - JS with existing copyright notice
- `different_copyright.js` - JS with different copyright format
- `basic.ts` - Basic TypeScript without copyright notice
- `with_copyright.ts` - TypeScript with existing copyright and timestamps

### AutoHotkey
- `basic.ahk` - Basic AutoHotkey without copyright notice
- `basic.ahk2` - AutoHotkey v2 without copyright notice
- `with_copyright.ahk` - AutoHotkey with existing copyright notice

### Python
- `basic.py` - Basic Python without copyright notice
- `with_copyright.py` - Python with existing copyright notice

### C++
- `basic.cpp` - Basic C++ without copyright notice
- `basic.h` - Basic C++ header without copyright notice

### Excluded Files (JSON)
- `config.json` - Should be excluded from copyright notices
- `package.json` - Should be excluded from copyright notices

### Other
- `basic.html` - Basic HTML without copyright notice
- `basic.css` - Basic CSS without copyright notice
- `basic.sh` - Basic shell script without copyright notice

## Testing Instructions

1. Copy `test_settings.json` to your VS Code settings
2. Open each test file in VS Code
3. Verify that copyright notices are added to appropriate files
4. Verify that JSON files are excluded
5. Test the manual command: `Ctrl+Shift+P` → "Apply Copyright Notice"

## Expected Behavior

- Files without copyright notices should get them added automatically
- Files with existing copyright notices should remain unchanged (or get timestamps updated if enabled)
- JSON files should be excluded from copyright notices
- .ahk2 files should work properly even if VS Code doesn't recognize the language ID

## VS Code Settings

Use the provided `test_settings.json` file to configure the extension for testing.
