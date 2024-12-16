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
                onFileSelect({ path: file.path }, shouldSelect);
            });
        } else {
            onFileSelect({ path });
        }
    };

    const isPartiallySelected = (node) => {
        if (node.isFile || Object.keys(node.children).length === 0) {
            return false;
        }

        const childStates = Object.values(node.children).map(child =>
            isFullySelected(child)
        );

        return childStates.some(Boolean) && !childStates.every(Boolean);
    };

    const isFullySelected = (node) => {
        if (node.isFile) {
            return node.selected;
        }

        if (Object.keys(node.children).length === 0) {
            return false;
        }

        return Object.values(node.children).every(child =>
            isFullySelected(child)
        );
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
                        selected: files.find(f => f.path === pathSoFar)?.selected || false
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