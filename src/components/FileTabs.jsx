import React from 'react';
import { FolderIcon, ListBulletIcon } from '@heroicons/react/24/outline';

function FileTabs({ activeTab, onTabChange }) {
    return (
        <div className="flex border-b border-gray-800/50 bg-gradient-sidebar p-2">
            <div className="flex gap-1 p-1 bg-gray-900/30 rounded-lg">
                <button
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                        transition-all duration-200
                        ${activeTab === 'tree'
                            ? 'bg-blue-500/20 text-blue-100 shadow-sm shadow-blue-500/30'
                            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'}`}
                    onClick={() => onTabChange('tree')}
                >
                    <FolderIcon className="w-4 h-4" />
                    Tree View
                </button>
                <button
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                        transition-all duration-200
                        ${activeTab === 'list'
                            ? 'bg-blue-500/20 text-blue-100 shadow-sm shadow-blue-500/30'
                            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'}`}
                    onClick={() => onTabChange('list')}
                >
                    <ListBulletIcon className="w-4 h-4" />
                    List View
                </button>
            </div>
        </div>
    );
}

export default FileTabs;