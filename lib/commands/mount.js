const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { RACKS_DIR, SERVERS_DIR, ACTIVE_CONFIG, getActiveRackName } = require('../config');
const { serverExists, errorAndExit } = require('../utils');

/**
 * Mount a server to the active rack
 * @param {import('commander').Command} program - The Commander program instance
 */
function mountCommand(program) {
  program
    .command('mount <servername>')
    .description('Add server to active rack')
    .action((servername) => {
      // Check if server exists
      if (!serverExists(servername, SERVERS_DIR)) {
        errorAndExit(`Server '${servername}' does not exist.`);
      }
      
      // Get active rack configuration
      try {
        if (!fs.existsSync(ACTIVE_CONFIG)) {
          errorAndExit('No active rack set. Use "rax use <rackname>" to set an active rack.');
        }
        
        const activeConfig = fs.readJSONSync(ACTIVE_CONFIG);
        
        if (!activeConfig.activeRack) {
          errorAndExit('No active rack set. Use "rax use <rackname>" to set an active rack.');
        }
        
        const rackFile = path.join(RACKS_DIR, `${activeConfig.activeRack}.json`);
        
        if (!fs.existsSync(rackFile)) {
          errorAndExit(`Active rack '${activeConfig.activeRack}' does not exist.`);
        }
        
        const rackConfig = fs.readJSONSync(rackFile);
        
        // Check if server is already mounted
        if (rackConfig.servers.includes(servername)) {
          console.log(chalk.yellow(`Server '${servername}' is already mounted in rack '${activeConfig.activeRack}'.`));
          return;
        }
        
        // Add server to rack
        rackConfig.servers.push(servername);
        
        // Save updated rack configuration
        fs.writeJSONSync(rackFile, rackConfig, { spaces: 2 });
        
        console.log(chalk.green(`Mounted server '${servername}' to rack '${activeConfig.activeRack}'.`));
      } catch (error) {
        errorAndExit(`Failed to mount server: ${error.message}`);
      }
    });
}

module.exports = mountCommand;