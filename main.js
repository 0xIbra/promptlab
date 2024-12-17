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
log.info('App starting...');

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

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 800,
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
        icon: path.join(__dirname, 'assets', 'icon.png')
    });

    remote.enable(win.webContents);
    win.loadFile('index.html');

    return win;
}

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
});

autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
});

autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
    let logMessage = `Download speed: ${progressObj.bytesPerSecond}`;
    logMessage = `${logMessage} - Downloaded ${progressObj.percent}%`;
    logMessage = `${logMessage} (${progressObj.transferred}/${progressObj.total})`;
    log.info(logMessage);
});

autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    // Install on next restart
    autoUpdater.quitAndInstall(false, true);
});

app.whenReady().then(() => {
    createWindow();
    autoUpdater.checkForUpdatesAndNotify();
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
            console.log(`Skipping token count for non-text file: ${filePath}`);
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

ipcMain.handle('update-recent-repos', async (event, repoPath) => {
    const recentRepos = store.get('recentRepos', []);
    const updatedRepos = [
        repoPath,
        ...recentRepos.filter(repo => repo !== repoPath)
    ].slice(0, 10); // Keep only last 10 repos

    store.set('recentRepos', updatedRepos);
    return updatedRepos;
});

// Add a new handler specifically for UI settings
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

ipcMain.handle('load-templates', async () => {
    return store.get('templates', []);
});

ipcMain.handle('save-templates', async (event, templates) => {
    store.set('templates', templates);
});

ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const currentRepo = store.get('globalSettings', {}).lastOpenedRepo;
        if (!currentRepo) {
            throw new Error('No repository is currently open');
        }

        // Correctly join the repo path with the relative file path
        const fullPath = path.join(currentRepo, filePath);

        // Verify the file is within the repo directory (security check)
        if (!fullPath.startsWith(currentRepo)) {
            throw new Error('Invalid file path');
        }

        // Log paths for debugging
        console.log('Reading file:', {
            currentRepo,
            filePath,
            fullPath
        });

        const content = await fs.readFile(fullPath, 'utf-8');
        return content;
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        throw error;
    }
});

// Modify the generateFileTree function to only include selected files
async function generateFileTree(rootPath, selectedFiles) {
    const tree = {};

    // Helper to add a path to the tree
    const addToTree = (pathParts, isFile = false) => {
        let current = tree;
        pathParts.forEach((part, index) => {
            if (!current[part]) {
                current[part] = {
                    isFile: isFile && index === pathParts.length - 1,
                    children: {}
                };
            }
            current = current[part].children;
        });
    };

    // Add all selected files and their parent directories to the tree
    selectedFiles.forEach(file => {
        const pathParts = file.path.split('/');

        // Add all parent directories
        for (let i = 1; i <= pathParts.length; i++) {
            addToTree(pathParts.slice(0, i), i === pathParts.length);
        }
    });

    // Helper to render the tree structure
    const renderTree = (node, prefix = '', isLast = true, parentPrefix = '') => {
        let result = '';
        const entries = Object.entries(node);

        entries.forEach(([name, data], index) => {
            const isLastEntry = index === entries.length - 1;
            const newPrefix = parentPrefix + (isLast ? '    ' : '│   ');

            result += `${prefix}${isLastEntry ? '└── ' : '├── '}${name}${data.isFile ? '' : '/'}\n`;

            if (!data.isFile && Object.keys(data.children).length > 0) {
                result += renderTree(data.children, newPrefix + '', isLastEntry, newPrefix);
            }
        });

        return result;
    };

    return renderTree(tree);
}

// Update the generate-prompt handler
ipcMain.handle('generate-prompt', async (event, { selectedFiles, instructions, activeTemplates, currentRepo, includeFileTree = false }) => {
    try {
        const sections = [];

        // Add templates
        if (activeTemplates?.length > 0) {
            sections.push(activeTemplates.map(t => t.content).join('\n\n'));
        }

        // Add instructions
        if (instructions?.trim()) {
            sections.push(`Instructions:\n${instructions.trim()}`);
        }

        sections.push("---")
        // Add file tree if requested (now only for selected files)
        if (includeFileTree && selectedFiles?.length > 0) {
            try {
                const fileTree = await generateFileTree(currentRepo, selectedFiles.filter(f => f.selected));
                sections.push(`Project Structure:\n\`\`\`\n${fileTree}\`\`\`\n---`);
            } catch (error) {
                console.error('Error generating file tree:', error);
                sections.push('Error generating project structure\n---');
            }
        }

        sections.push("=== codebase ===")

        // Rest of the function remains the same...
        const getFileContent = async (filePath) => {
            const fullPath = path.join(currentRepo, filePath);
            const content = await fs.readFile(fullPath, 'utf-8');
            return `${filePath}\n\`\`\`\n${content}\n\`\`\``;
        };

        // Add file contents
        if (selectedFiles?.length > 0) {
            for (const file of selectedFiles) {
                try {
                    const fullPath = path.join(currentRepo, file.path);

                    // Security check
                    if (!fullPath.startsWith(currentRepo)) {
                        throw new Error('Invalid file path');
                    }

                    sections.push(await getFileContent(file.path));
                } catch (error) {
                    console.error(`Error reading file ${file.path}:`, error);
                    sections.push(`${file.path}\nError reading file: ${error.message}`);
                }
            }
        }

        const finalText = sections.join('\n\n');
        const tokenCount = encode(finalText).length;

        return {
            text: finalText,
            tokens: tokenCount
        };
    } catch (error) {
        console.error('Error generating prompt:', error);
        throw error;
    }
});

ipcMain.handle('apply-code-changes', async (event, changes) => {
    const currentRepo = store.get('globalSettings', {}).lastOpenedRepo;
    if (!currentRepo) {
        throw new Error('No repository is currently open');
    }

    const results = [];
    for (const change of changes) {
        const fullPath = path.join(currentRepo, change.path);

        // Security check - ensure file is within repo
        if (!fullPath.startsWith(currentRepo)) {
            results.push({
                path: change.path,
                success: false,
                error: 'Invalid file path'
            });
            continue;
        }

        try {
            switch (change.operation.toLowerCase()) {
                case 'create':
                    // Ensure directory exists
                    await fs.mkdir(path.dirname(fullPath), { recursive: true });
                    await fs.writeFile(fullPath, change.code);
                    break;

                case 'update':
                case 'modify':
                    await fs.writeFile(fullPath, change.code);
                    break;

                case 'delete':
                    await fs.unlink(fullPath);
                    break;

                default:
                    throw new Error(`Unknown operation: ${change.operation}`);
            }

            results.push({
                path: change.path,
                success: true,
                summary: change.summary
            });
        } catch (error) {
            results.push({
                path: change.path,
                success: false,
                error: error.message
            });
        }
    }

    return results;
});
