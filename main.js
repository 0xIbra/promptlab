const { app, BrowserWindow, ipcMain, dialog } = require('electron');
require('@electron/remote/main').initialize();
const path = require('path');
const fs = require('fs').promises;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        backgroundColor: '#111827',
        frame: false,
        transparent: process.platform !== 'linux'
    });

    require('@electron/remote/main').enable(win.webContents);
    win.loadFile('index.html');

    // Enable dev tools
    // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

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
    'Thumbs.db'
];

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
                            paths.push(relativePath);
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
