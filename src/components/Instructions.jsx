import React from 'react';
import { DocumentIcon } from '@heroicons/react/24/outline';

function Instructions({ value, onChange, activeTab, onTabChange, selectedFile, fileContent }) {
    return (
        <div className="border-b border-gray-800">
            <div className="flex border-b border-gray-800 bg-gradient-sidebar">
                <button
                    onClick={() => onTabChange('instructions')}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-200
                        ${activeTab === 'instructions'
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-gray-400 hover:text-gray-300'}`}
                >
                    Instructions
                </button>
                <button
                    onClick={() => onTabChange('fileViewer')}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-200
                        ${activeTab === 'fileViewer'
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-gray-400 hover:text-gray-300'}`}
                >
                    File Viewer
                </button>
            </div>

            {activeTab === 'instructions' ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Enter your instructions here..."
                    className="w-full h-64 bg-transparent p-4 text-sm resize-none focus:outline-none"
                />
            ) : (
                <div className="h-64 overflow-auto">
                    {selectedFile ? (
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
                                <DocumentIcon className="w-4 h-4" />
                                <span>{selectedFile}</span>
                            </div>
                            <pre className="font-mono text-sm whitespace-pre-wrap text-gray-300 bg-gray-800/30 p-4 rounded-lg">
                                {fileContent || 'Loading...'}
                            </pre>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-sm text-gray-500">
                            Select a file to view its contents
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Instructions;