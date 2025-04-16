const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const prompts = require('prompts');
const { SERVERS_DIR } = require('../../config');
const { serverExists, errorAndExit } = require('../../utils');

/**
 * Register the server edit command with the program
 * @param {import('commander').Command} program - The Commander program instance
 */
function serverEditCommand(program) {
  program
    .command('edit <servername>')
    .description('Edit a server configuration')
    .option('-r, --raw', 'Output JSON after editing (for piping to a file)')
    .action(async (servername, options) => {
      try {
        // Check if server exists
        if (!serverExists(servername, SERVERS_DIR)) {
          errorAndExit(`Server '${servername}' does not exist.`);
        }
        
        const serverFile = path.join(SERVERS_DIR, `${servername}.json`);
        const serverConfig = fs.readJSONSync(serverFile);
        
        // Prompt for updated configuration
        const updatedConfig = await promptForEdit(serverConfig);
        
        // Ensure server name remains the same
        updatedConfig.name = servername;
        
        // Validate the updated configuration
        validateServerConfig(updatedConfig);
        
        // Save the updated configuration
        fs.writeJSONSync(serverFile, updatedConfig, { spaces: 2 });
        
        if (options.raw) {
          // Output JSON for piping
          console.log('\n' + JSON.stringify(updatedConfig, null, 2));
        } else {
          console.log('\n' + chalk.green(`Updated server configuration for ${servername}`));
        }
      } catch (error) {
        errorAndExit(`Failed to edit server: ${error.message}`);
      }
    });
}

/**
 * Prompt for editing server configuration
 * @param {Object} config - Current server configuration
 * @returns {Promise<Object>} Updated server configuration
 */
async function promptForEdit(config) {
  const questions = [
    {
      type: 'text',
      name: 'command',
      message: 'Command to run the server:',
      initial: config.command,
      validate: value => value.trim() !== '' ? true : 'Command is required'
    },
    {
      type: 'text',
      name: 'args',
      message: 'Command arguments (comma-separated):',
      initial: config.args.join(','),
      format: value => value.split(',').map(arg => arg.trim()).filter(arg => arg !== '')
    },
    {
      type: 'confirm',
      name: 'hasEnv',
      message: 'Do you want to set environment variables?',
      initial: Object.keys(config.env || {}).length > 0
    },
    {
      type: prev => prev ? 'text' : null,
      name: 'env',
      message: 'Environment variables (KEY=VALUE, comma-separated):',
      initial: Object.entries(config.env || {}).map(([key, value]) => `${key}=${value}`).join(','),
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
      message: 'Should this server be disabled?',
      initial: config.disabled || false
    },
    {
      type: 'text',
      name: 'alwaysAllow',
      message: 'Always allow patterns (comma-separated):',
      initial: (config.alwaysAllow || []).join(','),
      format: value => value.split(',').map(pattern => pattern.trim()).filter(pattern => pattern !== '')
    }
  ];
  
  const responses = await prompts(questions);
  
  // Create updated config
  return {
    ...config,
    command: responses.command,
    args: responses.args,
    env: responses.hasEnv ? responses.env : {},
    disabled: responses.disabled,
    alwaysAllow: responses.alwaysAllow
  };
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

module.exports = serverEditCommand;