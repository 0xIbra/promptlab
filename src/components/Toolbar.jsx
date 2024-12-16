import React from 'react';
import { FolderIcon, ArrowsUpDownIcon, FunnelIcon } from '@heroicons/react/24/outline';

function Toolbar({ onSelectFolder }) {
    return (
        <div className="bg-gray-900 border-b border-gray-800 p-2 flex items-center gap-2">
            <button
                onClick={onSelectFolder}
                className="p-2 hover:bg-gray-800 rounded-md transition-colors"
            >
                <FolderIcon className="w-5 h-5" />
            </button>

            <button className="p-2 hover:bg-gray-800 rounded-md transition-colors">
                <ArrowsUpDownIcon className="w-5 h-5" />
            </button>

            <button className="p-2 hover:bg-gray-800 rounded-md transition-colors">
                <FunnelIcon className="w-5 h-5" />
            </button>

            <button className="text-sm px-3 py-1 hover:bg-gray-800 rounded-md transition-colors">
                Clear
            </button>
        </div>
    );
}

export default Toolbar;