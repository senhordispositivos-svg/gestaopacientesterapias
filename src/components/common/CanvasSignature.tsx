import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, RotateCcw, Check, PenTool } from 'lucide-react';

interface CanvasSignatureProps {
  onSave?: (dataUrl: string) => void;
  onChange?: (dataUrl: string) => void;
  value?: string;
  initialDataUrl?: string;
  label?: string;
  width?: number;
  height?: number;
}

export const CanvasSignature: React.FC<CanvasSignatureProps> = ({
  onSave,
  onChange,
  value,
  initialDataUrl,
  label = 'Desenhe a sua assinatura com o dedo, caneta ou mouse',
  width = 500,
  height = 180,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  const isDrawingRef = useRef(false);
  const historyRef = useRef<ImageData[]>([]);
  const isTouchActiveRef = useRef(false);

  const currentInitial = value || initialDataUrl;

  const notifyChange = useCallback((dataUrl: string) => {
    if (onChange) onChange(dataUrl);
    if (onSave) onSave(dataUrl);
  }, [onChange, onSave]);

  const drawGuidanceLine = useCallback((ctx: CanvasRenderingContext2D, cWidth: number, cHeight: number) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cWidth, cHeight);
    ctx.beginPath();
    ctx.moveTo(20, cHeight - 30);
    ctx.lineTo(cWidth - 20, cHeight - 30);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
  }, []);

  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => {
      const next = [...prev, imageData];
      historyRef.current = next;
      return next;
    });
  }, []);

  const handleSaveAndNotify = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    notifyChange(dataUrl);
  }, [notifyChange]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0f172a'; // Deep slate
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentInitial && currentInitial.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = currentInitial;
    } else {
      drawGuidanceLine(ctx, canvas.width, canvas.height);
    }
  }, [width, height, currentInitial, drawGuidanceLine]);

  // Coordinate calculations
  const getCoordinatesFromTouch = (touch: Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  };

  const getCoordinatesFromPointer = (
    e: React.PointerEvent<HTMLCanvasElement> | PointerEvent | MouseEvent,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Robust Native Touch Event Handlers for Mobile (touchstart, touchmove, touchend, touchcancel)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      e.preventDefault();
      e.stopPropagation();

      isTouchActiveRef.current = true;
      saveCanvasState();
      isDrawingRef.current = true;
      setIsDrawing(true);
      setHasSignature(true);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCoordinatesFromTouch(e.touches[0], canvas);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDrawingRef.current || e.touches.length === 0) return;
      e.preventDefault();
      e.stopPropagation();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCoordinatesFromTouch(e.touches[0], canvas);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isDrawingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        isDrawingRef.current = false;
        setIsDrawing(false);
        handleSaveAndNotify();
      }
      setTimeout(() => {
        isTouchActiveRef.current = false;
      }, 100);
    };

    const onTouchCancel = (e: TouchEvent) => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        setIsDrawing(false);
        handleSaveAndNotify();
      }
      setTimeout(() => {
        isTouchActiveRef.current = false;
      }, 100);
    };

    // Attach with { passive: false } to allow e.preventDefault() and prevent scrolling
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchCancel, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [saveCanvasState, handleSaveAndNotify]);

  // Pointer / Mouse events for desktop browsers
  const startPointerDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If a touch interaction is already active via native touchstart, ignore duplicate pointerdown
    if (isTouchActiveRef.current || e.pointerType === 'touch') return;
    if (e.button !== 0) return;

    saveCanvasState();
    isDrawingRef.current = true;
    setIsDrawing(true);
    setHasSignature(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
    }

    const { x, y } = getCoordinatesFromPointer(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const drawPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isTouchActiveRef.current || e.pointerType === 'touch') return;
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinatesFromPointer(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopPointerDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (isTouchActiveRef.current || (e && e.pointerType === 'touch')) return;
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      setIsDrawing(false);

      const canvas = canvasRef.current;
      if (canvas && e && canvas.releasePointerCapture) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
      handleSaveAndNotify();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawGuidanceLine(ctx, canvas.width, canvas.height);
    setHasSignature(false);
    setHistory([]);
    historyRef.current = [];
    notifyChange('');
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = history[history.length - 1];
    ctx.putImageData(previousState, 0, 0);
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    historyRef.current = newHistory;

    if (newHistory.length === 0) {
      setHasSignature(false);
    }
    handleSaveAndNotify();
  };

  const handleSave = () => {
    handleSaveAndNotify();
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center select-none">
      <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white p-1.5 shadow-inner overflow-hidden w-full max-w-lg">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onPointerDown={startPointerDrawing}
          onPointerMove={drawPointer}
          onPointerUp={stopPointerDrawing}
          onPointerCancel={stopPointerDrawing}
          onPointerLeave={stopPointerDrawing}
          className="cursor-crosshair bg-white rounded-xl block w-full touch-none"
          style={{ touchAction: 'none' }}
        />
        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 gap-2 font-medium text-xs px-4 text-center">
            <PenTool className="w-4 h-4 shrink-0 text-teal-600" />
            <span>{label}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between w-full max-w-lg mt-3 gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={history.length === 0}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 flex items-center gap-1 transition shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Desfazer
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30 flex items-center gap-1 transition shadow-2xs cursor-pointer"
          >
            <Eraser className="w-3.5 h-3.5" /> Limpar
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasSignature}
          className="px-4 py-2 text-xs font-black rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-30 flex items-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" /> Assinatura Pronta
        </button>
      </div>
    </div>
  );
};
