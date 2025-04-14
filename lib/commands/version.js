const chalk = require('chalk');
const ora = require('ora');
const semver = require('semver');
const updateNotifier = require('update-notifier');
const pkg = require('../../package.json');
const { getUpdateSettings } = require('../config');

/**
 * Version command implementation
 * @param {import('commander').Command} program - The Commander program instance
 */
function versionCommand(program) {
  program
    .command('version')
    .description('Display version information and check for updates')
    .option('-c, --check', 'Check for updates')
    .action(async (options) => {
      console.log(chalk.blue('mcprax version:'), chalk.green(pkg.version));
      console.log(chalk.blue('Node.js version:'), chalk.green(process.version));
      console.log(chalk.blue('Platform:'), chalk.green(process.platform), chalk.green(process.arch));
      
      // Show update settings
      const settings = getUpdateSettings();
      console.log(chalk.blue('Update notifications:'), settings.checkEnabled !== false ? 
        chalk.green('Enabled') : chalk.yellow('Disabled'));
      
      // Check for updates if requested
      if (options.check) {
        const spinner = ora('Checking for updates...').start();
        
        try {
          // Force check for updates
          const notifier = updateNotifier({
            pkg,
            updateCheckInterval: 0  // Force check
          });
          
          // Wait for update check
          await notifier.fetchInfo();
          
          if (notifier.update) {
            spinner.succeed(`Update available: ${pkg.version} → ${chalk.green(notifier.update.latest)}`);
            
            const type = semver.major(notifier.update.latest) > semver.major(pkg.version) ? 'major' :
                         semver.minor(notifier.update.latest) > semver.minor(pkg.version) ? 'minor' : 
                         'patch';
                         
            console.log(chalk.blue('Update type:'), chalk.cyan(type.toUpperCase()));
            console.log(chalk.blue('\nRun'), chalk.cyan('rax update'), chalk.blue('to update.'));
          } else {
            spinner.succeed('mcprax is up to date.');
          }
        } catch (error) {
          spinner.fail(`Update check failed: ${error.message}`);
        }
      }
    });
}

module.exports = versionCommand;