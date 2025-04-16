const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const prompts = require('prompts');
const {
  RACKS_DIR,
  SERVERS_DIR,
  ACTIVE_CONFIG,
  CLAUDE_CONFIG_DIR,
  CLAUDE_CONFIG_FILE,
  generateClaudeConfig,
  backupClaudeConfig,
  ensureClaudeConfigDir,
  getActiveRackName
} = require('../config');
const { errorAndExit } = require('../utils');

/**
 * Apply the active rack configuration to Claude Desktop
 * @param {import('commander').Command} program - The Commander program instance
 */
function applyCommand(program) {
  program
    .command('apply')
    .description('Apply the active rack configuration to Claude Desktop')
    .option('-f, --force', 'Apply configuration without confirmation')
    .option('-y, --yes', 'Answer yes to all prompts')
    .option('-r, --restart', 'Restart Claude Desktop after applying configuration')
    .on('--help', () => {
      console.log('');
      console.log(chalk.yellow('Examples:'));
      console.log('');
      console.log('  $ rax apply                # Apply active rack configuration with confirmation');
      console.log('  $ rax apply --force        # Apply even if rack has no servers');
      console.log('  $ rax apply --yes          # Apply without confirmation prompts');
      console.log('  $ rax apply --restart      # Apply and automatically restart Claude Desktop');
      console.log('');
      console.log(chalk.cyan('Notes:'));
      console.log('  - An active rack must be set before applying');
      console.log('  - A backup of the existing configuration will be created');
      console.log('  - You may need to restart Claude Desktop for changes to take effect');
    })
    .action(async (options) => {
      const spinner = ora('Reading configuration...').start();
      
      try {
        // Get active rack configuration
        
        const activeRackName = getActiveRackName();
        
        if (!activeRackName) {
          spinner.fail('No active rack set');
          console.log(`Use ${chalk.cyan('rax use <rackname>')} to set an active rack.`);
          return;
        }
        
        spinner.text = `Loading rack '${activeRackName}'...`;
        
        const rackFile = path.join(RACKS_DIR, `${activeRackName}.json`);
        
        if (!fs.existsSync(rackFile)) {
          spinner.fail(`Active rack '${activeRackName}' does not exist`);
          return;
        }
        
        const rackConfig = fs.readJSONSync(rackFile);
        
        // Check if rack has any servers
        if (!rackConfig.servers || rackConfig.servers.length === 0) {
          spinner.warn(`Rack '${activeRackName}' has no servers mounted`);
          console.log(chalk.yellow('This will result in an empty server configuration for Claude Desktop.'));
          
          if (!options.force && !options.yes) {
            spinner.stop();
            const response = await prompts({
              type: 'confirm',
              name: 'proceed',
              message: 'Continue with empty server configuration?',
              initial: false
            });
            
            if (!response.proceed) {
              console.log(chalk.blue('Operation cancelled.'));
              return;
            }
            spinner.start('Proceeding with empty configuration...');
          }
        }
        
        // Ensure Claude Desktop config directory exists
        spinner.text = 'Ensuring Claude Desktop configuration directory exists...';
        if (!ensureClaudeConfigDir()) {
          spinner.fail(`Failed to create Claude Desktop config directory: ${CLAUDE_CONFIG_DIR}`);
          return;
        }
        
        // Generate the Claude Desktop configuration
        spinner.text = 'Generating Claude Desktop configuration...';
        const claudeConfig = generateClaudeConfig();
        if (!claudeConfig) {
          spinner.fail('Failed to generate Claude Desktop configuration');
          return;
        }
        
        // Create backup if existing configuration exists
        if (fs.existsSync(CLAUDE_CONFIG_FILE)) {
          spinner.text = 'Creating backup of existing configuration...';
          const backupFile = backupClaudeConfig();
          if (backupFile) {
            spinner.succeed(`Created backup of existing configuration`);
            console.log(chalk.magenta(`Backup saved to: ${backupFile}`));
            spinner.start('Applying new configuration...');
          } else {
            spinner.warn('Failed to create backup of existing configuration');
            
            if (!options.force && !options.yes) {
              spinner.stop();
              const response = await prompts({
                type: 'confirm',
                name: 'proceed',
                message: 'Continue without backup?',
                initial: false
              });
              
              if (!response.proceed) {
                console.log(chalk.blue('Operation cancelled.'));
                return;
              }
              spinner.start('Proceeding without backup...');
            }
          }
        }
        
        // Write Claude Desktop configuration
        spinner.text = 'Writing Claude Desktop configuration...';
        fs.writeJSONSync(CLAUDE_CONFIG_FILE, claudeConfig, { spaces: 2 });
        
        const serverCount = Object.keys(claudeConfig.mcpServers).length;
        spinner.succeed(`Applied rack '${activeRackName}' to Claude Desktop with ${serverCount} servers`);
        
        console.log(chalk.magenta(`Configuration file: ${CLAUDE_CONFIG_FILE}`));
        
        // Show server list
        if (serverCount > 0) {
          console.log(chalk.blue('\nApplied servers:'));
          Object.keys(claudeConfig.mcpServers).forEach(serverName => {
            const disabled = claudeConfig.mcpServers[serverName].disabled;
            if (disabled) {
              console.log(`  ${chalk.magenta(serverName)} ${chalk.yellow('(disabled)')}`);
            } else {
              console.log(`  ${chalk.green(serverName)}`);
            }
          });
        }
        
        // Add restart functionality if requested
        if (options.restart) {
          console.log(chalk.blue('\nRestarting Claude Desktop...'));
          
          // Import the restartClaudeDesktop function from reboot
          const { restartClaudeDesktop } = require('./reboot');
          
          // Only force restart without confirmation if --force or --yes was specified
          restartClaudeDesktop({ force: options.force || options.yes });
        } else {
          console.log(chalk.blue('\nYou may need to restart Claude Desktop for changes to take effect.'));
        }
      } catch (error) {
        spinner.fail(`Failed to apply configuration: ${error.message}`);
        console.log(chalk.red('Error details:'), error);
      }
    });
}

module.exports = applyCommand;