import React, { useState } from 'react';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
const { ipcRenderer } = window.require('electron');

// Move generatePrompt outside components and properly accept parameters
const generatePrompt = async (selectedFiles, instructions, activeTemplates) => {
    try {
        // Get current repo path from global settings
        const settings = await ipcRenderer.invoke('load-global-settings');
        const currentRepo = settings.lastOpenedRepo;

        if (!currentRepo) {
            throw new Error('No repository is currently open');
        }

        // Generate prompt in main process
        return await ipcRenderer.invoke('generate-prompt', {
            selectedFiles,
            instructions,
            activeTemplates,
            currentRepo
        });
    } catch (error) {
        console.error('Error generating prompt:', error);
        throw error;
    }
};

function CopyButton({ selectedFiles, instructions, activeTemplates }) {
    const [showPreview, setShowPreview] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);

    const handleCopy = async () => {
        try {
            const prompt = await generatePrompt(selectedFiles, instructions, activeTemplates);
            if (prompt) {
                await navigator.clipboard.writeText(prompt);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (error) {
            setError(error.message);
        }
    };

    const handlePreview = async () => {
        setShowPreview(true);
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 flex items-center gap-2">
                <button
                    onClick={handlePreview}
                    className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700
                        text-gray-300 text-sm transition-all duration-200
                        border border-gray-700/50 hover:border-gray-600/50"
                >
                    Preview
                </button>

                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg
                        bg-gradient-button hover:shadow-lg hover:shadow-blue-500/20
                        transition-all duration-200"
                >
                    <ClipboardDocumentIcon className="w-5 h-5" />
                    <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gradient-dark rounded-xl w-[800px] max-h-[80vh] shadow-2xl border border-gray-800/50 flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
                            <h2 className="text-lg font-medium">Preview</h2>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-1 hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <PreviewContent
                                selectedFiles={selectedFiles}
                                instructions={instructions}
                                activeTemplates={activeTemplates}
                            />
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
                                className="flex items-center gap-2 px-4 py-2 rounded-lg
                                    bg-gradient-button hover:shadow-lg hover:shadow-blue-500/20
                                    transition-all duration-200"
                            >
                                <ClipboardDocumentIcon className="w-5 h-5" />
                                <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function PreviewContent({ selectedFiles, instructions, activeTemplates }) {
    const [content, setContent] = useState('Loading preview...');
    const [error, setError] = useState(null);

    React.useEffect(() => {
        const loadPreview = async () => {
            try {
                const prompt = await generatePrompt(selectedFiles, instructions, activeTemplates);
                if (prompt) {
                    setContent(prompt);
                    setError(null);
                }
            } catch (error) {
                console.error('Error loading preview:', error);
                setError('Error loading preview. Please try again.');
                setContent('');
            }
        };

        loadPreview();
    }, [selectedFiles, instructions, activeTemplates]);

    if (error) {
        return (
            <div className="text-red-400 text-sm">
                {error}
            </div>
        );
    }

    return (
        <pre className="text-sm font-mono whitespace-pre-wrap text-gray-300">
            {content}
        </pre>
    );
}

export default CopyButton;