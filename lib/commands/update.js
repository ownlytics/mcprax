const chalk = require('chalk');
const ora = require('ora');
const { spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const updateNotifier = require('update-notifier');
const prompts = require('prompts');
const pkg = require('../../package.json');
const { getUpdateSettings, setUpdateSettings } = require('../config');

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
    .on('--help', () => {
      console.log('');
      console.log(chalk.yellow('Examples:'));
      console.log('');
      console.log('  $ rax update                # Check and prompt to update if available');
      console.log('  $ rax update --check-only   # Only check, don\'t update');
      console.log('  $ rax update --force        # Update even if already on latest version');
      console.log('  $ rax update --disable-notifications  # Turn off update notifications');
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
      
      const spinner = ora('Checking for updates...').start();
      
      try {
        // Create a notifier instance with forced checking
        const notifier = updateNotifier({
          pkg,
          updateCheckInterval: 0  // Force check
        });
        
        // Check for updates
        await notifier.fetchInfo();
        
        if (!notifier.update && !options.force) {
          spinner.succeed(`mcprax is already at the latest version (${pkg.version}).`);
          return;
        }
        
        // If there's an update or force flag is set
        if (notifier.update) {
          spinner.succeed(`Update available: ${pkg.version} → ${chalk.green(notifier.update.latest)}`);
        } else {
          spinner.succeed(`Current version: ${pkg.version}`);
        }
        
        if (options.checkOnly) {
          const packageName = pkg.name;
          console.log(chalk.cyan(`\nRun 'npm install -g ${packageName}' to update.`));
          return;
        }
        
        // Confirm update
        if (!options.force && notifier.update) {
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