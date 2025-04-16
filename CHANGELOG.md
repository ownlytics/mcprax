# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.12] - 2025-04-16

### Fixed

- Fixed inconsistent behavior in `rax update` command
  - Resolved issue where the command reported being on the latest version while simultaneously showing an update notification
  - Improved consistency between update notification system and update command by sharing version information
  - Added `--clear-cache` option to force fresh update checks when needed
  - Enhanced version comparison using standardized semver checks
  - Added cache clearing functionality to resolve potential stale cache issues

## [0.1.11] - 2025-04-16

### Fixed

- Fixed `rax reboot` command to handle missing Claude Desktop processes gracefully
  - Added timeout mechanism to prevent hanging when processes can't be terminated
  - Improved error handling for "No such process" errors on macOS and Windows
  - Enhanced feedback messages for better user experience
  - Fixed process counting logic to ensure command always completes
- Fixed inconsistency in confirmation behavior between `rax reboot` and `rax apply --restart`
  - Modified `rax apply --restart` to respect `--force` and `--yes` flags for consistency
  - Added proper confirmation prompt when using `rax apply --restart` without force options
- Fixed redundant help lines in `rax --help` and `rax` commands
  - Streamlined help display logic to avoid duplicating content
  - Limited ASCII banner display to main help only
  - Improved help content organization and guidance

### Enhanced

- Enhanced `rax current` command to show more detailed information
  - Added display of mounted servers with their status and configuration
  - Included server commands and "Always Allow" patterns in the output
  - Provided helpful tips for accessing more detailed information
  - Improved feedback when no servers are mounted

## [0.1.10] - 2025-04-15

### Added

- Added `rax reboot` command to restart Claude Desktop application
  - Supports both macOS and Windows platforms
  - Includes confirmation prompt to prevent data loss (can be bypassed with `--force`)
  - Automatically detects and terminates Claude Desktop processes
  - Launches Claude Desktop from common installation locations
- Added `--restart` option to `rax apply` command
  - Automatically restarts Claude Desktop after applying configuration changes
  - Eliminates need for manual restarts
- Updated documentation to reflect new commands and options

## [0.1.9] - 2025-04-14

### Added

- Enhanced version management system
  - Added `version` command to display detailed version information
  - Added `update` command to check for and apply updates
  - Added configuration options for update notifications
- Improved update notification system
  - Fixed display issues with update notifications
  - Added ability to enable/disable update notifications
  - Added tracking for previously notified versions to prevent duplicate notifications
- Added documentation for version management features

## [0.1.8] - 2025-04-14

### Fixed

- Fixed active rack detection issue in the Apply command
  - Removed redundant check for `ACTIVE_CONFIG` file existence in `apply.js`
  - Updated `setActiveRack()` function in `config.js` to ensure the `ACTIVE_CONFIG` file is created when setting the active rack
  - This resolves an issue where the apply command would fail to recognize the active rack even though the use command successfully set it

## [0.1.7] - 2025-04-01

### Added

- Initial public release
- CLI commands for managing MCP servers and racks
- Support for applying rack configurations to Claude Desktop
- Cross-platform support for Windows, macOS, and Linux