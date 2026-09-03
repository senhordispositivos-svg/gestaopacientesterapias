import React, { useState, useEffect, useRef } from 'react';
import { Settings, Building2, Palette, MessageSquare, Check, Sparkles, Save, Headset, Mail, PhoneCall, Code2, Lock, Unlock, ShieldCheck, Database, Download, RefreshCw, Server, Activity, AlertCircle, Loader2, Image as ImageIcon, MapPin, Search, Plus, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatCNPJ, formatPhone, formatCEP } from '../../utils/cpf';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { DbConnectionTestModal } from '../database/DbConnectionTestModal';
import { ClinicProfileModal } from '../layout/ClinicProfileModal';

// Preset elegant clinic logos that can be chosen with 1 click
const PRESET_LOGOS = [
  {
    name: 'Ícone Saúde & Bem-Estar',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=240&auto=format&fit=crop&q=80',
  },
  {
    name: 'Ícone Fisioterapia Movimento',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=240&auto=format&fit=crop&q=80',
  },
  {
    name: 'Ícone Coluna & Reabilitação',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=240&auto=format&fit=crop&q=80',
  },
  {
    name: 'Ícone Flor de Lótus & Terapias',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=240&auto=format&fit=crop&q=80',
  },
];

interface SettingsViewProps {
  onUpdate?: () => void;
  onNavigateToBackup?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onUpdate, onNavigateToBackup }) => {
  const { user, tenant, updateTenantConfig, allTenants, switchTenant } = useAuth();

  const [tradeName, setTradeName] = useState('');
  const [corporateName, setCorporateName] = useState('');
  const [docType, setDocType] = useState<'CPF' | 'CNPJ'>('CNPJ');
  const [documentNumber, setDocumentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0d9488');
  const [secondaryColor, setSecondaryColor] = useState('#0f766e');
  const [customHeader, setCustomHeader] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState<'CONFIGURED' | 'NOT_CONFIGURED'>('NOT_CONFIGURED');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');

  // Super User / Developer Edit Lock Mode
  const [isSuperUserMode, setIsSuperUserMode] = useState(false);
  const [isDbTestModalOpen, setIsDbTestModalOpen] = useState(false);
  const [isClinicProfileModalOpen, setIsClinicProfileModalOpen] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const initialTenantIdRef = useRef<string | null>(null);

  // Load tenant into state, but DO NOT wipe fields if the user has unsaved edits
  useEffect(() => {
    if (tenant) {
      const isNewTenant = initialTenantIdRef.current !== tenant.id;
      if (isNewTenant || !isDirty) {
        initialTenantIdRef.current = tenant.id;
        setTradeName(tenant.tradeName || tenant.name || '');
        setCorporateName(tenant.corporateName || '');
        setDocType(tenant.docType || 'CNPJ');
        setDocumentNumber(tenant.documentNumber || '');
        setEmail(tenant.email || '');
        setPhone(tenant.phone || '');
        setCep(tenant.cep || '');
        setAddress(tenant.address || '');
        setNumber(tenant.number || '');
        setComplement(tenant.complement || '');
        setNeighborhood(tenant.neighborhood || '');
        setCity(tenant.city || '');
        setState(tenant.state || '');
        setLogoUrl(tenant.logoUrl || '');
        setPrimaryColor(tenant.primaryColor || '#0d9488');
        setSecondaryColor(tenant.secondaryColor || '#0f766e');
        setCustomHeader(tenant.customHeader || '');
        setWhatsappToken(tenant.whatsappConfig?.token || '');
        setWhatsappPhoneId(tenant.whatsappConfig?.phoneNumberId || '');
        setWhatsappStatus(tenant.whatsappConfig?.status || 'NOT_CONFIGURED');
        setSupportEmail(tenant.supportEmail || 'suporte@fisiomassoterapia.com.br');
        setSupportPhone(tenant.supportPhone || '(11) 98765-4321');
      }
    }
  }, [tenant, isDirty]);

  const handleSearchCep = async (cepValue: string) => {
    const clean = cepValue.replace(/\D/g, '');
    if (clean.length !== 8) return;
    setIsLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        if (data.logradouro) setAddress(data.logradouro);
        if (data.bairro) setNeighborhood(data.bairro);
        if (data.localidade) setCity(data.localidade);
        if (data.uf) setState(data.uf);
        setIsDirty(true);
      }
    } catch (err) {
      console.warn('Erro ao consultar ViaCEP:', err);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tenant) return;

    setIsSaving(true);
    setSaveFeedback(null);

    try {
      const updatedClinicName = tradeName.trim() || corporateName.trim() || tenant.name || 'Minha Clínica';

      await updateTenantConfig({
        name: updatedClinicName,
        tradeName: updatedClinicName,
        corporateName: corporateName.trim(),
        docType,
        documentNumber: documentNumber.trim(),
        email: email.trim(),
        phone: phone.trim(),
        cep: cep.trim(),
        address: address.trim(),
        number: number.trim(),
        complement: complement.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim(),
        logoUrl: logoUrl.trim(),
        primaryColor,
        secondaryColor,
        customHeader: customHeader.trim() || `${updatedClinicName} - Fisioterapia e Massoterapia Integrativa`,
        supportEmail: supportEmail.trim(),
        supportPhone: supportPhone.trim(),
        creatorName: 'Osaias Brito',
        whatsappConfig: {
          token: whatsappToken.trim(),
          phoneNumberId: whatsappPhoneId.trim(),
          status: whatsappToken.trim() ? 'CONFIGURED' : 'NOT_CONFIGURED',
        },
      });


      setIsDirty(false);
      setIsSaved(true);
      setSaveFeedback('Configurações e logomarca da empresa salvas com sucesso!');

      if (onUpdate) onUpdate();
      setTimeout(() => {
        setIsSaved(false);
        setSaveFeedback(null);
      }, 4000);
    } catch (err) {
      console.error('Erro ao salvar tenant:', err);
      setSaveFeedback('Erro ao salvar as configurações. Tente novamente.');
      alert('Erro ao salvar alterações da empresa. Verifique a conexão e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Instant Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            Configurações do Tenant & White Label
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Personalize a identidade visual, logo, cores, endereço e dados oficiais da empresa.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {saveFeedback && (
            <div className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              isSaved
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
            }`}>
              {isSaved ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{saveFeedback}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-teal-500/20 transition cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>

      {isDirty && !isSaved && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Você tem edições não salvas no cadastro da empresa ou logomarca.</span>
          </div>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Salvar Agora
          </button>
        </div>
      )}

      {/* Clinic Selector / Multi-Tenancy bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-teal-400 uppercase font-bold tracking-wider">Clínica Ativa no Sistema</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{tenant?.tradeName || tenant?.name || 'Clínica Principal'}</span>
              <span className="text-xs text-slate-400 font-normal">
                ({tenant?.city || 'São Paulo'}/{tenant?.state || 'SP'})
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs text-slate-300 font-medium">Trocar Unidade:</div>
          <select
            value={tenant?.id || ''}
            onChange={(e) => {
              if (e.target.value) {
                switchTenant(e.target.value);
                setIsDirty(false);
              }
            }}
            className="bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-lg px-3 py-2 focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            {allTenants.map(t => (
              <option key={t.id} value={t.id}>
                {t.tradeName || t.name} ({t.city || 'São Paulo'}/{t.state || 'SP'})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsClinicProfileModalOpen(true)}
            className="px-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Cadastrar Outra Clínica</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Dados da Empresa & Endereço Completo */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" /> 1. Cadastro Geral e Endereço da Empresa / Clínica
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Unidade atual: <strong className="text-teal-600 dark:text-teal-400">{tenant?.tradeName || tenant?.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Nome Fantasia (Nome da Clínica) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Clínica Fisio Integrada"
                value={tradeName}
                onChange={e => {
                  setTradeName(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Razão Social</label>
              <input
                type="text"
                placeholder="Ex: Clínica Fisio Integrada LTDA"
                value={corporateName}
                onChange={e => {
                  setCorporateName(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">CNPJ / CPF</label>
              <input
                type="text"
                placeholder="00.000.000/0001-00"
                value={documentNumber}
                onChange={e => {
                  setDocumentNumber(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">E-mail Comercial</label>
              <input
                type="email"
                placeholder="contato@clinica.com.br"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Telefone / WhatsApp</label>
              <input
                type="text"
                placeholder="(11) 98765-4321"
                value={phone}
                onChange={e => {
                  setPhone(formatPhone(e.target.value));
                  setIsDirty(true);
                }}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-teal-500 focus:outline-none"
              />
            </div>

            {/* CEP com busca automática */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>CEP</span>
                {isLoadingCep && <span className="text-[10px] text-teal-600 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Buscando...</span>}
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  placeholder="00000-000"
                  maxLength={9}
                  value={cep}
                  onChange={e => {
                    const formatted = formatCEP(e.target.value);
                    setCep(formatted);
                    setIsDirty(true);
                    if (formatted.replace(/\D/g, '').length === 8) {
                      handleSearchCep(formatted);
                    }
                  }}
                  className="w-full p-2.5 pr-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-teal-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSearchCep(cep)}
                  title="Consultar CEP via ViaCEP"
                  className="absolute right-2 top-2.5 text-slate-400 hover:text-teal-600 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Endereço / Logradouro */}
            <div className="md:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-teal-600" /> Endereço / Logradouro (Rua, Av.)
              </label>
              <input
                type="text"
                placeholder="Ex: Av. Paulista"
                value={address}
                onChange={e => {
                  setAddress(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-teal-500 focus:outline-none"
              />
            </div>

            {/* Número */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Número</label>
              <input
                type="text"
                placeholder="Ex: 1500"
                value={number}
                onChange={e => {
                  setNumber(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-teal-500 focus:outline-none"
              />
            </div>

            {/* Complemento */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Complemento</label>
              <input
                type="text"
                placeholder="Ex: Sala 42, Bloco B"
                value={complement}
                onChange={e => {
                  setComplement(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-teal-500 focus:outline-none"
              />
            </div>

            {/* Bairro */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Bairro</label>
              <input
                type="text"
                placeholder="Ex: Bela Vista"
                value={neighborhood}
                onChange={e => {
                  setNeighborhood(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-teal-500 focus:outline-none"
              />
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Cidade</label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo"
                  value={city}
                  onChange={e => {
                    setCity(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">UF</label>
                <input
                  type="text"
                  placeholder="SP"
                  maxLength={2}
                  value={state}
                  onChange={e => {
                    setState(e.target.value.toUpperCase());
                    setIsDirty(true);
                  }}
                  className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-teal-500 focus:outline-none uppercase"
                />
              </div>
            </div>
          </div>
        </div>


        {/* Section 2: White Label & Identidade Visual */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Palette className="w-4 h-4 text-teal-600" /> 2. Personalização White Label & Cores
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2 space-y-3">
              <ImageUploadInput
                label="Logomarca Oficial da Empresa (Logotipo)"
                value={logoUrl}
                onChange={url => {
                  setLogoUrl(url);
                  setIsDirty(true);
                }}
                shape="square"
                fallbackInitials={tradeName || 'E'}
                helperText="Upload direto por arrastar/soltar ou arquivo PNG/JPG. A logomarca é aplicada no cabeçalho do sistema, menu lateral e relatórios."
              />

              {/* Quick Model Logos */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                  Ou selecione uma logomarca modelo para sua clínica:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_LOGOS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLogoUrl(preset.url);
                        setIsDirty(true);
                      }}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                        logoUrl === preset.url
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 ring-2 ring-teal-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-teal-400 bg-slate-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-7 h-7 rounded-lg object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[10px] font-medium leading-tight truncate">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Cor Principal (Tema)</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => {
                    setPrimaryColor(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-10 h-9 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => {
                    setPrimaryColor(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Cabeçalho de Documentos e Prontuários Impressos
              </label>
              <input
                type="text"
                value={customHeader}
                onChange={e => {
                  setCustomHeader(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Texto para ser exibido nos relatórios e prontuários..."
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Dedicated Section 2 Save Button */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {logoUrl ? 'Logomarca selecionada e pronta para salvar.' : 'Adicione uma logomarca ou use a inicial da clínica.'}
            </p>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar Dados da Empresa & Logomarca
            </button>
          </div>
        </div>

        {/* Section 3: WhatsApp Business API Config */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <MessageSquare className="w-4 h-4 text-teal-600" /> 3. Integração WhatsApp Business API
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                API Token de Acesso Meta / WhatsApp
              </label>
              <input
                type="password"
                value={whatsappToken}
                onChange={e => setWhatsappToken(e.target.value)}
                placeholder="EAAG..."
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Phone Number ID (Meta Cloud API)
              </label>
              <input
                type="text"
                value={whatsappPhoneId}
                onChange={e => setWhatsappPhoneId(e.target.value)}
                placeholder="10928374..."
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Suporte Técnico & Atendimento ao Usuário (Exclusivo Super Usuário / Desenvolvedor) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Headset className="w-4 h-4 text-teal-600" /> 4. Canais de Contato para Suporte Técnico
            </h3>

            {/* Toggle Super User / Developer Edit Permission */}
            <button
              type="button"
              onClick={() => setIsSuperUserMode(!isSuperUserMode)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                isSuperUserMode
                  ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isSuperUserMode ? <Unlock className="w-3.5 h-3.5 text-white" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
              {isSuperUserMode ? 'Modo Desenvolvedor (Liberado)' : 'Alternar para Modo Super Usuário'}
            </button>
          </div>

          {/* Super User Access Status Banner */}
          {!isSuperUserMode ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-xs">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-amber-900 dark:text-amber-100">
                  Apenas Leitura • Cadastro de Suporte Restrito ao Desenvolvedor / Super Usuário
                </p>
                <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                  O cadastro e edição do e-mail e telefone do suporte técnico da plataforma são exclusivos do <strong>Desenvolvedor (Osaias Brito / Super Usuário)</strong>. Todos os usuários da clínica podem utilizar os botões de ação rápida abaixo para falar diretamente com o suporte.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5 text-emerald-900 dark:text-emerald-200 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-emerald-900 dark:text-emerald-100">
                  Modo Super Usuário Ativo (Desenvolvedor Osaias Brito)
                </p>
                <p className="mt-0.5 text-emerald-800 dark:text-emerald-300">
                  Permissão de alteração concedida. Atualize os dados de e-mail e WhatsApp do suporte oficial que serão disponibilizados para todos os clientes da plataforma.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-600" /> E-mail de Suporte Técnico
                </span>
                {!isSuperUserMode && (
                  <span className="text-[10px] font-extrabold text-amber-600 flex items-center gap-1 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" /> Exclusivo Super Usuário
                  </span>
                )}
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
                disabled={!isSuperUserMode}
                placeholder="suporte@fisiomassoterapia.com.br"
                className={`w-full p-2.5 rounded-lg border transition ${
                  isSuperUserMode
                    ? 'border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-teal-600" /> Telefone / WhatsApp de Suporte
                </span>
                {!isSuperUserMode && (
                  <span className="text-[10px] font-extrabold text-amber-600 flex items-center gap-1 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" /> Exclusivo Super Usuário
                  </span>
                )}
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={e => setSupportPhone(formatPhone(e.target.value))}
                disabled={!isSuperUserMode}
                placeholder="(11) 98765-4321"
                className={`w-full p-2.5 rounded-lg border transition ${
                  isSuperUserMode
                    ? 'border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* Direct Support Quick Actions */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {supportPhone && (
              <a
                href={`https://wa.me/55${supportPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Abrir WhatsApp do Suporte
              </a>
            )}

            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition"
              >
                <Mail className="w-3.5 h-3.5 text-teal-600" /> Enviar E-mail para {supportEmail}
              </a>
            )}
          </div>
        </div>

        {/* Section 5: Backup & Segurança de Dados do Banco */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" /> 5. Banco de Dados & Segurança
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              Gravação Atômica Ativa
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Proteção Permanente & Conectividade
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Diagnóstico em tempo real da conexão com PostgreSQL/Supabase e verificação de snapshots atômicos.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsDbTestModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center justify-center gap-2 shrink-0 shadow-sm transition cursor-pointer"
              >
                <Server className="w-4 h-4 text-teal-400" /> Testar Conexão com Banco
              </button>

              {onNavigateToBackup && (
                <button
                  type="button"
                  onClick={onNavigateToBackup}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 shadow-sm transition cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Central de Backup
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section 6: Criador do Aplicativo */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-extrabold text-teal-300 tracking-wider">
                Desenvolvimento & Autoria do Sistema
              </p>
              <h4 className="text-base font-black text-white">Criado por Osaias Brito</h4>
              <p className="text-xs text-slate-300">
                Gerenciamento Especializado para Clínicas de Fisioterapia e Massoterapia
              </p>
            </div>
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-200 text-xs font-bold whitespace-nowrap">
            Versão 2.5 • Premium
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saveFeedback ? (
            <p className={`text-xs font-semibold ${isSaved ? 'text-emerald-600' : 'text-rose-600'}`}>
              {saveFeedback}
            </p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Salvando Configurações...' : 'Salvar Todas as Configurações'}
          </button>
        </div>
      </form>

      <DbConnectionTestModal
        isOpen={isDbTestModalOpen}
        onClose={() => setIsDbTestModalOpen(false)}
      />

      <ClinicProfileModal
        isOpen={isClinicProfileModalOpen}
        onClose={() => setIsClinicProfileModalOpen(false)}
      />
    </div>
  );
};
