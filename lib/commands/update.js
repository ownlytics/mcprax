const chalk = require('chalk');
const ora = require('ora');
const { spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const updateNotifier = require('update-notifier');
const prompts = require('prompts');
const semver = require('semver');
const pkg = require('../../package.json');
const { getUpdateSettings, setUpdateSettings } = require('../config');
const { clearUpdateCache, isUpdateAvailable } = require('../utils');

/**
 * Update command implementation
 * @param {import('commander').Command} program - The Commander program instance
 */
function updateCommand(program) {
  program
    .command('update')
    .description('Check for and apply updates to mcprax')
    .option('-c, --check-only', 'Only check for updates, don\'t install')
    .option('-f, --force', 'Force update even if already on latest version')
    .option('--enable-notifications', 'Enable update notifications')
    .option('--disable-notifications', 'Disable update notifications')
    .option('--clear-cache', 'Clear update check cache before checking')
    .on('--help', () => {
      console.log('');
      console.log(chalk.yellow('Examples:'));
      console.log('');
      console.log('  $ rax update                # Check and prompt to update if available');
      console.log('  $ rax update --check-only   # Only check, don\'t update');
      console.log('  $ rax update --force        # Update even if already on latest version');
      console.log('  $ rax update --disable-notifications  # Turn off update notifications');
      console.log('  $ rax update --clear-cache   # Clear update cache before checking');
      console.log('');
    })
    .action(async (options) => {
      // Handle notification settings
      if (options.enableNotifications) {
        setUpdateSettings({ checkEnabled: true });
        console.log(chalk.green('Update notifications enabled.'));
        return;
      }
      
      if (options.disableNotifications) {
        setUpdateSettings({ checkEnabled: false });
        console.log(chalk.green('Update notifications disabled.'));
        return;
      }
      
      // Clear cache if requested
      if (options.clearCache) {
        const cleared = clearUpdateCache();
        if (cleared) {
          console.log(chalk.blue('Update check cache cleared.'));
        }
      }
      
      const spinner = ora('Checking for updates...').start();
      
      try {
        // IMPORTANT: Check if we already know about a newer version first
        const settings = getUpdateSettings();
        const knownLatestVersion = settings.lastNotifiedVersion;
        let updateAvailable = false;
        let latestVersion = null;
        
        // If we already know about a newer version and it's greater than current version
        if (knownLatestVersion && isUpdateAvailable(pkg.version, knownLatestVersion)) {
          updateAvailable = true;
          latestVersion = knownLatestVersion;
          spinner.succeed(`Update available: ${pkg.version} → ${chalk.green(latestVersion)}`);
        } else {
          // Fallback to regular update check if we don't already know about an update
          const notifier = updateNotifier({
            pkg,
            updateCheckInterval: 0  // Force check
          });
          
          // Check for updates
          await notifier.fetchInfo();
          
          if (notifier.update) {
            updateAvailable = true;
            latestVersion = notifier.update.latest;
            // Also update the lastNotifiedVersion to ensure consistency
            setUpdateSettings({ lastNotifiedVersion: latestVersion });
            spinner.succeed(`Update available: ${pkg.version} → ${chalk.green(latestVersion)}`);
          } else if (!options.force) {
            spinner.succeed(`mcprax is already at the latest version (${pkg.version}).`);
            return;
          } else {
            spinner.succeed(`Current version: ${pkg.version}`);
          }
        }
        
        // Rest of the update process (check only, confirm, perform update)
        if (options.checkOnly) {
          const packageName = pkg.name;
          console.log(chalk.cyan(`\nRun 'npm install -g ${packageName}' to update.`));
          return;
        }
        
        // Confirm update
        if (!options.force && updateAvailable) {
          spinner.stop();
          const response = await prompts({
            type: 'confirm',
            name: 'confirm',
            message: 'Do you want to update now?',
            initial: true
          });
          
          if (!response.confirm) {
            console.log(chalk.blue('Update cancelled.'));
            return;
          }
        }
        
        // Perform update
        spinner.text = 'Updating mcprax...';
        spinner.start();
        
        // Get correct package name
        const packageName = pkg.name;
        
        const updateProcess = spawn('npm', ['install', '-g', packageName], {
          stdio: 'pipe',
          shell: true
        });
        
        // Capture output
        let stdout = '';
        let stderr = '';
        
        updateProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        updateProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        updateProcess.on('close', (code) => {
          if (code === 0) {
            spinner.succeed(`mcprax has been updated successfully${notifier.update ? ' to ' + notifier.update.latest : ''}.`);
          } else {
            spinner.fail(`Update failed with exit code ${code}.`);
            console.log(chalk.red('You may need to run the update command with administrator privileges.'));
            console.log(chalk.yellow('\nError output:'));
            console.log(stderr || stdout || 'No error details available');
            console.log(chalk.cyan(`\nTry running manually: npm install -g ${packageName}`));
          }
        });
      } catch (error) {
        spinner.fail(`Update check failed: ${error.message}`);
        console.error(chalk.red('Error details:'), error);
      }
    });
}

module.exports = updateCommand;