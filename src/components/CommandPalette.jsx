import React, { useState, useEffect, useRef } from 'react';
import { CommandLineIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

function CommandPalette({ isOpen, onClose, onAction }) {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    const commands = [
        { id: 'open-folder', name: 'Open Folder', shortcut: '⌘O', category: 'File' },
        { id: 'manage-filters', name: 'Manage Filters', shortcut: '⌘F', category: 'File' },
        { id: 'select-all', name: 'Select All Files', shortcut: '⌘A', category: 'Selection' },
        { id: 'clear-selection', name: 'Clear Selection', shortcut: '⌘⇧A', category: 'Selection' },
        { id: 'toggle-view', name: 'Toggle View Mode', shortcut: '⌘\\', category: 'View' },
        { id: 'manage-templates', name: 'Manage Templates', shortcut: '⌘T', category: 'Templates' },
        { id: 'apply-changes', name: 'Apply Code Changes', shortcut: '⌘⇧C', category: 'Code' },
    ];

    const filteredCommands = commands.filter(cmd =>
        cmd.name.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (!isOpen) onClose();
            } else if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[20vh] z-50 animate-fade-in">
            <div className="w-[640px] bg-gradient-dark rounded-xl shadow-2xl border border-gray-800/50 overflow-hidden">
                <div className="p-4 border-b border-gray-800/50">
                    <div className="relative flex items-center">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 text-gray-400 pointer-events-none" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search commands..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ paddingLeft: "2.5rem" }}
                            className="w-full px-4 py-2.5 bg-gray-900/50 rounded-lg border border-gray-700/50
                                text-sm focus:outline-none focus:border-indigo-500/50 transition-colors duration-200"
                        />
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                    {filteredCommands.length > 0 ? (
                        <div className="p-2">
                            {Object.entries(
                                filteredCommands.reduce((acc, cmd) => {
                                    if (!acc[cmd.category]) acc[cmd.category] = [];
                                    acc[cmd.category].push(cmd);
                                    return acc;
                                }, {})
                            ).map(([category, items]) => (
                                <div key={category} className="mb-4">
                                    <div className="px-2 mb-2 text-xs font-medium text-gray-500">
                                        {category}
                                    </div>
                                    <div className="space-y-1">
                                        {items.map((cmd) => (
                                            <button
                                                key={cmd.id}
                                                onClick={() => {
                                                    onAction(cmd.id);
                                                    onClose();
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg
                                                    hover:bg-indigo-500/10 group transition-colors duration-200"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <CommandLineIcon className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
                                                    <span className="text-sm text-gray-300 group-hover:text-indigo-300">
                                                        {cmd.name}
                                                    </span>
                                                </div>
                                                <kbd className="px-2 py-1 text-xs rounded bg-gray-800/50 border border-gray-700/50
                                                    text-gray-400 group-hover:border-indigo-500/30 group-hover:text-indigo-400">
                                                    {cmd.shortcut}
                                                </kbd>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            No commands found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CommandPalette;