import React from 'react';
import { FolderOpenIcon } from '@heroicons/react/24/outline';

function Toolbar({ onSelectFolder }) {
    return (
        <div className="border-b border-gray-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={onSelectFolder}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
                >
                    <FolderOpenIcon className="w-4 h-4" />
                    Select Folder
                </button>
            </div>

            <div className="flex items-center gap-4">
                <button
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-sm"
                    onClick={() => {/* TODO: Implement copy to clipboard */}}
                >
                    Copy to Clipboard
                </button>
            </div>
        </div>
    );
}

export default Toolbar;