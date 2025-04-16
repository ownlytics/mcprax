const semver = require('semver');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const { spawn } = require('child_process');
const updateNotifier = require('update-notifier');
const pkg = require('../../package.json');
const { getUpdateSettings, setUpdateSettings } = require('../config');

/**
 * Check if an update is available
 * @param {boolean} [forceCheck=false] - Whether to bypass cache and force check
 * @returns {Promise<{updateAvailable: boolean, currentVersion: string, latestVersion: string|null}>} Update information
 */
async function checkForUpdate(forceCheck = false) {
  try {
    // Create update notifier instance
    const notifier = updateNotifier({
      pkg,
      updateCheckInterval: forceCheck ? 0 : 1000 * 60 * 60 * 24, // 0 or 1 day
    });
    
    // Fetch update info
    await notifier.fetchInfo();
    
    // Get current update settings
    const settings = getUpdateSettings();
    let updateAvailable = false;
    let latestVersion = null;
    
    // Check if update is available
    if (notifier.update) {
      updateAvailable = true;
      latestVersion = notifier.update.latest;
      
      // Update the last notified version
      setUpdateSettings({ lastNotifiedVersion: latestVersion });
    } else if (settings.lastNotifiedVersion) {
      // Check if we already know about a newer version
      if (semver.gt(settings.lastNotifiedVersion, pkg.version)) {
        updateAvailable = true;
        latestVersion = settings.lastNotifiedVersion;
      }
    }
    
    return {
      updateAvailable,
      currentVersion: pkg.version,
      latestVersion
    };
  } catch (error) {
    // Return safe default values on error
    return {
      updateAvailable: false,
      currentVersion: pkg.version,
      latestVersion: null,
      error: error.message
    };
  }
}

/**
 * Perform the update
 * @returns {Promise<{success: boolean, message: string, error: Error|null}>} Update result
 */
async function performUpdate() {
  return new Promise((resolve) => {
    // Get correct package name
    const packageName = pkg.name;
    
    // Spawn npm install process
    const updateProcess = spawn('npm', ['install', '-g', packageName], {
      stdio: 'pipe',
      shell: true
    });
    
    // Capture output
    let stdout = '';
    let stderr = '';
    
    updateProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    updateProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Handle process completion
    updateProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          message: `mcprax has been updated successfully.`,
          error: null
        });
      } else {
        resolve({
          success: false,
          message: `Update failed with exit code ${code}.`,
          error: new Error(stderr || stdout || 'No error details available'),
          errorDetails: stderr || stdout || 'No error details available',
          exitCode: code
        });
      }
    });
  });
}

module.exports = {
  checkForUpdate,
  performUpdate
};