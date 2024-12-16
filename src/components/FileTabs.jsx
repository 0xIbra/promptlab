import React from 'react';
import { FolderIcon, ListBulletIcon } from '@heroicons/react/24/outline';

function FileTabs({ activeTab, onTabChange }) {
    return (
        <div className="flex border-b border-gray-800">
            <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium
                    ${activeTab === 'tree'
                        ? 'text-blue-500 border-b-2 border-blue-500'
                        : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => onTabChange('tree')}
            >
                <FolderIcon className="w-4 h-4" />
                Tree View
            </button>
            <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium
                    ${activeTab === 'list'
                        ? 'text-blue-500 border-b-2 border-blue-500'
                        : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => onTabChange('list')}
            >
                <ListBulletIcon className="w-4 h-4" />
                List View
            </button>
        </div>
    );
}

export default FileTabs;