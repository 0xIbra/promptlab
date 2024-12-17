import React, { useState } from 'react';
import { FolderIcon, DocumentIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const formatTokenCount = (count) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) {
        return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
};

function FileTree({ files, currentPath, onFileSelect, onFileView }) {
    console.log('FileTree received:', {
        filesType: typeof files,
        isArray: Array.isArray(files),
        filesLength: files?.length,
        files,
        currentPath
    });

    // Early return if no files
    if (!files || files.length === 0) {
        return (
            <div className="p-4 text-gray-500 text-sm">
                No files available ({typeof files}, {Array.isArray(files) ? 'is array' : 'not array'})
            </div>
        );
    }

    console.log('FileTree render:', { files, currentPath });
    const [expandedFolders, setExpandedFolders] = useState(new Set());

    const toggleFolder = (path) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) {
                newSet.delete(path);
            } else {
                newSet.add(path);
            }
            return newSet;
        });
    };

    const getAllFilesInFolder = (path) => {
        return files.filter(f =>
            f.path.startsWith(path + '/') || f.path === path
        );
    };

    const handleSelect = (path, node, isFolder) => {
        if (isFolder) {
            const folderFiles = getAllFilesInFolder(path);
            const shouldSelect = !isFullySelected(node);
            folderFiles.forEach(file => {
                if (file.isText) {
                    onFileSelect({ path: file.path }, shouldSelect);
                }
            });
        } else {
            onFileSelect({ path });
        }
    };

    const isPartiallySelected = (node) => {
        if (node.isFile) {
            return false;
        }

        const allFiles = Object.values(node.children).flatMap(child =>
            child.isFile ? [child] : Object.values(child.children)
        );

        if (allFiles.length === 0) return false;

        const selectedCount = allFiles.filter(file => file.selected).length;
        return selectedCount > 0 && selectedCount < allFiles.length;
    };

    const isFullySelected = (node) => {
        if (node.isFile) {
            return node.selected;
        }

        const allFiles = Object.values(node.children).flatMap(child =>
            child.isFile ? [child] : Object.values(child.children)
        );

        if (allFiles.length === 0) return false;

        return allFiles.every(file => file.selected);
    };

    const buildTree = (paths, files) => {
        const tree = {};
        paths.forEach(file => {
            const parts = file.path.split('/');
            let current = tree;
            parts.forEach((part, i) => {
                const pathSoFar = parts.slice(0, i + 1).join('/');
                if (!current[part]) {
                    current[part] = {
                        isFile: i === parts.length - 1,
                        children: {},
                        selected: files.find(f => f.path === pathSoFar)?.selected || false,
                        tokens: files.find(f => f.path === pathSoFar)?.tokens || 0
                    };
                }
                current = current[part].children;
            });
        });
        return tree;
    };

    const renderTree = (node, path = '', level = 0) => {
        const entries = Object.entries(node);
        const folders = entries.filter(([_, data]) => !data.isFile);
        const fileEntries = entries.filter(([_, data]) => data.isFile);

        folders.sort(([a], [b]) => a.localeCompare(b));
        fileEntries.sort(([a], [b]) => a.localeCompare(b));

        const sortedEntries = [...folders, ...fileEntries];

        return sortedEntries.map(([name, data]) => {
            const fullPath = path + name;
            const isExpanded = expandedFolders.has(fullPath);
            const isFolder = !data.isFile;

            const fileEntry = files.find(f => f.path === fullPath);
            const isSelected = isFolder
                ? isFullySelected(data)
                : Boolean(fileEntry?.selected);

            const isPartial = isFolder && isPartiallySelected(data);
            const isTextFile = fileEntry?.isText;

            return (
                <div key={fullPath} style={{ paddingLeft: `${level * 20}px` }}>
                    <div
                        className={`flex items-center gap-2 py-2 px-3 rounded-lg
                            transition-all duration-200 group
                            ${isSelected ? 'bg-blue-500/20 text-blue-100' : 'hover:bg-gray-800/50'}
                            ${isFolder ? 'hover:bg-gray-800/30' : ''}
                            ${!isFolder && !isTextFile ? 'opacity-50' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-[18px] h-[18px] border rounded-md flex items-center justify-center
                                    transition-all duration-200 cursor-pointer
                                    ${isSelected
                                        ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/30'
                                        : isPartial
                                            ? 'border-blue-500/50'
                                            : 'border-gray-600/50 group-hover:border-blue-500/50'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isFolder || isTextFile) {
                                        handleSelect(fullPath, data, isFolder);
                                    }
                                }}
                            >
                                {isSelected && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {isPartial && (
                                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />
                                )}
                            </div>
                        </div>

                        <div
                            className={`flex items-center min-w-0 flex-1 ${!isFolder && !isTextFile ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            onClick={() => {
                                if (isFolder) {
                                    toggleFolder(fullPath);
                                } else if (isTextFile) {
                                    onFileView(fullPath);
                                }
                            }}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {isFolder && (
                                    <ChevronRightIcon
                                        className={`w-5 h-5 flex-shrink-0 transition-transform ${
                                            isExpanded ? 'transform rotate-90' : ''
                                        }`}
                                    />
                                )}
                                {isFolder ? (
                                    <FolderIcon className="w-5 h-5 flex-shrink-0 text-gray-400" />
                                ) : (
                                    <DocumentIcon className="w-5 h-5 flex-shrink-0 text-gray-400" />
                                )}
                                <span className="text-sm text-gray-300 truncate">{name}</span>
                            </div>
                        </div>

                        {!isFolder && (
                            <div className="flex-shrink-0 flex items-center gap-2">
                                {!isTextFile ? (
                                    <span className="text-[11px] text-gray-500">(binary)</span>
                                ) : data.tokens > 0 && (
                                    <div className="px-2 py-0.5 rounded-full bg-gray-800/50 border border-gray-700/50">
                                        <span className="text-[11px] text-gray-400">
                                            {formatTokenCount(data.tokens)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {isFolder && isExpanded && (
                        renderTree(data.children, fullPath + '/', level + 1)
                    )}
                </div>
            );
        });
    };

    const tree = buildTree(files, files);

    return (
        <div className="p-2">
            <div className="text-sm text-gray-400 px-2 py-1">Repository</div>
            {renderTree(tree)}
        </div>
    );
}

export default FileTree;