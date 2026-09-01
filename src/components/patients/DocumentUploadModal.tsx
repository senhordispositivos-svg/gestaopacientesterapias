import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FolderPlus, FileText, Upload, Paperclip, X } from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onDocumentUploaded: () => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  onDocumentUploaded,
}) => {
  const { tenant, user } = useAuth();
  const [category, setCategory] = useState<'ATESTADO' | 'PDF' | 'EXAM' | 'LAUDO' | 'IMAGE' | 'OTHER'>('ATESTADO');
  const [fileName, setFileName] = useState('');
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('application/pdf');
  const [fileSize, setFileSize] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!fileName) {
      setFileName(file.name);
    }
    setFileType(file.type || 'application/pdf');
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = event => {
      if (event.target?.result) {
        setFileUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !fileName || !fileUrl) {
      alert('Por favor selecione um arquivo ou forneça o documento.');
      return;
    }

    setIsUploading(true);
    try {
      await api.uploadDocument(
        patientId,
        tenant.id,
        {
          fileName,
          fileType,
          fileSize: fileSize || 256000,
          fileUrl,
          category,
          notes,
        },
        user
      );
      onDocumentUploaded();
      onClose();
    } catch (err) {
      alert('Erro ao anexar documento.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Anexar Documento / Atestado</h3>
              <p className="text-[11px] text-slate-500">Paciente: {patientName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Categoria do Documento
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-bold"
            >
              <option value="ATESTADO">ATESTADO MÉDICO</option>
              <option value="EXAM">EXAME CLÍNICO / IMAGEM</option>
              <option value="LAUDO">LAUDO / ENCAMINHAMENTO</option>
              <option value="PDF">DOCUMENTO EM PDF</option>
              <option value="IMAGE">FOTO / IMAGEM ILUSTRATIVA</option>
              <option value="OTHER">OUTRO DOCUMENTO</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Nome do Documento / Título
            </label>
            <input
              type="text"
              required
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              placeholder="Ex: Atestado Ortopédico - Dr. Carlos.pdf"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* File Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Arquivo (PDF ou Imagem)
            </label>
            <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center hover:border-teal-500 transition cursor-pointer">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer block space-y-1">
                <Upload className="w-6 h-6 text-teal-600 mx-auto" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Clique aqui para selecionar o arquivo no computador ou tablet
                </span>
                <span className="text-[10px] text-slate-400 block">PDF, JPG, PNG até 10MB</span>
              </label>
            </div>

            {fileUrl && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                <Paperclip className="w-4 h-4 shrink-0" />
                <span className="truncate">{fileName || 'Arquivo selecionado e pronto para envio'}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Observações / Notas do Documento
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Atestado de afastamento temporário por 5 dias..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading || !fileUrl}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold disabled:opacity-40"
            >
              {isUploading ? 'Anexando...' : 'Salvar Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
