import React, { useState, useEffect } from 'react';
import { XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gradient-dark rounded-xl w-[600px] shadow-2xl border border-gray-800/50">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
                    <div className="flex items-center gap-2">
                        <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-medium bg-gradient-to-r from-gray-100 to-gray-300 text-transparent bg-clip-text">
                            Folder Filters
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-400">
                                Filter files in the selected folder. Uses .gitignore syntax.
                            </p>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/30 border border-gray-700/50">
                                <span className="text-sm text-gray-400">Selected Folder:</span>
                                <span className="text-sm text-gray-300 font-medium">{currentPath}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <textarea
                                value={filters}
                                onChange={(e) => setFilters(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={`# Temp files\n**/tmp\n**/temp\n\n# Project specific\n**/node_modules\n**/dist`}
                                className="w-full h-64 bg-gray-900/50 p-4 rounded-lg text-sm font-mono
                                    resize-none border border-gray-700/50 placeholder-gray-600
                                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                                    transition-all duration-200"
                            />
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <kbd className="px-2 py-1 rounded-md bg-gray-800/50 border border-gray-700/50">
                                    Ctrl
                                </kbd>
                                <span>+</span>
                                <kbd className="px-2 py-1 rounded-md bg-gray-800/50 border border-gray-700/50">
                                    Enter
                                </kbd>
                                <span>to save and close</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t border-gray-800/50">
                    <button
                        onClick={onClose}
                        className="button-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="button-primary"
                    >
                        Save Filters
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FilterModal;