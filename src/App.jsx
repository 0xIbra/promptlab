import React, { useState, useEffect, useRef } from 'react';
import FileTree from './components/FileTree';
import FileTabs from './components/FileTabs';
import Instructions from './components/Instructions';
import SelectedFiles from './components/SelectedFiles';
import Toolbar from './components/Toolbar';
import Titlebar from './components/Titlebar';
import FilterModal from './components/FilterModal';
import { cache } from './services/cache';
import { DocumentIcon } from '@heroicons/react/24/outline';
import { countFileTokens } from './services/tokenizer';
import { useLoading } from './context/LoadingContext';
import CopyButton from './components/CopyButton';
import CodeChangesModal from './components/CodeChangesModal';
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
    const { setLoading } = useLoading();
    const [sidebarWidth, setSidebarWidth] = useState(288);
    const isResizing = useRef(false);
    const [activeTemplates, setActiveTemplates] = useState([]);
    const [isChangesModalOpen, setIsChangesModalOpen] = useState(false);

    useEffect(() => {
        const loadLastSession = async () => {
            setLoading(true, 'Loading last session...');
            try {
                const settings = await cache.loadGlobalSettings();
                if (settings.lastOpenedRepo) {
                    const repoData = await cache.loadRepoData(settings.lastOpenedRepo);
                    setCurrentPath(settings.lastOpenedRepo);
                    setFilters(repoData.filters || []);
                    setInstructions(repoData.instructions || '');

                    // Load files and apply filters in the backend
                    const cleanFilters = (repoData.filters || []).filter(f => f && !f.startsWith('#'));
                    const files = await ipcRenderer.invoke('read-directory', settings.lastOpenedRepo, cleanFilters);

                    // Initialize all files with their cached selection state
                    const fileObjects = files.map(file => ({
                        ...file,
                        selected: (repoData.selectedFiles || []).includes(file.path)
                    }));

                    setSelectedFiles(fileObjects);
                }
            } catch (error) {
                console.error('Error loading last session:', error);
                // Reset state on error
                setCurrentPath('');
                setFilters([]);
                setSelectedFiles([]);
                setInstructions('');
            } finally {
                setLoading(false);
            }
        };

        loadLastSession();
    }, []);

    useEffect(() => {
        const saveSession = async () => {
            if (currentPath) {
                try {
                    await cache.saveRepoData(currentPath, {
                        filters,
                        lastOpened: new Date().toISOString(),
                        selectedFiles: selectedFiles
                            .filter(f => f.selected)
                            .map(f => f.path),
                        instructions
                    });

                    await cache.updateRecentRepos(currentPath);
                } catch (error) {
                    console.error('Error saving session:', error);
                }
            }
        };

        // Debounce the save operation to avoid too frequent writes
        const timeoutId = setTimeout(saveSession, 500);
        return () => clearTimeout(timeoutId);
    }, [currentPath, filters, selectedFiles, instructions]);

    const handleFolderSelect = async () => {
        const electron = window.require('electron');
        const { ipcRenderer } = electron;

        setLoading(true, 'Opening folder...');
        try {
            const paths = await ipcRenderer.invoke('select-folder');
            if (paths && paths.length > 0) {
                const selectedPath = paths[0];

                try {
                    // Load cached data for this repo first
                    const repoData = await cache.loadRepoData(selectedPath);

                    setCurrentPath(selectedPath);
                    setFilters(repoData.filters || []);
                    setInstructions(repoData.instructions || '');

                    // Get filtered files from backend using the repo's filters
                    const cleanFilters = (repoData.filters || []).filter(f => f && !f.startsWith('#'));
                    const files = await ipcRenderer.invoke('read-directory', selectedPath, cleanFilters);

                    // Map the files to include selected state
                    const fileObjects = files.map(file => ({
                        ...file,
                        selected: (repoData.selectedFiles || []).includes(file.path)
                    }));

                    setSelectedFiles(fileObjects);

                    // Save the selected path as lastOpenedRepo
                    await cache.saveGlobalSettings({
                        lastOpenedRepo: selectedPath
                    });

                    // Also update the store directly through main process
                    await ipcRenderer.invoke('save-global-settings', {
                        lastOpenedRepo: selectedPath
                    });
                } catch (error) {
                    console.error('Error loading folder:', error);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (file, forceState) => {
        const newSelected = forceState !== undefined ? forceState : !file.selected;

        setSelectedFiles(prev =>
            prev.map(f => {
                if (f.path === file.path) {
                    return { ...f, selected: newSelected };
                }
                return f;
            })
        );
    };

    const handleOpenFilters = () => {
        setIsFilterModalOpen(true);
    };

    const handleSaveFilters = async (newFilters) => {
        if (currentPath) {
            setLoading(true, 'Applying filters...');
            try {
                // Clean up filters - remove empty lines and comments for file filtering
                const cleanFilters = newFilters.filter(f => f && !f.startsWith('#'));

                // Get filtered files from backend
                const files = await ipcRenderer.invoke('read-directory', currentPath, cleanFilters);

                // Update state with the full filters (including comments)
                setFilters(newFilters);
                setSelectedFiles(files.map(file => ({
                    ...file,
                    selected: false
                })));

                // Save the full filters to cache for this repo
                const repoData = await cache.loadRepoData(currentPath);
                await cache.saveRepoData(currentPath, {
                    ...repoData,
                    filters: newFilters,  // Save the complete filter list including comments
                    lastOpened: new Date().toISOString(),
                    selectedFiles: [],
                    instructions: instructions
                });
            } catch (error) {
                console.error('Error applying filters:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSelectAll = () => {
        setLoading(true, 'Selecting all files...');
        try {
            // Simply mark all text files as selected
            setSelectedFiles(prev =>
                prev.map(f => ({ ...f, selected: true }))
            );
        } finally {
            setLoading(false);
        }
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
                    {Array.isArray(selectedFiles) && selectedFiles.length > 0 ? (
                        selectedFiles.map((file) => (
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
                        ))
                    ) : (
                        <div className="text-gray-500 text-sm">No files available</div>
                    )}
                </div>
            </div>
        );
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing.current) return;

            const newWidth = e.clientX;
            // Limit the minimum and maximum width
            if (newWidth >= 200 && newWidth <= 600) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.classList.remove('resize-x');
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startResizing = () => {
        isResizing.current = true;
        document.body.classList.add('resize-x');
    };

    // Load sidebar width from cache on initial load
    useEffect(() => {
        const loadSidebarWidth = async () => {
            try {
                const uiSettings = await cache.loadUISettings();
                if (uiSettings.sidebarWidth) {
                    setSidebarWidth(uiSettings.sidebarWidth);
                }
            } catch (error) {
                console.error('Error loading sidebar width:', error);
            }
        };

        loadSidebarWidth();
    }, []);

    // Save sidebar width to cache when it changes
    useEffect(() => {
        const saveSidebarWidth = async () => {
            try {
                await cache.saveUISettings({
                    sidebarWidth
                });
            } catch (error) {
                console.error('Error saving sidebar width:', error);
            }
        };

        // Debounce the save operation
        const timeoutId = setTimeout(saveSidebarWidth, 500);
        return () => clearTimeout(timeoutId);
    }, [sidebarWidth]);

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Titlebar />
            <Toolbar
                onSelectFolder={handleFolderSelect}
                onOpenFilters={handleOpenFilters}
                onSelectAll={handleSelectAll}
                onUnselectAll={handleUnselectAll}
                activeTab={activeMainTab}
                onTabChange={setActiveMainTab}
                onOpenChanges={() => setIsChangesModalOpen(true)}
            />

            <div className="flex-1 flex overflow-hidden">
                {/* Left sidebar - File tree */}
                <div
                    className="border-r border-gray-800 flex flex-col overflow-hidden flex-shrink-0"
                    style={{ width: sidebarWidth }}
                >
                    <FileTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <div className="flex-1 overflow-y-auto">
                        {renderFileView()}
                    </div>
                </div>

                {/* Resize handle */}
                <div
                    className="w-1 hover:bg-blue-500/50 cursor-col-resize relative group"
                    onMouseDown={startResizing}
                >
                    <div className="absolute inset-y-0 -left-2 right-2 group-hover:bg-blue-500/20" />
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
                        activeTemplates={activeTemplates}
                        setActiveTemplates={setActiveTemplates}
                    />
                    <div className="flex-1 overflow-y-auto">
                        <SelectedFiles
                            files={selectedFiles.filter(f => f.selected)}
                        />
                    </div>
                </div>
            </div>

            <CopyButton
                selectedFiles={selectedFiles.filter(f => f.selected)}
                instructions={instructions}
                activeTemplates={activeTemplates}
            />

            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                currentPath={currentPath}
                onSave={handleSaveFilters}
            />

            <CodeChangesModal
                isOpen={isChangesModalOpen}
                onClose={() => setIsChangesModalOpen(false)}
            />
        </div>
    );
}

export default App;