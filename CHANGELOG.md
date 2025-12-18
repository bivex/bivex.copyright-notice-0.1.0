# Change Log
All notable changes to the "copyright-notice" extension will be documented in this file.

## [1.1.10] - 2025-12-18
### Fixed
- "Last Updated" timestamps now properly update in Python files with `#` style comments
- Enhanced timestamp update logic to handle both JavaScript (`/** */`) and Python (`#`) comment styles

## [1.1.9] - 2025-12-18
### Added
- UTC timezone support with `copyright-notice.useUtc` configuration option
- Enhanced timestamp parsing to handle both UTC and local timezone formats
### Changed
- Improved timestamp formatting to support UTC when configured

## [1.1.8] - 2025-12-18
### Added
- Go language support with proper comment formatting
- ISO 8601-2:2019 compliant timestamp formatting (changed default from "YYYY-MM-DD HH:mm:ss" to "YYYY-MM-DDTHH:mm:ss")
- Comprehensive timestamp format fallback parsing for existing files with various timestamp formats
### Changed
- Updated default timestamp format to use ISO 8601-2:2019 standard with 'T' separator between date and time
- Enhanced timestamp parsing to support multiple formats for backward compatibility
### Fixed
- Improved timezone handling in timestamp parsing to avoid date shifting issues

## [1.1.1] - 2025-12-17
### Added
- Silent background mode for unobtrusive copyright management
- Configurable background update delay (500-10000ms)
- Smart caching system for improved performance
- Advanced document opening handler
- Comprehensive diagnostic and testing tools
- Folder restriction functionality to limit copyright application
- Comprehensive default exclusions for common folders (node_modules, .git, dist, etc.)
- Smart debouncing for inactive files with configurable thresholds
- Inactive file detection for immediate copyright updates
- `copyright-notice.silentMode` setting (default: true)
- `copyright-notice.backgroundUpdateDelay` setting (default: 1500ms)
- `copyright-notice.allowedFolders` setting for folder-based restrictions
- `copyright-notice.smartDebouncing` setting for intelligent delay management
- `copyright-notice.smartDebounceMultiplier` and `smartDebounceThreshold` settings
### Fixed
- Method binding issue causing runtime errors in document save handler
- Improved copyright detection with better pattern recognition
- Enhanced insertion logic to preserve file structure
- Module loading compatibility issues resolved

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
