import React, { useState } from 'react';
import { Tool } from '../types.ts';
import { SelectIcon, BrushIcon, ExpandIcon, ScissorIcon, MagicWandIcon, TransformIcon, EraseIcon } from './icons/index.tsx';

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  t: (key: string) => string;
  language: 'en' | 'ar';
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolChange, t, language }) => {
    // FIX: The 'tool' variable from the `.map` was out of scope for the tooltip's JSX.
    // To fix this, added `labelKey` to the tooltip state. It's now set on mouse enter
    // and can be reliably accessed when rendering the tooltip.
    const [tooltip, setTooltip] = useState<{ title: string; description: string; top: number; disabled: boolean; labelKey: string; } | null>(null);

    const tools = [
        { id: Tool.Select, icon: SelectIcon, labelKey: 'toolbar.select.label', descriptionKey: 'toolbar.select.description', disabled: false },
        { id: Tool.Brush, icon: BrushIcon, labelKey: 'toolbar.brush.label', descriptionKey: 'toolbar.brush.description', disabled: false },
        { id: Tool.MagicEraser, icon: EraseIcon, labelKey: 'toolbar.magicEraser.label', descriptionKey: 'toolbar.magicEraser.description', disabled: false },
        { id: Tool.Transform, icon: TransformIcon, labelKey: 'toolbar.transform.label', descriptionKey: 'toolbar.transform.description', disabled: true },
        { id: Tool.Expand, icon: ExpandIcon, labelKey: 'toolbar.expand.label', descriptionKey: 'toolbar.expand.description', disabled: true },
        { id: Tool.RemoveBg, icon: ScissorIcon, labelKey: 'toolbar.removeBg.label', descriptionKey: 'toolbar.removeBg.description', disabled: false },
        { id: Tool.Enhance, icon: MagicWandIcon, labelKey: 'toolbar.enhance.label', descriptionKey: 'toolbar.enhance.description', disabled: false },
    ];

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, tool: typeof tools[0]) => {
        setTooltip({
            title: t(tool.labelKey),
            description: tool.disabled ? t(tool.labelKey.replace('.label', '.soon')) : t(tool.descriptionKey),
            top: e.currentTarget.offsetTop,
            disabled: tool.disabled,
            labelKey: tool.labelKey,
        });
    };
    
    const handleMouseLeave = () => {
        setTooltip(null);
    };

  return (
    <aside className="relative bg-slate-900/40 backdrop-blur-2xl ltr:border-r rtl:border-l border-white/10 p-4 flex flex-col items-center space-y-4 shadow-2xl shadow-black/50 z-20">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => !tool.disabled && onToolChange(tool.id)}
          onMouseEnter={(e) => handleMouseEnter(e, tool)}
          onMouseLeave={handleMouseLeave}
          className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 border ${
            activeTool === tool.id 
              ? 'bg-gradient-to-br from-blue-500/80 to-blue-700/80 border-blue-400/50 text-white shadow-[0_0_20px_rgba(59,130,246,0.7)]' 
              : 'bg-slate-800/50 hover:bg-slate-700/70 border-white/10 text-slate-300'
          } ${tool.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={t(tool.labelKey)}
        >
          <tool.icon className="w-7 h-7" />
        </button>
      ))}
       {tooltip && (
            <div
                className="absolute ltr:left-full rtl:right-full ltr:ml-4 rtl:mr-4 w-64 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-4 transition-opacity duration-200 pointer-events-none"
                style={{ top: tooltip.top, opacity: 1 }}
            >
                <h4 className="font-bold text-white flex items-center">{tooltip.title}
                {tooltip.disabled && <span className="text-xs bg-yellow-500/80 text-slate-900 font-bold px-2 py-0.5 rounded-full ltr:ml-2 rtl:mr-2">{t(tooltip.labelKey.replace('.label', '.soonBadge'))}</span>}
                </h4>
                <p className="text-slate-300 text-sm mt-1">{tooltip.description}</p>
            </div>
        )}
    </aside>
  );
};