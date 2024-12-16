import React from 'react';

function Instructions({ value, onChange }) {
    return (
        <div className="p-4 border-b border-gray-800">
            <div className="text-sm text-gray-400 mb-2">Instructions</div>
            <textarea
                className="w-full h-32 bg-gray-800 text-gray-200 p-3 rounded-md resize-none"
                placeholder="Enter instructions for the AI..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

export default Instructions;