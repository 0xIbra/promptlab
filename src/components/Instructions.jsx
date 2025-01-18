import React, { useState, useEffect, useRef } from 'react';
import { DocumentIcon, TagIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import TemplateManager, { DEFAULT_TEMPLATES } from './TemplateManager';
const { ipcRenderer } = window.require('electron');

function Instructions({
    value,
    onChange,
    activeTab,
    onTabChange,
    selectedFile,
    fileContent,
    activeTemplates,
    setActiveTemplates,
    isTemplateManagerOpen,
    onTemplateManagerClose,
    onTemplateManagerOpen
}) {
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [selectorPosition, setSelectorPosition] = useState({ top: 0, left: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
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
        // Only add to active templates if not already there
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
        if (activeTemplates.length === 0) return null;

        return (
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
            const delta = startY.current - e.clientY;
            const newHeight = Math.max(150, Math.min(600, startHeight.current + delta));
            setHeight(newHeight);
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.classList.remove('resize-y');
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
        <div className="relative flex flex-col overflow-hidden" style={{ height: `${height}px` }}>
            {activeTab === 'instructions' && (
                <div className="flex-1 flex flex-col overflow-hidden">
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
                                    onClick={() => onTemplateManagerOpen()}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-md
                                        bg-gray-800/50 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50
                                        text-sm transition-colors duration-200"
                                >
                                    <TagIcon className="w-3.5 h-3.5" />
                                    <span>Manage</span>
                                </button>
                            </div>
                        </div>
                        {renderActiveTemplates()}
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto">
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter your instructions here..."
                            className="w-full h-full bg-transparent resize-none focus:outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Template Quick Selector */}
            {showTemplateSelector && (
                <div
                    ref={selectorRef}
                    className="absolute z-50 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl"
                    style={{
                        top: selectorPosition.top + 'px',
                        left: selectorPosition.left + 'px'
                    }}
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
                </div>
            )}

            {activeTab === 'fileViewer' && selectedFile && (
                <div className="flex-1 p-4 overflow-y-auto">
                    <div className="text-sm text-gray-400 mb-3">{selectedFile}</div>
                    <pre className="text-sm font-mono whitespace-pre-wrap">{fileContent}</pre>
                </div>
            )}

            <div
                className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-500/30 transition-colors"
                onMouseDown={startResizing}
            />

            {isTemplateManagerOpen && (
                <TemplateManager
                    templates={templates}
                    onSave={handleSaveTemplates}
                    onInsert={handleInsertTemplate}
                    onClose={onTemplateManagerClose}
                />
            )}
        </div>
    );
}

export default Instructions;