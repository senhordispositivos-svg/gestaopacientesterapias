import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { useAuth } from '../../context/AuthContext';
import { Building2, Sparkles, Check, Globe, MapPin, Phone, Mail, FileText, Palette } from 'lucide-react';
import { formatPhone, formatCEP } from '../../utils/cpf';

interface ClinicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicProfileModal: React.FC<ClinicProfileModalProps> = ({ isOpen, onClose }) => {
  const { tenant, updateTenantConfig, user } = useAuth();

  const [tradeName, setTradeName] = useState('');
  const [corporateName, setCorporateName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [customHeader, setCustomHeader] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0d9488');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (tenant && isOpen) {
      setTradeName(tenant.tradeName || tenant.name || '');
      setCorporateName(tenant.corporateName || '');
      setDocumentNumber(tenant.documentNumber || '');
      setEmail(tenant.email || '');
      setPhone(tenant.phone || '');
      setCity(tenant.city || '');
      setState(tenant.state || '');
      setAddress(tenant.address || '');
      setLogoUrl(tenant.logoUrl || '');
      setCustomHeader(tenant.customHeader || '');
      setPrimaryColor(tenant.primaryColor || '#0d9488');
      setSuccessMessage('');
    }
  }, [tenant, isOpen]);

  if (!tenant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');

    try {
      await updateTenantConfig({
        tradeName,
        name: tradeName,
        corporateName,
        documentNumber,
        email,
        phone,
        city,
        state,
        address,
        logoUrl: logoUrl || undefined,
        customHeader: customHeader || `${tradeName} - Fisioterapia e Massoterapia Integrativa`,
        primaryColor,
      });

      setSuccessMessage('Logomarca e perfil da clínica atualizados com sucesso!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1300);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar as configurações e logomarca da clínica.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Perfil & Logomarca da Empresa / Clínica"
      subtitle="Defina a logomarca oficial e os dados visuais da clínica"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {successMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Upload de Logomarca */}
        <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <ImageUploadInput
            label="Logomarca Oficial da Empresa / Clínica"
            value={logoUrl}
            onChange={setLogoUrl}
            shape="square"
            fallbackInitials={tradeName || 'C'}
            helperText="A logomarca será exibida no menu lateral, topo do sistema, cabeçalhos de prontuários impressos e relatórios em PDF."
          />
        </div>

        {/* Informações Básicas da Empresa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Nome Fantasia da Clínica
            </label>
            <input
              type="text"
              required
              value={tradeName}
              onChange={e => setTradeName(e.target.value)}
              placeholder="Ex: Clínica Equilíbrio & Bem-Estar"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Razão Social
            </label>
            <input
              type="text"
              value={corporateName}
              onChange={e => setCorporateName(e.target.value)}
              placeholder="Ex: Equilíbrio Servicos de Saude Ltda"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              CNPJ / CPF
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={e => setDocumentNumber(e.target.value)}
              placeholder="00.000.000/0001-00"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Telefone / WhatsApp Comercial
            </label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              placeholder="(11) 98765-4321"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              E-mail de Contato
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="contato@clinica.com.br"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Cidade
            </label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="São Paulo"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Estado (UF)
            </label>
            <input
              type="text"
              value={state}
              onChange={e => setState(e.target.value.toUpperCase())}
              maxLength={2}
              placeholder="SP"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium uppercase"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Cabeçalho Personalizado para Prontuários & Impressões
            </label>
            <input
              type="text"
              value={customHeader}
              onChange={e => setCustomHeader(e.target.value)}
              placeholder="Ex: Clínica Equilíbrio - Fisioterapia e Terapias Manuais"
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
            className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSaving ? 'Salvando...' : 'Salvar Logomarca e Dados'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
