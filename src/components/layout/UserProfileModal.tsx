import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { useAuth } from '../../context/AuthContext';
import { Shield, Mail, Phone, Award, User as UserIcon, Check } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [councilNumber, setCouncilNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');
      setSpecialty(user.specialty || '');
      setCouncilNumber(user.councilNumber || '');
      setSuccessMessage('');
    }
  }, [user, isOpen]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');

    try {
      await updateUserProfile({
        name,
        phone,
        avatarUrl: avatarUrl || undefined,
        specialty,
        councilNumber,
      });
      setSuccessMessage('Perfil e foto atualizados com sucesso!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar alterações de perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Meu Perfil Profissional"
      subtitle="Gerencie suas informações e foto de exibição"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {successMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {successMessage}
          </div>
        )}

        {/* Photo Upload */}
        <div>
          <ImageUploadInput
            label="Sua Foto de Perfil (Opcional)"
            value={avatarUrl}
            onChange={setAvatarUrl}
            fallbackInitials={name || 'U'}
            helperText="Esta foto será exibida no cabeçalho, prontuários assinados e listagens do sistema."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Nome Completo
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              E-mail de Acesso (Login)
            </label>
            <div className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Especialidade Principal
            </label>
            <input
              type="text"
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              placeholder="Ex: Fisioterapia Esportiva"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Nº Registro / Conselho (CREFITO/etc.)
            </label>
            <input
              type="text"
              value={councilNumber}
              onChange={e => setCouncilNumber(e.target.value)}
              placeholder="Ex: CREFITO 12345-F"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
            />
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
