import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { useAuth } from '../../context/AuthContext';
import { Building2, Sparkles, Check, Globe, MapPin, Phone, Mail, FileText, Palette, Search, Plus, Loader2 } from 'lucide-react';
import { formatPhone, formatCEP, formatCNPJ } from '../../utils/cpf';
import { Tenant } from '../../types';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface ClinicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClinicId?: string;
}

export const ClinicProfileModal: React.FC<ClinicProfileModalProps> = ({ isOpen, onClose, initialClinicId }) => {
  const { tenant, allTenants, switchTenant, updateTenantConfig, createClinic, user, refreshTenantData } = useAuth();

  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenant?.id || '');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form Fields
  const [tradeName, setTradeName] = useState('');
  const [corporateName, setCorporateName] = useState('');
  const [docType, setDocType] = useState<'CNPJ' | 'CPF'>('CNPJ');
  const [documentNumber, setDocumentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [logoUrl, setLogoUrl] = useState('');
  const [customHeader, setCustomHeader] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0d9488');
  
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Track the tenant ID loaded into form state so polling/background sync never erases user edits
  const loadedTenantKeyRef = useRef<string | null>(null);

  // Helper to load tenant values into form state
  const loadTenantIntoForm = (target: Tenant | null | undefined) => {
    if (!target) {
      setTradeName('');
      setCorporateName('');
      setDocType('CNPJ');
      setDocumentNumber('');
      setEmail('');
      setPhone('');
      setCep('');
      setAddress('');
      setNumber('');
      setComplement('');
      setNeighborhood('');
      setCity('');
      setState('SP');
      setLogoUrl('');
      setCustomHeader('');
      setPrimaryColor('#0d9488');
      return;
    }

    setTradeName(target.tradeName || target.name || '');
    setCorporateName(target.corporateName || '');
    setDocType(target.docType || 'CNPJ');
    setDocumentNumber(target.documentNumber || '');
    setEmail(target.email || '');
    setPhone(target.phone || '');
    setCep(target.cep || '');
    setAddress(target.address || '');
    setNumber(target.number || '');
    setComplement(target.complement || '');
    setNeighborhood(target.neighborhood || '');
    setCity(target.city || 'São Paulo');
    setState(target.state || 'SP');
    setLogoUrl(target.logoUrl || '');
    setCustomHeader(target.customHeader || '');
    setPrimaryColor(target.primaryColor || '#0d9488');
  };

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      const targetId = initialClinicId || tenant?.id || '';
      setSelectedTenantId(targetId);
      setIsCreatingNew(false);

      const targetTenant = allTenants.find(t => t.id === targetId) || tenant;
      loadTenantIntoForm(targetTenant);
      loadedTenantKeyRef.current = targetId;
      setSuccessMessage('');
      setErrorMessage('');
    } else {
      loadedTenantKeyRef.current = null;
    }
  }, [isOpen, initialClinicId]);

  const handleSelectClinic = (targetId: string) => {
    setSelectedTenantId(targetId);
    setIsCreatingNew(false);
    const targetTenant = allTenants.find(t => t.id === targetId) || (tenant?.id === targetId ? tenant : null);
    loadTenantIntoForm(targetTenant);
    loadedTenantKeyRef.current = targetId;
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleStartCreateNew = () => {
    setIsCreatingNew(true);
    loadTenantIntoForm(null);
    loadedTenantKeyRef.current = '__NEW__';
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleCancelCreateNew = () => {
    setIsCreatingNew(false);
    const targetTenant = allTenants.find(t => t.id === selectedTenantId) || tenant;
    loadTenantIntoForm(targetTenant);
    loadedTenantKeyRef.current = selectedTenantId;
    setSuccessMessage('');
    setErrorMessage('');
  };

  // Automatic CEP Search via ViaCEP
  const handleCepSearch = async (targetCep: string) => {
    const raw = targetCep.replace(/\D/g, '');
    if (raw.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data = await res.json();
      if (!data.erro) {
        if (data.logradouro) setAddress(data.logradouro);
        if (data.bairro) setNeighborhood(data.bairro);
        if (data.localidade) setCity(data.localidade);
        if (data.uf) setState(data.uf);
      }
    } catch (e) {
      console.warn('ViaCEP connection issue:', e);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCep(formatted);
    if (formatted.replace(/\D/g, '').length === 8) {
      handleCepSearch(formatted);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    const cleanTradeName = tradeName.trim();
    const cleanCorporateName = corporateName.trim();
    const cleanName = cleanTradeName || cleanCorporateName;

    if (!cleanName) {
      setErrorMessage('Por favor, informe o Nome da Clínica ou Razão Social antes de salvar.');
      return;
    }

    setIsSaving(true);

    try {
      if (isCreatingNew) {
        // Create new clinic unit
        const created = await createClinic({
          name: cleanName,
          tradeName: cleanTradeName || cleanName,
          corporateName: cleanCorporateName || `${cleanName} Ltda`,
          docType,
          documentNumber: documentNumber.trim(),
          email: email.trim(),
          phone: phone.trim(),
          cep: cep.trim(),
          address: address.trim(),
          number: number.trim(),
          complement: complement.trim(),
          neighborhood: neighborhood.trim(),
          city: city.trim() || 'São Paulo',
          state: state.trim() || 'SP',
          logoUrl: logoUrl.trim(),
          customHeader: customHeader.trim() || `${cleanName} - Fisioterapia e Massoterapia Integrativa`,
          primaryColor,
        });

        await switchTenant(created.id);
        setSelectedTenantId(created.id);
        setIsCreatingNew(false);
        loadedTenantKeyRef.current = created.id;
        setSuccessMessage('Nova clínica cadastrada e ativada com sucesso!');
      } else {
        // Update existing clinic
        const targetId = selectedTenantId || tenant?.id || 'tenant-demo-1';

        await updateTenantConfig(
          {
            name: cleanName,
            tradeName: cleanTradeName || cleanName,
            corporateName: cleanCorporateName,
            docType,
            documentNumber: documentNumber.trim(),
            email: email.trim(),
            phone: phone.trim(),
            cep: cep.trim(),
            address: address.trim(),
            number: number.trim(),
            complement: complement.trim(),
            neighborhood: neighborhood.trim(),
            city: city.trim() || 'São Paulo',
            state: state.trim() || 'SP',
            logoUrl: logoUrl.trim(),
            customHeader: customHeader.trim() || `${cleanName} - Fisioterapia e Massoterapia Integrativa`,
            primaryColor,
          },
          targetId
        );

        if (targetId !== tenant?.id) {
          await switchTenant(targetId);
        }

        try {
          await refreshTenantData(targetId);
        } catch (_) {}

        setSuccessMessage('Dados da clínica salvos e persistidos com sucesso no banco!');
      }

      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Erro ao salvar dados da clínica:', err);
      setErrorMessage('Erro ao salvar as configurações da clínica: ' + (err?.message || 'Tente novamente.'));
    } finally {
      setIsSaving(false);
    }
  };

  const modalFooter = (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-full sm:max-w-xs">
        {address || city ? (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">
              {address ? `${address}${number ? `, ${number}` : ''}` : ''}
              {city ? ` - ${city}/${state}` : ''}
            </span>
          </span>
        ) : (
          <span className="text-slate-400">Preencha os dados e clique em Salvar</span>
        )}
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isSaving}
          className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Salvar Dados da Clínica</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dados da Clínica, Endereço & Identidade Visual"
      subtitle="Edite o nome da clínica, endereço completo, cidade, estado e logomarca oficial"
      maxWidth="2xl"
      footer={modalFooter}
    >
      <form id="clinic-profile-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Clinic Unit Switcher / Creator Header */}
        <div className="bg-slate-100 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Unidade em Edição:
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isCreatingNew ? (
              <>
                <select
                  value={selectedTenantId}
                  onChange={e => handleSelectClinic(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white outline-none focus:border-teal-500 cursor-pointer flex-1 sm:flex-none"
                >
                  {allTenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.tradeName || t.name} ({t.city || 'Cidade'}/{t.state || 'UF'})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleStartCreateNew}
                  className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-teal-600 hover:text-white text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition shrink-0 cursor-pointer"
                  title="Cadastrar uma nova clínica no sistema"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Nova
                </button>

                <button
                  type="submit"
                  form="clinic-profile-form"
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
                  title="Salvar alterações imediatamente"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Salvar
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                  Cadastrando Nova Clínica
                </span>
                <button
                  type="button"
                  onClick={handleCancelCreateNew}
                  className="px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Logomarca Oficial */}
        <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <ImageUploadInput
            label="Logomarca Oficial da Empresa / Clínica"
            value={logoUrl}
            onChange={setLogoUrl}
            shape="square"
            fallbackInitials={tradeName || 'C'}
            helperText="A logomarca é aplicada no banner do dashboard, menu lateral, impressões e relatórios da clínica."
          />
        </div>

        {/* 2. Informações de Identificação */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1">
            <Building2 className="w-3.5 h-3.5 text-teal-600" />
            Identificação da Clínica
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nome da Clínica / Nome Fantasia *
              </label>
              <input
                type="text"
                value={tradeName}
                onChange={e => setTradeName(e.target.value)}
                placeholder="Ex: Clínica Fisio & Terapia Integrada"
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
                placeholder="Ex: Clínica Fisio & Terapia Integrada Ltda"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Documento Oficial
                </label>
                <div className="flex items-center gap-2 text-[10px]">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="docTypeModal"
                      checked={docType === 'CNPJ'}
                      onChange={() => setDocType('CNPJ')}
                    />
                    CNPJ
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="docTypeModal"
                      checked={docType === 'CPF'}
                      onChange={() => setDocType('CPF')}
                    />
                    CPF
                  </label>
                </div>
              </div>
              <input
                type="text"
                value={documentNumber}
                onChange={e => setDocumentNumber(docType === 'CNPJ' ? formatCNPJ(e.target.value) : e.target.value)}
                placeholder={docType === 'CNPJ' ? 'Ex: 00.000.000/0001-00' : 'Ex: 000.000.000-00'}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 3. Localização & Endereço Completo */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            Endereço & Localização da Unidade
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                CEP (com busca automática)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cep}
                  onChange={handleCepChange}
                  onBlur={() => handleCepSearch(cep)}
                  placeholder="Ex: 00000-000"
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleCepSearch(cep)}
                  title="Buscar endereço pelo CEP"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition"
                >
                  {isLoadingCep ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Endereço / Logradouro (Rua, Avenida)
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Ex: Av. Paulista, Rua das Flores"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Número
              </label>
              <input
                type="text"
                value={number}
                onChange={e => setNumber(e.target.value)}
                placeholder="Ex: 120, S/N"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={complement}
                onChange={e => setComplement(e.target.value)}
                placeholder="Ex: Sala 302, Bloco B (opcional)"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Bairro
              </label>
              <input
                type="text"
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                placeholder="Ex: Bela Vista, Centro"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Ex: São Paulo, Rio de Janeiro"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Estado (UF)
              </label>
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium cursor-pointer"
              >
                {BRAZILIAN_STATES.map(uf => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4. Contato Comercial */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1">
            <Phone className="w-3.5 h-3.5 text-teal-600" />
            Canais de Atendimento
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Telefone / WhatsApp Comercial
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                placeholder="Ex: (11) 98765-4321"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                E-mail de Contato da Clínica
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ex: contato@suaclinica.com.br"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
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
                placeholder="Ex: Clínica Fisio & Terapia Integrada - Fisioterapia e Massoterapia"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white focus:border-teal-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* In-Form Primary Action Bar */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-xl">
          <div className="text-xs">
            {successMessage ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" /> {successMessage}
              </span>
            ) : errorMessage ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">{errorMessage}</span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                Os dados salvos serão gravados no banco de dados e refletidos imediatamente.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando no Banco...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Dados da Clínica</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

