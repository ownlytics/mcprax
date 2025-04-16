const chalk = require('chalk');
const ora = require('ora');
const semver = require('semver');
const pkg = require('../../package.json');
const { getUpdateSettings } = require('../config');
const { checkForUpdate } = require('../services/update-service');

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
          const { updateAvailable, currentVersion, latestVersion, error } = await checkForUpdate(true);
          
          if (error) {
            spinner.fail(`Update check failed: ${error}`);
            return;
          }
          
          if (updateAvailable) {
            spinner.succeed(`Update available: ${currentVersion} → ${chalk.green(latestVersion)}`);
            
            const type = semver.major(latestVersion) > semver.major(currentVersion) ? 'major' :
                         semver.minor(latestVersion) > semver.minor(currentVersion) ? 'minor' : 
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