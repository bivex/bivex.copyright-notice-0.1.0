@echo off
setlocal enabledelayedexpansion

REM Set script directory and project root
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
cd /d "%PROJECT_ROOT%"

echo [%date% %time%] === Starting VS Code Extension Packaging ===
echo [%date% %time%] Script directory: %SCRIPT_DIR%
echo [%date% %time%] Project root: %PROJECT_ROOT%
echo [%date% %time%] Current directory: %CD%
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [%date% %time%] ERROR: package.json not found. Please run this script from the project root directory.
    echo [%date% %time%] Expected location: %PROJECT_ROOT%
    pause
    exit /b 1
)

echo [%date% %time%] ✓ Found package.json - running from correct directory

REM Check if Node.js is installed
echo [%date% %time%] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [%date% %time%] ERROR: Node.js is not installed or not in PATH
    echo [%date% %time%] Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [%date% %time%] ✓ Node.js found and ready

REM Skip vsce check since it's known to work
echo [%date% %time%] ✓ vsce check skipped (known to work)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo [%date% %time%] Installing dependencies...
    npm install
    if errorlevel 1 (
        echo [%date% %time%] ERROR: Failed to install dependencies
        echo [%date% %time%] Try running: npm install manually
        pause
        exit /b 1
    )
    echo [%date% %time%] ✓ Dependencies installed successfully
) else (
    echo [%date% %time%] ✓ Dependencies already installed
)

REM Compile TypeScript (if source files exist)
if exist "src" (
    echo [%date% %time%] Compiling TypeScript...
    npm run compile
    if errorlevel 1 (
        echo [%date% %time%] ERROR: Failed to compile TypeScript
        echo [%date% %time%] Check your TypeScript configuration
        pause
        exit /b 1
    )
    echo [%date% %time%] ✓ TypeScript compiled successfully
) else (
    echo [%date% %time%] ✓ No TypeScript source files found, skipping compilation
)

REM Create output directory if it doesn't exist
if not exist "out" (
    echo [%date% %time%] Creating output directory...
    mkdir "out"
    if errorlevel 1 (
        echo [%date% %time%] ERROR: Failed to create output directory
        pause
        exit /b 1
    )
    echo [%date% %time%] ✓ Output directory created
) else (
    echo [%date% %time%] ✓ Output directory already exists
)

REM Check if out directory has required files
if exist "out\extension.js" (
    echo [%date% %time%] ✓ Found compiled extension.js
) else (
    echo [%date% %time%] WARNING: extension.js not found in out directory
)

if exist "out\CopyrightHandler.js" (
    echo [%date% %time%] ✓ Found compiled CopyrightHandler.js
) else (
    echo [%date% %time%] WARNING: CopyrightHandler.js not found in out directory
)

REM Package the extension
echo [%date% %time%] Packaging extension...
echo y | vsce package
if errorlevel 1 (
    echo [%date% %time%] ERROR: Failed to package extension
    echo [%date% %time%] Check your package.json configuration
    pause
    exit /b 1
)

REM Find the created VSIX file
for %%f in (*.vsix) do (
    set "VSIX_FILE=%%f"
    set "VSIX_SIZE=%%~zf"
)

if defined VSIX_FILE (
    echo [%date% %time%] ✓ Extension packaged successfully
    echo [%date% %time%] VSIX file: %VSIX_FILE%
    echo [%date% %time%] File size: %VSIX_SIZE% bytes
) else (
    echo [%date% %time%] ERROR: VSIX file not found after packaging
    pause
    exit /b 1
)

echo.
echo [%date% %time%] === Packaging completed successfully ===
echo [%date% %time%] You can now install the extension by:
echo [%date% %time%] 1. Opening VS Code
echo [%date% %time%] 2. Going to Extensions (Ctrl+Shift+X)
echo [%date% %time%] 3. Clicking '...' and selecting 'Install from VSIX...'
echo [%date% %time%] 4. Choosing the file: %VSIX_FILE%
echo.
pause 
