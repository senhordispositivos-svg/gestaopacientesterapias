import React from 'react';
import { DocumentFile } from '../../types';
import { X, Download, FileText, Calendar, User, ExternalLink } from 'lucide-react';
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
  if (!isOpen || !doc) return null;

  const isPdf =
    doc.fileType?.toLowerCase().includes('pdf') ||
    doc.fileName?.toLowerCase().endsWith('.pdf') ||
    doc.fileUrl?.startsWith('data:application/pdf');

  const isImage =
    doc.fileType?.toLowerCase().includes('image') ||
    doc.fileUrl?.startsWith('data:image') ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(doc.fileName);

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {doc.fileName}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getCategoryBadge(
                    doc.category
                  )}`}
                >
                  {getCategoryLabel(doc.category)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                {patientName && <span>Paciente: <strong>{patientName}</strong> •</span>}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {formatDate(doc.uploadedAt)}
                </span>
                {doc.uploadedByName && (
                  <span className="flex items-center gap-1">
                    • <User className="w-3 h-3" /> Anexado por {doc.uploadedByName}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={doc.fileUrl}
              download={doc.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <Download className="w-4 h-4" /> Baixar
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content viewer */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950/60 min-h-[350px]">
          {isImage ? (
            <div className="max-w-full max-h-[60vh] flex items-center justify-center p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <img
                src={doc.fileUrl}
                alt={doc.fileName}
                className="max-h-[58vh] max-w-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-[62vh] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white shadow-xs">
              <iframe
                src={doc.fileUrl}
                title={doc.fileName}
                className="w-full h-full border-none"
              />
            </div>
          ) : (
            <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md space-y-3">
              <FileText className="w-12 h-12 text-teal-600 mx-auto" />
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Documento disponível para download
              </p>
              <p className="text-xs text-slate-500">
                O formato deste arquivo ({doc.fileType}) pode ser visualizado após o download.
              </p>
              <a
                href={doc.fileUrl}
                download={doc.fileName}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-xs hover:bg-teal-700"
              >
                <Download className="w-4 h-4" /> Baixar {doc.fileName}
              </a>
            </div>
          )}

          {doc.notes && (
            <div className="w-full mt-4 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                Notas & Observações Clínicas do Arquivo:
              </span>
              <p className="text-slate-600 dark:text-slate-400">{doc.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
