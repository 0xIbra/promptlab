import React, { useState, useMemo } from 'react';
import { FolderIcon, DocumentIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const formatTokenCount = (count) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) {
        return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
};

function FileTree({ files, currentPath, onFileSelect, onFileView }) {
    // Early return if no files
    if (!files || files.length === 0) {
        return (
            <div className="p-4 text-gray-500 text-sm">
                No files available ({typeof files}, {Array.isArray(files) ? 'is array' : 'not array'})
            </div>
        );
    }

    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [previousExpandedState, setPreviousExpandedState] = useState(null);

    const filteredFiles = useMemo(() => {
        if (!searchQuery.trim()) {
            if (previousExpandedState) {
                setExpandedFolders(previousExpandedState);
                setPreviousExpandedState(null);
            }
            return files;
        }

        if (!previousExpandedState) {
            setPreviousExpandedState(new Set(expandedFolders));
        }

        // Get all folder paths from files
        const folderPaths = new Set();
        files.forEach(file => {
            const parts = file.path.split('/');
            parts.pop(); // Remove filename

            let currentPath = '';
            parts.forEach(part => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                folderPaths.add(currentPath);
            });
        });

        const searchLower = searchQuery.toLowerCase();

        // Match files and folders
        const matchingFiles = files.filter(file => {
            // Check if file matches
            if (file.path.toLowerCase().includes(searchLower)) {
                return true;
            }

            // Check if any parent folder matches
            const parts = file.path.split('/');
            parts.pop(); // Remove filename

            let currentPath = '';
            for (const part of parts) {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                if (part.toLowerCase().includes(searchLower)) {
                    return true;
                }
            }

            return false;
        });

        // Get all parent folders for matching files
        const parentFolders = new Set();
        matchingFiles.forEach(file => {
            const parts = file.path.split('/');
            parts.pop();

            let currentPath = '';
            parts.forEach(part => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                parentFolders.add(currentPath);
            });
        });

        setExpandedFolders(new Set(parentFolders));
        return matchingFiles;
    }, [files, searchQuery]);

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
        const folderPath = path.endsWith('/') ? path : path + '/';
        return files.filter(f =>
            f.path.startsWith(folderPath) || f.path === path
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
            const file = files.find(f => f.path === path);
            onFileSelect({ path }, file ? !file.selected : true);
        }
    };

    const isPartiallySelected = (node) => {
        if (node.isFile) {
            return false;
        }

        // Get all text files in this folder and subfolders
        const folderFiles = getAllFilesInFolder(node.path);
        const textFiles = folderFiles.filter(f => f.isText);

        if (textFiles.length === 0) return false;

        const selectedCount = textFiles.filter(f => f.selected).length;
        return selectedCount > 0 && selectedCount < textFiles.length;
    };

    const isFullySelected = (node) => {
        if (node.isFile) {
            const fileEntry = files.find(f => f.path === node.path);
            return Boolean(fileEntry?.selected);
        }

        // Get all text files in this folder and subfolders
        const folderFiles = getAllFilesInFolder(node.path);
        const textFiles = folderFiles.filter(f => f.isText);

        if (textFiles.length === 0) return false;

        return textFiles.every(f => f.selected);
    };

    const buildTree = (paths, files) => {
        const tree = {};
        paths.forEach(file => {
            const parts = file.path.split('/');
            let current = tree;
            let currentPath = '';

            parts.forEach((part, i) => {
                currentPath = currentPath ? currentPath + '/' + part : part;
                if (!current[part]) {
                    current[part] = {
                        isFile: i === parts.length - 1,
                        children: {},
                        path: currentPath, // Add path to each node
                        selected: files.find(f => f.path === currentPath)?.selected || false,
                        tokens: files.find(f => f.path === currentPath)?.tokens || 0
                    };
                }
                current = current[part].children;
            });
        });
        return tree;
    };

    const calculateFolderTokens = (node) => {
        if (node.isFile) {
            return node.tokens || 0;
        }

        return Object.values(node.children).reduce((sum, child) =>
            sum + calculateFolderTokens(child), 0
        );
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

            const totalTokens = isFolder ? calculateFolderTokens(data) : data.tokens;

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

                        {(isFolder || isTextFile) && totalTokens > 0 && (
                            <div className="flex-shrink-0">
                                <div className="px-2 py-0.5 rounded-full bg-gray-800/50 border border-gray-700/50">
                                    <span className="text-[11px] text-gray-400">
                                        {formatTokenCount(totalTokens)}
                                    </span>
                                </div>
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
        <div className="flex flex-col h-full">
            <div className="p-2">
                <div className="relative flex items-center">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: "2.5rem" }}
                        className="w-full px-4 py-2.5 bg-gray-900/50 rounded-lg border border-gray-700/50
                            text-sm focus:outline-none focus:border-indigo-500/50 transition-colors duration-200"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-2">
                    <div className="text-sm text-gray-400 px-2 py-1">Repository</div>
                    {buildTree(filteredFiles, filteredFiles) && renderTree(buildTree(filteredFiles, filteredFiles))}
                </div>
            </div>
        </div>
    );
}

export default FileTree;