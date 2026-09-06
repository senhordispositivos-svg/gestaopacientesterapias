import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, RotateCcw, Check, PenTool, Sparkles, ShieldCheck } from 'lucide-react';

interface CanvasSignatureProps {
  onSave?: (dataUrl: string) => void;
  onChange?: (dataUrl: string) => void;
  value?: string;
  initialDataUrl?: string;
  label?: string;
  width?: number;
  height?: number;
  required?: boolean;
}

interface Point {
  x: number;
  y: number;
}

export const CanvasSignature: React.FC<CanvasSignatureProps> = ({
  onSave,
  onChange,
  value,
  initialDataUrl,
  label = 'Desenhe a sua assinatura com o dedo, caneta touch ou mouse',
  height = 190,
  required = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);

  // References for drawing calculations & smooth bezier curves
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const strokePointsRef = useRef<Point[]>([]);
  const strokeHistoryRef = useRef<ImageData[]>([]);
  const dprRef = useRef(1);
  const logicalSizeRef = useRef({ width: 500, height });
  const totalStrokeLengthRef = useRef(0);

  const currentInitial = value || initialDataUrl;

  const notifyChange = useCallback((dataUrl: string) => {
    if (onChange) onChange(dataUrl);
    if (onSave) onSave(dataUrl);
  }, [onChange, onSave]);

  // Draw calibrated guidance line & baseline watermark
  const drawGuidanceBase = useCallback((ctx: CanvasRenderingContext2D, width: number, h: number) => {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, h);

    // Baseline where signature rests (clean solid subtle line)
    const lineY = h - 38;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(32, lineY);
    ctx.lineTo(width - 32, lineY);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Elegant subtle signature "X" indicator
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('✕', 14, lineY + 5);

    ctx.restore();
    ctx.setLineDash([]);
  }, []);

  // Configure high-DPI scaling and calibrate canvas coordinate space
  const setupCanvasCalibration = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width || 320, 280);
    const dpr = Math.min(window.devicePixelRatio || 2, 3);

    dprRef.current = dpr;
    logicalSizeRef.current = { width, height };

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Scale drawing context so all coordinate math is 1:1 with CSS pixels
    ctx.scale(dpr, dpr);
    ctx.setLineDash([]);
    ctx.strokeStyle = '#0f172a'; // High contrast deep slate ink
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentInitial && currentInitial.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        setHasSignature(true);
        totalStrokeLengthRef.current = 100;
      };
      img.src = currentInitial;
    } else {
      drawGuidanceBase(ctx, width, height);
      setHasSignature(false);
      totalStrokeLengthRef.current = 0;
    }
  }, [height, currentInitial, drawGuidanceBase]);

  // Handle resize / orientation change with calibration
  useEffect(() => {
    setupCanvasCalibration();

    const handleResize = () => {
      // Debounce slight resize
      setupCanvasCalibration();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setupCanvasCalibration]);

  // Snapshot canvas state for undo functionality
  const saveStateForUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      strokeHistoryRef.current.push(snapshot);
      if (strokeHistoryRef.current.length > 20) {
        strokeHistoryRef.current.shift();
      }
      setStrokeCount(strokeHistoryRef.current.length);
    } catch (e) {
      // Canvas may be tainted in rare cases
    }
  }, []);

  const exportAndNotify = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Verify if there is an actual signature
    if (totalStrokeLengthRef.current > 30 || strokePointsRef.current.length > 8) {
      const dataUrl = canvas.toDataURL('image/png');
      setHasSignature(true);
      notifyChange(dataUrl);
    } else if (totalStrokeLengthRef.current === 0) {
      setHasSignature(false);
      notifyChange('');
    }
  }, [notifyChange]);

  // Precision coordinate extraction with offset calibration
  const getPointerPos = (clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Start stroke
  const startDrawing = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveStateForUndo();

    isDrawingRef.current = true;
    setIsDrawing(true);

    const pos = getPointerPos(clientX, clientY);
    lastPointRef.current = pos;
    strokePointsRef.current = [pos];

    // Configure solid, continuous ink properties
    ctx.setLineDash([]);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw immediate dot for single tap
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 1.3, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
  };

  // Continuous, unbroken stroke progression (never dashed or dotted)
  const continueDrawing = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPos = getPointerPos(clientX, clientY);
    const lastPos = lastPointRef.current;

    // Calculate distance traveled to measure calibration & ensure true signature
    const dx = currentPos.x - lastPos.x;
    const dy = currentPos.y - lastPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Prevent identical coordinates re-stroke
    if (dist < 0.5) return;

    totalStrokeLengthRef.current += dist;

    // Ensure continuous, solid ink without any dash gaps
    ctx.setLineDash([]);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();

    lastPointRef.current = currentPos;
    strokePointsRef.current.push(currentPos);

    if (totalStrokeLengthRef.current > 30) {
      setHasSignature(true);
    }
  };

  const endDrawing = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      setIsDrawing(false);
      lastPointRef.current = null;
      exportAndNotify();
    }
  };

  // Attach native non-passive touch listeners to eliminate mobile scrolling interference
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) return;
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      startDrawing(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDrawingRef.current || e.touches.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      continueDrawing(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      endDrawing();
    };

    const handleTouchCancel = (e: TouchEvent) => {
      e.preventDefault();
      endDrawing();
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [exportAndNotify]);

  // Pointer event handlers for desktop & stylus (Apple Pencil, Surface Pen, Wacom)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If it's a touch event, it's already handled by native touch listener
    if (e.pointerType === 'touch') return;
    if (e.button !== 0) return;

    const canvas = canvasRef.current;
    if (canvas && canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
    }

    startDrawing(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') return;
    if (!isDrawingRef.current) return;
    continueDrawing(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') return;
    const canvas = canvasRef.current;
    if (canvas && canvas.releasePointerCapture) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    endDrawing();
  };

  // Clear signature canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height: h } = logicalSizeRef.current;
    drawGuidanceBase(ctx, width, h);

    setHasSignature(false);
    totalStrokeLengthRef.current = 0;
    strokePointsRef.current = [];
    strokeHistoryRef.current = [];
    setStrokeCount(0);
    notifyChange('');
  };

  // Undo last stroke
  const undoLastStroke = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (strokeHistoryRef.current.length === 0) {
      clearCanvas();
      return;
    }

    const previousSnapshot = strokeHistoryRef.current.pop();
    setStrokeCount(strokeHistoryRef.current.length);

    if (previousSnapshot) {
      ctx.putImageData(previousSnapshot, 0, 0);
      if (strokeHistoryRef.current.length === 0) {
        setHasSignature(false);
        totalStrokeLengthRef.current = 0;
        notifyChange('');
      } else {
        const dataUrl = canvas.toDataURL('image/png');
        notifyChange(dataUrl);
      }
    }
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center select-none notranslate" translate="no">
      <div
        className={`relative border-2 rounded-2xl bg-white p-1 shadow-xs transition-all w-full overflow-hidden ${
          hasSignature
            ? 'border-emerald-500/80 ring-2 ring-emerald-500/15'
            : required
            ? 'border-amber-400 dark:border-amber-600/70 bg-amber-50/10'
            : 'border-slate-300 dark:border-slate-700'
        }`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="cursor-crosshair bg-white rounded-xl block w-full touch-none"
          style={{
            touchAction: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
        />

        {/* Guidance Watermark / Calibrated Label */}
        {!hasSignature && !isDrawing && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1.5 px-4 text-center">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <PenTool className="w-4 h-4 text-teal-600 animate-pulse" />
              <span>{label}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Calibrado para toque nos celulares e canetas digitais • Mantenha o traço contínuo
            </span>
          </div>
        )}

        {/* Live Calibration Status Tag */}
        <div className="absolute top-2 right-2 pointer-events-none flex items-center gap-1">
          {hasSignature ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 shadow-2xs">
              <Check className="w-3 h-3" /> Assinatura Calibrada
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-medium">
              Aguardando Assinatura
            </span>
          )}
        </div>
      </div>

      {/* Signature Toolbar */}
      <div className="flex items-center justify-between w-full mt-2.5 gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={undoLastStroke}
            disabled={strokeCount === 0}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 transition cursor-pointer"
            title="Desfazer último traço"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Desfazer
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30 flex items-center gap-1.5 transition cursor-pointer"
            title="Limpar e assinar novamente"
          >
            <Eraser className="w-3.5 h-3.5" /> Limpar Assinatura
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasSignature ? (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Válida para prontuário
            </span>
          ) : (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              * Assinatura obrigatória
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
