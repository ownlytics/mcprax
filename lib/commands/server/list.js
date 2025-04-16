const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { SERVERS_DIR, getActiveRack } = require('../../config');
const { errorAndExit } = require('../../utils');

/**
 * Register the server list command with the program
 * @param {import('commander').Command} program - The Commander program instance
 */
function serverListCommand(program) {
  program
    .command('list')
    .description('List all available servers')
    .option('-d, --detailed', 'Show detailed information for each server')
    .action((options) => {
      try {
        // Get list of server configuration files
        const serverFiles = fs.readdirSync(SERVERS_DIR).filter(file => file.endsWith('.json'));
        
        if (serverFiles.length === 0) {
          console.log('\n' + chalk.yellow('No servers available. Create one with "rax server create <servername>".'));
          return;
        }
        
        // Get active rack to identify mounted servers
        const activeRack = getActiveRack();
        const mountedServers = activeRack ? activeRack.servers : [];
        
        console.log('\n' + chalk.blue('Available servers:'));
        
        serverFiles.forEach(file => {
          const serverName = path.basename(file, '.json');
          const isMounted = mountedServers.includes(serverName);
          
          try {
            const serverConfig = fs.readJSONSync(path.join(SERVERS_DIR, file));
            
            if (options.detailed) {
              // Detailed view
              console.log(chalk.cyan(`\n${serverName}${isMounted ? chalk.green(' (mounted)') : ''}`));
              console.log(`  Command: ${serverConfig.command} ${serverConfig.args.join(' ')}`);
              
              if (Object.keys(serverConfig.env).length > 0) {
                console.log('  Environment:');
                Object.entries(serverConfig.env).forEach(([key, value]) => {
                  console.log(`    ${key}=${value}`);
                });
              }
              
              if (serverConfig.disabled) {
                console.log(chalk.yellow('  Status: Disabled'));
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
              const mounted = isMounted ? chalk.green(' (mounted)') : '';
              console.log(`  ${serverName}${mounted}${status}`);
            }
          } catch (error) {
            console.log(`  ${serverName} (error reading configuration)`);
          }
        });
      } catch (error) {
        errorAndExit(`Failed to list servers: ${error.message}`);
      }
    });
}

module.exports = serverListCommand;