# Packaging Scripts

This directory contains scripts to easily package the VS Code extension into a VSIX file.

## Available Scripts

### Windows (pack.bat)
```bash
# Run the Windows batch script
scripts\pack.bat

# Or use npm script
npm run package:win
```

### Unix/Linux/macOS (pack.sh)
```bash
# Make executable (first time only)
chmod +x scripts/pack.sh

# Run the shell script
./scripts/pack.sh

# Or use npm script
npm run package:unix
```

### Direct vsce command
```bash
# Simple packaging without additional checks
npm run package
```

## What the Scripts Do

1. **Path Validation**: Automatically navigate to project root and validate directory structure
2. **Check Prerequisites**: Verify Node.js and vsce are installed with version information
3. **Install Dependencies**: Run `npm install` if needed
4. **Compile TypeScript**: Run `npm run compile` if source files exist
5. **Create Output Directory**: Ensure the `out` directory exists
6. **Validate Build Files**: Check for required compiled files (extension.js, CopyrightHandler.js)
7. **Package Extension**: Run `vsce package` to create the VSIX file
8. **Verify Output**: Confirm VSIX file was created and show file details

## Requirements

- Node.js (https://nodejs.org/)
- vsce (installed automatically if missing)

## Output

The scripts will create a `.vsix` file in the project root directory with the name format:
`copyright-notice-1.0.1.vsix`

### Logging Features

Both scripts now include comprehensive logging:
- **Timestamped entries** for all operations
- **Color-coded output** (Windows: standard, Unix: colored)
- **Success indicators** (✓) for completed steps
- **Warning messages** for non-critical issues
- **Error details** with troubleshooting suggestions
- **File information** including size and location

## Troubleshooting

### Windows Issues
- The script automatically navigates to the project root directory
- Ensure Node.js is in your PATH
- Run as Administrator if you encounter permission issues
- Check that package.json exists in the project root
- **Note**: The script skips vsce version checking to avoid hanging issues

### Unix/Linux/macOS Issues
- Make sure the script is executable: `chmod +x scripts/pack.sh`
- If bash is not available, install it or use: `sh scripts/pack.sh`
- On macOS, you might need to allow execution: `xattr -d com.apple.quarantine scripts/pack.sh`
- The script automatically navigates to the project root directory

### Common Issues
- **"package.json not found"**: Make sure you're running the script from the project directory
- **"Failed to install vsce"**: Try running `npm install -g @vscode/vsce` manually
- **"Failed to compile TypeScript"**: Check your tsconfig.json and TypeScript installation
- **"VSIX file not found"**: Check your package.json configuration and vsce installation 
