import React, { useState } from 'react';
import { XMarkIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { codeChanges } from '../services/codeChanges';

function CodeChangesModal({ isOpen, onClose }) {
    const [xmlInput, setXmlInput] = useState('');
    const [results, setResults] = useState(null);
    const [isApplying, setIsApplying] = useState(false);

    const handleApplyChanges = async () => {
        if (!xmlInput.trim()) return;

        setIsApplying(true);
        try {
            const results = await codeChanges.applyChanges(xmlInput);
            setResults(results);
        } catch (error) {
            setResults([{
                success: false,
                error: error.message
            }]);
        } finally {
            setIsApplying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gradient-dark rounded-xl w-[800px] max-h-[80vh] shadow-2xl border border-gray-800/50 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
                    <div className="flex items-center gap-2">
                        <CodeBracketIcon className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-medium bg-gradient-to-r from-gray-100 to-gray-300 text-transparent bg-clip-text">
                            Apply Code Changes
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Paste XML Response</label>
                        <textarea
                            value={xmlInput}
                            onChange={(e) => setXmlInput(e.target.value)}
                            placeholder="<code_changes>...</code_changes>"
                            className="w-full h-48 bg-gray-900/50 p-4 rounded-lg text-sm font-mono
                                resize-none border border-gray-700/50 placeholder-gray-600
                                focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>

                    {results && (
                        <div className="space-y-2">
                            <div className="text-sm text-gray-400">Results</div>
                            <div className="space-y-2">
                                {results.map((result, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg border ${
                                            result.success
                                                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                                                : 'bg-red-500/10 border-red-500/30 text-red-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                {result.path || 'Error'}
                                            </span>
                                            <span className="text-xs">
                                                {result.success ? 'Success' : 'Failed'}
                                            </span>
                                        </div>
                                        <div className="text-xs mt-1 opacity-80">
                                            {result.success ? result.summary : result.error}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-800/50 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg hover:bg-gray-800/50
                            text-gray-300 transition-colors duration-200"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleApplyChanges}
                        disabled={isApplying || !xmlInput.trim()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg
                            ${isApplying
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'}
                            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isApplying ? (
                            <>
                                <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                                <span>Applying...</span>
                            </>
                        ) : (
                            <>
                                <CodeBracketIcon className="w-5 h-5" />
                                <span>Apply Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CodeChangesModal;