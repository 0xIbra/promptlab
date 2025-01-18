import React, { useState, useEffect } from 'react';
import { XMarkIcon, MinusIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';

function Titlebar() {
    const [isMaximized, setIsMaximized] = useState(false);
    const [windowControls, setWindowControls] = useState(null);
    const [isMac, setIsMac] = useState(false);

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

            // Initial state
            updateMaximizedState();

            return () => {
                win.removeAllListeners('maximize');
                win.removeAllListeners('unmaximize');
            };
        } catch (error) {
            console.error('Failed to initialize window controls:', error);
        }
    }, []);

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

            <div className="absolute left-1/2 transform -translate-x-1/2 text-sm text-gray-400">
                PromptLab
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