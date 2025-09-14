import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { EditorCanvas, EditorCanvasHandle } from './components/EditorCanvas';
import { EditorPanel } from './components/EditorPanel';
import { PreviewControls } from './components/PreviewControls';
import { ZoomControls } from './components/ZoomControls';
import Loader from './components/Loader';
import { Tool, SelectionRect } from './types';
import * as geminiService from './services/geminiService';
import { UploadIcon } from './components/icons';
import { translations } from './i18n';

type Language = 'en' | 'ar';

const App: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isInPreviewMode, setIsInPreviewMode] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<Tool>(Tool.Select);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>('');
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [language, setLanguage] = useState<Language>('en');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const editorCanvasRef = useRef<EditorCanvasHandle>(null);

  const t = useCallback((key: string) => {
    const keys = key.split('.');
    let result: any = translations[language];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) return key;
    }
    return result;
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const updateImage = useCallback((newImageUrl: string) => {
    const newImage = new Image();
    newImage.crossOrigin = "anonymous";
    newImage.onload = () => {
      setImage(newImage);
      setImageUrl(newImageUrl);

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newImageUrl);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    };
    newImage.src = newImageUrl;
  }, [history, historyIndex]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          updateImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };
  
  const clearSelection = () => {
    setSelectionRect(null);
    if (maskCanvasRef.current) {
        const maskCtx = maskCanvasRef.current.getContext('2d');
        if (maskCtx) {
            maskCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        }
    }
  }

  const handleToolChange = (tool: Tool) => {
    setActiveTool(tool);
    if (!isInPreviewMode) {
      clearSelection();
    }
  };
  
  const executeGenerativeAction = async (action: () => Promise<string>) => {
    if (!image) return;
    setIsLoading(true);
    try {
      const newImageUrl = await action();
      setPreviewImageUrl(newImageUrl);
      setIsInPreviewMode(true);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const executeAction = async (action: () => Promise<string>) => {
    if (!image) return;
    setIsLoading(true);
    try {
      const newImageUrl = await action();
      updateImage(newImageUrl);
      clearSelection();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAcceptPreview = () => {
    if (previewImageUrl) {
        updateImage(previewImageUrl);
    }
    setPreviewImageUrl(null);
    setIsInPreviewMode(false);
    clearSelection();
  };
  
  const handleRejectPreview = () => {
    setPreviewImageUrl(null);
    setIsInPreviewMode(false);
  };

  const handleRemoveBg = () => {
    executeAction(() => geminiService.removeBackground(image!));
  };

  const handleEnhance = () => {
    executeAction(() => geminiService.enhanceImage(image!));
  };
  
  const handleExpand = (margins: { top: number, right: number, bottom: number, left: number }) => {
    executeAction(() => geminiService.expandImage(image!, margins));
  };
  
  const handleTransform = (transform: { dx: number, dy: number, scale: number }) => {
    if (!maskCanvasRef.current) return;
    executeAction(() => geminiService.transformObject(image!, maskCanvasRef.current!, transform));
  };

  const handleGenerativeFill = () => {
    if (!maskCanvasRef.current || !prompt) return;
    executeGenerativeAction(() => geminiService.editWithPrompt(image!, maskCanvasRef.current!, prompt));
  };
  
  const handleRetexture = () => {
    if (!maskCanvasRef.current || !prompt) return;
    executeGenerativeAction(() => geminiService.retextureObject(image!, maskCanvasRef.current!, prompt));
  };
  
  const handleMagicErase = () => {
    if (!maskCanvasRef.current) return;
    executeGenerativeAction(() => geminiService.magicErase(image!, maskCanvasRef.current!));
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const newImage = new Image();
      newImage.crossOrigin = "anonymous";
      newImage.onload = () => {
        setImage(newImage);
        setImageUrl(history[newIndex]);
      };
      newImage.src = history[newIndex];
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const newImage = new Image();
      newImage.crossOrigin = "anonymous";
      newImage.onload = () => {
        setImage(newImage);
        setImageUrl(history[newIndex]);
      };
      newImage.src = history[newIndex];
    }
  }

  const handleReset = () => {
    if (history.length > 0 && historyIndex > 0) {
        setHistoryIndex(0);
        const newImage = new Image();
        newImage.crossOrigin = "anonymous";
        newImage.onload = () => {
            setImage(newImage);
            setImageUrl(history[0]);
        };
        newImage.src = history[0];
    }
  }

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'edited-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewChange = ({ zoom, pan }: { zoom: number; pan: { x: number; y: number } }) => {
    setZoom(zoom);
    setPan(pan);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 10));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleResetView = () => {
    editorCanvasRef.current?.resetView();
  };

  if (isLoading) {
    return <Loader t={t} />;
  }

  return (
    <div className={`flex h-screen w-screen font-sans overflow-hidden ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
      <Toolbar activeTool={activeTool} onToolChange={handleToolChange} t={t} language={language}/>
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {imageUrl ? (
          <div className="relative w-full h-full flex items-center justify-center">
             <EditorCanvas
                ref={editorCanvasRef}
                imageUrl={previewImageUrl || imageUrl}
                tool={activeTool}
                canvasRef={canvasRef}
                maskCanvasRef={maskCanvasRef}
                selectionRect={selectionRect}
                onSelectionChange={setSelectionRect}
                isFrozen={isInPreviewMode}
                zoom={zoom}
                pan={pan}
                onViewChange={handleViewChange}
            />
            {isInPreviewMode && (
                <PreviewControls onAccept={handleAcceptPreview} onReject={handleRejectPreview} t={t} />
            )}
             <ZoomControls 
                zoom={zoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomReset={handleResetView}
                t={t}
             />
          </div>
        ) : (
          <div className="w-full max-w-xl h-auto flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 shadow-2xl shadow-black/50">
            <UploadIcon className="w-20 h-20 text-slate-400 mb-6" />
            <h2 className="text-2xl font-bold mb-2 text-slate-100">{t('upload.title')}</h2>
            <p className="text-slate-400 mb-8">{t('upload.description')}</p>
            <label className="bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 border border-blue-400/50 text-white font-bold py-3 px-6 rounded-full cursor-pointer transition-all duration-300 shadow-lg hover:shadow-blue-400/50">
              {t('upload.button')}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        )}
      </main>
      {image && (
        <EditorPanel
          tool={activeTool}
          prompt={prompt}
          onPromptChange={setPrompt}
          onRemoveBg={handleRemoveBg}
          onEnhance={handleEnhance}
          onExpand={handleExpand}
          onTransform={handleTransform}
          onGenerativeFill={handleGenerativeFill}
          onRetexture={handleRetexture}
          onMagicErase={handleMagicErase}
          onUndo={handleUndo}
          canUndo={historyIndex > 0}
          onRedo={handleRedo}
          canRedo={historyIndex < history.length - 1}
          onReset={handleReset}
          onDownload={handleDownload}
          isDisabled={isInPreviewMode}
          t={t}
          language={language}
          setLanguage={setLanguage}
        />
      )}
    </div>
  );
};

export default App;