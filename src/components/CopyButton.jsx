import React, { useState } from 'react';
import { ClipboardDocumentIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
const { ipcRenderer } = window.require('electron');

function CopyButton({ selectedFiles, instructions, activeTemplates }) {
    const [includeFileTree, setIncludeFileTree] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewContent, setPreviewContent] = useState('');

    const generatePrompt = async () => {
        const currentRepo = await ipcRenderer.invoke('load-global-settings')
            .then(settings => settings.lastOpenedRepo);

        if (!currentRepo) {
            throw new Error('No repository is currently open');
        }

        return await ipcRenderer.invoke('generate-prompt', {
            selectedFiles: selectedFiles.filter(f => f.selected),
            instructions,
            activeTemplates,
            currentRepo,
            includeFileTree
        });
    };

    const handleCopy = async () => {
        if (isCopying) return;

        setIsCopying(true);
        try {
            const prompt = await generatePrompt();
            await navigator.clipboard.writeText(prompt);
            setTimeout(() => setIsCopying(false), 1000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            setIsCopying(false);
        }
    };

    const handlePreview = async () => {
        try {
            const prompt = await generatePrompt();
            setPreviewContent(prompt);
            setShowPreview(true);
        } catch (error) {
            console.error('Error generating preview:', error);
        }
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/80
                    backdrop-blur-sm border border-gray-700/50">
                    <input
                        type="checkbox"
                        checked={includeFileTree}
                        onChange={(e) => setIncludeFileTree(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-600
                            focus:ring-blue-500 focus:ring-offset-gray-800"
                    />
                    <span className="text-sm text-gray-300">Include File Tree</span>
                </label>

                <button
                    onClick={handlePreview}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg
                        bg-gray-800/80 hover:bg-gray-700/80 text-gray-300
                        backdrop-blur-sm border border-gray-700/50
                        transition-all duration-200"
                >
                    <EyeIcon className="w-5 h-5" />
                    <span>Preview</span>
                </button>

                <button
                    onClick={handleCopy}
                    disabled={isCopying}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg
                        ${isCopying
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'}
                        shadow-lg shadow-blue-500/20 transition-all duration-200`}
                >
                    <ClipboardDocumentIcon className="w-5 h-5" />
                    <span>{isCopying ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-gradient-dark rounded-xl w-[800px] max-h-[80vh] shadow-2xl border border-gray-800/50 flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
                            <h2 className="text-lg font-medium bg-gradient-to-r from-gray-100 to-gray-300 text-transparent bg-clip-text">
                                Preview
                            </h2>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-1 hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <pre className="text-sm font-mono whitespace-pre-wrap text-gray-300">
                                {previewContent || 'Loading preview...'}
                            </pre>
                        </div>
                        <div className="p-4 border-t border-gray-800/50 flex justify-end gap-2">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-4 py-2 rounded-lg hover:bg-gray-800/50
                                    text-gray-300 transition-colors duration-200"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleCopy}
                                disabled={isCopying}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg
                                    ${isCopying
                                        ? 'bg-green-500/20 text-green-300'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'}
                                    transition-all duration-200`}
                            >
                                <ClipboardDocumentIcon className="w-5 h-5" />
                                <span>{isCopying ? 'Copied!' : 'Copy to Clipboard'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CopyButton;