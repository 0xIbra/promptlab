import React from 'react';
import {
    FolderIcon,
    FunnelIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

function Toolbar({ onSelectFolder, onOpenFilters, onSelectAll, onUnselectAll }) {
    return (
        <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 p-2 flex items-center gap-2">
            {/* Left group */}
            <div className="flex items-center gap-1.5">
                <button
                    onClick={onSelectFolder}
                    className="p-1.5 hover:bg-gray-800/70 rounded-md transition-all duration-200 text-gray-400 hover:text-gray-200"
                    title="Open Folder"
                >
                    <FolderIcon className="w-5 h-5" />
                </button>

                <button
                    onClick={onOpenFilters}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-gray-800/70 rounded-md
                        transition-all duration-200 text-gray-400 hover:text-gray-200"
                    title="Manage Filters"
                >
                    <FunnelIcon className="w-5 h-5" />
                    <span className="text-sm">Filters</span>
                </button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-800/80 mx-1"></div>

            {/* Selection group with modern pill design */}
            <div className="flex bg-gray-800/30 rounded-lg p-0.5">
                <button
                    onClick={onSelectAll}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium
                        hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-200
                        text-gray-400 hover:shadow-sm"
                    title="Select All Files"
                >
                    <CheckCircleIcon className="w-4 h-4" />
                    Select All
                </button>
                <div className="w-px bg-gray-700/50 mx-0.5"></div>
                <button
                    onClick={onUnselectAll}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium
                        hover:bg-red-500/10 hover:text-red-400 transition-all duration-200
                        text-gray-400 hover:shadow-sm"
                    title="Unselect All Files"
                >
                    <XCircleIcon className="w-4 h-4" />
                    Clear
                </button>
            </div>
        </div>
    );
}

export default Toolbar;