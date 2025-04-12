#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { installCompletionScripts } = require('../completions');
const os = require('os');
const { ensureConfigDir } = require('../config');

// Only run this in global installation contexts
const isGlobalInstall = process.env.npm_config_global === 'true';

function displayWelcomeMessage() {
  console.log();
  console.log(chalk.blue.bold('🎉 Thank you for installing mcprax! 🎉'));
  console.log();
  console.log(chalk.cyan('mcprax is a command-line tool for managing MCP servers and racks for Claude Desktop.'));
  console.log();
  console.log('To get started, try:');
  console.log();
  console.log(chalk.green('  rax --help') + chalk.gray('                 # Show help information'));
  console.log(chalk.green('  rax create default') + chalk.gray('          # Create a default rack'));
  console.log(chalk.green('  rax server create myapi node api.js') + chalk.gray(' # Create a server configuration'));
  console.log(chalk.green('  rax mount myapi') + chalk.gray('             # Add server to the active rack'));
  console.log(chalk.green('  rax apply') + chalk.gray('                   # Apply configuration to Claude Desktop'));
  console.log();
  console.log(chalk.yellow('For more information, visit:'));
  console.log(chalk.blue('https://github.com/ownlytics/mcprax'));
  console.log();
}

// Ensure config directory exists
ensureConfigDir();

// Only for global installs
if (isGlobalInstall) {
  // Display welcome message
  displayWelcomeMessage();
  
  // Install shell completions
  installCompletionScripts();
}

// Exit cleanly
process.exit(0);