#!/usr/bin/env node

/**
 * This is a simple test script to verify that mcprax is installed correctly.
 * Run this after installing mcprax globally to ensure everything is working.
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('Testing mcprax global installation...'));

try {
  // Test that the rax command is available
  const version = execSync('rax --version', { encoding: 'utf8' }).trim();
  console.log(chalk.green(`✓ rax command is available (version: ${version})`));

  // Test help command
  console.log(chalk.blue('Testing help command...'));
  execSync('rax --help', { stdio: 'inherit' });
  
  console.log(chalk.green('✓ All tests passed!'));
  console.log(chalk.blue('mcprax is ready to use.'));
  
} catch (error) {
  console.error(chalk.red('✗ Test failed'));
  console.error(chalk.red(error.message));
  console.error(chalk.yellow('\nIf the rax command is not found, ensure mcprax is installed globally:'));
  console.error(chalk.blue('npm install -g @ownlytics/mcprax'));
  
  console.error(chalk.yellow('\nCheck that your PATH includes the global npm bin directory:'));
  console.error(chalk.blue('npm bin -g'));
  
  process.exit(1);
}