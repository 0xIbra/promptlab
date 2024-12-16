import React, { useState } from 'react';
import FileTree from './components/FileTree';
import FileTabs from './components/FileTabs';
import Instructions from './components/Instructions';
import SelectedFiles from './components/SelectedFiles';
import Toolbar from './components/Toolbar';
import Titlebar from './components/Titlebar';
import FilterModal from './components/FilterModal';
const { ipcRenderer } = window.require('electron');
const path = window.require('path');
const fs = window.require('fs').promises;

function App() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [instructions, setInstructions] = useState('');
    const [currentPath, setCurrentPath] = useState('');
    const [activeTab, setActiveTab] = useState('tree');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState([]);

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
            try {
                const ignoreFilePath = path.join(paths[0], '.repo_ignore');
                const ignoreContent = await fs.readFile(ignoreFilePath, 'utf-8');
                const loadedFilters = ignoreContent
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#'));
                setFilters(loadedFilters);
            } catch (error) {
                // .repo_ignore doesn't exist, that's fine
                setFilters([]);
            }
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

    const handleOpenFilters = () => {
        setIsFilterModalOpen(true);
    };

    const handleSaveFilters = async (newFilters) => {
        // Save filters to .repo_ignore file
        if (currentPath) {
            const ignoreFilePath = path.join(currentPath, '.repo_ignore');
            await fs.writeFile(ignoreFilePath, newFilters.join('\n'));

            // Get fresh files from directory
            const files = await ipcRenderer.invoke('read-directory', currentPath);

            // Create the isFileIgnored function with newFilters instead of filters state
            const isFileIgnoredWithNewFilters = (filePath) => {
                return newFilters.some(pattern => {
                    const regex = new RegExp(
                        pattern
                            .replace(/\*/g, '.*')
                            .replace(/\?/g, '.')
                            .replace(/\//g, '\\/')
                    );
                    return regex.test(filePath);
                });
            };

            // Filter files with new filters
            const filteredFiles = files.filter(file => !isFileIgnoredWithNewFilters(file));

            // Update both filters and files in sequence
            setFilters(newFilters);
            setSelectedFiles(filteredFiles.map(file => ({
                path: file,
                selected: false,
                tokens: 0
            })));
        }
    };

    const isFileIgnored = (filePath) => {
        return filters.some(pattern => {
            // Convert gitignore pattern to regex
            const regex = new RegExp(
                pattern
                    .replace(/\*/g, '.*')
                    .replace(/\?/g, '.')
                    .replace(/\//g, '\\/')
            );
            return regex.test(filePath);
        });
    };

    const renderFileView = () => {
        if (activeTab === 'tree') {
            return (
                <FileTree
                    files={selectedFiles}
                    currentPath={currentPath}
                    onFileSelect={handleFileSelect}
                />
            );
        }

        // List view
        return (
            <div className="p-2 space-y-1">
                {selectedFiles.map((file) => (
                    <div
                        key={file.path}
                        className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-800 cursor-pointer rounded
                            ${file.selected ? 'bg-gray-800' : ''}`}
                    >
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-4 h-4 border rounded flex items-center justify-center
                                    ${file.selected ? 'bg-blue-500 border-blue-500' : 'border-gray-600'}
                                    hover:border-blue-500 transition-colors cursor-pointer`}
                                onClick={() => handleFileSelect({ path: file.path })}
                            >
                                {file.selected && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-sm text-gray-300">{file.path}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col">
            <Titlebar />
            <Toolbar
                onSelectFolder={handleFolderSelect}
                onOpenFilters={handleOpenFilters}
            />

            <div className="flex-1 flex">
                {/* Left sidebar - File tree */}
                <div className="w-72 border-r border-gray-800 flex flex-col">
                    <FileTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <div className="flex-1 overflow-y-auto">
                        {renderFileView()}
                    </div>
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

            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                currentPath={currentPath}
                onSave={handleSaveFilters}
                initialFilters={filters}
            />
        </div>
    );
}

export default App;