import React from 'react';
import { FolderIcon, DocumentIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

function FileTree({ files, currentPath, onFileSelect }) {
    const buildTree = (paths) => {
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
        // Separate folders and files
        const entries = Object.entries(node);
        const folders = entries.filter(([_, data]) => !data.isFile);
        const files = entries.filter(([_, data]) => data.isFile);

        // Sort folders and files alphabetically
        folders.sort(([a], [b]) => a.localeCompare(b));
        files.sort(([a], [b]) => a.localeCompare(b));

        // Combine sorted folders and files
        const sortedEntries = [...folders, ...files];

        return sortedEntries.map(([name, data]) => (
            <div key={path + name} style={{ paddingLeft: `${level * 16}px` }}>
                <div
                    className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-800 cursor-pointer rounded ${
                        data.selected ? 'bg-gray-800' : ''
                    }`}
                    onClick={() => data.isFile && onFileSelect({ path: path + name })}
                >
                    {!data.isFile && <ChevronRightIcon className="w-4 h-4" />}
                    {data.isFile ? (
                        <DocumentIcon className="w-4 h-4 text-gray-400" />
                    ) : (
                        <FolderIcon className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-300">{name}</span>
                </div>
                {!data.isFile && renderTree(data.children, path + name + '/', level + 1)}
            </div>
        ));
    };

    const tree = buildTree(files);

    return (
        <div className="p-2">
            <div className="text-sm text-gray-400 px-2 py-1">Repository</div>
            {renderTree(tree)}
        </div>
    );
}

export default FileTree;