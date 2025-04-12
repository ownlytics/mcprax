# mcprax - MCP Server & Rack Manager

A command-line tool for managing Model Control Protocol (MCP) servers and collections of servers called "racks" for Claude Desktop.

## Installation

Install globally via npm:

```bash
npm install -g @ownlytics/mcprax
```

This will make the `rax` command available globally.

## Quick Start

```bash
# Create a default rack
rax create default

# Create a server configuration
rax server create api node api.js

# Mount the server to the active rack
rax mount api

# Apply the configuration to Claude Desktop
rax apply
```

## Commands

### Rack Management

- `rax create <rackname>` - Create a new, empty rack
- `rax use <rackname>` - Activate a specific rack
- `rax list` - List available racks
- `rax current` - Show currently active rack
- `rax delete <rackname>` - Delete a rack

### Server Management

- `rax server create <servername> <command> [args...]` - Create a new server configuration
- `rax server list` - List available servers
- `rax server show <servername>` - Show details of a server configuration
- `rax server edit <servername>` - Edit a server configuration
- `rax server delete <servername>` - Delete a server configuration

### Rack-Server Operations

- `rax mount <servername>` - Add server to active rack
- `rax unmount <servername>` - Remove server from active rack
- `rax mounted` - List servers in the active rack

### Configuration Application

- `rax apply` - Apply active rack to Claude Desktop configuration

## Configuration

mcprax stores configurations in the user's home directory:

```
~/.mcprax/
├── active.json            # Tracks active rack
├── servers/               # Server definitions
│   ├── server1.json
│   └── server2.json
└── racks/                 # Rack definitions
    ├── rack1.json
    └── rack2.json
```

## Server Configuration

Server configurations are JSON files with the following structure:

```json
{
  "name": "api-server",
  "command": "node",
  "args": ["api.js", "--port", "3000"],
  "env": {
    "NODE_ENV": "development",
    "DEBUG": "api:*"
  },
  "disabled": false,
  "alwaysAllow": ["fetch", "readFile"]
}
```

- `name`: The name of the server (must match the filename)
- `command`: The command to run (e.g., node, python)
- `args`: An array of command-line arguments
- `env`: Environment variables to set when running the server
- `disabled`: Whether the server is disabled (won't start when applying configuration)
- `alwaysAllow`: (Optional) Array of operations that should always be allowed for this server

## Rack Configuration

Rack configurations are JSON files with the following structure:

```json
{
  "name": "development",
  "servers": ["api-server", "database", "auth"],
  "description": "Development environment with API and database servers"
}
```

- `name`: The name of the rack (must match the filename)
- `servers`: An array of server names to include in this rack
- `description`: (Optional) A description of this rack

## Cross-Platform Support

mcprax works on:
- macOS
- Windows
- Linux

It automatically detects the correct location for the Claude Desktop configuration file based on your operating system.

## Shell Completion

mcprax installs shell completion scripts for Bash and Zsh during global installation. After installing, you may need to restart your terminal or source your shell configuration file for completions to take effect.

## Examples

```bash
# Create a new rack for development
rax create development

# Create a Node.js API server configuration
rax server create api-server node api.js --port 3000

# Create a Python web server configuration
rax server create python-server python -m http.server 8000

# Set the development rack as active
rax use development

# Add servers to the active rack
rax mount api-server
rax mount python-server

# Apply the configuration to Claude Desktop
rax apply

# List all available racks
rax list

# Show the active rack and its servers
rax current
rax mounted

# Remove a server from the active rack
rax unmount python-server

# Apply the updated configuration
rax apply
```

## License

MIT