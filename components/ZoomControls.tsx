import React from 'react';
import { ZoomInIcon, ZoomOutIcon, FitScreenIcon } from './icons/index.tsx';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  t: (key: string) => string;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ zoom, onZoomIn, onZoomOut, onZoomReset, t }) => {
  return (
    <div className="absolute bottom-8 ltr:right-8 rtl:left-8 flex items-center space-x-1 rtl:space-x-reverse bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-full p-1 shadow-2xl shadow-black/50 z-20">
      <button onClick={onZoomOut} className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors" title={t('zoom.out')}>
        <ZoomOutIcon className="w-6 h-6" />
      </button>
      <span 
        className="text-sm font-semibold text-white w-16 text-center py-2"
      >
        {Math.round(zoom * 100)}%
      </span>
      <button onClick={onZoomIn} className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors" title={t('zoom.in')}>
        <ZoomInIcon className="w-6 h-6" />
      </button>
      <button onClick={onZoomReset} className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors" title={t('zoom.fit')}>
        <FitScreenIcon className="w-6 h-6" />
      </button>
    </div>
  );
};