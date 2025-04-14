# mcprax - Model Context Protocol Rack Manager

![Version](https://img.shields.io/badge/version-0.1.9-purple.svg) ![Status](https://img.shields.io/badge/status-beta-orange.svg) [![npm version](https://img.shields.io/npm/v/@ownlytics/mcprax?color=cb0000&label=npm&logo=npm)](https://www.npmjs.com/package/@ownlytics/mcprax) [![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://mariadb.com/bsl11/) ![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)

A powerful CLI tool for managing and deploying Model Context Protocol (MCP) servers to Claude Desktop as configurable "racks" - streamlining your development workflow.

## Installation

Install globally via npm:

```bash
npm install -g @ownlytics/mcprax
```

This will make the `rax` command available globally.

## What is mcprax?

mcprax (pronounced "mcp-racks") is a specialized tool for managing Model Context Protocol (MCP) servers in Claude Desktop. It allows you to:

1. Define multiple MCP server configurations
2. Group these servers into "racks" (collections)
3. Switch between different racks
4. Apply rack configurations to Claude Desktop

This approach is similar to version managers like nvm, rvm, and conda, allowing you to maintain multiple server configurations and easily switch between them.

## Quick Start

```bash
# Create a new rack for development
rax create ai-tools-rack

# Create an MCP server for filesystem access
rax server create filesystem '{"command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/username/Documents", "/Users/username/Projects"]}'

# Create a GitHub MCP server
rax server create github-server '{"command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"], "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"}}'

# Set the rack as active
rax use ai-tools-rack

# Mount servers to the active rack
rax mount filesystem
rax mount github-server

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

### Version Management

- `rax version` - Display version information
  - Use `--check` to check for updates
- `rax update` - Check for and apply updates to mcprax
  - Use `--check-only` to only check for updates, don't install
  - Use `--force` to update even if already on latest version
  - Use `--enable-notifications` to enable update notifications
  - Use `--disable-notifications` to disable update notifications

## MCP Server Configuration

MCP (Model Context Protocol) servers allow AI systems like Claude to interact with external tools, data sources, and services through a standardized interface. mcprax helps you manage these server configurations for Claude Desktop.

### Server Configuration Format

```json
{
  "name": "github-server",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
  },
  "disabled": false,
  "alwaysAllow": ["fetch", "readFile"]
}
```

#### Configuration Fields

- `name` - Identifier for the server
- `command` - The executable to run (npx, node, python, etc.)
- `args` - Array of command-line arguments
- `env` - Environment variables to set
- `disabled` - Whether the server is disabled by default
- `alwaysAllow` - Array of operations to always allow for this server

### Creating Server Configurations

There are multiple ways to create a server configuration:

#### Using JSON directly

```bash
rax server create postgres-server '{"command": "npx", "args": ["-y", "@modelcontextprotocol/server-postgresql"], "env": {"PGUSER": "user", "PGPASSWORD": "password", "PGDATABASE": "mydb"}}'
```

#### Using command arguments

```bash
rax server create vector-db npx -y @modelcontextprotocol/server-chroma
```

#### Using interactive mode

```bash
rax server create custom-server --interactive
```

#### From a JSON file

```bash
rax server create config-server path/to/server-config.json
```

## Rack Configuration

A rack is a collection of server configurations. When applied, all servers in the rack are configured in Claude Desktop.

```json
{
  "name": "ai-tools-rack",
  "servers": ["filesystem", "github-server", "brave-search"],
  "description": "Development environment with file access, GitHub, and search capabilities"
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

### Basic MCP Server Setup

```bash
# Create a development rack
rax create mcp-basic

# Create filesystem server for local file access
rax server create filesystem '{"command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/username/Documents"]}'

# Activate and configure
rax use mcp-basic
rax mount filesystem
rax apply
```

### Multiple Environment Management

```bash
# Create different racks for different purposes
rax create coding-tools
rax create data-analysis
rax create content-creation

# Configure coding tools rack
rax use coding-tools
rax mount github-server
rax mount code-assistant
rax apply

# Later, switch to data analysis tools
rax use data-analysis
rax mount postgres-server
rax mount csv-tools
rax apply
```

### Popular MCP Server Examples

Here are some examples of popular MCP servers you might want to configure:

1. **Filesystem** - Provides file system access
   ```bash
   rax server create filesystem '{"command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"]}'
   ```

2. **GitHub** - Repository and code management
   ```bash
   rax server create github '{"command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"], "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "your-token"}}'
   ```

3. **PostgreSQL** - Database access
   ```bash
   rax server create postgres '{"command": "npx", "args": ["-y", "@modelcontextprotocol/server-postgresql"], "env": {"PGUSER": "user", "PGPASSWORD": "pass", "PGDATABASE": "db", "PGHOST": "localhost"}}'
   ```

4. **Brave Search** - Web search capabilities
   ```bash
   rax server create brave-search '{"command": "npx", "args": ["-y", "@modelcontextprotocol/server-brave-search"], "env": {"BRAVE_API_KEY": "your-api-key"}}'
   ```

5. **Memory** - Persistent memory for LLMs
   ```bash
   rax server create memory '{"command": "npx", "args": ["-y", "@modelcontextprotocol/server-memory"]}'
   ```

## Storage Locations

mcprax stores configurations in the user's home directory:

```
~/.mcprax/
├── active.json            # Tracks active rack
├── servers/               # Server definitions
│   ├── filesystem.json
│   └── github-server.json
└── racks/                 # Rack definitions
    ├── coding-tools.json
    └── data-analysis.json
```

The Claude Desktop configuration is stored at:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

## Tips and Best Practices

1. **Name servers descriptively** - Use names that indicate function (e.g., "github-server", "postgres-db")
2. **Create purpose-specific racks** - Create different racks for different workflows
3. **Use the `--force` flag with caution** - It will override configurations without confirmation
4. **Check mounted servers before applying** - Use `rax mounted` to verify rack contents
5. **Restart Claude Desktop after applying** - Changes may require a restart to take effect
6. **Keep sensitive information secure** - API keys and tokens in MCP server configurations should be protected

## Troubleshooting

### Common Issues

- **"No active rack set"** - Run `rax use <rackname>` to set an active rack
- **"Server not found"** - Check if the server exists with `rax server list`
- **Configuration not taking effect** - Restart Claude Desktop after applying changes
- **Permission issues** - Ensure you have write access to the Claude Desktop configuration directory
- **MCP server errors** - Check Claude Desktop logs for server-specific error messages
- **Update failures** - If `rax update` fails, you may need administrator privileges. Try running `npm install -g @ownlytics/mcprax` manually

### Update Management

mcprax includes built-in tools to help you stay up-to-date:

```bash
# Check the current version and available updates
rax version --check

# Update to the latest version
rax update

# Disable update notifications
rax update --disable-notifications

# Enable update notifications
rax update --enable-notifications
```

### Configuration Backup

mcprax automatically creates backups of the Claude Desktop configuration before applying changes. Backups are stored in the same directory as the configuration file with a timestamp suffix.

## License

MIT