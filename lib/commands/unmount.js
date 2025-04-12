const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { RACKS_DIR, ACTIVE_CONFIG } = require('../config');
const { errorAndExit } = require('../utils');

/**
 * Unmount a server from the active rack
 * @param {import('commander').Command} program - The Commander program instance
 */
function unmountCommand(program) {
  program
    .command('unmount <servername>')
    .description('Remove server from active rack')
    .action((servername) => {
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
        
        // Check if server is mounted
        if (!rackConfig.servers.includes(servername)) {
          console.log(chalk.yellow(`Server '${servername}' is not mounted in rack '${activeConfig.activeRack}'.`));
          return;
        }
        
        // Remove server from rack
        rackConfig.servers = rackConfig.servers.filter(s => s !== servername);
        
        // Save updated rack configuration
        fs.writeJSONSync(rackFile, rackConfig, { spaces: 2 });
        
        console.log(chalk.green(`Unmounted server '${servername}' from rack '${activeConfig.activeRack}'.`));
      } catch (error) {
        errorAndExit(`Failed to unmount server: ${error.message}`);
      }
    });
}

module.exports = unmountCommand;