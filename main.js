const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        backgroundColor: '#111827', // Dark background
        titleBarStyle: 'hiddenInset'
    });

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
    const glob = require('glob');
    const files = await glob('**/*', {
        cwd: folderPath,
        nodir: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**']
    });
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
