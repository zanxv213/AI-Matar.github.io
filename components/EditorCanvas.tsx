import React, { useRef, useEffect, useState, useImperativeHandle } from 'react';
import { Tool, SelectionRect } from '../types';

export interface EditorCanvasProps {
  imageUrl: string;
  tool: Tool;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  maskCanvasRef: React.RefObject<HTMLCanvasElement>;
  selectionRect: SelectionRect | null;
  onSelectionChange: (rect: SelectionRect | null) => void;
  isFrozen?: boolean;
  zoom: number;
  pan: { x: number; y: number };
  onViewChange: (view: { zoom: number; pan: { x: number; y: number } }) => void;
}

export type EditorCanvasHandle = {
  resetView: () => void;
};

export const EditorCanvas = React.forwardRef<EditorCanvasHandle, EditorCanvasProps>(({
  imageUrl,
  tool,
  canvasRef,
  maskCanvasRef,
  selectionRect,
  onSelectionChange,
  isFrozen = false,
  zoom,
  pan,
  onViewChange,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacebarDown, setIsSpacebarDown] = useState(false);

  const resetView = () => {
    if (!imageRef.current || !containerRef.current) return;
    const image = imageRef.current;
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    if (image.naturalWidth === 0 || image.naturalHeight === 0) return;

    const zoomX = containerWidth / image.naturalWidth;
    const zoomY = containerHeight / image.naturalHeight;
    const newZoom = Math.min(zoomX, zoomY) * 0.95; // 5% padding
    
    const newPan = {
      x: (containerWidth - image.naturalWidth * newZoom) / 2,
      y: (containerHeight - image.naturalHeight * newZoom) / 2,
    };
    onViewChange({ zoom: newZoom, pan: newPan });
  };

  useImperativeHandle(ref, () => ({
    resetView,
  }));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacebarDown) {
        e.preventDefault();
        setIsSpacebarDown(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacebarDown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacebarDown]);

  // Effect for loading and drawing the base image.
  // This ensures the image is drawn only after it's fully loaded, fixing visibility and coordinate bugs.
  useEffect(() => {
    if (!imageUrl) return;
    
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;
    image.onload = () => {
      imageRef.current = image;
      const canvases = [canvasRef.current, maskCanvasRef.current];
      canvases.forEach(canvas => {
        if (canvas) {
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
        }
      });
      
      const mainCtx = canvasRef.current?.getContext('2d');
      if (mainCtx) {
          mainCtx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          mainCtx.drawImage(image, 0, 0);
      }

      if (!isFrozen) {
        onSelectionChange(null);
      }
      resetView();
    };
  }, [imageUrl]);

  // Effect for drawing the selection rectangle on the mask canvas.
  useEffect(() => {
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas?.getContext('2d');
    
    if (!maskCtx || !maskCanvas) return;
    
    // Clear previous rectangle when dragging to create a new one.
    if (tool === Tool.Select) {
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    }
    
    if (selectionRect && tool === Tool.Select) {
      const gradient = maskCtx.createLinearGradient(selectionRect.x, selectionRect.y, selectionRect.x + selectionRect.width, selectionRect.y + selectionRect.height);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
      gradient.addColorStop(1, 'rgba(13, 110, 253, 0.5)');
      maskCtx.fillStyle = gradient;
      maskCtx.fillRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
      
      maskCtx.strokeStyle = 'rgba(96, 165, 250, 1)';
      maskCtx.lineWidth = 2; // Fixed line width, not scaled by zoom
      maskCtx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
    }
  }, [selectionRect, tool]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLDivElement>): { x: number; y: number } => {
    const container = containerRef.current;
    if (!container || !imageRef.current || imageRef.current.naturalWidth === 0) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const imageX = (mouseX - pan.x) / zoom;
    const imageY = (mouseY - pan.y) / zoom;
    
    return { x: imageX, y: imageY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFrozen) return;
    if (isSpacebarDown) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    setStartPoint(coords);
    if (tool === Tool.Brush || tool === Tool.MagicEraser) {
      const maskCtx = maskCanvasRef.current?.getContext('2d');
      if (maskCtx) {
        maskCtx.beginPath();
        maskCtx.moveTo(coords.x, coords.y);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      onViewChange({ zoom, pan: { x: e.clientX - panStart.x, y: e.clientY - panStart.y } });
      return;
    }
    if (!isDrawing || isFrozen) return;
    const coords = getCanvasCoordinates(e);

    if (tool === Tool.Brush || tool === Tool.MagicEraser) {
      const maskCtx = maskCanvasRef.current?.getContext('2d');
      if (maskCtx) {
        maskCtx.lineTo(coords.x, coords.y);
        maskCtx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
        maskCtx.lineWidth = 30;
        maskCtx.lineCap = 'round';
        maskCtx.lineJoin = 'round';
        maskCtx.stroke();
      }
    } else if (tool === Tool.Select && startPoint) {
      onSelectionChange({
        x: Math.min(startPoint.x, coords.x),
        y: Math.min(startPoint.y, coords.y),
        width: Math.abs(startPoint.x - coords.x),
        height: Math.abs(startPoint.y - coords.y),
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    if (isFrozen) return;
    setIsDrawing(false);
    setStartPoint(null);
    
    if (tool === Tool.Brush || tool === Tool.MagicEraser) {
        const maskCtx = maskCanvasRef.current?.getContext('2d');
        if (maskCtx) {
            maskCtx.closePath();
        }
    }
  };
  
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isFrozen) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY > 0 ? 1 / 1.1 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, zoom * zoomFactor));
    const newPan = {
        x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
        y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
    };
    onViewChange({ zoom: newZoom, pan: newPan });
  };

  const getCursor = () => {
    if (isFrozen) return 'not-allowed';
    if (isSpacebarDown) return isPanning ? 'grabbing' : 'grab';
    if (tool === Tool.Brush || tool === Tool.Select || tool === Tool.MagicEraser) return 'crosshair';
    return 'default';
  };

  return (
    <div 
        ref={containerRef}
        className="w-full h-full relative shadow-2xl shadow-black/50 rounded-2xl overflow-hidden bg-slate-900/50"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            willChange: 'transform'
        }}>
            <canvas ref={canvasRef} />
            <canvas
                ref={maskCanvasRef}
                style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    cursor: getCursor() 
                }}
            />
        </div>
    </div>
  );
});
