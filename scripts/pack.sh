#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Error logging function
log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Success logging function
log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

# Warning logging function
log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Set script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Log start
log "=== Starting VS Code Extension Packaging ==="
log "Script directory: $SCRIPT_DIR"
log "Project root: $PROJECT_ROOT"
log "Current directory: $(pwd)"
echo

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Please run this script from the project root directory."
    log "Expected location: $PROJECT_ROOT"
    exit 1
fi

log_success "Found package.json - running from correct directory"

# Check if Node.js is installed
log "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed or not in PATH"
    log "Please install Node.js from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version 2>/dev/null)
log_success "Node.js found: $NODE_VERSION"

# Check if vsce is installed globally
log "Checking vsce installation..."
if ! command -v vsce &> /dev/null; then
    log "Installing vsce globally..."
    npm install -g @vscode/vsce
    if [ $? -ne 0 ]; then
        log_error "Failed to install vsce"
        log "Try running: npm install -g @vscode/vsce"
        exit 1
    fi
    log_success "vsce installed successfully"
else
    VSCE_VERSION=$(vsce --version 2>/dev/null)
    log_success "vsce found: $VSCE_VERSION"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    log "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        log_error "Failed to install dependencies"
        log "Try running: npm install manually"
        exit 1
    fi
    log_success "Dependencies installed successfully"
else
    log_success "Dependencies already installed"
fi

# Compile TypeScript (if source files exist)
if [ -d "src" ]; then
    log "Compiling TypeScript..."
    npm run compile
    if [ $? -ne 0 ]; then
        log_error "Failed to compile TypeScript"
        log "Check your TypeScript configuration"
        exit 1
    fi
    log_success "TypeScript compiled successfully"
else
    log_success "No TypeScript source files found, skipping compilation"
fi

# Create output directory if it doesn't exist
if [ ! -d "out" ]; then
    log "Creating output directory..."
    mkdir -p out
    if [ $? -ne 0 ]; then
        log_error "Failed to create output directory"
        exit 1
    fi
    log_success "Output directory created"
else
    log_success "Output directory already exists"
fi

# Check if out directory has required files
if [ -f "out/extension.js" ]; then
    log_success "Found compiled extension.js"
else
    log_warning "extension.js not found in out directory"
fi

if [ -f "out/CopyrightHandler.js" ]; then
    log_success "Found compiled CopyrightHandler.js"
else
    log_warning "CopyrightHandler.js not found in out directory"
fi

# Package the extension
log "Packaging extension..."
echo "y" | vsce package
if [ $? -ne 0 ]; then
    log_error "Failed to package extension"
    log "Check your package.json configuration"
    exit 1
fi

# Find the created VSIX file
VSIX_FILES=(*.vsix)
if [ ${#VSIX_FILES[@]} -gt 0 ] && [ -f "${VSIX_FILES[0]}" ]; then
    VSIX_FILE="${VSIX_FILES[0]}"
    VSIX_SIZE=$(stat -c%s "$VSIX_FILE" 2>/dev/null || stat -f%z "$VSIX_FILE" 2>/dev/null || echo "unknown")
    log_success "Extension packaged successfully"
    log "VSIX file: $VSIX_FILE"
    log "File size: $VSIX_SIZE bytes"
else
    log_error "VSIX file not found after packaging"
    exit 1
fi

echo
log "=== Packaging completed successfully ==="
log "You can now install the extension by:"
log "1. Opening VS Code"
log "2. Going to Extensions (Ctrl+Shift+X)"
log "3. Clicking '...' and selecting 'Install from VSIX...'"
log "4. Choosing the file: $VSIX_FILE"
echo 
