import React, { useMemo } from 'react';
import { DocumentIcon, FolderIcon } from '@heroicons/react/24/outline';

function SelectedFiles({ files }) {
    const totalTokens = files.reduce((sum, file) => sum + (file.tokens || 0), 0);

    // Group and sort files
    const { folderGroups, rootFiles } = useMemo(() => {
        const groups = {};
        const root = [];

        // First separate files into folders and root
        files.forEach(file => {
            const parts = file.path.split('/');
            if (parts.length > 1) {
                const parentDir = parts[0];
                if (!groups[parentDir]) {
                    groups[parentDir] = [];
                }
                groups[parentDir].push(file);
            } else {
                root.push(file);
            }
        });

        // Sort files within each folder
        Object.values(groups).forEach(groupFiles => {
            groupFiles.sort((a, b) => a.path.localeCompare(b.path));
        });

        // Sort folders alphabetically
        const sortedGroups = Object.fromEntries(
            Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
        );

        // Sort root files
        root.sort((a, b) => a.path.localeCompare(b.path));

        return {
            folderGroups: sortedGroups,
            rootFiles: root
        };
    }, [files]);

    return (
        <div className="p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-medium text-gray-300">Selected Files</div>
                <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm">
                    ~{totalTokens.toLocaleString()} Tokens
                </div>
            </div>

            <div className="space-y-4">
                {Object.entries(folderGroups).map(([group, groupFiles]) => (
                    <div key={group} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400 pl-1">
                            <FolderIcon className="w-4 h-4" />
                            <span>{group}</span>
                            <span className="text-gray-500">
                                (~{groupFiles.reduce((sum, f) => sum + (f.tokens || 0), 0).toLocaleString()} tokens)
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {groupFiles.map((file) => {
                                const fileName = file.path.split('/').pop();
                                return (
                                    <div
                                        key={file.path}
                                        className="file-card p-3"
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

                {/* Render root files after folders */}
                {rootFiles.length > 0 && (
                    <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                            {rootFiles.map((file) => (
                                <div
                                    key={file.path}
                                    className="flex items-center justify-between bg-gray-800/50 hover:bg-gray-800
                                        p-2 rounded-md transition-colors duration-200"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <DocumentIcon className="w-4 h-4 flex-shrink-0 text-gray-400" />
                                        <span className="text-sm truncate" title={file.path}>
                                            {file.path}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 flex-shrink-0">
                                        {file.tokens?.toLocaleString() || 0}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SelectedFiles;