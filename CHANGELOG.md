# Change Log
All notable changes to the "copyright-notice" extension will be documented in this file.

## [1.1.1] - 2025-12-04
### Added
- `copyright-notice.autoRemoveEmojis` setting for automatic emoji removal on file save

## [1.1.0] - 2025-12-04
### Added
- New "Remove All Emojis from File" command to clean emoji characters from code files
- Comprehensive emoji detection covering all Unicode emoji ranges
- `copyright-notice.autoRemoveEmojis` setting for automatic emoji removal on file save

## [1.0.1] - 2025-07-18
### Fixed
- `.ahk2` files now work properly even if VS Code doesn't recognize the language ID
- Extension now works if EITHER language ID OR file extension is enabled (not both required)

### Added
- File exclusion patterns to prevent copyright notices on specific files (e.g., `*.json`)
- Support for glob patterns in file exclusions
- New configuration option `copyright-notice.excludedFiles`
- Packaging scripts for easy VSIX creation (`scripts/pack.bat` and `scripts/pack.sh`)
- NPM scripts for packaging: `package`, `package:win`, `package:unix`

## [1.0.0] - 2024-01-XX
### Added
- Timestamp support for creation and update times
- Manual command to apply copyright notices
- File extension filtering
- Multiple predefined templates
- Improved formatting and error handling

## [0.1.0] - 2024-01-XX
- Initial release
- Add copyright notice at the beginning of files when typing if one doesn't already exist 
