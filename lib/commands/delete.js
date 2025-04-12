const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const prompts = require('prompts');
const { RACKS_DIR, ACTIVE_CONFIG } = require('../config');
const { rackExists, errorAndExit } = require('../utils');

/**
 * Register the delete rack command with the program
 * @param {import('commander').Command} program - The Commander program instance
 */
function deleteCommand(program) {
  program
    .command('delete <rackname>')
    .description('Delete a rack')
    .option('-f, --force', 'Force deletion without confirmation')
    .action(async (rackname, options) => {
      try {
        // Check if rack exists
        if (!rackExists(rackname, RACKS_DIR)) {
          errorAndExit(`Rack '${rackname}' does not exist.`);
        }
        
        // Check if rack is active
        let isActive = false;
        if (fs.existsSync(ACTIVE_CONFIG)) {
          const activeConfig = fs.readJSONSync(ACTIVE_CONFIG);
          isActive = activeConfig.activeRack === rackname;
        }
        
        if (isActive) {
          console.log(chalk.yellow(`Warning: Rack '${rackname}' is currently active.`));
          console.log(chalk.yellow('Deleting the active rack will clear the active rack setting.'));
        }
        
        // Confirm deletion
        let confirmed = options.force;
        
        if (!confirmed) {
          const response = await prompts({
            type: 'confirm',
            name: 'value',
            message: `Are you sure you want to delete rack '${rackname}'?`,
            initial: false
          });
          
          confirmed = response.value;
        }
        
        if (!confirmed) {
          console.log(chalk.yellow('Delete cancelled.'));
          return;
        }
        
        // Delete rack configuration
        const rackFile = path.join(RACKS_DIR, `${rackname}.json`);
        fs.removeSync(rackFile);
        
        // Clear active rack if this rack was active
        if (isActive) {
          const activeConfig = { activeRack: null };
          fs.writeJSONSync(ACTIVE_CONFIG, activeConfig, { spaces: 2 });
          console.log(chalk.blue('Cleared active rack setting.'));
        }
        
        console.log(chalk.green(`Deleted rack: ${rackname}`));
      } catch (error) {
        errorAndExit(`Failed to delete rack: ${error.message}`);
      }
    });
}

module.exports = deleteCommand;