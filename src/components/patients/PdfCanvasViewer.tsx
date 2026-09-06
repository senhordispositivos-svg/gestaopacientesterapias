import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Download,
  ExternalLink,
  Layers,
  FileText,
  MoveHorizontal,
  Hand,
} from 'lucide-react';

// Configure PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (e) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface PdfCanvasViewerProps {
  fileUrl: string;
  fileName?: string;
  onOpenNewTab?: () => void;
}

interface PageDimension {
  width: number;
  height: number;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  fileUrl,
  fileName = 'documento.pdf',
  onOpenNewTab,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');
  const [fitMode, setFitMode] = useState<'page' | 'width' | 'custom'>('page');

  const pdfDocRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});
  const renderTasksRef = useRef<{ [key: number]: any }>({});
  const pageSizesRef = useRef<{ [key: number]: PageDimension }>({});

  // Mouse pan state
  const [isPanning, setIsPanning] = useState(false);
  const [isHandToolActive, setIsHandToolActive] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Convert data URI / blob / remote URL to Uint8Array
  const loadPdfBytes = useCallback(async (url: string): Promise<Uint8Array> => {
    if (url.startsWith('data:')) {
      const base64Index = url.indexOf(';base64,');
      if (base64Index !== -1) {
        const base64 = url.substring(base64Index + 8);
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }
    }
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }, []);

  // Compute scale to fit page or width based on natural page dimensions
  const calculateFitScale = useCallback(
    (mode: 'page' | 'width', pageNum = currentPage, rot = rotation): number => {
      if (!containerRef.current) return 1.0;
      const container = containerRef.current;
      const availWidth = Math.max(180, container.clientWidth - 40);
      const availHeight = Math.max(180, container.clientHeight - 40);

      const size = pageSizesRef.current[pageNum] || pageSizesRef.current[1] || { width: 595, height: 842 };
      const isRotated = rot % 180 !== 0;
      const actualWidth = isRotated ? size.height : size.width;
      const actualHeight = isRotated ? size.width : size.height;

      if (mode === 'width') {
        const s = availWidth / actualWidth;
        return Math.max(0.1, Math.min(s, 3.5));
      } else {
        // Fit entire page in view (both width and height visible without scrolling)
        const scaleW = availWidth / actualWidth;
        const scaleH = availHeight / actualHeight;
        const s = Math.min(scaleW, scaleH);
        return Math.max(0.1, Math.min(s, 3.5));
      }
    },
    [currentPage, rotation]
  );

  // Load PDF document
  useEffect(() => {
    let isCancelled = false;

    async function loadDocument() {
      if (!fileUrl) {
        setError('Arquivo PDF não especificado.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const pdfBytes = await loadPdfBytes(fileUrl);
        if (isCancelled) return;

        const loadingTask = pdfjsLib.getDocument({
          data: pdfBytes,
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setCurrentPage(1);

        // Preload page dimensions for page 1
        const p1 = await doc.getPage(1);
        const vp = p1.getViewport({ scale: 1.0, rotation: 0 });
        pageSizesRef.current[1] = { width: vp.width, height: vp.height };

        // Preload other pages if few
        for (let i = 2; i <= Math.min(doc.numPages, 10); i++) {
          doc.getPage(i).then(p => {
            const v = p.getViewport({ scale: 1.0, rotation: 0 });
            pageSizesRef.current[i] = { width: v.width, height: v.height };
          }).catch(() => {});
        }

        setIsLoading(false);

        // Give DOM a frame to layout containerRef, then compute fit
        requestAnimationFrame(() => {
          if (!isCancelled && containerRef.current) {
            const availW = Math.max(180, containerRef.current.clientWidth - 40);
            const availH = Math.max(180, containerRef.current.clientHeight - 40);
            const scaleW = availW / vp.width;
            const scaleH = availH / vp.height;
            // Fit entire page so 100% of the document is visible
            const fitScale = Math.min(scaleW, scaleH);
            const initialScale = Math.max(0.12, Math.min(fitScale, 3.0));
            setScale(parseFloat(initialScale.toFixed(3)));
            setFitMode('page');
          }
        });
      } catch (err: any) {
        console.error('Erro ao processar PDF com PDF.js:', err);
        if (!isCancelled) {
          setError(
            err?.message ||
              'Não foi possível renderizar o PDF. O arquivo pode estar corrompido ou protegido.'
          );
          setIsLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [fileUrl, loadPdfBytes]);

  // Handle ResizeObserver to keep fit mode on screen resize or fullscreen
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (fitMode === 'page') {
        const s = calculateFitScale('page');
        setScale(parseFloat(s.toFixed(3)));
      } else if (fitMode === 'width') {
        const s = calculateFitScale('width');
        setScale(parseFloat(s.toFixed(3)));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [fitMode, calculateFitScale]);

  // Render a specific page to its canvas
  const renderPage = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement) => {
      if (!pdfDocRef.current || !canvas) return;

      // Cancel previous render task for this canvas if in-flight
      if (renderTasksRef.current[pageNumber]) {
        try {
          renderTasksRef.current[pageNumber].cancel();
        } catch (e) {
          // ignore
        }
      }

      try {
        const page = await pdfDocRef.current.getPage(pageNumber);
        
        // Cache page natural size
        const unscaledVp = page.getViewport({ scale: 1.0, rotation: 0 });
        pageSizesRef.current[pageNumber] = { width: unscaledVp.width, height: unscaledVp.height };

        const pixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale, rotation: rotation });

        const context = canvas.getContext('2d');
        if (!context) return;

        // Set dimensions taking pixelRatio into account for high-DPI clarity
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const task = page.render(renderContext);
        renderTasksRef.current[pageNumber] = task;
        await task.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Erro ao renderizar página ${pageNumber}:`, err);
        }
      }
    },
    [scale, rotation]
  );

  // Trigger render when scale, rotation, viewMode, or currentPage changes
  useEffect(() => {
    if (!pdfDocRef.current || isLoading) return;

    if (viewMode === 'all') {
      for (let p = 1; p <= numPages; p++) {
        const canvas = canvasRefs.current[p];
        if (canvas) {
          renderPage(p, canvas);
        }
      }
    } else {
      const canvas = canvasRefs.current[currentPage];
      if (canvas) {
        renderPage(currentPage, canvas);
      }
    }
  }, [numPages, currentPage, scale, rotation, viewMode, isLoading, renderPage]);

  // Fit handlers
  const handleFitPage = () => {
    setFitMode('page');
    const s = calculateFitScale('page');
    setScale(parseFloat(s.toFixed(3)));
  };

  const handleFitWidth = () => {
    setFitMode('width');
    const s = calculateFitScale('width');
    setScale(parseFloat(s.toFixed(3)));
  };

  const handleZoomIn = () => {
    setFitMode('custom');
    setScale(prev => Math.min(parseFloat((prev + 0.15).toFixed(3)), 3.5));
  };

  const handleZoomOut = () => {
    setFitMode('custom');
    setScale(prev => Math.max(parseFloat((prev - 0.15).toFixed(3)), 0.1));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleScalePreset = (newScaleVal: number) => {
    setFitMode('custom');
    setScale(newScaleVal);
  };

  // Drag to pan logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isHandToolActive && scale <= calculateFitScale('page')) return;
    if (!containerRef.current) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !containerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    containerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    containerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (viewMode === 'single' && currentPage < numPages) {
          setCurrentPage(p => p + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (viewMode === 'single' && currentPage > 1) {
          setCurrentPage(p => p - 1);
        }
      } else if (e.key === '+' || (e.ctrlKey && e.key === '=')) {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || (e.ctrlKey && e.key === '-')) {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0' && e.ctrlKey) {
        e.preventDefault();
        handleFitPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentPage, numPages]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 overflow-hidden select-none">
      {/* PDF Controls Toolbar */}
      <div className="px-2 sm:px-4 py-2 bg-slate-850 border-b border-slate-750 flex items-center justify-between flex-wrap gap-2 text-slate-200 shrink-0 text-xs">
        {/* Page navigation */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700/60">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition ${
                viewMode === 'single'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Exibir uma página por vez"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Página Única</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition ${
                viewMode === 'all'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Exibir todas as páginas em rolagem vertical contínua"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Todas</span>
            </button>
          </div>

          {/* Page Counter & Prev/Next */}
          {viewMode === 'single' && (
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700/60">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-0.5 hover:bg-slate-700 rounded disabled:opacity-30 transition cursor-pointer"
                title="Página Anterior (Seta Esquerda)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold px-1.5 text-white">
                {currentPage} <span className="text-slate-400">/</span> {numPages || 1}
              </span>
              <button
                type="button"
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                className="p-0.5 hover:bg-slate-700 rounded disabled:opacity-30 transition cursor-pointer"
                title="Próxima Página (Seta Direita)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {viewMode === 'all' && numPages > 0 && (
            <span className="text-[11px] font-bold text-slate-400 px-1 hidden sm:inline">
              {numPages} {numPages === 1 ? 'página' : 'páginas'}
            </span>
          )}
        </div>

        {/* Fit and Zoom controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          {/* Fit entire page on screen */}
          <button
            type="button"
            onClick={handleFitPage}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition border ${
              fitMode === 'page'
                ? 'bg-teal-600/90 text-white border-teal-500'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700/70'
            }`}
            title="Ajustar à tela para ver a página inteira completa de uma só vez (sem cortar nada)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-teal-300" />
            <span>Ver Completo</span>
          </button>

          {/* Fit to width */}
          <button
            type="button"
            onClick={handleFitWidth}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition border ${
              fitMode === 'width'
                ? 'bg-teal-600/90 text-white border-teal-500'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700/70'
            }`}
            title="Ajustar à largura do container"
          >
            <MoveHorizontal className="w-3.5 h-3.5 text-teal-300" />
            <span className="hidden sm:inline">Ajustar Largura</span>
          </button>

          {/* Zoom In & Out */}
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700/60 p-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 hover:bg-slate-750 rounded text-slate-300 hover:text-white transition cursor-pointer"
              title="Reduzir Zoom (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-extrabold px-2 text-teal-400 min-w-[46px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 hover:bg-slate-750 rounded text-slate-300 hover:text-white transition cursor-pointer"
              title="Aumentar Zoom (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Hand tool for pan */}
          <button
            type="button"
            onClick={() => setIsHandToolActive(prev => !prev)}
            className={`p-1.5 rounded-lg border transition ${
              isHandToolActive
                ? 'bg-teal-600 text-white border-teal-500'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700/60'
            }`}
            title="Ferramenta Mão: Arraste o documento com o mouse quando estiver com zoom"
          >
            <Hand className="w-3.5 h-3.5" />
          </button>

          {/* Rotate */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
            title="Girar documento 90 graus"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 overflow-auto p-2 sm:p-4 flex flex-col items-center justify-start bg-slate-950/90 relative ${
          isHandToolActive ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center my-auto p-8 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
            <p className="text-sm font-bold text-slate-200">
              Carregando e ajustando documento na tela...
            </p>
            <p className="text-xs text-slate-400">
              Renderizando em alta resolução com PDF.js
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="max-w-md my-auto p-6 rounded-2xl bg-slate-850 border border-slate-700 text-center space-y-4 shadow-xl">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
            <div>
              <h4 className="font-bold text-slate-100 text-sm">
                Visualização Direta Indisponível
              </h4>
              <p className="text-xs text-slate-400 mt-1">{error}</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              {onOpenNewTab && (
                <button
                  type="button"
                  onClick={onOpenNewTab}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" /> Abrir em Nova Aba
                </button>
              )}
              <a
                href={fileUrl}
                download={fileName}
                className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" /> Baixar Arquivo
              </a>
            </div>
          </div>
        )}

        {!isLoading && !error && numPages > 0 && (
          <div className="flex flex-col items-center gap-6 my-auto max-w-full">
            {viewMode === 'all'
              ? Array.from({ length: numPages }, (_, index) => {
                  const pageNum = index + 1;
                  return (
                    <div
                      key={pageNum}
                      className="flex flex-col items-center shadow-2xl rounded-sm overflow-hidden bg-white relative transition-all border border-slate-700/50"
                    >
                      <canvas
                        ref={el => {
                          canvasRefs.current[pageNum] = el;
                        }}
                        className="block bg-white"
                      />
                      <div className="w-full py-1 px-3 bg-slate-100 border-t border-slate-200 text-slate-600 text-[10px] font-bold text-center flex items-center justify-between">
                        <span>{fileName}</span>
                        <span>
                          Página {pageNum} de {numPages}
                        </span>
                      </div>
                    </div>
                  );
                })
              : (
                <div className="flex flex-col items-center shadow-2xl rounded-sm overflow-hidden bg-white relative transition-all border border-slate-700/50">
                  <canvas
                    ref={el => {
                      canvasRefs.current[currentPage] = el;
                    }}
                    className="block bg-white"
                  />
                  <div className="w-full py-1 px-3 bg-slate-100 border-t border-slate-200 text-slate-600 text-[10px] font-bold text-center flex items-center justify-between">
                    <span className="truncate max-w-[200px]">{fileName}</span>
                    <span>
                      Página {currentPage} de {numPages}
                    </span>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};
