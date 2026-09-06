import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FolderPlus, FileText, Upload, Paperclip, X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';

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
  const [category, setCategory] = useState<'ATESTADO' | 'LAUDO' | 'EXAM' | 'IMAGE' | 'PDF' | 'OTHER'>('ATESTADO');
  const [fileName, setFileName] = useState('');
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('application/pdf');
  const [fileSize, setFileSize] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const processFile = (file: File) => {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !fileName.trim() || !fileUrl) {
      alert('Por favor, selecione um arquivo (PDF ou Imagem) e dê um nome ao documento.');
      return;
    }

    setIsUploading(true);
    try {
      await api.uploadDocument(
        patientId,
        tenant.id,
        {
          fileName: fileName.trim(),
          fileType,
          fileSize: fileSize || 256000,
          fileUrl,
          category,
          notes: notes.trim(),
        },
        user
      );
      onDocumentUploaded();
      // Reset form
      setFileName('');
      setNotes('');
      setFileUrl('');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao anexar documento. Verifique o arquivo e tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const isImage = fileType.toLowerCase().includes('image') || fileUrl.startsWith('data:image');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Anexar Atestado / Laudo de Saúde
              </h3>
              <p className="text-[11px] text-slate-500">
                Ficha do Cliente: <strong className="text-slate-700 dark:text-slate-300">{patientName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Category */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Tipo / Categoria do Documento <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-bold cursor-pointer"
            >
              <option value="ATESTADO">📋 Atestado Médico (Liberação / Afastamento)</option>
              <option value="LAUDO">📑 Laudo Clínico / Fisioterapêutico</option>
              <option value="EXAM">🔬 Exame de Imagem (RX, Ressonância, Tomografia)</option>
              <option value="IMAGE">📷 Foto / Registro de Lesão ou Ponto de Dor</option>
              <option value="PDF">📄 Documento em PDF Geral</option>
              <option value="OTHER">📁 Outro Documento Complementar</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Título / Nome do Documento <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              placeholder="Ex: Atestado Ortopédico de Liberação - Dr. Marcos.pdf"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* File Selector & Drag and Drop */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Arquivo (PDF ou Imagem) <span className="text-rose-500">*</span>
            </label>
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`p-4 border-2 border-dashed rounded-2xl transition text-center cursor-pointer ${
                isDragOver
                  ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/20'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-teal-500'
              }`}
            >
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="doc-file-upload-input"
              />
              <label htmlFor="doc-file-upload-input" className="cursor-pointer block space-y-1.5">
                <Upload className="w-7 h-7 text-teal-600 mx-auto" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Clique para selecionar ou arraste o arquivo aqui
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Formatos aceitos: PDF, JPG, PNG, WEBP (Atestados, Laudos, Fotos)
                </span>
              </label>
            </div>

            {/* Preview of selected file */}
            {fileUrl && (
              <div className="mt-3 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {isImage ? (
                    <img
                      src={fileUrl}
                      alt="Prévia"
                      className="w-10 h-10 object-cover rounded-lg border border-teal-200 dark:border-teal-800 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-teal-200 dark:bg-teal-900 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-teal-900 dark:text-teal-200 truncate">
                      {fileName || 'Arquivo pronto para envio'}
                    </p>
                    <p className="text-[10px] text-teal-700 dark:text-teal-400">
                      {fileSize ? formatFileSize(fileSize) : 'Tamanho calibrado'} • {isImage ? 'Imagem' : 'Documento PDF'}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" /> Pronto
                </span>
              </div>
            )}
          </div>

          {/* Observations */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Observações / Instruções Clínicas (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Atestado liberando para drenagem linfática com restrição na perna esquerda..."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading || !fileUrl || !fileName.trim()}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold disabled:opacity-40 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isUploading ? (
                <>Anexando Documento...</>
              ) : (
                <>
                  <Paperclip className="w-4 h-4" /> Salvar na Ficha do Cliente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
