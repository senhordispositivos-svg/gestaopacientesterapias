import React, { useState, useEffect } from 'react';
import { DocumentFile } from '../../types';
import {
  X,
  Download,
  FileText,
  Calendar,
  User,
  ExternalLink,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentFile | null;
  patientName?: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  patientName,
}) => {
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  // Reset zoom & rotation when doc changes
  useEffect(() => {
    setImageScale(1);
    setImageRotation(0);
  }, [doc?.id]);

  const isImage = React.useMemo(() => {
    if (!doc) return false;
    return (
      doc.fileType?.toLowerCase().includes('image') ||
      doc.fileUrl?.startsWith('data:image') ||
      /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(doc.fileName)
    );
  }, [doc]);

  const isPdf = React.useMemo(() => {
    if (!doc) return false;
    if (isImage) return false;
    return (
      doc.fileType?.toLowerCase().includes('pdf') ||
      doc.fileName?.toLowerCase().endsWith('.pdf') ||
      doc.fileUrl?.startsWith('data:application/pdf') ||
      doc.fileUrl?.includes('JVBERi0') ||
      doc.category === 'ATESTADO' ||
      doc.category === 'LAUDO' ||
      doc.category === 'PDF' ||
      doc.category === 'EXAM'
    );
  }, [doc, isImage]);

  // Create clean Blob URL from Data URI so browsers (Chrome/Edge/Firefox)
  // preview PDFs inline inside iframes/objects without blocking or auto-downloading.
  useEffect(() => {
    if (!isOpen || !doc?.fileUrl) {
      setBlobUrl('');
      return;
    }

    if (doc.fileUrl.startsWith('data:')) {
      try {
        const parts = doc.fileUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        let mime = mimeMatch ? mimeMatch[1] : isPdf ? 'application/pdf' : 'image/png';
        if (isPdf && (!mime || mime.includes('octet-stream'))) {
          mime = 'application/pdf';
        }

        const b64Data = parts[1];
        const byteCharacters = atob(b64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error('Erro ao converter data URI para Blob:', err);
        setBlobUrl(doc.fileUrl);
      }
    } else {
      setBlobUrl(doc.fileUrl);
    }
  }, [isOpen, doc?.fileUrl, isPdf]);

  if (!isOpen || !doc) return null;

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'ATESTADO':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      case 'LAUDO':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-900';
      case 'EXAM':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900';
      case 'IMAGE':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'ATESTADO':
        return 'Atestado Médico';
      case 'LAUDO':
        return 'Laudo Clínico';
      case 'EXAM':
        return 'Exame / Imagem';
      case 'IMAGE':
        return 'Foto / Registro';
      case 'PDF':
        return 'Documento PDF';
      default:
        return 'Documento Geral';
    }
  };

  const handleOpenInNewTab = () => {
    const targetUrl = blobUrl || doc.fileUrl;
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }
  };

  const handlePrint = () => {
    const targetUrl = blobUrl || doc.fileUrl;
    if (!targetUrl) return;

    if (isImage) {
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(`
          <html>
            <head>
              <title>${doc.fileName}</title>
              <style>
                body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
                img { max-width: 95%; max-height: 95%; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${targetUrl}" onload="window.print();window.close();" />
            </body>
          </html>
        `);
        printWin.document.close();
      }
    } else {
      const printWin = window.open(targetUrl, '_blank');
      printWin?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div
        className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
          isFullscreen
            ? 'fixed inset-2 sm:inset-3 max-w-none max-h-none h-[calc(100vh-16px)] sm:h-[calc(100vh-24px)] z-50'
            : 'max-w-5xl max-h-[92vh] h-[88vh]'
        }`}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
              {isImage ? <Eye className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate" title={doc.fileName}>
                  {doc.fileName}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getCategoryBadge(
                    doc.category
                  )}`}
                >
                  {getCategoryLabel(doc.category)}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Visualização Direta
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 truncate">
                {patientName && (
                  <span>
                    Paciente: <strong className="text-slate-700 dark:text-slate-300">{patientName}</strong> •
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {formatDate(doc.uploadedAt)}
                </span>
                {doc.uploadedByName && (
                  <span className="flex items-center gap-1">
                    • <User className="w-3 h-3" /> {doc.uploadedByName}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons on header */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Open in full separate tab without download */}
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Abrir documento em tela inteira em uma nova aba do navegador"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Aba</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Imprimir documento diretamente"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            {/* Download copy */}
            <a
              href={blobUrl || doc.fileUrl}
              download={doc.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
              title="Baixar uma cópia deste arquivo para seu computador"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar Cópia</span>
            </a>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(prev => !prev)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isFullscreen ? 'Restaurar tamanho' : 'Expandir para tela cheia'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ml-1"
              title="Fechar visualizador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-900/90 dark:bg-slate-950 relative">
          {/* Image Toolbar */}
          {isImage && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white shadow-lg text-xs">
              <button
                type="button"
                onClick={() => setImageScale(s => Math.max(0.4, s - 0.2))}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition"
                title="Reduzir zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold px-1.5">{Math.round(imageScale * 100)}%</span>
              <button
                type="button"
                onClick={() => setImageScale(s => Math.min(3, s + 0.2))}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={() => setImageRotation(r => (r + 90) % 360)}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition flex items-center gap-1"
                title="Girar 90 graus"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageScale(1);
                  setImageRotation(0);
                }}
                className="px-2 py-1 text-[11px] font-bold hover:bg-slate-800 rounded-lg transition"
              >
                Redefinir
              </button>
            </div>
          )}

          {/* Main Visualizer */}
          <div className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-2 sm:p-4">
            {isImage ? (
              <div className="w-full h-full flex items-center justify-center overflow-auto">
                <img
                  src={blobUrl || doc.fileUrl}
                  alt={doc.fileName}
                  style={{
                    transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xl select-none"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : isPdf ? (
              <div className="w-full h-full rounded-2xl overflow-hidden bg-white shadow-2xl relative flex flex-col">
                {blobUrl ? (
                  <object
                    data={`${blobUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                    type="application/pdf"
                    className="w-full h-full flex-1 border-0"
                  >
                    <iframe
                      src={`${blobUrl}#toolbar=1`}
                      title={doc.fileName}
                      className="w-full h-full flex-1 border-0"
                    />
                  </object>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                    Carregando visualizador de documento...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md space-y-4 shadow-xl">
                <FileText className="w-14 h-14 text-teal-600 mx-auto" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Documento pronto para leitura
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Arquivo: <strong>{doc.fileName}</strong> ({doc.fileType || 'Documento'})
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-xs hover:bg-teal-700 transition"
                  >
                    <ExternalLink className="w-4 h-4" /> Visualizar em Nova Aba
                  </button>
                  <a
                    href={blobUrl || doc.fileUrl}
                    download={doc.fileName}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition"
                  >
                    <Download className="w-4 h-4" /> Baixar Cópia
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Notes bar at bottom if notes exist */}
          {doc.notes && (
            <div className="p-3 sm:px-4 sm:py-2.5 bg-slate-800/95 dark:bg-slate-900 border-t border-slate-700 text-xs text-slate-200 shrink-0 flex items-start gap-2">
              <span className="font-bold text-teal-400 whitespace-nowrap">
                Observações Clínicas:
              </span>
              <p className="text-slate-300 line-clamp-2">{doc.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
