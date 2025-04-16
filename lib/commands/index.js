const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { RACKS_DIR, ACTIVE_CONFIG, SERVERS_DIR } = require('../config');
const { validateName, rackExists, errorAndExit } = require('../utils');

// Import server commands
const serverCreateCommand = require('./server/create');
const serverListCommand = require('./server/list');
const serverShowCommand = require('./server/show');
const serverEditCommand = require('./server/edit');
const serverDeleteCommand = require('./server/delete');

// Import version and update commands
const updateCommand = require('./update');
const versionCommand = require('./version');
const { rebootCommand } = require('./reboot');

// Import rack-server operations commands
const mountCommand = require('./mount');
const unmountCommand = require('./unmount');
const mountedCommand = require('./mounted');

// Import configuration application command
const applyCommand = require('./apply');

// Import rack delete command
const deleteCommand = require('./delete');

/**
 * Register all commands with the program
 * @param {import('commander').Command} program - The Commander program instance
 */
function commandRouter(program) {
  // Create command
  program
    .command('create <rackname>')
    .description('Create a new, empty rack')
    .action((rackname) => {
      // Validate rack name
      if (!validateName(rackname)) {
        errorAndExit(`Invalid rack name: ${rackname}. Use only alphanumeric characters, hyphens, and underscores.`);
      }
      
      // Check if rack already exists
      if (rackExists(rackname, RACKS_DIR)) {
        errorAndExit(`Rack '${rackname}' already exists.`);
      }
      
      // Create rack configuration
      const rackConfig = {
        name: rackname,
        servers: [],
        description: ""
      };
      
      // Save rack configuration
      const rackFile = path.join(RACKS_DIR, `${rackname}.json`);
      try {
        fs.writeJSONSync(rackFile, rackConfig, { spaces: 2 });
        console.log(chalk.green(`Created rack: ${rackname}`));
      } catch (error) {
        errorAndExit(`Failed to create rack: ${error.message}`);
      }
    });

  // Use command
  program
    .command('use <rackname>')
    .description('Activate a rack')
    .action((rackname) => {
      // Check if rack exists
      if (!rackExists(rackname, RACKS_DIR)) {
        errorAndExit(`Rack '${rackname}' does not exist.`);
      }
      
      // Update active configuration using the setActiveRack function
      try {
        const { setActiveRack } = require('../config');
        setActiveRack(rackname);
        console.log(chalk.green(`Activated rack: ${rackname}`));
      } catch (error) {
        errorAndExit(`Failed to activate rack: ${error.message}`);
      }
    });

  // Apply command
  applyCommand(program);

  // Delete rack command
  deleteCommand(program);
  
  // Version command
  versionCommand(program);
  
  // Update command
  updateCommand(program);

  // Reboot command
  rebootCommand(program);

  // Server commands
  const serverCommand = program
    .command('server')
    .description('Manage MCP servers');

  // Add server commands
  serverCreateCommand(serverCommand);
  serverListCommand(serverCommand);
  serverShowCommand(serverCommand);
  serverEditCommand(serverCommand);
  serverDeleteCommand(serverCommand);

  // Rack-server operations commands
  mountCommand(program);
  unmountCommand(program);
  mountedCommand(program);

  // List command
  program
    .command('list [type]')
    .description('List racks or servers (type can be "racks" or "servers")')
    .action((type = 'racks') => {
      if (type === 'racks') {
        // Read active rack to highlight it
        const { getActiveRackName } = require('../config');
        let activeRackName = getActiveRackName();
        
        // List racks
        try {
          const rackFiles = fs.readdirSync(RACKS_DIR).filter(file => file.endsWith('.json'));
          
          if (rackFiles.length === 0) {
            console.log(chalk.yellow('No racks available. Create one with "rax create <rackname>".'));
            return;
          }
          
          console.log(chalk.blue('Available racks:'));
          rackFiles.forEach(file => {
            const rackName = path.basename(file, '.json');
            const isActive = rackName === activeRackName;
            
            try {
              const rackConfig = fs.readJSONSync(path.join(RACKS_DIR, file));
              const serverCount = rackConfig.servers ? rackConfig.servers.length : 0;
              const description = rackConfig.description ? ` - ${rackConfig.description}` : '';
              
              if (isActive) {
                console.log(chalk.green(`* ${rackName} (${serverCount} servers)${description}`));
              } else {
                console.log(`  ${rackName} (${serverCount} servers)${description}`);
              }
            } catch (error) {
              console.log(`  ${rackName} (error reading configuration)`);
            }
          });
        } catch (error) {
          errorAndExit(`Failed to list racks: ${error.message}`);
        }
      } else if (type === 'servers') {
        // Redirect to mounted command for backward compatibility
        console.log(chalk.yellow('Use "rax mounted" to list servers in the active rack.'));
        console.log(chalk.yellow('Use "rax server list" to list all available servers.'));
      } else {
        console.log(chalk.red(`Unknown list type: ${type}`));
      }
    });

  // Current command
  program
    .command('current')
    .description('Show the currently active rack and mounted servers')
    .action(() => {
      try {
        const { getActiveRackName, hasActiveRack } = require('../config');
        
        if (!hasActiveRack()) {
          console.log(chalk.yellow('No active rack set.'));
          return;
        }
        
        const activeRackName = getActiveRackName();
        const rackFile = path.join(RACKS_DIR, `${activeRackName}.json`);
        
        if (!fs.existsSync(rackFile)) {
          console.log(chalk.yellow(`Active rack '${activeRackName}' does not exist.`));
          return;
        }
        
        const rackConfig = fs.readJSONSync(rackFile);
        const serverCount = rackConfig.servers ? rackConfig.servers.length : 0;
        const description = rackConfig.description ? ` - ${rackConfig.description}` : '';
        
        console.log(chalk.green(`Active rack: ${activeRackName} (${serverCount} servers)${description}`));
        
        // Display mounted servers information
        if (serverCount > 0) {
          console.log(chalk.blue('\nMounted servers:'));
          
          rackConfig.servers.forEach((serverName, index) => {
            const serverFile = path.join(SERVERS_DIR, `${serverName}.json`);
            
            try {
              if (!fs.existsSync(serverFile)) {
                console.log(chalk.yellow(`  ${index + 1}. ${serverName} (server configuration missing)`));
                return;
              }
              
              const serverConfig = fs.readJSONSync(serverFile);
              const status = serverConfig.disabled ? chalk.yellow(' (disabled)') : '';
              const command = serverConfig.command ? ` - ${serverConfig.command}` : '';
              
              console.log(`  ${index + 1}. ${chalk.cyan(serverName)}${status}${command}`);

              // Show always allow patterns if they exist
              if (serverConfig.alwaysAllow && serverConfig.alwaysAllow.length > 0) {
                console.log(`     Always allows: ${serverConfig.alwaysAllow.join(', ')}`);
              }
            } catch (error) {
              console.log(`  ${index + 1}. ${serverName} (error reading configuration: ${error.message})`);
            }
          });
          
          console.log(chalk.blue('\nTip: Use "rax mounted --detailed" for more detailed information.'));
        } else {
          console.log(chalk.yellow('\nNo servers mounted in this rack.'));
          console.log(chalk.blue(`Use 'rax mount <servername>' to add servers to this rack.`));
        }
      } catch (error) {
        errorAndExit(`Failed to retrieve active rack: ${error.message}`);
      }
    });

  // Handle unknown commands
  program.on('command:*', (operands) => {
    console.error(chalk.red(`Error: Unknown command '${operands[0]}'`));
    console.log('');
    console.log(`See ${chalk.green('rax --help')} for a list of available commands.`);
    process.exit(1);
  });
}

module.exports = commandRouter;