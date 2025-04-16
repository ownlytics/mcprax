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
const { ensureConfigDir, getUpdateSettings, setUpdateSettings } = require('../lib/config');
const commandRouter = require('../lib/commands');
const { firstTimeSetup } = require('../lib/scripts/first-run');

// Run first-time setup if needed
(async () => {
  await firstTimeSetup();
})();

// Check for updates only if enabled in settings
const settings = getUpdateSettings();
if (settings.checkEnabled !== false) { // Default to true if not set
  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 1000 * 60 * 60 * 24, // 1 day
    shouldNotifyInNpmScript: true
  });

  // Only notify if we haven't already notified about this version
  if (notifier.update && notifier.update.latest !== settings.lastNotifiedVersion) {
    // Update last notified version
    setUpdateSettings({ lastNotifiedVersion: notifier.update.latest });
    
    // Use the built-in notifier with custom styling
    notifier.notify({
      message: `Update available: ${pkg.version} → ${notifier.update.latest}\nRun ${chalk.cyan('rax update')} to update`,
      boxenOpts: {
        padding: 1,
        margin: 1,
        align: 'center',
        borderColor: 'blue',
        borderStyle: 'round'
      }
    });
  }
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

// Flag to determine if we're showing main help (no command specified)
const isShowingMainHelp = process.argv.length <= 2;

// Set up program
program
  .version(pkg.version, '-v, --version', 'Output the current version')
  .description(chalk.cyan('A tool for managing MCP servers and racks for Claude Desktop'))
  .usage('<command> [options]');

// Add commands
commandRouter(program);

// Override the help output to include the banner only for main help
const originalHelp = program.help;
program.help = function(cb) {
  // Only show the banner for the main help (no command specified)
  if (isShowingMainHelp) {
    console.log(chalk.cyan(asciiBanner));
  }
  return originalHelp.call(this, cb);
};

// Add examples section only for main help
if (isShowingMainHelp) {
  program.on('--help', () => {
    console.log('');
    console.log(chalk.yellow('Common Examples:'));
    console.log('');
    console.log('  $ rax create myproject    Create a new rack named "myproject"');
    console.log('  $ rax server create api node server.js    Create a new server configuration');
    console.log('  $ rax mount api          Add the "api" server to the active rack');
    console.log('  $ rax apply              Apply the configuration to Claude Desktop');
    console.log('');
    console.log(chalk.blue('For detailed help on a specific command, use:'));
    console.log('  $ rax <command> --help');
    console.log('');
  });
}

// Display help when no command is provided
if (isShowingMainHelp) {
  program.help();
}

// Handle command errors
program.showHelpAfterError('(add --help for additional information)');

// Parse arguments
program.parse(process.argv);