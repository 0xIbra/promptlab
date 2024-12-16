import React, { useState } from 'react';
import { FolderIcon, DocumentIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

function FileTree({ files, currentPath, onFileSelect }) {
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

    const getAllFilesInFolder = (node, path = '') => {
        const files = [];
        Object.entries(node).forEach(([name, data]) => {
            const fullPath = path + name;
            if (data.isFile) {
                files.push(fullPath);
            } else {
                files.push(...getAllFilesInFolder(data.children, fullPath + '/'));
            }
        });
        return files;
    };

    const handleSelect = (path, node, isFolder) => {
        if (isFolder) {
            const allFiles = getAllFilesInFolder(node.children);
            // If any file is not selected, select all. Otherwise, deselect all
            const shouldSelect = allFiles.some(filePath => !files.find(f => f.path === filePath)?.selected);
            allFiles.forEach(filePath => {
                onFileSelect({ path: filePath }, shouldSelect);
            });
        } else {
            onFileSelect({ path });
        }
    };

    const isPartiallySelected = (node) => {
        const allFiles = getAllFilesInFolder(node.children);
        const selectedCount = allFiles.filter(path => files.find(f => f.path === path)?.selected).length;
        return selectedCount > 0 && selectedCount < allFiles.length;
    };

    const isFullySelected = (node) => {
        const allFiles = getAllFilesInFolder(node.children);
        return allFiles.length > 0 && allFiles.every(path => files.find(f => f.path === path)?.selected);
    };

    const buildTree = (paths, files) => {
        const tree = {};
        paths.forEach(file => {
            const parts = file.path.split('/');
            let current = tree;
            parts.forEach((part, i) => {
                if (!current[part]) {
                    current[part] = {
                        isFile: i === parts.length - 1,
                        children: {},
                        selected: file.selected
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

            return (
                <div key={fullPath} style={{ paddingLeft: `${level * 16}px` }}>
                    <div
                        className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-800 cursor-pointer rounded
                            ${isSelected ? 'bg-gray-800' : ''}`}
                    >
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-4 h-4 border rounded flex items-center justify-center
                                    ${isSelected ? 'bg-blue-500 border-blue-500' :
                                      isPartial ? 'border-blue-500' : 'border-gray-600'}
                                    hover:border-blue-500 transition-colors cursor-pointer`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(fullPath, data, isFolder);
                                }}
                            >
                                {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {isPartial && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-sm" />
                                )}
                            </div>
                        </div>

                        <div
                            className="flex items-center gap-2 flex-1"
                            onClick={() => isFolder && toggleFolder(fullPath)}
                        >
                            {isFolder && (
                                <ChevronRightIcon
                                    className={`w-4 h-4 transition-transform ${
                                        isExpanded ? 'transform rotate-90' : ''
                                    }`}
                                />
                            )}
                            {isFolder ? (
                                <FolderIcon className="w-4 h-4 text-gray-400" />
                            ) : (
                                <DocumentIcon className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm text-gray-300">{name}</span>
                        </div>
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