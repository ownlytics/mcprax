const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { RACKS_DIR, ACTIVE_CONFIG, getActiveRackName } = require('../config');
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
        const activeRackName = getActiveRackName();
        
        if (!activeRackName) {
          errorAndExit('No active rack set. Use "rax use <rackname>" to set an active rack.');
        }
        
        const rackFile = path.join(RACKS_DIR, `${activeRackName}.json`);
        
        if (!fs.existsSync(rackFile)) {
          errorAndExit(`Active rack '${activeRackName}' does not exist.`);
        }
        
        const rackConfig = fs.readJSONSync(rackFile);
        
        // Check if server is mounted
        if (!rackConfig.servers.includes(servername)) {
          console.log(chalk.yellow(`Server '${servername}' is not mounted in rack '${activeRackName}'.`));
          return;
        }
        
        // Remove server from rack
        rackConfig.servers = rackConfig.servers.filter(s => s !== servername);
        
        // Save updated rack configuration
        fs.writeJSONSync(rackFile, rackConfig, { spaces: 2 });
        
        console.log(chalk.green(`Unmounted server '${servername}' from rack '${activeRackName}'.`));
      } catch (error) {
        errorAndExit(`Failed to unmount server: ${error.message}`);
      }
    });
}

module.exports = unmountCommand;