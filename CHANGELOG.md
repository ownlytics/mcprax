# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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