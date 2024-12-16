import React from 'react';
import { FolderIcon, DocumentIcon } from '@heroicons/react/24/outline';

function FileTree({ files, currentPath, onFileSelect }) {
    const getFileIcon = (path) => {
        return path.endsWith('/') ?
            <FolderIcon className="w-4 h-4" /> :
            <DocumentIcon className="w-4 h-4" />;
    };

    return (
        <div className="p-4">
            <div className="mb-4 text-sm text-gray-400">
                {currentPath || 'No folder selected'}
            </div>
            <div className="file-tree">
                {files.map((file) => (
                    <div
                        key={file.path}
                        className={`file-tree-item cursor-pointer ${file.selected ? 'selected-file' : ''}`}
                        onClick={() => onFileSelect(file)}
                    >
                        {getFileIcon(file.path)}
                        <span className="truncate">{file.path}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FileTree;