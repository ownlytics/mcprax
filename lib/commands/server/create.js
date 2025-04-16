const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const prompts = require('prompts');
const { SERVERS_DIR } = require('../../config');
const { validateName, serverExists, errorAndExit } = require('../../utils');

/**
 * Register the server create command with the program
 * @param {import('commander').Command} program - The Commander program instance
 */
function serverCreateCommand(program) {
  program
    .command('create <servername> [config]')
    .description('Create a new server configuration. Config can be a JSON string or path to a JSON file.')
    .option('-i, --interactive', 'Create server configuration interactively')
    .action(async (servername, config, options) => {
      // Validate server name
      if (!validateName(servername)) {
        errorAndExit(`Invalid server name: ${servername}. Use only alphanumeric characters, hyphens, and underscores.`);
      }
      
      // Check if server already exists
      if (serverExists(servername, SERVERS_DIR)) {
        errorAndExit(`Server '${servername}' already exists.`);
      }
      
      let serverConfig = {
        name: servername,
        command: '',
        args: [],
        env: {},
        disabled: false,
        alwaysAllow: []
      };
      
      // Handle configuration input
      if (options.interactive) {
        // Interactive mode
        serverConfig = await promptForServerConfig(serverConfig);
      } else if (config) {
        try {
          // Check if config is a path to a file
          if (fs.existsSync(config) && fs.statSync(config).isFile()) {
            serverConfig = { ...serverConfig, ...fs.readJSONSync(config) };
          } else {
            // Assume config is a JSON string
            serverConfig = { ...serverConfig, ...JSON.parse(config) };
          }
        } catch (error) {
          errorAndExit(`Failed to parse configuration: ${error.message}`);
        }
      } else {
        // No configuration provided, prompt for minimal config
        serverConfig = await promptForMinimalConfig(serverConfig);
      }
      
      // Validate the server configuration
      validateServerConfig(serverConfig);
      
      // Ensure server name matches the provided name
      serverConfig.name = servername;
      
      // Save server configuration
      const serverFile = path.join(SERVERS_DIR, `${servername}.json`);
      try {
        fs.writeJSONSync(serverFile, serverConfig, { spaces: 2 });
        console.log('\n' + chalk.green(`Created server: ${servername}`));
      } catch (error) {
        errorAndExit(`Failed to create server: ${error.message}`);
      }
    });
}

/**
 * Prompt the user for full server configuration
 * @param {Object} defaultConfig - Default configuration values
 * @returns {Promise<Object>} The server configuration
 */
async function promptForServerConfig(defaultConfig) {
  const questions = [
    {
      type: 'text',
      name: 'command',
      message: 'Command to run the server:',
      initial: defaultConfig.command,
      validate: value => value.trim() !== '' ? true : 'Command is required'
    },
    {
      type: 'text',
      name: 'args',
      message: 'Command arguments (comma-separated):',
      initial: defaultConfig.args.join(','),
      format: value => value.split(',').map(arg => arg.trim()).filter(arg => arg !== '')
    },
    {
      type: 'confirm',
      name: 'hasEnv',
      message: 'Do you want to add environment variables?',
      initial: Object.keys(defaultConfig.env).length > 0
    },
    {
      type: prev => prev ? 'text' : null,
      name: 'env',
      message: 'Environment variables (KEY=VALUE, comma-separated):',
      initial: Object.entries(defaultConfig.env).map(([key, value]) => `${key}=${value}`).join(','),
      format: value => {
        const env = {};
        value.split(',').forEach(pair => {
          const [key, value] = pair.trim().split('=');
          if (key && value) {
            env[key] = value;
          }
        });
        return env;
      }
    },
    {
      type: 'confirm',
      name: 'disabled',
      message: 'Should this server be disabled by default?',
      initial: defaultConfig.disabled
    },
    {
      type: 'text',
      name: 'alwaysAllow',
      message: 'Always allow patterns (comma-separated):',
      initial: defaultConfig.alwaysAllow.join(','),
      format: value => value.split(',').map(pattern => pattern.trim()).filter(pattern => pattern !== '')
    }
  ];
  
  const responses = await prompts(questions);
  
  // Combine responses with default config
  return {
    ...defaultConfig,
    ...responses,
    env: responses.env || defaultConfig.env
  };
}

/**
 * Prompt the user for minimal server configuration
 * @param {Object} defaultConfig - Default configuration values
 * @returns {Promise<Object>} The server configuration
 */
async function promptForMinimalConfig(defaultConfig) {
  const questions = [
    {
      type: 'text',
      name: 'command',
      message: 'Command to run the server:',
      validate: value => value.trim() !== '' ? true : 'Command is required'
    },
    {
      type: 'text',
      name: 'args',
      message: 'Command arguments (comma-separated):',
      initial: '',
      format: value => value.split(',').map(arg => arg.trim()).filter(arg => arg !== '')
    }
  ];
  
  const responses = await prompts(questions);
  return { ...defaultConfig, ...responses };
}

/**
 * Validate server configuration
 * @param {Object} config - The server configuration to validate
 * @throws {Error} If the configuration is invalid
 */
function validateServerConfig(config) {
  if (!config.command || typeof config.command !== 'string') {
    errorAndExit('Server configuration must include a command string.');
  }
  
  if (!Array.isArray(config.args)) {
    errorAndExit('Server configuration args must be an array.');
  }
  
  if (typeof config.env !== 'object') {
    errorAndExit('Server configuration env must be an object.');
  }
  
  if (typeof config.disabled !== 'boolean') {
    config.disabled = !!config.disabled; // Convert to boolean
  }
  
  if (!Array.isArray(config.alwaysAllow)) {
    errorAndExit('Server configuration alwaysAllow must be an array.');
  }
}

module.exports = serverCreateCommand;