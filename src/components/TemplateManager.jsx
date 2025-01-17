const defaultTemplate = `<meta_prompt>
Your task is to follow to the best of your ability the instructions of the user.

Use the included project structure as a general guide.
You will respond with 2 sections: A summary section and an XML section.

Here are some notes on how you should respond in the summary section:
- Provide a brief overall summary
- Provide a 1-sentence summary for each file changed and why.
- Format this section as markdown.

Here are some notes on how you should respond in the XML section:
- Respond with the XML and nothing else
- Include all of the changed files
- Specify each file operation with CREATE, UPDATE, or DELETE
- If it is a CREATE or UPDATE include the full file code. Do not get lazy.
- Each file should include a brief change summary.
- Include the full file path
- I am going to copy/paste that entire XML section into a parser to automatically apply the changes you made, so put the XML block inside a markdown codeblock.
- Make sure to enclose the code with ![CDATA[__CODE HERE__]]
- Be sure to close the <file_code> tag with </file_code> after the code.

Here is how you should structure the XML:
<code_changes>
    <changed_files>
        <file>
            <file_summary>**BRIEF CHANGE SUMMARY HERE**</file_summary>
            <file_operation>**FILE OPERATION HERE**</file_operation>
            <file_path>**FILE PATH HERE**</file_path>
            <file_code><![CDATA[
__FULL FILE CODE HERE__
]]></file_code>
        </file>
        **REMAINING FILES HERE**
    </changed_files>
</code_changes>

So the XML section will be:
\`\`\`xml
__XML HERE__
\`\`\`
</meta_prompt>
`


export const DEFAULT_TEMPLATES = [
    {
        name: "Parseable XML Response",
        content: defaultTemplate,
        isDefault: true
    }
];

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
        if (index < DEFAULT_TEMPLATES.length) return;

        const templateIndex = index - DEFAULT_TEMPLATES.length;
        const updatedTemplates = templates.filter((_, i) => i !== templateIndex);
        onSave(updatedTemplates);
    };

    const allTemplates = [...DEFAULT_TEMPLATES, ...templates.filter(t => !t.isDefault)];

    const filteredTemplates = allTemplates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gradient-dark rounded-xl w-[1000px] max-w-[90vw] h-[60vh] shadow-2xl border border-gray-800/50">
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
                    <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                        {filteredTemplates.map((template, index) => (
                            <div
                                key={index}
                                className={`group relative p-4 rounded-lg bg-gray-800/30 border
                                    ${template.isDefault
                                        ? 'border-blue-500/30'
                                        : 'border-gray-700/50 hover:border-blue-500/30'}
                                    transition-all duration-200`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <TagIcon className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm font-medium text-gray-300">
                                            {template.name}
                                        </span>
                                        {template.isDefault && (
                                            <span className="px-2 py-0.5 text-xs rounded-full
                                                bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onInsert(template)}
                                            className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs font-medium
                                                rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30
                                                transition-all duration-200"
                                        >
                                            Use Template
                                        </button>
                                        {!template.isDefault && (
                                            <button
                                                onClick={() => handleDeleteTemplate(index)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20
                                                    rounded transition-all duration-200"
                                            >
                                                <XMarkIcon className="w-3.5 h-3.5 text-red-400" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <pre className="text-sm text-gray-400 whitespace-pre-wrap h-[120px] overflow-y-auto
                                    bg-gray-900/30 rounded-lg p-3 border border-gray-700/30">
                                    {template.content}
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add New Template Modal */}
                {isAdding && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-gradient-dark rounded-xl w-[800px] max-w-[90vw] shadow-2xl border border-gray-800/50 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-medium">New Template</h3>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="p-1 hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Template Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter template name..."
                                        value={newTemplate.name}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-700/50
                                            text-sm focus:outline-none focus:border-blue-500/50 transition-colors duration-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Template Content</label>
                                    <textarea
                                        placeholder="Enter template content..."
                                        value={newTemplate.content}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                                        className="w-full h-[400px] px-3 py-2 bg-gray-900/50 rounded-lg border
                                            border-gray-700/50 text-sm resize-none font-mono
                                            focus:outline-none focus:border-blue-500/50 transition-colors duration-200"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700
                                        transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveTemplate}
                                    className="px-4 py-2 text-sm rounded-lg bg-blue-500 hover:bg-blue-600
                                        transition-colors duration-200"
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