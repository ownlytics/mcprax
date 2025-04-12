const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Validate a name to ensure it contains only alphanumeric characters, hyphens, and underscores
 * @param {string} name - The name to validate
 * @returns {boolean} true if valid, false otherwise
 */
function validateName(name) {
  return /^[a-zA-Z0-9-_]+$/.test(name);
}

/**
 * Check if a server exists
 * @param {string} serverName - The name of the server
 * @param {string} serversDir - The directory containing server configurations
 * @returns {boolean} true if the server exists, false otherwise
 */
function serverExists(serverName, serversDir) {
  const serverFile = path.join(serversDir, `${serverName}.json`);
  return fs.existsSync(serverFile);
}

/**
 * Check if a rack exists
 * @param {string} rackName - The name of the rack
 * @param {string} racksDir - The directory containing rack configurations
 * @returns {boolean} true if the rack exists, false otherwise
 */
function rackExists(rackName, racksDir) {
  const rackFile = path.join(racksDir, `${rackName}.json`);
  return fs.existsSync(rackFile);
}

/**
 * Log an error message and exit the process
 * @param {string} message - The error message
 * @param {number} exitCode - The exit code (default: 1)
 */
function errorAndExit(message, exitCode = 1) {
  console.error(chalk.red(`Error: ${message}`));
  process.exit(exitCode);
}

/**
 * Validate server configuration
 * @param {Object} config - The server configuration to validate
 * @returns {boolean} true if valid, false otherwise
 */
function validateServerConfig(config) {
  return (
    config &&
    typeof config.name === 'string' &&
    typeof config.command === 'string' &&
    Array.isArray(config.args) &&
    typeof config.env === 'object' &&
    (typeof config.disabled === 'boolean' || config.disabled === undefined) &&
    (Array.isArray(config.alwaysAllow) || config.alwaysAllow === undefined)
  );
}

/**
 * Format server configuration for display
 * @param {Object} config - The server configuration
 * @returns {string} Formatted configuration string
 */
function formatServerConfig(config) {
  let output = `${config.command} ${config.args.join(' ')}`;
  
  if (Object.keys(config.env).length > 0) {
    const envString = Object.entries(config.env)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');
    output += `\nEnvironment: ${envString}`;
  }
  
  if (config.disabled) {
    output += '\nStatus: Disabled';
  }
  
  if (config.alwaysAllow && config.alwaysAllow.length > 0) {
    output += `\nAlways Allow: ${config.alwaysAllow.join(', ')}`;
  }
  
  return output;
}

module.exports = {
  validateName,
  serverExists,
  rackExists,
  errorAndExit,
  validateServerConfig,
  formatServerConfig
};