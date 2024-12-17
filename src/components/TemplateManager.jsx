import React, { useState } from 'react';
import { PlusIcon, XMarkIcon, TagIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

function TemplateManager({ templates, onSave, onInsert, onClose }) {
    const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSaveTemplate = () => {
        if (newTemplate.name && newTemplate.content) {
            onSave([...templates, newTemplate]);
            setNewTemplate({ name: '', content: '' });
            setIsAdding(false);
        }
    };

    const handleDeleteTemplate = (index) => {
        const updatedTemplates = templates.filter((_, i) => i !== index);
        onSave(updatedTemplates);
    };

    const filteredTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gradient-dark rounded-xl w-[600px] shadow-2xl border border-gray-800/50">
                <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
                    <div className="flex items-center gap-2">
                        <TagIcon className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-medium">Prompt Templates</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    {/* Search and Add New buttons */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-gray-900/50 rounded-lg border border-gray-700/50
                                    text-sm focus:outline-none focus:border-blue-500/50 transition-colors duration-200"
                            />
                        </div>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500
                                hover:bg-blue-600 transition-colors duration-200"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">New Template</span>
                        </button>
                    </div>

                    {/* Template Grid */}
                    <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                        {filteredTemplates.map((template, index) => (
                            <div
                                key={index}
                                className="group relative p-3 rounded-lg bg-gray-800/30 border border-gray-700/50
                                    hover:border-blue-500/30 transition-all duration-200"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <TagIcon className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm font-medium text-gray-300">
                                            {template.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteTemplate(index)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20
                                            rounded transition-all duration-200"
                                    >
                                        <XMarkIcon className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                </div>
                                <pre className="text-xs text-gray-400 whitespace-pre-wrap mb-3 h-20 overflow-y-auto">
                                    {template.content}
                                </pre>
                                <button
                                    onClick={() => onInsert(template)}
                                    className="w-full px-3 py-1.5 text-xs font-medium rounded-md
                                        bg-blue-500/20 text-blue-400 hover:bg-blue-500/30
                                        transition-colors duration-200"
                                >
                                    Insert Template
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add New Template Modal */}
                {isAdding && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-gradient-dark rounded-xl w-[400px] shadow-2xl border border-gray-800/50 p-4">
                            <h3 className="text-lg font-medium mb-4">New Template</h3>
                            <input
                                type="text"
                                placeholder="Template name"
                                value={newTemplate.name}
                                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full mb-3 px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-700/50 text-sm"
                            />
                            <textarea
                                placeholder="Template content"
                                value={newTemplate.content}
                                onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                                className="w-full h-32 px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-700/50 text-sm resize-none"
                            />
                            <div className="flex justify-end gap-2 mt-3">
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveTemplate}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-blue-500 hover:bg-blue-600"
                                >
                                    Save Template
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TemplateManager;