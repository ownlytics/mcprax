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
        const activeRackName = getActiveRackName();
        
        if (!activeRackName) {
          errorAndExit('No active rack set. Use "rax use <rackname>" to set an active rack.');
        }
        
        const rackFile = path.join(RACKS_DIR, `${activeRackName}.json`);
        
        if (!fs.existsSync(rackFile)) {
          errorAndExit(`Active rack '${activeRackName}' does not exist.`);
        }
        
        const rackConfig = fs.readJSONSync(rackFile);
        
        // Check if server is already mounted
        if (rackConfig.servers.includes(servername)) {
          console.log('\n' + chalk.yellow(`Server '${servername}' is already mounted in rack '${activeRackName}'.`));
          return;
        }
        
        // Add server to rack
        rackConfig.servers.push(servername);
        
        // Save updated rack configuration
        fs.writeJSONSync(rackFile, rackConfig, { spaces: 2 });
        
        console.log('\n' + chalk.green(`Mounted server '${servername}' to rack '${activeRackName}'.`));
      } catch (error) {
        errorAndExit(`Failed to mount server: ${error.message}`);
      }
    });
}

module.exports = mountCommand;