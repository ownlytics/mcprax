const chalk = require('chalk');
const ora = require('ora');
const prompts = require('prompts');
const { checkForUpdate, performUpdate } = require('../services/update-service');
const { setUpdateSettings } = require('../config');
const { clearUpdateCache } = require('../utils');

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
        clearUpdateCache();
        console.log(chalk.blue('Update check cache cleared.'));
      }
      
      // Start update check
      const spinner = ora('Checking for updates...').start();
      
      try {
        // Check for updates
        const { updateAvailable, currentVersion, latestVersion, error } = await checkForUpdate(true);
        
        // Handle check errors
        if (error) {
          spinner.fail(`Update check failed: ${error}`);
          return;
        }
        
        // Display update status
        if (updateAvailable) {
          spinner.succeed(`Update available: ${currentVersion} → ${chalk.green(latestVersion)}`);
        } else if (!options.force) {
          spinner.succeed(`mcprax is already at the latest version (${currentVersion}).`);
          return;
        } else {
          spinner.succeed(`Current version: ${currentVersion}`);
        }
        
        // Check-only mode
        if (options.checkOnly) {
          console.log(chalk.cyan(`\nRun 'npm install -g ${require('../../package.json').name}' to update.`));
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
        
        const updateResult = await performUpdate();
        
        if (updateResult.success) {
          spinner.succeed(updateResult.message);
        } else {
          spinner.fail(updateResult.message);
          console.log(chalk.red('You may need to run the update command with administrator privileges.'));
          console.log(chalk.yellow('\nError output:'));
          console.log(updateResult.errorDetails);
          console.log(chalk.cyan(`\nTry running manually: npm install -g ${require('../../package.json').name}`));
        }
      } catch (error) {
        spinner.fail(`Update operation failed: ${error.message}`);
        console.error(chalk.red('Error details:'), error);
      }
    });
}

module.exports = updateCommand;