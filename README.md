# mcprax - Model Control Protocol Rack Manager

![Version](https://img.shields.io/badge/version-0.1.5-purple.svg) ![Status](https://img.shields.io/badge/status-beta-orange.svg) [![npm version](https://img.shields.io/npm/v/@ownlytics/mcprax?color=cb0000&label=npm&logo=npm)](https://www.npmjs.com/package/@ownlytics/mcprax) [![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://mariadb.com/bsl11/) ![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)

A powerful CLI tool for managing and deploying Model Control Protocol (MCP) servers to Claude Desktop as configurable "racks" - streamlining your development workflow.

## Installation

Install globally via npm:

```bash
npm install -g @ownlytics/mcprax
```

This will make the `rax` command available globally.

## What is mcprax?

mcprax (pronounced "mcp-racks") allows you to:

1. Define multiple MCP server configurations
2. Group these servers into "racks" (collections)
3. Switch between different racks
4. Apply rack configurations to Claude Desktop

This approach is similar to version managers like nvm, rvm, and conda, allowing you to maintain multiple server configurations and easily switch between them.

## Quick Start

```bash
# Create a new rack for development
rax create dev-environment

# Create an MCP server configuration
rax server create api-server '{"command": "node", "args": ["api.js"], "env": {"PORT": "3000"}}'

# Or create a server with direct command arguments
rax server create db-server node db-server.js --port 5432

# Set the rack as active
rax use dev-environment

# Mount servers to the active rack
rax mount api-server
rax mount db-server

# Apply the rack to Claude Desktop
rax apply

# Verify your configuration
rax mounted
```

## Commands

### Rack Management

- `rax create <rackname>` - Create a new, empty rack
- `rax use <rackname>` - Activate a specific rack
- `rax list` - List available racks
- `rax current` - Show currently active rack
- `rax delete <rackname>` - Delete a rack

### Server Management

- `rax server create <servername> [config]` - Create a new server configuration
  - `config` can be a JSON string, path to JSON file, or command + args
- `rax server list` - List available servers
- `rax server show <servername>` - Show details of a server configuration
- `rax server delete <servername>` - Delete a server configuration

### Rack-Server Operations

- `rax mount <servername>` - Add server to active rack
- `rax unmount <servername>` - Remove server from active rack
- `rax mounted` - List servers in the active rack

### Configuration Application

- `rax apply` - Apply active rack to Claude Desktop configuration
  - Use `--force` to apply even if rack has no servers
  - Use `--yes` to skip confirmation prompts

## MCP Server Configuration

MCP servers in Claude Desktop run background server processes that Claude can connect to. mcprax provides a simple way to manage these server configurations.

### Server Configuration Format

```json
{
  "name": "my-api",
  "command": "node",
  "args": ["server.js", "--port", "3000"],
  "env": {
    "NODE_ENV": "development"
  },
  "disabled": false,
  "alwaysAllow": ["fetch", "readFile"]
}
```

#### Configuration Fields

- `name` - Identifier for the server
- `command` - Executable to run (node, python, etc.)
- `args` - Array of command-line arguments
- `env` - Environment variables to set
- `disabled` - Whether the server is disabled by default
- `alwaysAllow` - Array of operations to always allow for this server

### Creating Server Configurations

There are multiple ways to create a server configuration:

#### Using JSON directly

```bash
rax server create python-api '{"command": "python", "args": ["-m", "http.server", "8000"]}'
```

#### Using command arguments

```bash
rax server create node-api node server.js --port 3000
```

#### Using interactive mode

```bash
rax server create interactive-server --interactive
```

#### From a JSON file

```bash
rax server create file-server path/to/server-config.json
```

## Rack Configuration

A rack is a collection of server configurations. When applied, all servers in the rack are configured in Claude Desktop.

```json
{
  "name": "development",
  "servers": ["my-api", "database", "auth-service"],
  "description": "Development environment with API and services"
}
```

## How It Works

mcprax manages:

1. Server configurations (JSON files in `~/.mcprax/servers/`)
2. Rack configurations (JSON files in `~/.mcprax/racks/`)
3. Active rack tracking
4. Claude Desktop configuration generation

When you run `rax apply`, mcprax:

1. Reads the active rack configuration
2. Loads all server configurations in the rack
3. Generates a Claude Desktop configuration file with all the server configurations
4. Backs up the existing Claude Desktop configuration (if any)
5. Writes the new configuration to Claude Desktop

## Example Workflows

### Development Environment Setup

```bash
# Create a development rack
rax create development

# Create API server
rax server create api '{"command": "node", "args": ["api.js"], "env": {"DEBUG": "api:*"}}'

# Create database server
rax server create db '{"command": "docker", "args": ["compose", "up", "db"]}'

# Activate and configure
rax use development
rax mount api
rax mount db
rax apply
```

### Multiple Environment Management

```bash
# Create multiple racks
rax create development
rax create testing
rax create production

# Add specific servers to each
rax use development
rax mount dev-api
rax mount local-db

rax use testing
rax mount test-api
rax mount test-db

rax use production
rax mount prod-api

# Switch between environments
rax use development
rax apply

# Later, switch to testing
rax use testing
rax apply
```

### Temporary Configuration Changes

```bash
# Remove a server temporarily
rax unmount api
rax apply

# Add it back later
rax mount api
rax apply
```

## Storage Locations

mcprax stores configurations in the user's home directory:

```
~/.mcprax/
├── active.json            # Tracks active rack
├── servers/               # Server definitions
│   ├── api.json
│   └── database.json
└── racks/                 # Rack definitions
    ├── development.json
    └── production.json
```

The Claude Desktop configuration is stored at:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

## Tips and Best Practices

1. **Name servers descriptively** - Use names that indicate function (e.g., "api-server", "auth-service")
2. **Create purpose-specific racks** - Create different racks for different workflows
3. **Use the `--force` flag with caution** - It will override configurations without confirmation
4. **Check mounted servers before applying** - Use `rax mounted` to verify rack contents
5. **Restart Claude Desktop after applying** - Changes may require a restart to take effect

## Troubleshooting

### Common Issues

- **"No active rack set"** - Run `rax use <rackname>` to set an active rack
- **"Server not found"** - Check if the server exists with `rax server list`
- **Configuration not taking effect** - Restart Claude Desktop after applying changes
- **Permission issues** - Ensure you have write access to the Claude Desktop configuration directory

### Configuration Backup

mcprax automatically creates backups of the Claude Desktop configuration before applying changes. Backups are stored in the same directory as the configuration file with a timestamp suffix.

## License

MIT