const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const remote = require('@electron/remote/main');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
remote.initialize();
const path = require('path');
const fs = require('fs').promises;
const { encode } = require('gpt-tokenizer');
const Store = require('electron-store');
const store = new Store();

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;
log.info('PromptLab starting...');

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.allowPrerelease = false;
autoUpdater.forceDevUpdateConfig = true;

// Set GitHub configuration
const updateConfig = {
    provider: 'github',
    owner: '0xIbra',
    repo: 'promptlab'
};

if (!app.isPackaged) {
    const devConfigPath = path.join(__dirname, 'dev-app-update.yml');
    autoUpdater.updateConfigPath = devConfigPath;
} else {
    autoUpdater.setFeedURL(updateConfig);
}

log.info('App version:', app.getVersion());

const DEFAULT_IGNORE_PATTERNS = [
    // Common
    '# Common',
    'node_modules',
    'dist',
    'build',
    '.next',
    '.vite',
    '.git',
    '.env',
    '.env.*',
    '',

    // Python
    '# Python',
    '__pycache__',
    'venv',
    '*.pyc',

    // IDE
    '# IDE',
    '.idea',
    '.vscode',

    // System
    '# System',
    '.DS_Store',
    'Thumbs.db',
];

// Near the top with other store initialization
const DEFAULT_WINDOW_BOUNDS = {
    width: 1400,
    height: 800,
    x: undefined,
    y: undefined
};

// Function to check if webpack bundle exists
async function waitForWebpackBundle() {
    const bundlePath = path.join(__dirname, 'dist', 'bundle.js');
    let attempts = 0;
    const maxAttempts = 30; // 30 * 100ms = 3 seconds max wait

    while (attempts < maxAttempts) {
        try {
            await fs.access(bundlePath);
            return true;
        } catch (error) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    return false;
}

function createWindow() {
    // Get stored window bounds
    const windowBounds = store.get('windowBounds', DEFAULT_WINDOW_BOUNDS);

    const win = new BrowserWindow({
        ...windowBounds,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: false
        },
        backgroundColor: '#111827',
        frame: false,
        transparent: process.platform !== 'linux',
        icon: path.join(__dirname, 'assets/icons/256x256.png')
    });

    // Save window position and size when it changes
    ['move', 'resize'].forEach(event => {
        win.on(event, () => {
            if (!win.isMaximized()) {
                const bounds = win.getBounds();
                store.set('windowBounds', bounds);
            }
        });
    });

    // Save maximized state
    win.on('maximize', () => {
        store.set('windowMaximized', true);
    });

    win.on('unmaximize', () => {
        store.set('windowMaximized', false);
        // Save current bounds after unmaximize
        const bounds = win.getBounds();
        store.set('windowBounds', bounds);
    });

    remote.enable(win.webContents);

    // In development, wait for webpack bundle before loading
    if (!app.isPackaged) {
        waitForWebpackBundle().then(bundleReady => {
            if (bundleReady) {
                win.loadFile('index.html');
                win.webContents.on('did-finish-load', () => {
                    checkForUpdates();
                });
            } else {
                log.error('Webpack bundle not found after waiting');
                win.loadFile('index.html'); // Load anyway, might need refresh
            }
        });
    } else {
        // In production, load immediately
        win.loadFile('index.html');
        win.webContents.on('did-finish-load', () => {
            checkForUpdates();
        });
    }

    // Restore maximized state if it was maximized when closed
    if (store.get('windowMaximized', false)) {
        win.maximize();
    }

    return win;
}

// Function to check for updates
async function checkForUpdates() {
    try {
        const result = await autoUpdater.checkForUpdates();
        if (result?.updateInfo) {
            log.info('Update available:', {
                currentVersion: app.getVersion(),
                newVersion: result.updateInfo.version
            });
        }
    } catch (error) {
        log.error('Error checking for updates:', error.message);
    }
}

// Auto-updater events with minimal logging
autoUpdater.on('checking-for-update', () => {
    // Silent check
});

autoUpdater.on('update-available', (info) => {
    // Send update info to renderer
    BrowserWindow.getAllWindows().forEach(window => {
        window.webContents.send('update-available', {
            version: info.version,
            releaseDate: info.releaseDate,
            releaseNotes: info.releaseNotes
        });
    });
});

autoUpdater.on('update-not-available', () => {
    // Silent when no update
});

autoUpdater.on('error', (err) => {
    log.error('Update error:', err.message);
});

autoUpdater.on('download-progress', (progressObj) => {
    // Only log every 20% to avoid spam
    if (Math.round(progressObj.percent) % 20 === 0) {
        log.info(`Download progress: ${Math.round(progressObj.percent)}%`);
    }
});

autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded. Will be installed on next restart.');
});

app.whenReady().then(() => {
    createWindow();
    // Remove this since we're now checking after window loads
    // autoUpdater.checkForUpdatesAndNotify();
});

// File system handlers
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    return result.filePaths;
});

function isFileIgnoredWithFilters(filePath, filtersList) {
    if (!filtersList || filtersList.length === 0) return false;

    return filtersList.some(pattern => {
        // Skip empty patterns and comments
        if (!pattern || pattern.startsWith('#')) return false;

        try {
            // Clean up the pattern
            pattern = pattern.trim();

            // Handle directory patterns (ending with /)
            if (pattern.endsWith('/')) {
                pattern = pattern.slice(0, -1);
            }

            // Convert glob pattern to regex
            let regexPattern = pattern
                // Escape special regex characters except * and ?
                .replace(/[.+^${}()|[\]\\]/g, '\\$&')
                // Convert ** to special placeholder
                .replace(/\*\*/g, '__GLOBSTAR__')
                // Convert * to non-separator match
                .replace(/\*/g, '[^/]*')
                // Convert ? to single non-separator char
                .replace(/\?/g, '[^/]')
                // Convert globstar back
                .replace(/__GLOBSTAR__/g, '.*');

            // Make the pattern match anywhere in the path
            if (!pattern.startsWith('/')) {
                regexPattern = `(^|/|\\\\)${regexPattern}(/|$|\\\\)`;
            }

            const regex = new RegExp(regexPattern);
            return regex.test(filePath);
        } catch (error) {
            return false;
        }
    });
}

async function isTextFile(filePath) {
    try {
        // Read the first 8KB of the file
        const fd = await fs.open(filePath, 'r');
        const buffer = Buffer.alloc(8192); // 8KB buffer
        const { bytesRead } = await fd.read(buffer, 0, 8192, 0);
        await fd.close();

        // If file is empty, consider it text
        if (bytesRead === 0) return true;

        // Check for NULL bytes in the content
        // Files with NULL bytes are likely binary
        for (let i = 0; i < bytesRead; i++) {
            if (buffer[i] === 0) return false;
        }

        // Try to decode as UTF-8
        try {
            buffer.slice(0, bytesRead).toString('utf8');
            return true;
        } catch (e) {
            return false;
        }
    } catch (error) {
        console.error(`Error checking if ${filePath} is text:`, error);
        return false;
    }
}

async function countTokens(filePath) {
    try {
        // First check if it's a text file
        if (!await isTextFile(filePath)) {
            return 0;
        }

        const content = await fs.readFile(filePath, 'utf-8');
        return encode(content).length;
    } catch (error) {
        console.error(`Error counting tokens for ${filePath}:`, error);
        return 0;
    }
}

ipcMain.handle('read-directory', async (event, folderPath, filters = []) => {
    // Use default patterns if no filters provided
    const activeFilters = filters.length > 0
        ? filters
        : DEFAULT_IGNORE_PATTERNS;

    async function getAllFiles(dir) {
        let files;
        try {
            files = await fs.readdir(dir, { withFileTypes: true });
        } catch (error) {
            if (error.code === 'EACCES' || error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }

        const paths = [];

        for (const file of files) {
            const filePath = path.join(dir, file.name);
            const relativePath = path.relative(folderPath, filePath).replace(/\\/g, '/');

            try {
                if (file.isDirectory()) {
                    const subDirFiles = await getAllFiles(filePath);
                    paths.push(...subDirFiles);
                } else {
                    // Check if file should be ignored
                    if (!isFileIgnoredWithFilters(relativePath, activeFilters)) {
                        try {
                            await fs.access(filePath, fs.constants.R_OK);
                            // Count tokens for each file that passes the filters
                            const tokens = await countTokens(filePath);
                            paths.push({
                                path: relativePath,
                                tokens,
                                isText: tokens > 0 // If tokens were counted, it's a text file
                            });
                        } catch (accessError) {
                            if (accessError.code === 'EACCES' || accessError.code === 'ENOENT') {
                                continue;
                            }
                            throw accessError;
                        }
                    }
                }
            } catch (error) {
                if (error.code === 'EACCES' || error.code === 'ENOENT') {
                    continue;
                }
                throw error;
            }
        }

        return paths;
    }

    try {
        const files = await getAllFiles(folderPath);
        return files;
    } catch (error) {
        throw error;
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('load-global-settings', async () => {
    return store.get('globalSettings', {
        lastOpenedRepo: null
    });
});

ipcMain.handle('save-global-settings', async (event, settings) => {
    try {
        // Ensure the path exists and is absolute
        if (settings.lastOpenedRepo) {
            const absolutePath = path.resolve(settings.lastOpenedRepo);
            settings.lastOpenedRepo = absolutePath;
        }
        store.set('globalSettings', settings);
    } catch (error) {
        console.error('Error saving global settings:', error);
        throw error;
    }
});

ipcMain.handle('load-repo-data', async (event, repoPath) => {
    const repoData = store.get(`repos.${repoPath}`, {});

    // Initialize filters with defaults if they don't exist
    // This ensures each repo starts with default filters but can be customized
    if (!repoData.filters) {
        repoData.filters = DEFAULT_IGNORE_PATTERNS;
        store.set(`repos.${repoPath}`, repoData);
    }

    return repoData;
});

ipcMain.handle('save-repo-data', async (event, repoPath, data) => {
    store.set(`repos.${repoPath}`, data);
});

ipcMain.handle('load-templates', async () => {
    return store.get('templates', []);
});

ipcMain.handle('save-templates', async (event, templates) => {
    store.set('templates', templates);
});

ipcMain.handle('load-ui-settings', async () => {
    const settings = store.get('uiSettings', {
        sidebarWidth: 288, // Default width
        instructionsHeight: 256 // Default height
    });
    return settings;
});

ipcMain.handle('save-ui-settings', async (event, settings) => {
    // Only allow specific UI-related settings
    const allowedKeys = ['sidebarWidth', 'instructionsHeight'];
    const sanitizedSettings = {};

    for (const key of allowedKeys) {
        if (key in settings) {
            sanitizedSettings[key] = settings[key];
        }
    }

    // Get current settings
    const currentSettings = store.get('uiSettings', {});

    // Merge and save
    const newSettings = {
        ...currentSettings,
        ...sanitizedSettings
    };

    store.set('uiSettings', newSettings);
});

ipcMain.handle('update-recent-repos', async (event, repoPath) => {
    const recentRepos = store.get('recentRepos', []);
    const updatedRepos = [
        repoPath,
        ...recentRepos.filter(repo => repo !== repoPath)
    ].slice(0, 10); // Keep only last 10 repos

    store.set('recentRepos', updatedRepos);
    return updatedRepos;
});