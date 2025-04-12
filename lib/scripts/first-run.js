const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { CONFIG_DIR } = require('../config');

/**
 * Show a welcome message on first run
 */
async function firstTimeSetup() {
  // Check if this is first run
  const isFirstRun = !fs.existsSync(path.join(CONFIG_DIR, '.initialized'));
  
  if (!isFirstRun) {
    return;
  }
  
  // Mark as initialized
  fs.writeFileSync(path.join(CONFIG_DIR, '.initialized'), new Date().toISOString());
  
  // Show welcome message
  console.log(chalk.green.bold('🎉 Welcome to mcprax! 🎉'));
  console.log();
  console.log(chalk.cyan('To get started, try:'));
  console.log();
  console.log(`  ${chalk.cyan('rax create <rackname>')}     Create a new rack`);
  console.log(`  ${chalk.cyan('rax server create <name>')}  Create a server configuration`);
  console.log(`  ${chalk.cyan('rax mount <servername>')}    Add a server to your rack`);
  console.log(`  ${chalk.cyan('rax apply')}                 Apply configuration to Claude Desktop`);
  console.log();
  console.log(chalk.blue('Type `rax --help` to see all available commands.'));
  console.log();
}

module.exports = { firstTimeSetup };