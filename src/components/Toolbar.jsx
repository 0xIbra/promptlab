import React from 'react';
import {
    FolderIcon,
    FunnelIcon,
    CheckCircleIcon,
    XCircleIcon,
    DocumentTextIcon,
    DocumentIcon
} from '@heroicons/react/24/outline';

function Toolbar({
    onSelectFolder,
    onOpenFilters,
    onSelectAll,
    onUnselectAll,
    activeTab,
    onTabChange
}) {
    return (
        <div className="bg-gradient-toolbar border-b border-gray-800/50 p-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
                <button
                    onClick={onSelectFolder}
                    className="button-primary flex items-center gap-2"
                >
                    <FolderIcon className="w-5 h-5" />
                    <span>Open Folder</span>
                </button>

                <button
                    onClick={onOpenFilters}
                    className="button-secondary flex items-center gap-2"
                >
                    <FunnelIcon className="w-5 h-5" />
                    <span>Filters</span>
                </button>
            </div>

            <div className="h-6 w-px bg-gray-700/30"></div>

            <div className="glass-effect rounded-lg p-1 flex gap-1">
                <button
                    onClick={onSelectAll}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md
                        hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-200"
                >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Select All</span>
                </button>

                <button
                    onClick={onUnselectAll}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md
                        hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                >
                    <XCircleIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Clear</span>
                </button>
            </div>

            <div className="h-6 w-px bg-gray-700/30 ml-auto"></div>

            <div className="glass-effect rounded-lg p-1 flex gap-1">
                <button
                    onClick={() => onTabChange('instructions')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md
                        transition-all duration-200
                        ${activeTab === 'instructions'
                            ? 'bg-blue-500/20 text-blue-100'
                            : 'hover:bg-gray-800/50'}`}
                >
                    <DocumentTextIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Instructions</span>
                </button>

                <button
                    onClick={() => onTabChange('fileViewer')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md
                        transition-all duration-200
                        ${activeTab === 'fileViewer'
                            ? 'bg-blue-500/20 text-blue-100'
                            : 'hover:bg-gray-800/50'}`}
                >
                    <DocumentIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">File Viewer</span>
                </button>
            </div>
        </div>
    );
}

export default Toolbar;