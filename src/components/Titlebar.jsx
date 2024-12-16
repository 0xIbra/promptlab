import React from 'react';
import { XMarkIcon, MinusIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

function Titlebar() {
    const electron = window.require('electron');

    const handleClose = () => {
        window.close();
    };

    const handleMinimize = () => {
        const remote = window.require('@electron/remote');
        const window = remote.getCurrentWindow();
        window.minimize();
    };

    const handleMaximize = () => {
        const remote = window.require('@electron/remote');
        const window = remote.getCurrentWindow();
        if (window.isMaximized()) {
            window.unmaximize();
        } else {
            window.maximize();
        }
    };

    return (
        <div className="h-10 bg-gray-900 flex items-center justify-between px-4 select-none draggable relative">
            <div className="w-24" />

            <div className="absolute left-1/2 transform -translate-x-1/2 text-sm text-gray-400">
                Repo Prompt
            </div>

            <div className="flex items-center space-x-4 z-10">
                <button
                    onClick={handleMinimize}
                    className="hover:bg-gray-700 p-1 rounded"
                >
                    <MinusIcon className="w-4 h-4" />
                </button>

                <button
                    onClick={handleMaximize}
                    className="hover:bg-gray-700 p-1 rounded"
                >
                    <ArrowsPointingOutIcon className="w-4 h-4" />
                </button>

                <button
                    onClick={handleClose}
                    className="hover:bg-red-600 p-1 rounded"
                >
                    <XMarkIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default Titlebar;