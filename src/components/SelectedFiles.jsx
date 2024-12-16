import React from 'react';
import { DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

function SelectedFiles({ files }) {
    const totalTokens = files.reduce((sum, file) => sum + (file.tokens || 0), 0);

    return (
        <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-400">Selected Files</div>
                <div className="text-sm text-gray-400">~{totalTokens} Tokens</div>
            </div>
            <div className="space-y-2">
                {files.map((file) => (
                    <div key={file.path} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                        <div className="flex items-center gap-2">
                            <DocumentIcon className="w-4 h-4" />
                            <span className="text-sm">{file.path}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                            {file.tokens || 0} tokens
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SelectedFiles;