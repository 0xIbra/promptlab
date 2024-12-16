import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

function FilterModal({ isOpen, onClose, currentPath, onSave, initialFilters = [] }) {
    const [filters, setFilters] = useState(initialFilters.join('\n'));

    const handleSave = () => {
        const filterList = filters
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));
        onSave(filterList);
        onClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSave();
        }
    };

    useEffect(() => {
        if (isOpen) {
            setFilters(initialFilters.join('\n'));
        }
    }, [isOpen, initialFilters]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg w-[600px] shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-lg">Folder Filter</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-800 rounded"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    <p className="text-sm text-gray-400 mb-2">
                        Filter files in the selected folder. Filter uses the same syntax as .gitignore.
                        Saving a filter will store a .repo_ignore file in the root of the selected folder
                    </p>

                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-400">Selected Folder:</span>
                            <span className="text-sm text-gray-300">{currentPath}</span>
                        </div>
                    </div>

                    <textarea
                        value={filters}
                        onChange={(e) => setFilters(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`# Temp files\n**/tmp\n**/temp\n\n# Project specific\n**/node_modules\n**/dist`}
                        className="w-full h-64 bg-gray-800 p-3 rounded text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="mt-2 text-xs text-gray-500">
                        Press Ctrl+Enter to save and close
                    </div>
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-gray-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 rounded"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FilterModal;