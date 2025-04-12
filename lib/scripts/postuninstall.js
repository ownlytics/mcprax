#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

// Only run this in global uninstallation contexts
const isGlobalUninstall = process.env.npm_config_global === 'true';

/**
 * Removes shell completion files installed by mcprax
 */
function removeShellCompletions() {
  try {
    const userHome = os.homedir();
    
    // Check and remove Bash completions
    const bashCompletionFile = path.join(userHome, '.bash_completion.d', 'rax');
    if (fs.existsSync(bashCompletionFile)) {
      fs.unlinkSync(bashCompletionFile);
      console.log(chalk.green('✓ Removed Bash completion script'));
    }
    
    // Check and remove Zsh completions
    const zshCompletionFile = path.join(userHome, '.zsh', 'completion', '_rax');
    if (fs.existsSync(zshCompletionFile)) {
      fs.unlinkSync(zshCompletionFile);
      console.log(chalk.green('✓ Removed Zsh completion script'));
    }
    
    return true;
  } catch (error) {
    // Just log the error but don't fail - uninstallation should continue
    console.error(chalk.yellow(`Warning: Error removing shell completions: ${error.message}`));
    return false;
  }
}

/**
 * Offer to remove configuration directory
 */
function checkConfigDirectory() {
  const configDir = path.join(os.homedir(), '.mcprax');
  
  if (fs.existsSync(configDir)) {
    console.log(chalk.yellow(`
Note: The configuration directory at ${configDir} was not removed.
If you want to completely remove mcprax, you can delete this directory manually.
This directory contains your racks and server configurations.
    `));
  }
}

// Only perform cleanup for global uninstalls
if (isGlobalUninstall) {
  console.log(chalk.blue('Cleaning up mcprax installation...'));
  
  // Remove shell completions
  removeShellCompletions();
  
  // Check for config directory
  checkConfigDirectory();
  
  console.log(chalk.blue('mcprax has been uninstalled.'));
}

// Exit cleanly
process.exit(0);