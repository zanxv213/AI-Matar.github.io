import React, { useState } from 'react';
import { Tool } from '../types.ts';
import { DownloadIcon, ScissorIcon, MagicWandIcon, ResetIcon, SparklesIcon } from './icons/index.tsx';

type Language = 'en' | 'ar';

interface EditorPanelProps {
  tool: Tool;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onRemoveBg: () => void;
  onEnhance: () => void;
  onExpand: (margins: { top: number; right: number; bottom: number; left: number }) => void;
  onTransform: (transform: { dx: number, dy: number, scale: number }) => void;
  onGenerativeFill: () => void;
  onRetexture: () => void;
  onMagicErase: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onRedo: () => void;
  canRedo: boolean;
  onReset: () => void;
  onDownload: () => void;
  isDisabled?: boolean;
  t: (key: string) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Button: React.FC<React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean, icon: React.FC<any> }>> = ({ onClick, disabled, children, icon: Icon }) => (
    <button onClick={onClick} disabled={disabled} className="w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 border border-blue-400/50 disabled:border-slate-500/50 shadow-lg hover:shadow-blue-400/50 disabled:shadow-none">
        <Icon className="w-5 h-5 rtl:ml-2 ltr:mr-2" />
        {children}
    </button>
);

export const EditorPanel: React.FC<EditorPanelProps> = ({
  tool,
  prompt,
  onPromptChange,
  onRemoveBg,
  onEnhance,
  onExpand,
  onTransform,
  onGenerativeFill,
  onRetexture,
  onMagicErase,
  onUndo, canUndo, onRedo, canRedo, onReset, onDownload, isDisabled,
  t, language, setLanguage
}) => {
  const [transform, setTransform] = useState({ dx: 0, dy: 0, scale: 1 });
  
  const allDisabled = isDisabled;

  const renderToolPanel = () => {
    switch (tool) {
      case Tool.Brush:
      case Tool.Select:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">{t('panel.generativeEdit.title')}</h3>
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={t('panel.generativeEdit.placeholder')}
              disabled={allDisabled}
              className="w-full h-28 p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Button onClick={onGenerativeFill} disabled={allDisabled || !prompt} icon={SparklesIcon}>{t('panel.generativeEdit.fill')}</Button>
              <Button onClick={onRetexture} disabled={allDisabled || !prompt} icon={MagicWandIcon}>{t('panel.generativeEdit.retexture')}</Button>
            </div>
          </div>
        );
      case Tool.MagicEraser:
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('panel.magicEraser.title')}</h3>
                <p className="text-sm text-slate-400">{t('panel.magicEraser.description')}</p>
                <Button onClick={onMagicErase} icon={SparklesIcon} disabled={allDisabled}>{t('panel.magicEraser.button')}</Button>
            </div>
        );
      case Tool.Transform:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('panel.transform.title')}</h3>
            <p className="text-sm text-slate-400">{t('panel.transform.description')}</p>
             <div className="space-y-2 text-slate-200">
                <label>{t('panel.transform.xOffset')} ({transform.dx}px)</label>
                <input type="range" min="-200" max="200" value={transform.dx} disabled={allDisabled} onChange={(e) => setTransform(t => ({...t, dx: parseInt(e.target.value)}))} />
            </div>
            <div className="space-y-2 text-slate-200">
                <label>{t('panel.transform.yOffset')} ({transform.dy}px)</label>
                <input type="range" min="-200" max="200" value={transform.dy} disabled={allDisabled} onChange={(e) => setTransform(t => ({...t, dy: parseInt(e.target.value)}))} />
            </div>
            <div className="space-y-2 text-slate-200">
                <label>{t('panel.transform.scale')} ({transform.scale.toFixed(1)}x)</label>
                <input type="range" min="0.5" max="2" step="0.1" value={transform.scale} disabled={allDisabled} onChange={(e) => setTransform(t => ({...t, scale: parseFloat(e.target.value)}))} />
            </div>
            <Button onClick={() => onTransform(transform)} icon={SparklesIcon} disabled={allDisabled}>{t('panel.transform.button')}</Button>
          </div>
        );
      case Tool.RemoveBg:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('panel.removeBg.title')}</h3>
            <p className="text-sm text-slate-400">{t('panel.removeBg.description')}</p>
            <Button onClick={onRemoveBg} icon={ScissorIcon} disabled={allDisabled}>{t('panel.removeBg.button')}</Button>
          </div>
        );
      case Tool.Enhance:
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('panel.enhance.title')}</h3>
                <p className="text-sm text-slate-400">{t('panel.enhance.description')}</p>
                <Button onClick={onEnhance} icon={MagicWandIcon} disabled={allDisabled}>{t('panel.enhance.button')}</Button>
            </div>
        );
      default:
        return <p className="text-slate-400 text-center mt-8">{t('panel.default')}</p>;
    }
  };

  return (
    <aside className="w-96 bg-slate-900/40 backdrop-blur-2xl ltr:border-l rtl:border-r border-white/10 p-6 flex flex-col shadow-2xl shadow-black/50">
      <div className="pb-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold text-slate-100">{t('panel.title')}</h2>
            <div className="flex items-center space-x-1 bg-slate-800/50 border border-white/10 rounded-full p-1">
                <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm rounded-full transition-colors ${language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>EN</button>
                <button onClick={() => setLanguage('ar')} className={`px-3 py-1 text-sm rounded-full transition-colors ${language === 'ar' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>ع</button>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <div className="opacity-100 transition-opacity duration-300" style={{ opacity: allDisabled ? 0.5 : 1 }}>
          {renderToolPanel()}
        </div>
      </div>
      
      <div className="flex-shrink-0">
        <div className="space-y-3 border-t border-white/20 pt-6">
          <div className="flex space-x-3 rtl:space-x-reverse">
              <button onClick={onUndo} disabled={!canUndo || allDisabled} className="flex-1 bg-slate-800/50 hover:bg-slate-700/70 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 font-semibold py-2 px-4 rounded-lg transition-all duration-300 border border-white/10">{t('panel.history.undo')}</button>
              <button onClick={onRedo} disabled={!canRedo || allDisabled} className="flex-1 bg-slate-800/50 hover:bg-slate-700/70 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 font-semibold py-2 px-4 rounded-lg transition-all duration-300 border border-white/10">{t('panel.history.redo')}</button>
          </div>
          <Button onClick={onReset} icon={ResetIcon} disabled={allDisabled}>{t('panel.history.reset')}</Button>
          <Button onClick={onDownload} icon={DownloadIcon} disabled={allDisabled}>{t('panel.history.save')}</Button>
        </div>
      </div>
    </aside>
  );
};