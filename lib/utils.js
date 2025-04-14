const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const boxen = require('boxen');

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
/**
 * Create a properly formatted update banner with correct width calculations
 * @param {Object} options - Banner options
 * @param {string} options.title - Banner title
 * @param {string} options.currentVersion - Current version
 * @param {string} options.latestVersion - Latest version
 * @param {string} options.updateCommand - Update command to display
 * @param {string} options.borderColor - Border color (default: 'blue')
 * @returns {string} Formatted banner
 */
function formatUpdateBanner({ title, currentVersion, latestVersion, updateCommand, borderColor = 'blue' }) {
  // Calculate the content to determine width
  const line1 = ` ${title} `;
  const line2 = ` Current version: ${currentVersion} `;
  const line3 = ` Latest version: ${latestVersion} `;
  const line4 = ` Run ${updateCommand} to update `;
  
  // Find the longest line
  const maxLength = Math.max(
    line1.length,
    line2.length,
    line3.length,
    line4.length
  );
  
  // Create the box with proper width
  const topBorder = '╭' + '─'.repeat(maxLength + 2) + '╮';
  const bottomBorder = '╰' + '─'.repeat(maxLength + 2) + '╯';
  
  // Create padded lines
  const paddedLine1 = '│ ' + line1 + ' '.repeat(maxLength - line1.length) + ' │';
  const paddedLine2 = '│ ' + line2 + ' '.repeat(maxLength - line2.length) + ' │';
  const paddedLine3 = '│ ' + line3 + ' '.repeat(maxLength - line3.length) + ' │';
  const paddedLine4 = '│ ' + line4 + ' '.repeat(maxLength - line4.length) + ' │';
  const separator = '├' + '─'.repeat(maxLength + 2) + '┤';
  
  // Apply colors and return
  return [
    chalk[borderColor](topBorder),
    chalk[borderColor](paddedLine1),
    chalk[borderColor](separator),
    chalk[borderColor](paddedLine2.replace(currentVersion, chalk.white(currentVersion))),
    chalk[borderColor](paddedLine3.replace(latestVersion, chalk.green(latestVersion))),
    chalk[borderColor](separator),
    chalk[borderColor](paddedLine4.replace(updateCommand, chalk.cyan(updateCommand))),
    chalk[borderColor](bottomBorder)
  ].join('\n');
}

module.exports = {
  validateName,
  serverExists,
  rackExists,
  errorAndExit,
  validateServerConfig,
  formatServerConfig,
  formatUpdateBanner
};