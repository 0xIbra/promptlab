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

    // Uncomment for dev tools
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

ipcMain.handle('read-directory', async (event, folderPath) => {
    async function getAllFiles(dir) {
        const files = await fs.readdir(dir, { withFileTypes: true });
        const paths = [];

        for (const file of files) {
            if (file.name.startsWith('.') ||
                file.name === 'node_modules' ||
                file.name === 'dist') {
                continue;
            }

            const filePath = path.join(dir, file.name);

            if (file.isDirectory()) {
                paths.push(...await getAllFiles(filePath));
            } else {
                paths.push(path.relative(folderPath, filePath));
            }
        }

        return paths;
    }

    const files = await getAllFiles(folderPath);
    return files;
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
