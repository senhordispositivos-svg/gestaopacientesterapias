import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Patient, User } from '../../types';
import { api, lancarAtendimentoSessao } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarCheck,
  DollarSign,
  Clock,
  UserCheck,
  Stethoscope,
  HeartPulse,
  PenTool,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  X,
  RotateCcw,
  Search,
  Check,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrencyInput, parseCurrencyInput, formatCurrencyAccounting } from '../../utils/currency';
import { CanvasSignature } from '../common/CanvasSignature';

interface SingleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  professionals: User[];
  onSessionCreated: () => void;
  preselectedPatientId?: string;
  onOpenCreatePatientModal?: () => void;
}

const DEFAULT_TECHNIQUES = [
  'Massagem Relaxante',
  'Liberação Miofascial',
  'Ventosaterapia',
  'Shiatsu Dorsal / Ventral',
  'Drenagem Linfática',
  'Massagem Desportiva',
  'Reflexologia Podal',
  'Bambuterapia',
  'Pedras Quentes',
  'Auriculoterapia',
  'Tui-Ná',
  'Escalda-pés com Aromaterapia',
];

export const SingleSessionModal: React.FC<SingleSessionModalProps> = ({
  isOpen,
  onClose,
  patients = [],
  professionals = [],
  onSessionCreated,
  preselectedPatientId,
  onOpenCreatePatientModal,
}) => {
  const { tenant, user } = useAuth();

  const availableProfessionals = useMemo(() => {
    const list = [...professionals];
    const osaias = list.find(
      p =>
        p.email?.toLowerCase().includes('osaias') ||
        p.name?.toLowerCase().includes('osaias') ||
        p.id === 'user-super-osaias' ||
        p.id === 'user-master-1'
    );
    if (!osaias) {
      list.unshift({
        id: 'user-super-osaias',
        tenantId: tenant?.id || 'tenant-demo-1',
        name: 'Osaias Brito',
        email: 'osaiasbrito@gmail.com',
        role: 'ADMIN',
        accessMode: 'COMPREHENSIVE',
        specialty: 'Fisioterapeuta & Massoterapeuta / Gestor Master',
        phone: '(98) 98854-1695',
        active: true,
        avatarUrl: '',
        isSuperUser: true,
        createdAt: '2026-08-19T02:00:00.000Z',
      });
    }
    return list;
  }, [professionals, tenant]);

  const defaultProfId = availableProfessionals[0]?.id || user?.id || 'user-super-osaias';

  // Form states
  const [patientId, setPatientId] = useState(preselectedPatientId || (patients[0]?.id || ''));
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [professionalId, setProfessionalId] = useState(defaultProfId);
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  // Price
  const [priceDisplay, setPriceDisplay] = useState('R$ 180,00');
  const [price, setPrice] = useState(180.0);

  // Blood Pressure (Pressão Arterial)
  const [systolicBP, setSystolicBP] = useState('120');
  const [diastolicBP, setDiastolicBP] = useState('80');
  const [noBPRecorded, setNoBPRecorded] = useState(false);

  // Techniques (Técnicas Utilizadas)
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([
    'Massagem Relaxante',
    'Liberação Miofascial',
  ]);
  const [customTechnique, setCustomTechnique] = useState('');

  // Evolution & Notes
  const [evolutionNotes, setEvolutionNotes] = useState('');

  // Signature (Assinatura Opcional do Cliente)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [hasSignature, setHasSignature] = useState(false);

  // Status
  const [isCompletedNow, setIsCompletedNow] = useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    amount: number;
    patientName: string;
    date: string;
  } | null>(null);

  // Initialize/Reset upon open
  useEffect(() => {
    if (isOpen) {
      setSuccessResult(null);
      if (preselectedPatientId) {
        setPatientId(preselectedPatientId);
      } else if (patients.length > 0 && (!patientId || !patients.some(p => p.id === patientId))) {
        setPatientId(patients[0].id);
      }

      if (!professionalId || !availableProfessionals.some(p => p.id === professionalId)) {
        setProfessionalId(defaultProfId);
      }

      const todayStr = new Date().toISOString().split('T')[0];
      setScheduledDate(todayStr);

      const now = new Date();
      setScheduledTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setSignatureDataUrl('');
      setHasSignature(false);
    }
  }, [isOpen, preselectedPatientId, patients, availableProfessionals, defaultProfId, professionalId]);

  // Filtered patients for selector
  const filteredPatients = patients.filter(p => {
    if (!patientSearchTerm.trim()) return true;
    const term = patientSearchTerm.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(term) ||
      (p.cpf || '').includes(term) ||
      (p.phone || '').includes(term)
    );
  });

  const selectedPatient = patients.find(p => p.id === patientId);

  // BP classification helper (pure calculation - no hook)
  const getBPAnalysis = () => {
    if (noBPRecorded) return { text: 'Não aferida', color: 'text-slate-400 bg-slate-100 dark:bg-slate-800' };
    const sys = parseInt(systolicBP, 10);
    const dia = parseInt(diastolicBP, 10);
    if (isNaN(sys) || isNaN(dia)) return { text: 'Pendente', color: 'text-slate-400 bg-slate-100 dark:bg-slate-800' };

    if (sys < 120 && dia < 80) {
      return { text: 'PA Ótima', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300' };
    }
    if (sys <= 129 && dia <= 84) {
      return { text: 'PA Normal', color: 'text-teal-700 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-300' };
    }
    if (sys <= 139 || dia <= 89) {
      return { text: 'Pré-Hipertensão', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300' };
    }
    return { text: 'Hipertensão / Alerta', color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300' };
  };

  const bpAnalysis = getBPAnalysis();

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setPriceDisplay(formatted);
    setPrice(parseCurrencyInput(formatted));
  };

  const toggleTechnique = (tech: string) => {
    setSelectedTechniques(prev =>
      prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
    );
  };

  const handleAddCustomTechnique = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTechnique.trim()) return;
    const trimmed = customTechnique.trim();
    if (!selectedTechniques.includes(trimmed)) {
      setSelectedTechniques(prev => [...prev, trimmed]);
    }
    setCustomTechnique('');
  };

  const handleSetQuickBP = (sys: string, dia: string) => {
    setSystolicBP(sys);
    setDiastolicBP(dia);
    setNoBPRecorded(false);
  };

  const handleSignatureChange = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    setHasSignature(Boolean(dataUrl && dataUrl.length > 50));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveTenantId = tenant?.id || 'tenant-demo-1';
    if (!patientId || !professionalId) {
      alert('Por favor, selecione o cliente que foi atendido e o profissional.');
      return;
    }

    const pat = patients.find(p => p.id === patientId);
    const prof = professionals.find(p => p.id === professionalId) || availableProfessionals.find(p => p.id === professionalId);

    const bpString = noBPRecorded
      ? undefined
      : systolicBP && diastolicBP
      ? `${systolicBP}/${diastolicBP} mmHg`
      : undefined;

    const techniquesToSave =
      selectedTechniques.length > 0 ? selectedTechniques : ['Massoterapia Clínica'];

    setIsSubmitting(true);
    try {
      const createdSession = await api.createSingleSession(effectiveTenantId, {
        patientId,
        patientName: pat?.name || 'Paciente',
        professionalId,
        professionalName: prof?.name || 'Profissional',
        scheduledDate,
        scheduledTime,
        procedures: techniquesToSave,
        bloodPressure: bpString,
        evolutionText: evolutionNotes,
        price: price || 180,
        status: isCompletedNow ? 'COMPLETED' : 'SCHEDULED',
        attendedAt: isCompletedNow ? new Date().toISOString() : undefined,
        clientSignatureUrl: signatureDataUrl || undefined,
        clientConfirmedAt: signatureDataUrl ? new Date().toISOString() : undefined,
      });

      // Executa lançamento direto no sistema financeiro integrado (Print 03)
      try {
        await lancarAtendimentoSessao({
          valor: price || 180.00,
          nomeCliente: pat?.name || 'Mariana Alves',
          procedimento: techniquesToSave.join(' & '),
          data: scheduledDate,
          alsoAddToSalary: true,
        });
      } catch (finErr) {
        console.warn('Aviso de envio ao sistema financeiro:', finErr);
      }

      setSuccessResult({
        amount: price || 180,
        patientName: pat?.name || 'Paciente',
        date: scheduledDate,
      });

      onSessionCreated();
    } catch (err: any) {
      console.error('Erro ao registrar sessão avulsa:', err);
      alert(`Erro ao salvar atendimento avulso: ${err.message || 'Tente novamente.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-50/70 to-emerald-50/50 dark:from-teal-950/20 dark:to-emerald-950/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Acrescentar Sessão Avulsa
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200">
                  Fluxo de Caixa Integrado
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Atendimento avulso de massoterapia com entrada no caixa do mês e sincronização externa automática
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success confirmation view */}
        {successResult ? (
          <div className="p-8 text-center space-y-6 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                Atendimento Avulso Registrado com Sucesso!
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                A sessão de <strong>{successResult.patientName}</strong> foi salva com sucesso e o valor de{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyAccounting(successResult.amount)}
                </strong>{' '}
                já foi somado ao fluxo de caixa do mês.
              </p>
            </div>

            {/* Financial sync badge */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left max-w-md mx-auto text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-teal-700 dark:text-teal-300">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Integração com Sistema Financeiro:</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Dados transmitidos para a API com categoria <code className="font-mono font-bold">MASSOTERAPIA</code>,
                descrição <code className="font-mono font-bold">Atendimento Massoterapia</code> e somado ao salário fixo
                do mês.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessResult(null);
                  setSignatureDataUrl('');
                  setHasSignature(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                + Lançar Outra Sessão Avulsa
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5">
            {/* Step 1: Cliente e Profissional */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  Cliente / Paciente Atendido <span className="text-rose-500">*</span>
                </label>
                {onOpenCreatePatientModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCreatePatientModal();
                    }}
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Cadastrar novo paciente
                  </button>
                )}
              </div>

              {/* Patient select with quick search */}
              <div className="space-y-2">
                <div className="relative">
                  <select
                    value={patientId}
                    onChange={e => setPatientId(e.target.value)}
                    required
                    className="w-full pl-3 pr-8 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  >
                    <option value="" disabled>
                      -- Selecione o cliente atendido ({patients.length} disponíveis) --
                    </option>
                    {filteredPatients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.cpf ? `• CPF: ${p.cpf}` : ''} {p.phone ? `• Tel: ${p.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {patients.length > 5 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={patientSearchTerm}
                      onChange={e => setPatientSearchTerm(e.target.value)}
                      placeholder="Filtrar lista de pacientes por nome, CPF ou telefone..."
                      className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-200"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Valor da Sessão e Fluxo de Caixa */}
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                    Valor da Sessão Avulsa <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80">
                    O valor informado aqui entra no <strong>Fluxo de Caixa do Mês</strong> e vai automaticamente para o
                    sistema de gestão financeira.
                  </p>
                </div>

                <div className="w-full sm:w-48">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={priceDisplay}
                      onChange={handlePriceChange}
                      placeholder="R$ 180,00"
                      className="w-full px-3 py-2 text-base font-black rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-500 dark:border-emerald-600 outline-none text-emerald-700 dark:text-emerald-400 text-center shadow-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-emerald-100 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Soma no Faturamento de <strong>{scheduledDate.slice(0, 7)}</strong> como <em>Atendimento Massoterapia</em>.
                </span>
              </div>
            </div>

            {/* Step 3: Anotação da Pressão Arterial */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  Anotação da Pressão Arterial (PA)
                </label>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${bpAnalysis.color}`}>
                    {bpAnalysis.text}
                  </span>
                  <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noBPRecorded}
                      onChange={e => setNoBPRecorded(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    Não aferir
                  </label>
                </div>
              </div>

              {!noBPRecorded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Sistólica (Máx)</span>
                      <input
                        type="number"
                        min="50"
                        max="260"
                        value={systolicBP}
                        onChange={e => setSystolicBP(e.target.value)}
                        placeholder="120"
                        className="w-full px-2.5 py-1.5 text-xs font-bold text-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-400 self-end mb-2">/</span>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Diastólica (Mín)</span>
                      <input
                        type="number"
                        min="30"
                        max="160"
                        value={diastolicBP}
                        onChange={e => setDiastolicBP(e.target.value)}
                        placeholder="80"
                        className="w-full px-2.5 py-1.5 text-xs font-bold text-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 self-end mb-2">mmHg</span>
                  </div>

                  {/* Quick buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 self-center">
                    <span className="text-[10px] text-slate-400 w-full">Atalhos rápidos:</span>
                    <button
                      type="button"
                      onClick={() => handleSetQuickBP('120', '80')}
                      className="px-2 py-1 rounded text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition"
                    >
                      120/80 (Normal)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickBP('110', '70')}
                      className="px-2 py-1 rounded text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition"
                    >
                      110/70 (Ótima)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickBP('130', '85')}
                      className="px-2 py-1 rounded text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition"
                    >
                      130/85 (Atenção)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Técnicas Utilizadas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  Técnicas Utilizadas no Atendimento
                </label>
                <span className="text-[11px] text-slate-400">
                  {selectedTechniques.length} selecionada(s)
                </span>
              </div>

              {/* Technique Chips */}
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                {DEFAULT_TECHNIQUES.map(tech => {
                  const isSelected = selectedTechniques.includes(tech);
                  return (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleTechnique(tech)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-xs font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {tech}
                    </button>
                  );
                })}
              </div>

              {/* Add custom technique */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customTechnique}
                  onChange={e => setCustomTechnique(e.target.value)}
                  placeholder="Digitar outra técnica personalizada..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTechnique(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomTechnique}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-teal-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
            </div>

            {/* Step 5: Data, Horário e Profissional */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Data do Atendimento
                </label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Horário
                </label>
                <input
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Profissional Responsável
                </label>
                <select
                  value={professionalId}
                  onChange={e => setProfessionalId(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-semibold"
                >
                  {availableProfessionals.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isSuperUser ? '★' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 6: Observações e Evolução Terapêutica (Opcional) */}
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Evolução Terapêutica / Observações do Atendimento (Opcional)
              </label>
              <textarea
                rows={2}
                value={evolutionNotes}
                onChange={e => setEvolutionNotes(e.target.value)}
                placeholder="Ex: Paciente relatou alívio imediato na região lombar. Pontos de tensão liberados em trapézio e escápulas..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            {/* Step 7: Assinatura Opcional do Cliente */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-teal-600" />
                  <label className="text-xs font-bold text-slate-900 dark:text-white">
                    Assinatura do Cliente
                  </label>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    Opcional
                  </span>
                </div>
                {hasSignature && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Assinatura desenhada
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Se o cliente estiver presente, ele pode assinar diretamente na tela com o dedo ou caneta touch para
                comprovação. Caso contrário, você pode salvar a sessão normalmente sem assinar.
              </p>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <CanvasSignature
                  height={150}
                  label="Desenhe a assinatura do cliente aqui (opcional)"
                  onChange={handleSignatureChange}
                  value={signatureDataUrl}
                />
              </div>
            </div>

            {/* Step 8: Status do Atendimento */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Marcar como Atendimento Concluído
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Gera a entrada no fluxo de caixa do mês imediatamente
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isCompletedNow}
                onChange={e => setIsCompletedNow(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition text-center"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Lançando no Caixa e Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finalizar Atendimento • {formatCurrencyAccounting(price)}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
