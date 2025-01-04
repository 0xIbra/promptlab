import React, { useState, useEffect } from 'react';
import { XMarkIcon, MinusIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';

function Titlebar() {
    const [isMaximized, setIsMaximized] = useState(false);
    const [windowControls, setWindowControls] = useState(null);

    useEffect(() => {
        try {
            const remote = window.require('@electron/remote');
            const win = remote.getCurrentWindow();
            setWindowControls({ remote, window: win });

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
        <div className="h-10 bg-gray-900 flex items-center justify-between pl-4 select-none draggable relative">
            <div className="w-24" />

            <div className="absolute left-1/2 transform -translate-x-1/2 text-sm text-gray-400">
                PromptLab
            </div>

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
        </div>
    );
}

export default Titlebar;