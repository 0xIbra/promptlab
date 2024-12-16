import React, { useState, useEffect } from 'react';
import FileTree from './components/FileTree';
import FileTabs from './components/FileTabs';
import Instructions from './components/Instructions';
import SelectedFiles from './components/SelectedFiles';
import Toolbar from './components/Toolbar';
import Titlebar from './components/Titlebar';
import FilterModal from './components/FilterModal';
import { cache } from './services/cache';
import { DocumentIcon } from '@heroicons/react/24/outline';
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
    const [activeMainTab, setActiveMainTab] = useState('instructions');
    const [selectedViewFile, setSelectedViewFile] = useState(null);
    const [fileContent, setFileContent] = useState('');

    useEffect(() => {
        const loadLastSession = async () => {
            const settings = await cache.loadGlobalSettings();
            if (settings.lastOpenedRepo) {
                const repoData = await cache.loadRepoData(settings.lastOpenedRepo);
                setCurrentPath(settings.lastOpenedRepo);
                setFilters(repoData.filters || []);
                setInstructions(repoData.instructions || '');

                // Load files and apply filters
                const files = await ipcRenderer.invoke('read-directory', settings.lastOpenedRepo);
                const filteredFiles = files.filter(file => !isFileIgnoredWithFilters(file, repoData.filters || []));

                setSelectedFiles(filteredFiles.map(file => ({
                    path: file,
                    selected: (repoData.selectedFiles || []).includes(file),
                    tokens: 0
                })));
            }
        };

        loadLastSession();
    }, []);

    useEffect(() => {
        const saveSession = async () => {
            if (currentPath) {
                await cache.saveRepoData(currentPath, {
                    filters,
                    lastOpened: new Date().toISOString(),
                    selectedFiles: selectedFiles
                        .filter(f => f.selected)
                        .map(f => f.path),
                    instructions
                });

                await cache.updateRecentRepos(currentPath);
            }
        };

        saveSession();
    }, [currentPath, filters, selectedFiles, instructions]);

    const handleFolderSelect = async () => {
        const electron = window.require('electron');
        const { ipcRenderer } = electron;
        const paths = await ipcRenderer.invoke('select-folder');
        if (paths && paths.length > 0) {
            setCurrentPath(paths[0]);

            // Load cached data for this repo first
            const repoData = await cache.loadRepoData(paths[0]);
            setFilters(repoData.filters || []);
            setInstructions(repoData.instructions || '');

            // Get files and apply filters
            const files = await ipcRenderer.invoke('read-directory', paths[0]);
            const filteredFiles = files.filter(file => !isFileIgnoredWithFilters(file, repoData.filters || []));

            setSelectedFiles(filteredFiles.map(file => ({
                path: file,
                selected: (repoData.selectedFiles || []).includes(file),
                tokens: 0
            })));
        }
    };

    // Helper function to check if file should be ignored using provided filters
    const isFileIgnoredWithFilters = (filePath, filtersList) => {
        return filtersList.some(pattern => {
            const regex = new RegExp(
                pattern
                    .replace(/\*/g, '.*')
                    .replace(/\?/g, '.')
                    .replace(/\//g, '\\/')
            );
            return regex.test(filePath);
        });
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
        if (currentPath) {
            // Get fresh files from directory
            const files = await ipcRenderer.invoke('read-directory', currentPath);

            // Filter files with new filters
            const filteredFiles = files.filter(file => !isFileIgnoredWithFilters(file, newFilters));

            // Update both filters and files in sequence
            setFilters(newFilters);
            setSelectedFiles(filteredFiles.map(file => ({
                path: file,
                selected: false,
                tokens: 0
            })));

            // Update cache
            await cache.saveRepoData(currentPath, {
                filters: newFilters,
                lastOpened: new Date().toISOString(),
                selectedFiles: selectedFiles
                    .filter(f => f.selected)
                    .map(f => f.path),
                instructions
            });
        }
    };

    const handleSelectAll = () => {
        setSelectedFiles(prev =>
            prev.map(f => ({
                ...f,
                selected: true
            }))
        );
    };

    const handleUnselectAll = () => {
        setSelectedFiles(prev =>
            prev.map(f => ({
                ...f,
                selected: false
            }))
        );
    };

    const handleFileView = async (filePath) => {
        if (!currentPath) return;

        try {
            const fullPath = path.join(currentPath, filePath);
            const content = await fs.readFile(fullPath, 'utf-8');
            setFileContent(content);
            setSelectedViewFile(filePath);
            setActiveMainTab('fileViewer');
        } catch (error) {
            console.error('Error reading file:', error);
            setFileContent('Error loading file content');
        }
    };

    const renderFileView = () => {
        if (activeTab === 'tree') {
            return (
                <FileTree
                    files={selectedFiles}
                    currentPath={currentPath}
                    onFileSelect={handleFileSelect}
                    onFileView={handleFileView}
                />
            );
        }

        return (
            <div className="p-4 space-y-2 animate-fade-in">
                <div className="text-sm text-gray-400 px-2 mb-3">All Files</div>
                <div className="space-y-1.5">
                    {Array.isArray(selectedFiles) && selectedFiles.map((file) => (
                        <div
                            key={file.path}
                            className={`group flex items-center justify-between p-2.5 rounded-lg
                                transition-all duration-200 hover:translate-x-1
                                ${file.selected
                                    ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30'
                                    : 'hover:bg-gray-800/50 border border-transparent'}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={`w-[18px] h-[18px] border rounded-md flex items-center justify-center
                                        transition-all duration-200 cursor-pointer
                                        ${file.selected
                                            ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/30'
                                            : 'border-gray-600/50 group-hover:border-blue-500/50'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFileSelect({ path: file.path });
                                    }}
                                >
                                    {file.selected && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <div
                                    className="flex items-center gap-2 min-w-0 cursor-pointer hover:text-blue-400"
                                    onClick={() => handleFileView(file.path)}
                                >
                                    <DocumentIcon className="w-4 h-4 flex-shrink-0 text-gray-400" />
                                    <span className="text-sm truncate" title={file.path}>
                                        {file.path}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">
                                    {file.tokens?.toLocaleString() || 0} tokens
                                </span>
                                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-200
                                    ${file.selected ? 'bg-blue-400' : 'bg-gray-600'}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Titlebar />
            <Toolbar
                onSelectFolder={handleFolderSelect}
                onOpenFilters={handleOpenFilters}
                onSelectAll={handleSelectAll}
                onUnselectAll={handleUnselectAll}
            />

            <div className="flex-1 flex overflow-hidden">
                {/* Left sidebar - File tree */}
                <div className="w-72 border-r border-gray-800 flex flex-col overflow-hidden">
                    <FileTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <div className="flex-1 overflow-y-auto">
                        {renderFileView()}
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Instructions
                        value={instructions}
                        onChange={setInstructions}
                        activeTab={activeMainTab}
                        onTabChange={setActiveMainTab}
                        selectedFile={selectedViewFile}
                        fileContent={fileContent}
                    />
                    <div className="flex-1 overflow-y-auto">
                        <SelectedFiles
                            files={selectedFiles.filter(f => f.selected)}
                        />
                    </div>
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