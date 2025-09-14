import React from 'react';

interface PreviewControlsProps {
    onAccept: () => void;
    onReject: () => void;
    t: (key: string) => string;
}

export const PreviewControls: React.FC<PreviewControlsProps> = ({ onAccept, onReject, t }) => {
    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/50 z-20">
            <button 
                onClick={onReject}
                className="bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300 border border-red-400/50 shadow-lg hover:shadow-red-400/50"
            >
                {t('preview.reject')}
            </button>
            <button 
                onClick={onAccept}
                className="bg-gradient-to-br from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300 border border-green-400/50 shadow-lg hover:shadow-green-400/50"
            >
                {t('preview.accept')}
            </button>
        </div>
    )
}