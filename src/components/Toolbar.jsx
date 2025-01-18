import React from 'react';
import {
    FunnelIcon,
    CheckCircleIcon,
    XCircleIcon,
    DocumentTextIcon,
    DocumentIcon,
    CodeBracketIcon,
    Bars3Icon
} from '@heroicons/react/24/outline';

function Toolbar({
    onOpenFilters,
    onSelectAll,
    onUnselectAll,
    activeTab,
    onTabChange,
    onOpenChanges
}) {
    return (
        <div className="h-12 bg-gradient-toolbar flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
                <div className="glass-effect rounded-lg p-1 flex gap-1">
                    <button
                        onClick={() => onTabChange('instructions')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                            transition-all duration-200
                            ${activeTab === 'instructions'
                                ? 'bg-indigo-500/20 text-indigo-100 shadow-lg shadow-indigo-500/20'
                                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'}`}
                    >
                        <DocumentTextIcon className="w-4 h-4" />
                        Instructions
                    </button>
                    <button
                        onClick={() => onTabChange('fileViewer')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                            transition-all duration-200
                            ${activeTab === 'fileViewer'
                                ? 'bg-indigo-500/20 text-indigo-100 shadow-lg shadow-indigo-500/20'
                                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'}`}
                    >
                        <DocumentIcon className="w-4 h-4" />
                        File Viewer
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="glass-effect rounded-lg p-1 flex gap-1">
                    <button
                        onClick={onSelectAll}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                            text-gray-400 hover:text-gray-300 hover:bg-gray-800/50
                            transition-all duration-200"
                        title="Select All (⌘A)"
                    >
                        <CheckCircleIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Select All</span>
                    </button>
                    <button
                        onClick={onUnselectAll}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                            text-gray-400 hover:text-gray-300 hover:bg-gray-800/50
                            transition-all duration-200"
                        title="Clear Selection (⌘⇧A)"
                    >
                        <XCircleIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Clear</span>
                    </button>
                </div>

                <div className="glass-effect rounded-lg p-1 flex gap-1">
                    <button
                        onClick={onOpenFilters}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                            text-gray-400 hover:text-gray-300 hover:bg-gray-800/50
                            transition-all duration-200"
                        title="Manage Filters (⌘F)"
                    >
                        <FunnelIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Filters</span>
                    </button>
                    <button
                        onClick={onOpenChanges}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                            text-gray-400 hover:text-gray-300 hover:bg-gray-800/50
                            transition-all duration-200"
                        title="Apply Changes (⌘⇧C)"
                    >
                        <CodeBracketIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Changes</span>
                    </button>
                </div>

                <button
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-300
                        hover:bg-gray-800/50 transition-all duration-200 sm:hidden"
                >
                    <Bars3Icon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

export default Toolbar;