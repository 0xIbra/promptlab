import React, { useState } from 'react';
import FileTree from './components/FileTree';
import Instructions from './components/Instructions';
import SelectedFiles from './components/SelectedFiles';
import Toolbar from './components/Toolbar';

function App() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [instructions, setInstructions] = useState('');
    const [currentPath, setCurrentPath] = useState('');

    const handleFolderSelect = async () => {
        const { ipcRenderer } = window.require('electron');
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

    return (
        <div className="h-screen flex flex-col">
            <Toolbar onSelectFolder={handleFolderSelect} />

            <div className="flex-1 flex">
                {/* Left sidebar - File tree */}
                <div className="w-72 border-r border-gray-800 overflow-y-auto">
                    <FileTree
                        files={selectedFiles}
                        currentPath={currentPath}
                        onFileSelect={(file) => {
                            setSelectedFiles(prev =>
                                prev.map(f => f.path === file.path ?
                                    {...f, selected: !f.selected} : f
                                )
                            );
                        }}
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