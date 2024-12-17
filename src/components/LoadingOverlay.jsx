import React from 'react';

function LoadingOverlay({ message }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900/90 rounded-xl p-6 shadow-2xl border border-gray-800/50 flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500/20">
                        <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin absolute inset-0" />
                    </div>
                </div>
                {message && (
                    <div className="text-sm text-gray-400">{message}</div>
                )}
            </div>
        </div>
    );
}

export default LoadingOverlay;