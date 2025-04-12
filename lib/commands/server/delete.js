const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const prompts = require('prompts');
const { SERVERS_DIR, RACKS_DIR } = require('../../config');
const { serverExists, errorAndExit } = require('../../utils');

/**
 * Register the server delete command with the program
 * @param {import('commander').Command} program - The Commander program instance
 */
function serverDeleteCommand(program) {
  program
    .command('delete <servername>')
    .description('Delete a server configuration')
    .option('-f, --force', 'Force deletion without confirmation')
    .action(async (servername, options) => {
      try {
        // Check if server exists
        if (!serverExists(servername, SERVERS_DIR)) {
          errorAndExit(`Server '${servername}' does not exist.`);
        }
        
        // Check if server is mounted in any racks
        const mountedRacks = findMountedRacks(servername);
        
        if (mountedRacks.length > 0) {
          console.log(chalk.yellow(`Warning: Server '${servername}' is mounted in the following racks:`));
          mountedRacks.forEach(rack => {
            console.log(`  ${rack}`);
          });
          console.log(chalk.yellow('Deleting this server will remove it from these racks.'));
        }
        
        // Confirm deletion
        let confirmed = options.force;
        
        if (!confirmed) {
          const response = await prompts({
            type: 'confirm',
            name: 'value',
            message: `Are you sure you want to delete server '${servername}'?`,
            initial: false
          });
          
          confirmed = response.value;
        }
        
        if (!confirmed) {
          console.log(chalk.yellow('Delete cancelled.'));
          return;
        }
        
        // Remove server from racks if mounted
        if (mountedRacks.length > 0) {
          for (const rackName of mountedRacks) {
            const rackFile = path.join(RACKS_DIR, `${rackName}.json`);
            const rackConfig = fs.readJSONSync(rackFile);
            
            // Remove server from rack
            rackConfig.servers = rackConfig.servers.filter(server => server !== servername);
            
            // Save updated rack configuration
            fs.writeJSONSync(rackFile, rackConfig, { spaces: 2 });
            console.log(chalk.blue(`Removed server from rack: ${rackName}`));
          }
        }
        
        // Delete server configuration
        const serverFile = path.join(SERVERS_DIR, `${servername}.json`);
        fs.removeSync(serverFile);
        
        console.log(chalk.green(`Deleted server: ${servername}`));
      } catch (error) {
        errorAndExit(`Failed to delete server: ${error.message}`);
      }
    });
}

/**
 * Find racks that have the server mounted
 * @param {string} servername - The name of the server
 * @returns {string[]} Array of rack names
 */
function findMountedRacks(servername) {
  try {
    const mountedRacks = [];
    const rackFiles = fs.readdirSync(RACKS_DIR).filter(file => file.endsWith('.json'));
    
    for (const file of rackFiles) {
      const rackName = path.basename(file, '.json');
      const rackFile = path.join(RACKS_DIR, file);
      
      try {
        const rackConfig = fs.readJSONSync(rackFile);
        
        if (rackConfig.servers && rackConfig.servers.includes(servername)) {
          mountedRacks.push(rackName);
        }
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Could not read rack '${rackName}': ${error.message}`));
      }
    }
    
    return mountedRacks;
  } catch (error) {
    console.warn(chalk.yellow(`Warning: Could not check mounted racks: ${error.message}`));
    return [];
  }
}

module.exports = serverDeleteCommand;