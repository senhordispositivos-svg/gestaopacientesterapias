import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Download,
  ExternalLink,
  Layers,
} from 'lucide-react';

// Configure PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (e) {
  // Fallback worker URL if Vite URL resolution fails
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface PdfCanvasViewerProps {
  fileUrl: string;
  fileName?: string;
  onOpenNewTab?: () => void;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  fileUrl,
  fileName = 'documento.pdf',
  onOpenNewTab,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('all');

  const pdfDocRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  // Helper to convert base64 / dataUrl / blob to Uint8Array
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
    // If it's a blob: or http: URL
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }, []);

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
        setIsLoading(false);
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

  // Render page to canvas
  const renderPage = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement) => {
      if (!pdfDocRef.current || !canvas) return;

      try {
        const page = await pdfDocRef.current.getPage(pageNumber);
        const pixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale, rotation: rotation });

        const context = canvas.getContext('2d');
        if (!context) return;

        // Set dimensions taking pixelRatio into account for razor sharp text/signatures
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
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

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleFitWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 48; // padding
      // Standard A4 width is ~595pt
      const newScale = Math.max(0.6, Math.min(containerWidth / 595, 2.0));
      setScale(parseFloat(newScale.toFixed(2)));
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 overflow-hidden select-none">
      {/* PDF Controls Toolbar */}
      <div className="px-3 py-2 bg-slate-850 border-b border-slate-700/80 flex items-center justify-between flex-wrap gap-2 text-slate-200 shrink-0 text-xs">
        {/* Page navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode(m => (m === 'all' ? 'single' : 'all'))}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
              viewMode === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-750 hover:bg-slate-700 text-slate-300'
            }`}
            title="Alternar entre ver todas as páginas ou página a página"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {viewMode === 'all' ? 'Todas Páginas' : 'Página Única'}
            </span>
          </button>

          {viewMode === 'single' && (
            <div className="flex items-center gap-1 bg-slate-750 px-2 py-0.5 rounded-lg">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 transition"
                title="Página Anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold px-1 text-white">
                {currentPage} / {numPages || 1}
              </span>
              <button
                type="button"
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 transition"
                title="Próxima Página"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {viewMode === 'all' && numPages > 0 && (
            <span className="text-[11px] font-bold text-slate-400 px-2">
              {numPages} {numPages === 1 ? 'página' : 'páginas'}
            </span>
          )}
        </div>

        {/* Zoom and rotation controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-750 rounded-lg text-slate-300 hover:text-white transition"
            title="Reduzir Zoom (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold px-1.5 text-teal-400 min-w-[42px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-750 rounded-lg text-slate-300 hover:text-white transition"
            title="Aumentar Zoom (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleFitWidth}
            className="px-2 py-1 hover:bg-slate-750 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white transition flex items-center gap-1"
            title="Ajustar à largura da tela"
          >
            <Maximize className="w-3 h-3" />
            <span className="hidden md:inline">Ajustar</span>
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 hover:bg-slate-750 rounded-lg text-slate-300 hover:text-white transition"
            title="Girar 90 graus"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 flex flex-col items-center gap-6 bg-slate-950/80"
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center my-auto p-8 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
            <p className="text-sm font-bold text-slate-200">
              Carregando e renderizando atestado / documento...
            </p>
            <p className="text-xs text-slate-400">
              Descodificando páginas em alta definição com PDF.js
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="max-w-md my-auto p-6 rounded-2xl bg-slate-850 border border-slate-700 text-center space-y-4">
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
          <>
            {viewMode === 'all'
              ? Array.from({ length: numPages }, (_, index) => {
                  const pageNum = index + 1;
                  return (
                    <div
                      key={pageNum}
                      className="flex flex-col items-center shadow-2xl rounded-sm overflow-hidden bg-white relative transition-all"
                    >
                      <canvas
                        ref={el => {
                          canvasRefs.current[pageNum] = el;
                        }}
                        className="block bg-white"
                      />
                      <div className="w-full py-1 px-2 bg-slate-100 border-t border-slate-200 text-slate-600 text-[10px] font-bold text-center">
                        Página {pageNum} de {numPages}
                      </div>
                    </div>
                  );
                })
              : (
                <div className="flex flex-col items-center shadow-2xl rounded-sm overflow-hidden bg-white relative transition-all">
                  <canvas
                    ref={el => {
                      canvasRefs.current[currentPage] = el;
                    }}
                    className="block bg-white"
                  />
                  <div className="w-full py-1 px-2 bg-slate-100 border-t border-slate-200 text-slate-600 text-[10px] font-bold text-center">
                    Página {currentPage} de {numPages}
                  </div>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
};
