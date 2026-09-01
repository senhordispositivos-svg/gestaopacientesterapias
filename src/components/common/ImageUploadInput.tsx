import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Link, Image as ImageIcon, Check } from 'lucide-react';

interface ImageUploadInputProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  shape?: 'circle' | 'square';
  fallbackInitials?: string;
  helperText?: string;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  label = 'Foto de Perfil (Opcional)',
  value,
  onChange,
  shape = 'circle',
  fallbackInitials = '?',
  helperText = 'Formatos suportados: JPG, PNG, WebP (Máx. 5MB). O envio é opcional.',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image to lightweight Base64 to ensure smooth local and database storage
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem selecionada é muito grande. O tamanho máximo permitido é 5MB.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 480;
        const MAX_HEIGHT = 480;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onChange(compressedDataUrl);
        } else {
          onChange(e.target?.result as string);
        }
        setIsProcessing(false);
      };

      img.onerror = () => {
        setIsProcessing(false);
        alert('Não foi possível processar a imagem.');
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setIsProcessing(false);
      alert('Erro ao carregar o arquivo.');
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (tempUrl.trim()) {
      onChange(tempUrl.trim());
      setTempUrl('');
      setShowUrlInput(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            {label}
          </label>
          <span className="text-[11px] font-medium text-slate-400">
            {value ? 'Foto carregada' : 'Opcional'}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80">
        {/* Avatar / Image Preview */}
        <div className="relative shrink-0 group">
          <div
            className={`w-16 h-16 sm:w-18 sm:h-18 ${
              shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
            } bg-slate-200 dark:bg-slate-700 border-2 border-dashed ${
              isDragging ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40' : 'border-slate-300 dark:border-slate-600'
            } overflow-hidden flex items-center justify-center text-slate-400 shadow-2xs relative transition`}
          >
            {value ? (
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="font-black text-xl text-slate-500 dark:text-slate-400 uppercase select-none">
                {fallbackInitials.charAt(0)}
              </span>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {value && (
            <button
              type="button"
              onClick={handleRemove}
              title="Remover foto"
              className="absolute -top-1.5 -right-1.5 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md transition cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Upload Controls & Drag Area */}
        <div className="flex-1 w-full space-y-2">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl p-2.5 sm:p-3 text-center cursor-pointer transition flex items-center justify-center gap-2 ${
              isDragging
                ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                : 'border-slate-300 dark:border-slate-600 hover:border-teal-500 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-xs font-bold truncate">
                {value ? 'Alterar foto' : 'Selecionar ou arrastar foto'}
              </p>
              <p className="text-[10px] text-slate-400 hidden sm:block truncate">
                Clique para navegar ou solte a imagem aqui
              </p>
            </div>
          </div>

          {/* Optional Action to Paste Image URL */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Link className="w-3 h-3" />
              {showUrlInput ? 'Ocultar campo de link' : 'Inserir link da foto'}
            </button>

            {value && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-[11px] text-rose-500 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Remover
              </button>
            )}
          </div>

          {showUrlInput && (
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="url"
                value={tempUrl}
                onChange={e => setTempUrl(e.target.value)}
                placeholder="https://exemplo.com/minha-foto.jpg"
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Aplicar
              </button>
            </div>
          )}
        </div>
      </div>

      {helperText && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
          {helperText}
        </p>
      )}
    </div>
  );
};
