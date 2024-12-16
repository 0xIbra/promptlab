import React, { useState } from 'react';
import FileTree from './components/FileTree';
import Instructions from './components/Instructions';
import SelectedFiles from './components/SelectedFiles';
import Toolbar from './components/Toolbar';
import Titlebar from './components/Titlebar';

function App() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [instructions, setInstructions] = useState('');
    const [currentPath, setCurrentPath] = useState('');

    const handleFolderSelect = async () => {
        const electron = window.require('electron');
        const { ipcRenderer } = electron;
        const paths = await ipcRenderer.invoke('select-folder');
        if (paths && paths.length > 0) {
            setCurrentPath(paths[0]);
            const files = await ipcRenderer.invoke('read-directory', paths[0]);
            setSelectedFiles(files.map(file => ({
                path: file,
                selected: false,
                tokens: 0
            })));
        }
    };

    const handleFileSelect = (file, forceState) => {
        setSelectedFiles(prev =>
            prev.map(f => ({
                ...f,
                selected: f.path === file.path
                    ? (forceState !== undefined ? forceState : !f.selected)
                    : f.selected
            }))
        );
    };

    return (
        <div className="h-screen flex flex-col">
            <Titlebar />
            <Toolbar onSelectFolder={handleFolderSelect} />

            <div className="flex-1 flex">
                {/* Left sidebar - File tree */}
                <div className="w-72 border-r border-gray-800 overflow-y-auto">
                    <FileTree
                        files={selectedFiles}
                        currentPath={currentPath}
                        onFileSelect={handleFileSelect}
                    />
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col">
                    <Instructions
                        value={instructions}
                        onChange={setInstructions}
                    />

                    <SelectedFiles
                        files={selectedFiles.filter(f => f.selected)}
                    />
                </div>
            </div>
        </div>
    );
}

export default App;