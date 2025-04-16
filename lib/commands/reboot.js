const { exec } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const ora = require('ora');
const prompts = require('prompts');
const { errorAndExit } = require('../utils');

/**
 * Implementation of the reboot command for Claude Desktop
 * @param {import('commander').Command} program - The Commander program instance
 */
function rebootCommand(program) {
  program
    .command('reboot')
    .description('Restart Claude Desktop application')
    .option('-f, --force', 'Force restart without confirmation')
    .on('--help', () => {
      console.log('');
      console.log(chalk.yellow('Examples:'));
      console.log('');
      console.log('  $ rax reboot              # Restart Claude Desktop with confirmation');
      console.log('  $ rax reboot --force      # Restart without confirmation');
      console.log('');
      console.log(chalk.cyan('Notes:'));
      console.log('  - Unsaved work in Claude Desktop may be lost');
      console.log('  - This command requires Claude Desktop to be installed');
      console.log('  - You may need appropriate permissions to terminate processes');
    })
    .action(async (options) => {
      // Implement confirmation unless force flag is set
      if (!options.force) {
        const response = await prompts({
          type: 'confirm',
          name: 'proceed',
          message: 'This will restart Claude Desktop and any unsaved work may be lost. Continue?',
          initial: false
        });
        
        if (!response.proceed) {
          console.log('\n' + chalk.blue('Restart cancelled.'));
          return;
        }
      }
      
      // Proceed with restart
      restartClaudeDesktop(options);
    });
}

/**
 * Platform-specific implementation of Claude Desktop restart
 * @param {Object} options - Command options
 */
function restartClaudeDesktop(options = {}) {
  const spinner = ora('Detecting Claude Desktop process...').start();
  const platform = process.platform;
  
  if (platform === 'darwin') {
    // macOS implementation
    restartOnMacOS(spinner, options);
  } else if (platform === 'win32') {
    // Windows implementation
    restartOnWindows(spinner, options);
  } else {
    spinner.fail(`Unsupported platform: ${platform}. Only macOS and Windows are supported.`);
  }
}

/**
 * Restart Claude Desktop on macOS
 * @param {Object} spinner - Ora spinner instance
 * @param {Object} options - Command options
 */
function restartOnMacOS(spinner, options) {
  // Find Claude Desktop process
  spinner.text = 'Finding Claude Desktop process on macOS...';
  
  exec('ps aux | grep -i "[C]laude" | grep -v grep', (error, stdout, stderr) => {
    if (error && !stdout.trim()) {
      spinner.warn('Claude Desktop process not found. Attempting to launch application...');
      launchClaudeDesktopMacOS(spinner);
      return;
    }
    
    // Parse process information
    const lines = stdout.trim().split('\n');
    let claudeProcesses = [];
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 2) continue;
      
      const pid = parts[1];
      const cmd = parts.slice(10).join(' ');
      
      if (pid && (cmd.includes('Claude') || cmd.includes('claude'))) {
        claudeProcesses.push({ pid, cmd });
      }
    }
    
    if (claudeProcesses.length === 0) {
      spinner.warn('Claude Desktop process not found. Attempting to launch application...');
      launchClaudeDesktopMacOS(spinner);
      return;
    }
    
    // Kill all Claude processes found
    spinner.text = `Terminating Claude Desktop processes (${claudeProcesses.length} found)...`;
    
    // Add a timeout to prevent hanging
    const terminationTimeout = setTimeout(() => {
      spinner.warn(`Termination timeout reached. Some processes may not have been terminated. Proceeding anyway...`);
      launchClaudeDesktopMacOS(spinner);
    }, 5000); // 5 second timeout
    
    let terminatedCount = 0;
    let errorCount = 0;
    
    for (const proc of claudeProcesses) {
      exec(`kill -9 ${proc.pid}`, (killError) => {
        if (killError) {
          // Check for specific "No such process" errors
          if (killError.message && killError.message.includes('No such process')) {
            // Process is already gone, count it as terminated
            terminatedCount++;
            console.warn(chalk.yellow(`Process ${proc.pid} already terminated.`));
          } else {
            errorCount++;
            console.error(chalk.yellow(`Warning: Failed to terminate process ${proc.pid}: ${killError.message}`));
          }
        } else {
          terminatedCount++;
        }
        
        // Launch after all processes are terminated or attempted
        if ((terminatedCount + errorCount) >= claudeProcesses.length) {
          clearTimeout(terminationTimeout);
          
          if (errorCount > 0) {
            spinner.warn(`Terminated ${terminatedCount}/${claudeProcesses.length} Claude Desktop processes (${errorCount} errors)`);
          } else {
            spinner.succeed(`Terminated all ${terminatedCount} Claude Desktop processes`);
          }
          
          launchClaudeDesktopMacOS(spinner);
        }
      });
    }
  });
}

/**
 * Launch Claude Desktop on macOS
 * @param {Object} spinner - Ora spinner instance
 */
function launchClaudeDesktopMacOS(spinner) {
  spinner.text = 'Launching Claude Desktop...';
  
  // Check common installation locations
  const commonPaths = [
    '/Applications/Claude.app',
    path.join(os.homedir(), 'Applications/Claude.app')
  ];
  
  let appPath = null;
  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      appPath = p;
      break;
    }
  }
  
  if (!appPath) {
    spinner.fail('Claude Desktop application not found. Please ensure it is installed correctly.');
    return;
  }
  
  // Launch using 'open' command
  exec(`open "${appPath}"`, (error) => {
    if (error) {
      spinner.fail(`Failed to launch Claude Desktop: ${error.message}`);
    } else {
      spinner.succeed('Claude Desktop restarted successfully');
    }
  });
}

/**
 * Restart Claude Desktop on Windows
 * @param {Object} spinner - Ora spinner instance
 * @param {Object} options - Command options
 */
function restartOnWindows(spinner, options) {
  // Find Claude Desktop process
  spinner.text = 'Finding Claude Desktop process on Windows...';
  
  exec('tasklist /fi "IMAGENAME eq Claude.exe" /fo csv /nh', (error, stdout, stderr) => {
    if (error || !stdout.trim() || stdout.includes('INFO: No tasks')) {
      // Also try other possible process names
      exec('tasklist /fi "IMAGENAME eq Claude*" /fo csv /nh', (error2, stdout2, stderr2) => {
        if (error2 || !stdout2.trim() || stdout2.includes('INFO: No tasks')) {
          spinner.warn('Claude Desktop process not found. Attempting to launch application...');
          launchClaudeDesktopWindows(spinner);
          return;
        } else {
          processWindowsTasklist(stdout2, spinner);
        }
      });
    } else {
      processWindowsTasklist(stdout, spinner);
    }
  });
}

/**
 * Process Windows tasklist output and terminate Claude processes
 * @param {string} tasklistOutput - Output from tasklist command
 * @param {Object} spinner - Ora spinner instance
 */
function processWindowsTasklist(tasklistOutput, spinner) {
  // Parse CSV output from tasklist
  const processes = tasklistOutput.trim().split('\r\n').map(line => {
    // Remove quotes and split by comma
    const parts = line.replace(/"/g, '').split(',');
    return {
      name: parts[0],
      pid: parts[1]
    };
  });
  
  if (processes.length === 0) {
    spinner.warn('Claude Desktop process not found. Attempting to launch application...');
    launchClaudeDesktopWindows(spinner);
    return;
  }
  
  // Kill all found processes
  spinner.text = `Terminating Claude Desktop processes (${processes.length} found)...`;
  
  // Add a timeout to prevent hanging
  const terminationTimeout = setTimeout(() => {
    spinner.warn(`Termination timeout reached. Some processes may not have been terminated. Proceeding anyway...`);
    launchClaudeDesktopWindows(spinner);
  }, 5000); // 5 second timeout
  
  let terminatedCount = 0;
  let errorCount = 0;
  
  for (const proc of processes) {
    exec(`taskkill /F /PID ${proc.pid}`, (killError) => {
      if (killError) {
        // Check if the process is already gone
        if (killError.message && (
            killError.message.includes('not found') ||
            killError.message.includes('does not exist') ||
            killError.message.includes('no running instance')
        )) {
          // Process is already gone, count it as terminated
          terminatedCount++;
          console.warn(chalk.yellow(`Process ${proc.pid} already terminated.`));
        } else {
          errorCount++;
          console.error(chalk.yellow(`Warning: Failed to terminate process ${proc.pid}: ${killError.message}`));
        }
      } else {
        terminatedCount++;
      }
      
      // Launch after all processes are terminated or attempted
      if ((terminatedCount + errorCount) >= processes.length) {
        clearTimeout(terminationTimeout);
        
        if (errorCount > 0) {
          spinner.warn(`Terminated ${terminatedCount}/${processes.length} Claude Desktop processes (${errorCount} errors)`);
        } else {
          spinner.succeed(`Terminated all ${terminatedCount} Claude Desktop processes`);
        }
        
        launchClaudeDesktopWindows(spinner);
      }
    });
  }
}

/**
 * Launch Claude Desktop on Windows
 * @param {Object} spinner - Ora spinner instance
 */
function launchClaudeDesktopWindows(spinner) {
  spinner.text = 'Launching Claude Desktop...';
  
  // Check common installation locations
  const commonPaths = [
    path.join(process.env['ProgramFiles'], 'Claude/Claude.exe'),
    path.join(process.env['ProgramFiles(x86)'], 'Claude/Claude.exe'),
    path.join(process.env['LOCALAPPDATA'], 'Programs/Claude/Claude.exe'),
    path.join(process.env['APPDATA'], 'Claude/Claude.exe')
  ];
  
  let appPath = null;
  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      appPath = p;
      break;
    }
  }
  
  if (!appPath) {
    // Try to find the executable using the Windows registry
    exec('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\Claude.exe" /ve', (regError, regStdout) => {
      if (!regError && regStdout) {
        const match = regStdout.match(/REG_SZ\s+(.+)/);
        if (match && match[1]) {
          const registryPath = match[1].trim();
          if (fs.existsSync(registryPath)) {
            launchWindowsExecutable(registryPath, spinner);
            return;
          }
        }
      }
      
      spinner.fail('Claude Desktop application not found. Please ensure it is installed correctly.');
    });
    return;
  }
  
  launchWindowsExecutable(appPath, spinner);
}

/**
 * Launch a Windows executable
 * @param {string} exePath - Path to the executable
 * @param {Object} spinner - Ora spinner instance
 */
function launchWindowsExecutable(exePath, spinner) {
  exec(`"${exePath}"`, (error) => {
    if (error) {
      spinner.fail(`Failed to launch Claude Desktop: ${error.message}`);
    } else {
      spinner.succeed('Claude Desktop restarted successfully');
    }
  });
}

// Export both the command function and the restart functionality
module.exports = {
  rebootCommand,
  restartClaudeDesktop
};