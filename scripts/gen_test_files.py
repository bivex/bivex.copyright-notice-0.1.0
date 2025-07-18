#!/usr/bin/env python3
"""
Test File Generator for Copyright Notice Extension

This script generates various test files to verify the copyright notice extension
works correctly with different file types, configurations, and scenarios.
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path

class TestFileGenerator:
    def __init__(self, output_dir="test_files"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
    def log(self, message):
        """Print timestamped log message"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {message}")
    
    def create_file(self, filename, content, description=""):
        """Create a test file with given content"""
        filepath = self.output_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        self.log(f"✓ Created {filename} ({len(content)} chars) - {description}")
        return filepath
    
    def generate_js_files(self):
        """Generate JavaScript test files"""
        self.log("Generating JavaScript test files...")
        
        # Basic JS file without copyright
        self.create_file(
            "basic.js",
            "function hello() {\n    console.log('Hello, World!');\n}\n",
            "Basic JS without copyright notice"
        )
        
        # JS file with existing copyright
        self.create_file(
            "with_copyright.js",
            "/**\n * Copyright (c) 2023 Test Company\n * All rights reserved.\n */\n\nfunction hello() {\n    console.log('Hello, World!');\n}\n",
            "JS with existing copyright notice"
        )
        
        # JS file with different copyright format
        self.create_file(
            "different_copyright.js",
            "/* Copyright (c) 2023 Another Company */\n\nfunction hello() {\n    console.log('Hello, World!');\n}\n",
            "JS with different copyright format"
        )
    
    def generate_ts_files(self):
        """Generate TypeScript test files"""
        self.log("Generating TypeScript test files...")
        
        # Basic TS file
        self.create_file(
            "basic.ts",
            "interface User {\n    name: string;\n    age: number;\n}\n\nfunction greet(user: User): string {\n    return `Hello, ${user.name}!`;\n}\n",
            "Basic TypeScript without copyright notice"
        )
        
        # TS file with existing copyright
        self.create_file(
            "with_copyright.ts",
            "/**\n * Copyright (c) 2023 TypeScript Company\n * Created: 2023-01-01 12:00:00\n * Last Updated: 2023-01-15 14:30:00\n */\n\ninterface User {\n    name: string;\n    age: number;\n}\n",
            "TypeScript with existing copyright and timestamps"
        )
    
    def generate_ahk_files(self):
        """Generate AutoHotkey test files"""
        self.log("Generating AutoHotkey test files...")
        
        # Basic AHK file
        self.create_file(
            "basic.ahk",
            "F1::\n    MsgBox, Hello World!\nreturn\n\nF2::\n    Send, Hello from AutoHotkey!\nreturn\n",
            "Basic AutoHotkey without copyright notice"
        )
        
        # AHK2 file
        self.create_file(
            "basic.ahk2",
            "F1:: {\n    MsgBox('Hello World!')\n}\n\nF2:: {\n    Send('Hello from AutoHotkey v2!')\n}\n",
            "AutoHotkey v2 without copyright notice"
        )
        
        # AHK file with existing copyright
        self.create_file(
            "with_copyright.ahk",
            "/*\n * Copyright (c) 2023 AHK Company\n * All rights reserved.\n */\n\nF1::\n    MsgBox, Hello World!\nreturn\n",
            "AutoHotkey with existing copyright notice"
        )
    
    def generate_py_files(self):
        """Generate Python test files"""
        self.log("Generating Python test files...")
        
        # Basic Python file
        self.create_file(
            "basic.py",
            "def hello():\n    print('Hello, World!')\n\nif __name__ == '__main__':\n    hello()\n",
            "Basic Python without copyright notice"
        )
        
        # Python file with existing copyright
        self.create_file(
            "with_copyright.py",
            "# Copyright (c) 2023 Python Company\n# All rights reserved.\n\ndef hello():\n    print('Hello, World!')\n",
            "Python with existing copyright notice"
        )
    
    def generate_cpp_files(self):
        """Generate C++ test files"""
        self.log("Generating C++ test files...")
        
        # Basic C++ file
        self.create_file(
            "basic.cpp",
            "#include <iostream>\n\nint main() {\n    std::cout << \"Hello, World!\" << std::endl;\n    return 0;\n}\n",
            "Basic C++ without copyright notice"
        )
        
        # C++ header file
        self.create_file(
            "basic.h",
            "#ifndef BASIC_H\n#define BASIC_H\n\nclass Basic {\npublic:\n    void hello();\n};\n\n#endif\n",
            "Basic C++ header without copyright notice"
        )
    
    def generate_json_files(self):
        """Generate JSON files (should be excluded)"""
        self.log("Generating JSON files (should be excluded)...")
        
        # Config file
        self.create_file(
            "config.json",
            '{\n    "name": "test",\n    "version": "1.0.0",\n    "description": "Test configuration"\n}\n',
            "JSON config file (should be excluded)"
        )
        
        # Package file
        self.create_file(
            "package.json",
            '{\n    "name": "test-package",\n    "version": "1.0.0",\n    "description": "Test package"\n}\n',
            "JSON package file (should be excluded)"
        )
    
    def generate_mixed_files(self):
        """Generate files with mixed content"""
        self.log("Generating mixed content files...")
        
        # HTML file
        self.create_file(
            "basic.html",
            "<!DOCTYPE html>\n<html>\n<head>\n    <title>Test Page</title>\n</head>\n<body>\n    <h1>Hello World</h1>\n</body>\n</html>\n",
            "Basic HTML without copyright notice"
        )
        
        # CSS file
        self.create_file(
            "basic.css",
            "body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}\n\nh1 {\n    color: #333;\n}\n",
            "Basic CSS without copyright notice"
        )
        
        # Shell script
        self.create_file(
            "basic.sh",
            "#!/bin/bash\n\necho \"Hello, World!\"\n\nexit 0\n",
            "Basic shell script without copyright notice"
        )
    
    def generate_vscode_settings(self):
        """Generate VS Code settings for testing"""
        self.log("Generating VS Code settings...")
        
        # Settings for testing .ahk2 files
        settings = {
            "copyright-notice.fileExtensions": [
                ".js", ".jsx", ".ts", ".tsx", ".py", ".cpp", ".h", ".ahk", ".ahk2"
            ],
            "copyright-notice.excludedFiles": [
                "*.json", "*.config.js", "package.json", "tsconfig.json"
            ],
            "copyright-notice.template": "/**\n * Copyright (c) {year} Test Company\n * All rights reserved.\n */\n\n",
            "copyright-notice.includeTimestamp": True,
            "copyright-notice.timestampFormat": "YYYY-MM-DD HH:mm:ss",
            "copyright-notice.includeUpdateTime": True,
            "copyright-notice.updateTimeFormat": "YYYY-MM-DD HH:mm:ss"
        }
        
        settings_path = self.output_dir / "test_settings.json"
        with open(settings_path, 'w', encoding='utf-8') as f:
            json.dump(settings, f, indent=4)
        
        self.log(f"✓ Created test_settings.json - VS Code settings for testing")
    
    def generate_readme(self):
        """Generate README for test files"""
        self.log("Generating test README...")
        
        readme_content = """# Test Files for Copyright Notice Extension

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
"""
        
        readme_path = self.output_dir / "README.md"
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        self.log(f"✓ Created README.md - Testing instructions")
    
    def generate_all(self):
        """Generate all test files"""
        self.log("=== Starting Test File Generation ===")
        self.log(f"Output directory: {self.output_dir.absolute()}")
        print()
        
        try:
            self.generate_js_files()
            print()
            self.generate_ts_files()
            print()
            self.generate_ahk_files()
            print()
            self.generate_py_files()
            print()
            self.generate_cpp_files()
            print()
            self.generate_json_files()
            print()
            self.generate_mixed_files()
            print()
            self.generate_vscode_settings()
            print()
            self.generate_readme()
            print()
            
            # Count files
            file_count = len(list(self.output_dir.glob("*")))
            self.log(f"=== Test file generation completed ===")
            self.log(f"Generated {file_count} files in {self.output_dir}")
            self.log("Use these files to test the copyright notice extension!")
            
        except Exception as e:
            self.log(f"ERROR: Failed to generate test files: {e}")
            return False
        
        return True

def main():
    """Main function"""
    if len(sys.argv) > 1:
        output_dir = sys.argv[1]
    else:
        output_dir = "test_files"
    
    generator = TestFileGenerator(output_dir)
    success = generator.generate_all()
    
    if success:
        print(f"\nTest files generated successfully in: {generator.output_dir.absolute()}")
        print("You can now use these files to test the copyright notice extension!")
    else:
        print("\nFailed to generate test files.")
        sys.exit(1)

if __name__ == "__main__":
    main() 
