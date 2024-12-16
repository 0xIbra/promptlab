import React, { useMemo } from 'react';
import { DocumentIcon, FolderIcon } from '@heroicons/react/24/outline';

function SelectedFiles({ files }) {
    const totalTokens = files.reduce((sum, file) => sum + (file.tokens || 0), 0);

    // Group files by their parent directory
    const groupedFiles = useMemo(() => {
        const groups = {};

        files.forEach(file => {
            const parts = file.path.split('/');
            const parentDir = parts.length > 1 ? parts[0] : '';

            if (!groups[parentDir]) {
                groups[parentDir] = [];
            }
            groups[parentDir].push(file);
        });

        return groups;
    }, [files]);

    return (
        <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-400">Selected Files</div>
                <div className="text-sm text-gray-400">~{totalTokens.toLocaleString()} Tokens</div>
            </div>

            <div className="space-y-4">
                {Object.entries(groupedFiles).map(([group, groupFiles]) => (
                    <div key={group || 'root'} className="space-y-2">
                        {/* Show group name if files are in a directory */}
                        {group && (
                            <div className="flex items-center gap-2 text-sm text-gray-400 pl-1">
                                <FolderIcon className="w-4 h-4" />
                                <span>{group}</span>
                                <span className="text-gray-600">
                                    (~{groupFiles.reduce((sum, f) => sum + (f.tokens || 0), 0).toLocaleString()} tokens)
                                </span>
                            </div>
                        )}

                        {/* Grid of files */}
                        <div className="grid grid-cols-3 gap-2">
                            {groupFiles.map((file) => {
                                const fileName = file.path.split('/').pop();

                                return (
                                    <div
                                        key={file.path}
                                        className="flex items-center justify-between bg-gray-800/50 hover:bg-gray-800
                                            p-2 rounded-md transition-colors duration-200"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <DocumentIcon className="w-4 h-4 flex-shrink-0 text-gray-400" />
                                            <span className="text-sm truncate" title={fileName}>
                                                {fileName}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 flex-shrink-0">
                                            {file.tokens?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SelectedFiles;