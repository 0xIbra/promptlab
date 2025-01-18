import React from 'react';
import {
    DocumentTextIcon,
    ClockIcon,
    CommandLineIcon,
    CpuChipIcon
} from '@heroicons/react/24/outline';

function StatusBar({ stats, onCommandPalette }) {
    return (
        <div className="h-8 bg-gradient-dark border-t border-gray-800/50 flex items-center justify-between px-4 text-xs">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                    <DocumentTextIcon className="w-3.5 h-3.5" />
                    <span>{stats.selectedFiles} files selected</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    <CpuChipIcon className="w-3.5 h-3.5" />
                    <span>~{stats.totalTokens.toLocaleString()} tokens</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    <ClockIcon className="w-3.5 h-3.5" />
                    <span>Last saved {stats.lastSaved}</span>
                </div>
            </div>

            <button
                onClick={onCommandPalette}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-800/50
                    text-gray-400 hover:text-gray-300 transition-colors duration-200"
            >
                <CommandLineIcon className="w-3.5 h-3.5" />
                <span>Command Palette</span>
                <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-gray-800/50 border border-gray-700/50">
                    ⌘K
                </kbd>
            </button>
        </div>
    );
}

export default StatusBar;