const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { RACKS_DIR, SERVERS_DIR, ACTIVE_CONFIG, getActiveRackName } = require('../config');
const { errorAndExit } = require('../utils');

/**
 * List servers in the active rack
 * @param {import('commander').Command} program - The Commander program instance
 */
function mountedCommand(program) {
  program
    .command('mounted')
    .description('List servers mounted in the active rack')
    .option('-d, --detailed', 'Show detailed information for each server')
    .action((options) => {
      try {
        // Get active rack configuration
        const activeRackName = getActiveRackName();
        
        if (!activeRackName) {
          errorAndExit('No active rack set. Use "rax use <rackname>" to set an active rack.');
        }
        
        const rackFile = path.join(RACKS_DIR, `${activeRackName}.json`);
        
        if (!fs.existsSync(rackFile)) {
          errorAndExit(`Active rack '${activeRackName}' does not exist.`);
        }
        
        const rackConfig = fs.readJSONSync(rackFile);
        
        // Check if rack has any servers
        if (!rackConfig.servers || rackConfig.servers.length === 0) {
          console.log('\n' + chalk.yellow(`Rack '${activeRackName}' has no servers mounted.`));
          console.log(chalk.blue(`Use 'rax mount <servername>' to add servers to this rack.`));
          return;
        }
        
        // List servers in the rack
        console.log('\n' + chalk.blue(`Servers mounted in rack '${activeRackName}':`));
        
        rackConfig.servers.forEach((serverName, index) => {
          const serverFile = path.join(SERVERS_DIR, `${serverName}.json`);
          
          try {
            if (!fs.existsSync(serverFile)) {
              console.log(chalk.yellow(`  ${serverName} (server configuration missing)`));
              return;
            }
            
            const serverConfig = fs.readJSONSync(serverFile);
            
            if (options.detailed) {
              // Detailed view
              console.log(chalk.cyan(`\n${index + 1}. ${serverName}`));
              console.log(`  Command: ${serverConfig.command} ${serverConfig.args.join(' ')}`);
              
              if (Object.keys(serverConfig.env).length > 0) {
                console.log('  Environment:');
                Object.entries(serverConfig.env).forEach(([key, value]) => {
                  console.log(`    ${key}=${value}`);
                });
              }
              
              if (serverConfig.disabled) {
                console.log(chalk.yellow('  Status: Disabled'));
              } else {
                console.log(chalk.green('  Status: Enabled'));
              }
              
              if (serverConfig.alwaysAllow && serverConfig.alwaysAllow.length > 0) {
                console.log('  Always Allow:');
                serverConfig.alwaysAllow.forEach(pattern => {
                  console.log(`    ${pattern}`);
                });
              }
            } else {
              // Simple view
              const status = serverConfig.disabled ? chalk.yellow(' (disabled)') : '';
              console.log(`  ${index + 1}. ${serverName}${status}`);
            }
          } catch (error) {
            console.log(`  ${index + 1}. ${serverName} (error reading configuration: ${error.message})`);
          }
        });
      } catch (error) {
        errorAndExit(`Failed to list mounted servers: ${error.message}`);
      }
    });
}

module.exports = mountedCommand;