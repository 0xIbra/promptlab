import React, { useState, useEffect } from 'react';
import { XMarkIcon, MinusIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
const { version } = require('../../package.json');
const { ipcRenderer, shell } = window.require('electron');

function Titlebar() {
    const [isMaximized, setIsMaximized] = useState(false);
    const [windowControls, setWindowControls] = useState(null);
    const [isMac, setIsMac] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(null);

    useEffect(() => {
        try {
            const remote = window.require('@electron/remote');
            const win = remote.getCurrentWindow();
            setWindowControls({ remote, window: win });
            setIsMac(process.platform === 'darwin');

            const updateMaximizedState = () => {
                setIsMaximized(win.isMaximized());
            };

            win.on('maximize', () => setIsMaximized(true));
            win.on('unmaximize', () => setIsMaximized(false));

            // Listen for update notifications
            const updateHandler = (_, info) => {
                console.log('Update available:', info);
                if (info && info.version) {
                    // Only show update if it's newer than current version
                    const currentParts = version.split('.').map(Number);
                    const newParts = info.version.split('.').map(Number);

                    for (let i = 0; i < 3; i++) {
                        if ((newParts[i] || 0) > (currentParts[i] || 0)) {
                            setUpdateAvailable(info);
                            break;
                        } else if ((newParts[i] || 0) < (currentParts[i] || 0)) {
                            break;
                        }
                    }
                }
            };

            ipcRenderer.on('update-available', updateHandler);

            // Initial state
            updateMaximizedState();

            return () => {
                win.removeAllListeners('maximize');
                win.removeAllListeners('unmaximize');
                ipcRenderer.removeListener('update-available', updateHandler);
            };
        } catch (error) {
            console.error('Failed to initialize window controls:', error);
        }
    }, []);

    const handleUpdateClick = () => {
        if (updateAvailable) {
            shell.openExternal(`https://github.com/0xIbra/promptlab/releases/tag/v${updateAvailable.version}`);
        }
    };

    const handleClose = () => {
        if (windowControls) {
            windowControls.window.close();
        }
    };

    const handleMinimize = () => {
        if (windowControls) {
            windowControls.window.minimize();
        }
    };

    const handleMaximize = () => {
        if (windowControls) {
            if (isMaximized) {
                windowControls.window.unmaximize();
            } else {
                windowControls.window.maximize();
            }
        }
    };

    return (
        <div className="h-10 bg-gray-900 flex items-center justify-between select-none draggable relative">
            {isMac ? (
                // macOS style controls
                <div className="flex items-center pl-2 gap-1.5 z-10">
                    <button
                        onClick={handleClose}
                        className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/90 flex items-center justify-center group transition-colors duration-200"
                        title="Close"
                    >
                        <XMarkIcon className="w-2 h-2 text-[#ff5f57]/30 opacity-0 group-hover:opacity-100" />
                    </button>
                    <button
                        onClick={handleMinimize}
                        className="w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#febc2e]/90 flex items-center justify-center group transition-colors duration-200"
                        title="Minimize"
                    >
                        <MinusIcon className="w-2 h-2 text-[#febc2e]/30 opacity-0 group-hover:opacity-100" />
                    </button>
                    <button
                        onClick={handleMaximize}
                        className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#28c840]/90 flex items-center justify-center group transition-colors duration-200"
                        title={isMaximized ? "Restore" : "Maximize"}
                    >
                        {isMaximized ? (
                            <ArrowsPointingInIcon className="w-2 h-2 text-[#28c840]/30 opacity-0 group-hover:opacity-100" />
                        ) : (
                            <ArrowsPointingOutIcon className="w-2 h-2 text-[#28c840]/30 opacity-0 group-hover:opacity-100" />
                        )}
                    </button>
                </div>
            ) : (
                // Windows/Linux style controls
                <div className="w-24" />
            )}

            <div className="absolute left-1/2 transform -translate-x-1/2 text-sm text-gray-400 flex items-center gap-2">
                <span>PromptLab</span>
                <span className="text-xs text-gray-500">v{version}</span>
                {updateAvailable && (
                    <button
                        onClick={handleUpdateClick}
                        className="ml-2 px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/30 transition-colors duration-200 flex items-center gap-1.5"
                        title={`Version ${updateAvailable.version} available\n${updateAvailable.releaseNotes || ''}`}
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        v{updateAvailable.version} Available
                    </button>
                )}
            </div>

            {!isMac && (
                <div className="flex items-center z-10">
                    <button
                        onClick={handleMinimize}
                        className="hover:bg-gray-700 w-12 h-10 flex items-center justify-center transition-colors duration-200"
                        title="Minimize"
                    >
                        <MinusIcon className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleMaximize}
                        className="hover:bg-gray-700 w-12 h-10 flex items-center justify-center transition-colors duration-200"
                        title={isMaximized ? "Restore" : "Maximize"}
                    >
                        {isMaximized ? (
                            <ArrowsPointingInIcon className="w-4 h-4" />
                        ) : (
                            <ArrowsPointingOutIcon className="w-4 h-4" />
                        )}
                    </button>

                    <button
                        onClick={handleClose}
                        className="hover:bg-red-600 w-12 h-10 flex items-center justify-center transition-colors duration-200"
                        title="Close"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

export default Titlebar;