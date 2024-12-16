import React from 'react';
import { FileEntry } from '../types';

interface FileExplorerProps {
  files: FileEntry[];
  onFileSelect: (file: FileEntry) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  onSelectAll,
  onClearSelection,
}) => {
  const renderFileTree = (entries: FileEntry[], level = 0) => {
    return entries.map((entry) => (
      <div key={entry.path} style={{ marginLeft: `${level * 20}px` }}>
        <div className="file-item">
          <input
            type="checkbox"
            checked={entry.selected}
            onChange={() => onFileSelect(entry)}
          />
          <span>{entry.name}{entry.isDirectory ? '/' : ''}</span>
        </div>
        {entry.children && renderFileTree(entry.children, level + 1)}
      </div>
    ));
  };

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <button onClick={onSelectAll}>Select All</button>
        <button onClick={onClearSelection}>Clear</button>
      </div>
      <div className="file-tree">
        {renderFileTree(files)}
      </div>
    </div>
  );
};

export default FileExplorer;