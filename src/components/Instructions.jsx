import React, { useState, useEffect, useRef } from 'react';
import { DocumentIcon, TagIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import TemplateManager, { DEFAULT_TEMPLATES } from './TemplateManager';
const { ipcRenderer } = window.require('electron');

function Instructions({ value, onChange, activeTab, onTabChange, selectedFile, fileContent, activeTemplates, setActiveTemplates }) {
    const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [selectorPosition, setSelectorPosition] = useState({ top: 0, left: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const textareaRef = useRef(null);
    const selectorRef = useRef(null);
    const [height, setHeight] = useState(256);
    const isResizing = useRef(false);
    const startY = useRef(0);
    const startHeight = useRef(0);

    useEffect(() => {
        const loadTemplates = async () => {
            const savedTemplates = await ipcRenderer.invoke('load-templates');
            setTemplates(savedTemplates);
        };
        loadTemplates();
    }, []);

    // Load height from cache on initial load
    useEffect(() => {
        const loadHeight = async () => {
            try {
                const uiSettings = await ipcRenderer.invoke('load-ui-settings');
                if (uiSettings.instructionsHeight) {
                    setHeight(uiSettings.instructionsHeight);
                }
            } catch (error) {
                console.error('Error loading instructions height:', error);
            }
        };

        loadHeight();
    }, []);

    // Save height to cache when it changes
    useEffect(() => {
        const saveHeight = async () => {
            try {
                const uiSettings = await ipcRenderer.invoke('load-ui-settings');
                const newSettings = {
                    ...uiSettings,
                    instructionsHeight: height
                };
                await ipcRenderer.invoke('save-ui-settings', newSettings);
            } catch (error) {
                console.error('Error saving instructions height:', error);
            }
        };

        // Debounce the save operation
        const timeoutId = setTimeout(saveHeight, 500);
        return () => clearTimeout(timeoutId);
    }, [height]);

    // Close template selector when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectorRef.current && !selectorRef.current.contains(event.target) &&
                event.target !== textareaRef.current) {
                setShowTemplateSelector(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === '{') {
            e.preventDefault();
            const rect = e.target.getBoundingClientRect();
            const lineHeight = parseInt(window.getComputedStyle(e.target).lineHeight);
            const cursorPosition = e.target.selectionStart;
            const textBeforeCursor = e.target.value.substring(0, cursorPosition);
            const lines = textBeforeCursor.split('\n');
            const currentLineNumber = lines.length - 1;

            setSelectorPosition({
                top: rect.top + (currentLineNumber * lineHeight) - e.target.scrollTop + lineHeight,
                left: rect.left + (e.target.selectionStart - lines[lines.length - 1].length) * 8
            });
            setShowTemplateSelector(true);
            setSearchQuery('');
        } else if (e.key === 'Escape') {
            setShowTemplateSelector(false);
        }
    };

    const handleInsertTemplate = (template) => {
        setActiveTemplates(prev => {
            if (!prev.find(t => t.name === template.name)) {
                return [...prev, template];
            }
            return prev;
        });
        setShowTemplateSelector(false);
        textareaRef.current?.focus();
    };

    const handleSaveTemplates = async (newTemplates) => {
        setTemplates(newTemplates);
        await ipcRenderer.invoke('save-templates', newTemplates);
    };

    const handleRemoveTemplate = (templateName) => {
        setActiveTemplates(prev => prev.filter(t => t.name !== templateName));
    };

    const renderActiveTemplates = () => {
        return (
            <div className="px-4 py-3 border-b border-gray-800/50 bg-gray-900/30">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-500">Active Templates</div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTemplateSelector(true)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-dashed
                                border-gray-700/50 text-gray-400 hover:text-gray-300 hover:border-gray-600/50
                                text-sm transition-colors duration-200"
                        >
                            <PlusIcon className="w-3.5 h-3.5" />
                            <span>Add Template</span>
                        </button>
                        <button
                            onClick={() => setIsTemplateManagerOpen(true)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md
                                bg-gray-800/50 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50
                                text-sm transition-colors duration-200"
                        >
                            <TagIcon className="w-3.5 h-3.5" />
                            <span>Manage</span>
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {activeTemplates.map((template) => (
                        <div
                            key={template.name}
                            className="group flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/20
                                border border-blue-500/30 text-blue-300 text-sm hover:bg-blue-500/30
                                transition-colors duration-200"
                            title={template.content}
                        >
                            <TagIcon className="w-3.5 h-3.5" />
                            <span>{template.name}</span>
                            <button
                                onClick={() => handleRemoveTemplate(template.name)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                                <XMarkIcon className="w-3.5 h-3.5 hover:text-blue-100" />
                            </button>
                        </div>
                    ))}
                    {activeTemplates.length === 0 && (
                        <div className="text-sm text-gray-500">
                            No active templates
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const allTemplates = [...DEFAULT_TEMPLATES, ...templates.filter(t => !t.isDefault)];

    const filteredTemplates = allTemplates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing.current) return;

            const dy = e.clientY - startY.current;
            const newHeight = Math.max(150, Math.min(600, startHeight.current + dy));
            setHeight(newHeight);
        };

        const handleMouseUp = () => {
            if (isResizing.current) {
                isResizing.current = false;
                document.body.classList.remove('resize-y');
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startResizing = (e) => {
        isResizing.current = true;
        startY.current = e.clientY;
        startHeight.current = height;
        document.body.classList.add('resize-y');
    };

    return (
        <div className="border-b border-gray-800">
            <div className="relative">
                {activeTab === 'instructions' && renderActiveTemplates()}

                <div style={{ height: `${height}px` }} className="relative">
                    {activeTab === 'instructions' ? (
                        <textarea
                            ref={textareaRef}
                            id="instructions-textarea"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="Enter your instructions here..."
                            className="w-full h-full bg-transparent p-4 text-sm resize-none focus:outline-none"
                            onKeyDown={handleKeyDown}
                        />
                    ) : (
                        <div className="h-full overflow-auto">
                            {selectedFile ? (
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
                                        <DocumentIcon className="w-4 h-4" />
                                        <span>{selectedFile}</span>
                                    </div>
                                    <pre className="font-mono text-sm whitespace-pre-wrap text-gray-300 bg-gray-800/30 p-4 rounded-lg">
                                        {fileContent || 'Loading...'}
                                    </pre>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                                    Select a file to view its contents
                                </div>
                            )}
                        </div>
                    )}

                    {/* Resize handle */}
                    <div
                        className="absolute bottom-0 left-0 right-0 cursor-row-resize group"
                        onMouseDown={startResizing}
                    >
                        {/* Visual indicator line */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-0.5
                            bg-gray-600/50 rounded-full group-hover:bg-blue-500/50 transition-colors duration-200" />

                        {/* Hover area */}
                        <div className="absolute -bottom-1 left-0 right-0 h-2 group-hover:bg-blue-500/10
                            transition-colors duration-200" />
                    </div>
                </div>

                {/* Template Quick Selector */}
                {showTemplateSelector && (
                    <div
                        ref={selectorRef}
                        className="absolute top-12 left-4 w-64 bg-gray-900 border border-gray-700
                            rounded-lg shadow-xl z-50"
                    >
                        <div className="p-2 border-b border-gray-800">
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-2 py-1 bg-gray-800 rounded text-sm focus:outline-none"
                                autoFocus
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {filteredTemplates.map((template, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleInsertTemplate(template)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-800 flex items-center gap-2
                                        group transition-colors duration-200"
                                >
                                    <TagIcon className="w-4 h-4 text-blue-400" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm truncate">{template.name}</span>
                                            {template.isDefault && (
                                                <span className="px-1.5 py-0.5 text-[10px] rounded-full
                                                    bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {template.content}
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {filteredTemplates.length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                    No templates found
                                </div>
                            )}
                        </div>
                        <div className="p-2 border-t border-gray-800">
                            <button
                                onClick={() => {
                                    setIsTemplateManagerOpen(true);
                                    setShowTemplateSelector(false);
                                }}
                                className="w-full px-3 py-2 text-sm text-center rounded-md
                                    bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
                            >
                                Manage Templates
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isTemplateManagerOpen && (
                <TemplateManager
                    templates={templates}
                    onSave={handleSaveTemplates}
                    onInsert={handleInsertTemplate}
                    onClose={() => setIsTemplateManagerOpen(false)}
                />
            )}
        </div>
    );
}

export default Instructions;