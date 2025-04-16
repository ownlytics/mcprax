const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { SERVERS_DIR, getActiveRack } = require('../../config');
const { serverExists, errorAndExit } = require('../../utils');

/**
 * Register the server show command with the program
 * @param {import('commander').Command} program - The Commander program instance
 */
function serverShowCommand(program) {
  program
    .command('show <servername>')
    .description('Show detailed information about a server')
    .action((servername) => {
      try {
        // Check if server exists
        if (!serverExists(servername, SERVERS_DIR)) {
          errorAndExit(`Server '${servername}' does not exist.`);
        }
        
        const serverFile = path.join(SERVERS_DIR, `${servername}.json`);
        const serverConfig = fs.readJSONSync(serverFile);
        
        // Get active rack to check if server is mounted
        const activeRack = getActiveRack();
        const isMounted = activeRack && activeRack.servers.includes(servername);
        
        // Display server information
        console.log('\n' + chalk.blue(`Server: ${servername}`));
        console.log(chalk.cyan('Configuration:'));
        console.log(`  Command: ${serverConfig.command} ${serverConfig.args.join(' ')}`);
        
        if (Object.keys(serverConfig.env).length > 0) {
          console.log('  Environment:');
          Object.entries(serverConfig.env).forEach(([key, value]) => {
            console.log(`    ${key}=${value}`);
          });
        } else {
          console.log('  Environment: None');
        }
        
        console.log(`  Status: ${serverConfig.disabled ? chalk.yellow('Disabled') : chalk.green('Enabled')}`);
        
        if (serverConfig.alwaysAllow && serverConfig.alwaysAllow.length > 0) {
          console.log('  Always Allow:');
          serverConfig.alwaysAllow.forEach(pattern => {
            console.log(`    ${pattern}`);
          });
        } else {
          console.log('  Always Allow: None');
        }
        
        console.log(chalk.cyan('Rack Status:'));
        if (activeRack) {
          if (isMounted) {
            console.log(`  Mounted in active rack: ${chalk.green(activeRack.name)}`);
          } else {
            console.log(`  Not mounted in active rack: ${chalk.yellow(activeRack.name)}`);
            console.log(`  Use 'rax mount ${servername}' to add it to the active rack.`);
          }
        } else {
          console.log('  No active rack set.');
          console.log(`  Use 'rax use <rackname>' to set an active rack, then 'rax mount ${servername}'.`);
        }
      } catch (error) {
        errorAndExit(`Failed to show server: ${error.message}`);
      }
    });
}

module.exports = serverShowCommand;