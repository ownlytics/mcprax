#!/usr/bin/env node

// Simple version output for -v/--version flags
if (process.argv.length === 3 &&
    (process.argv[2] === '-v' ||
     process.argv[2] === '--version' ||
     process.argv[2] === '-V')) {
  const pkg = require('../package.json');
  console.log(pkg.version);
  process.exit(0);
}

const { program } = require('commander');
const chalk = require('chalk');
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');
const { ensureConfigDir } = require('../lib/config');
const commandRouter = require('../lib/commands');
const { firstTimeSetup } = require('../lib/scripts/first-run');

// Run first-time setup if needed
(async () => {
  await firstTimeSetup();
})();

// Check for updates
const notifier = updateNotifier({
  pkg,
  updateCheckInterval: 1000 * 60 * 60 * 24 // 1 day
});

if (notifier.update) {
  console.log(chalk.blue('╭────────────────────────────────────────╮'));
  console.log(chalk.blue('│ Update available: ') +
    chalk.green(notifier.update.latest) +
    chalk.blue(' (current: ' + notifier.update.current + ')') +
    chalk.blue(' │'));
  console.log(chalk.blue('│ Run ') +
    chalk.cyan('npm install -g @ownlytics/mcprax') +
    chalk.blue(' to update │'));
  console.log(chalk.blue('╰────────────────────────────────────────╯'));
  console.log();
}

// Ensure config directory exists
ensureConfigDir();

// Define ASCII art banner to use in help
const asciiBanner = `
 ███    ███  ██████ ██████  ██████   █████  ██   ██
 ████  ████ ██      ██   ██ ██   ██ ██   ██  ██ ██
 ██ ████ ██ ██      ██████  ██████  ███████   ███
 ██  ██  ██ ██      ██      ██   ██ ██   ██  ██ ██
 ██      ██  ██████ ██      ██   ██ ██   ██ ██   ██
                                             v${pkg.version}
`;

// Flag to determine if we're showing help content
const isShowingHelp = process.argv.includes('--help') ||
                      process.argv.includes('-h') ||
                      process.argv.length <= 2;

// Set up program
program
  .version(pkg.version, '-v, --version', 'Output the current version')
  .description(chalk.cyan('A tool for managing MCP servers and racks for Claude Desktop'))
  .usage('<command> [options]');

// Add commands
commandRouter(program);

// Override the help output to include the banner
const originalHelp = program.help;
program.help = function(cb) {
  // Only show the banner if we're explicitly showing help
  if (isShowingHelp) {
    console.log(chalk.cyan(asciiBanner));
  }
  return originalHelp.call(this, cb);
};

// Add examples section
program.on('--help', () => {
  console.log('');
  console.log(chalk.yellow('Examples:'));
  console.log('');
  console.log('  $ rax create myproject    Create a new rack named "myproject"');
  console.log('  $ rax server create api node server.js    Create a new server configuration');
  console.log('  $ rax mount api          Add the "api" server to the active rack');
  console.log('  $ rax apply              Apply the configuration to Claude Desktop');
  console.log('');
});

// Display help when no command is provided
if (process.argv.length <= 2) {
  program.help();
}

// Handle command errors
program.showHelpAfterError('(add --help for additional information)');

// Parse arguments
program.parse(process.argv);