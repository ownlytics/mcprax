const Conf = require('conf');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

// Base config directory
const CONFIG_DIR = path.join(os.homedir(), '.mcprax');
const SERVERS_DIR = path.join(CONFIG_DIR, 'servers');
const RACKS_DIR = path.join(CONFIG_DIR, 'racks');
const ACTIVE_CONFIG = path.join(CONFIG_DIR, 'active.json');

// Update configuration using Conf
const updateConf = new Conf({
  projectName: 'mcprax',
  configName: 'update',
  schema: {
    checkEnabled: {
      type: 'boolean',
      default: true
    },
    lastNotifiedVersion: {
      type: 'string',
      default: ''
    }
  }
});

// Active rack configuration using Conf
const activeConf = new Conf({
  projectName: 'mcprax',
  configName: 'active',
  schema: {
    activeRack: {
      type: 'string',
      default: ''
    }
  }
});

// Determine Claude Desktop config path based on platform
let CLAUDE_CONFIG_DIR;
if (process.platform === 'darwin') {
  // macOS
  CLAUDE_CONFIG_DIR = path.join(os.homedir(), 'Library', 'Application Support', 'Claude');
} else if (process.platform === 'win32') {
  // Windows
  CLAUDE_CONFIG_DIR = path.join(os.homedir(), 'AppData', 'Roaming', 'Claude');
} else {
  // Linux and others
  CLAUDE_CONFIG_DIR = path.join(os.homedir(), '.config', 'Claude');
}

const CLAUDE_CONFIG_FILE = path.join(CLAUDE_CONFIG_DIR, 'claude_desktop_config.json');

/**
 * Ensure the mcprax configuration directory structure exists
 */
function ensureConfigDir() {
  try {
    fs.ensureDirSync(CONFIG_DIR);
    fs.ensureDirSync(SERVERS_DIR);
    fs.ensureDirSync(RACKS_DIR);
    
    // Initialize activeConf if this is first run
    if (!activeConf.has('activeRack')) {
      activeConf.set('activeRack', '');
      console.log(chalk.blue('Initialized mcprax configuration.'));
    }
    
    return true;
  } catch (error) {
    console.error(chalk.red(`Error creating config directories: ${error.message}`));
    return false;
  }
}

/**
 * Get the active rack configuration
 * @returns {Object|null} The active rack configuration or null if none is set
 */
function getActiveRack() {
  const activeRackName = activeConf.get('activeRack');
  
  if (!activeRackName) {
    return null;
  }
  
  const rackFile = path.join(RACKS_DIR, `${activeRackName}.json`);
  
  if (!fs.existsSync(rackFile)) {
    console.warn(chalk.yellow(`Warning: Active rack '${activeRackName}' does not exist.`));
    return null;
  }
  
  try {
    return fs.readJSONSync(rackFile);
  } catch (error) {
    console.error(chalk.red(`Error reading rack configuration: ${error.message}`));
    return null;
  }
}

/**
 * Set the active rack
 * @param {string} rackName - The name of the rack to activate
 */
function setActiveRack(rackName) {
  activeConf.set('activeRack', rackName);
  // Ensure the file is written to disk
  fs.writeJSONSync(ACTIVE_CONFIG, { activeRack: rackName }, { spaces: 2 });
}

/**
 * Generate Claude Desktop configuration from active rack
 * @returns {Object|null} The generated configuration or null on error
 */
function generateClaudeConfig() {
  try {
    const activeRack = getActiveRack();
    if (!activeRack) {
      console.error(chalk.red('No active rack set.'));
      return null;
    }
    
    // Create config object with mcpServers
    const claudeConfig = {
      mcpServers: {}
    };
    
    // Add each server from the rack
    let serverLoadErrors = 0;
    for (const serverName of activeRack.servers) {
      const serverFile = path.join(SERVERS_DIR, `${serverName}.json`);
      
      if (!fs.existsSync(serverFile)) {
        console.error(chalk.yellow(`Warning: Server '${serverName}' configuration not found.`));
        serverLoadErrors++;
        continue;
      }
      
      try {
        const serverConfig = fs.readJSONSync(serverFile);
        
        // Validate server config
        if (!serverConfig.command || !Array.isArray(serverConfig.args)) {
          console.error(chalk.yellow(`Warning: Server '${serverName}' has invalid configuration.`));
          serverLoadErrors++;
          continue;
        }
        
        // Add server to Claude Desktop config
        claudeConfig.mcpServers[serverName] = {
          command: serverConfig.command,
          args: serverConfig.args,
          env: serverConfig.env || {},
          disabled: serverConfig.disabled || false
        };
        
        // Add alwaysAllow if present
        if (serverConfig.alwaysAllow && serverConfig.alwaysAllow.length > 0) {
          claudeConfig.mcpServers[serverName].alwaysAllow = serverConfig.alwaysAllow;
        }
      } catch (error) {
        console.error(chalk.yellow(`Warning: Could not read server '${serverName}' configuration: ${error.message}`));
        serverLoadErrors++;
      }
    }
    
    if (serverLoadErrors > 0) {
      console.error(chalk.yellow(`Warning: ${serverLoadErrors} server configurations could not be loaded.`));
    }
    
    return claudeConfig;
  } catch (error) {
    console.error(chalk.red(`Error generating Claude Desktop configuration: ${error.message}`));
    return null;
  }
}

/**
 * Get the active rack name
 * @returns {string|null} The active rack name or null if none is set
 */
function getActiveRackName() {
  const activeRackName = activeConf.get('activeRack');
  return activeRackName || null;
}

/**
 * Check if the active rack is set and exists
 * @returns {boolean} true if an active rack is set and exists, false otherwise
 */
function hasActiveRack() {
  const activeRackName = getActiveRackName();
  if (!activeRackName) {
    return false;
  }
  
  const rackFile = path.join(RACKS_DIR, `${activeRackName}.json`);
  return fs.existsSync(rackFile);
}

/**
 * Update the active rack by adding or removing a server
 * @param {string} serverName - The name of the server
 * @param {boolean} add - Whether to add (true) or remove (false) the server
 * @returns {boolean} true if successful, false otherwise
 */
function updateActiveRackServers(serverName, add = true) {
  const activeRackName = getActiveRackName();
  if (!activeRackName) {
    return false;
  }
  
  const rackFile = path.join(RACKS_DIR, `${activeRackName}.json`);
  if (!fs.existsSync(rackFile)) {
    return false;
  }
  
  try {
    const rackConfig = fs.readJSONSync(rackFile);
    
    if (add) {
      // Add server if not already in the rack
      if (!rackConfig.servers.includes(serverName)) {
        rackConfig.servers.push(serverName);
      }
    } else {
      // Remove server if in the rack
      rackConfig.servers = rackConfig.servers.filter(s => s !== serverName);
    }
    
    fs.writeJSONSync(rackFile, rackConfig, { spaces: 2 });
    return true;
  } catch (error) {
    console.error(chalk.red(`Error updating rack servers: ${error.message}`));
    return false;
  }
}

/**
 * Create a backup of Claude Desktop configuration
 * @returns {string|null} The backup file path or null on error
 */
function backupClaudeConfig() {
  if (!fs.existsSync(CLAUDE_CONFIG_FILE)) {
    return null;
  }
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `${CLAUDE_CONFIG_FILE}.${timestamp}.bak`;
    fs.copySync(CLAUDE_CONFIG_FILE, backupFile);
    return backupFile;
  } catch (error) {
    console.error(chalk.red(`Error creating backup: ${error.message}`));
    return null;
  }
}

/**
 * Ensure Claude Desktop config directory exists
 * @returns {boolean} true if successful, false otherwise
 */
function ensureClaudeConfigDir() {
  try {
    if (!fs.existsSync(CLAUDE_CONFIG_DIR)) {
      fs.mkdirpSync(CLAUDE_CONFIG_DIR);
    }
    return true;
  } catch (error) {
    console.error(chalk.red(`Error creating Claude Desktop config directory: ${error.message}`));
    return false;
  }
}
/**
 * Get the update notification settings
 * @returns {Object} The update notification settings
 */
function getUpdateSettings() {
  return {
    checkEnabled: updateConf.get('checkEnabled'),
    lastNotifiedVersion: updateConf.get('lastNotifiedVersion')
  };
}

/**
 * Update the update notification settings
 * @param {Object} settings - The update notification settings
 * @param {boolean} [settings.checkEnabled] - Whether to enable update checks
 * @param {string} [settings.lastNotifiedVersion] - The last version notified about
 */
function setUpdateSettings(settings) {
  if (settings.checkEnabled !== undefined) updateConf.set('checkEnabled', settings.checkEnabled);
  if (settings.lastNotifiedVersion) updateConf.set('lastNotifiedVersion', settings.lastNotifiedVersion);
}

module.exports = {
  CONFIG_DIR,
  SERVERS_DIR,
  RACKS_DIR,
  ACTIVE_CONFIG,
  CLAUDE_CONFIG_DIR,
  CLAUDE_CONFIG_FILE,
  ensureConfigDir,
  getActiveRack,
  setActiveRack,
  generateClaudeConfig,
  getActiveRackName,
  hasActiveRack,
  updateActiveRackServers,
  backupClaudeConfig,
  ensureClaudeConfigDir,
  getUpdateSettings,
  setUpdateSettings
};