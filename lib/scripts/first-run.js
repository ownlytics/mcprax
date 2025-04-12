const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const prompts = require('prompts');
const { 
  CONFIG_DIR,
  RACKS_DIR, 
  SERVERS_DIR,
  setActiveRack
} = require('../config');

/**
 * Run the first-time setup with default configuration
 */
async function firstTimeSetup() {
  // Check if this is first run
  const isFirstRun = !fs.existsSync(path.join(CONFIG_DIR, '.initialized'));
  
  if (!isFirstRun) {
    return;
  }
  
  console.log(chalk.green.bold('🎉 Welcome to mcprax! 🎉'));
  console.log(chalk.cyan('Let\'s set up a default configuration for you.'));
  console.log();
  
  const response = await prompts({
    type: 'confirm',
    name: 'setupDefault',
    message: 'Would you like to set up a default rack with example servers?',
    initial: true
  });
  
  if (response.setupDefault) {
    // Create default rack
    const defaultRack = {
      name: 'default',
      description: 'Default rack created during setup',
      servers: []
    };
    
    fs.writeJSONSync(path.join(RACKS_DIR, 'default.json'), defaultRack, { spaces: 2 });
    
    // Create example server - node
    const nodeServer = {
      name: 'node-example',
      command: 'node',
      args: ['server.js'],
      env: {
        PORT: '3000',
        NODE_ENV: 'development'
      },
      disabled: false
    };
    
    fs.writeJSONSync(path.join(SERVERS_DIR, 'node-example.json'), nodeServer, { spaces: 2 });
    
    // Create example server - python
    const pythonServer = {
      name: 'python-example',
      command: 'python',
      args: ['-m', 'http.server', '8000'],
      env: {},
      disabled: true
    };
    
    fs.writeJSONSync(path.join(SERVERS_DIR, 'python-example.json'), pythonServer, { spaces: 2 });
    
    // Set default rack as active
    setActiveRack('default');
    
    console.log(chalk.green('✓ Created default rack'));
    console.log(chalk.green('✓ Created example server configurations'));
    console.log(chalk.green('✓ Set default rack as active'));
    console.log();
    console.log('You can now:');
    console.log(`  ${chalk.cyan('rax current')} to see the active rack`);
    console.log(`  ${chalk.cyan('rax server list')} to see available servers`);
    console.log(`  ${chalk.cyan('rax mount node-example')} to add the example server to your rack`);
    console.log(`  ${chalk.cyan('rax apply')} to apply the configuration to Claude Desktop`);
  }
  
  // Mark as initialized
  fs.writeFileSync(path.join(CONFIG_DIR, '.initialized'), new Date().toISOString());
  
  console.log();
  console.log(chalk.blue('Type `rax --help` to see all available commands.'));
  console.log();
}

module.exports = { firstTimeSetup };