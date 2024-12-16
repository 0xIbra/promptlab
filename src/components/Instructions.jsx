import React from 'react';

function Instructions({ value, onChange }) {
    return (
        <div className="border-b border-gray-800">
            <div className="flex border-b border-gray-800">
                <button className="px-4 py-2 text-sm text-blue-400 border-b-2 border-blue-400">
                    Instructions
                </button>
                <button className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300">
                    File Tree
                </button>
            </div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter your instructions here..."
                className="w-full h-64 bg-transparent p-4 text-sm resize-none focus:outline-none"
            />
        </div>
    );
}

export default Instructions;