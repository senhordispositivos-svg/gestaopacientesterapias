import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  HeartPulse,
  Sparkles,
  Send,
  Loader2,
  Search,
  Check,
  FileText,
  Heart,
  ClipboardList,
  Clock,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatCPF, validateCPF, formatPhone, formatCEP } from '../../utils/cpf';
import { Anamnesis, Patient, MassotherapyEvaluation } from '../../types';
import { CanvasSignature } from '../common/CanvasSignature';

interface PublicAnamnesisPageProps {
  token?: string;
  onBackToApp?: () => void;
}

export const PublicAnamnesisPage: React.FC<PublicAnamnesisPageProps> = ({
  token = '',
  onBackToApp,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Clinic & Professional Data
  const [clinicData, setClinicData] = useState<{
    name: string;
    tradeName?: string;
    logoUrl?: string;
    phone?: string;
    city?: string;
    state?: string;
  }>({
    name: 'Clínica de Massoterapia & Terapias Integrativas',
    tradeName: 'Clínica de Massoterapia & Terapias Integrativas',
  });
  const [professionalName, setProfessionalName] = useState('Equipe Clínica');

  // Step 1: Personal Data
  const [patientId, setPatientId] = useState<string>('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('Feminino');
  const [profession, setProfession] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Address
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Step 2, 3, 4: Evaluation State (Starts undefined to enforce explicit Sim/Não response)
  const [evaluation, setEvaluation] = useState<MassotherapyEvaluation>({
    hasCurrentMedicalCondition: undefined,
    currentMedicalConditionDescription: '',
    hasRecentSurgeries: undefined,
    recentSurgeriesDescription: '',
    hasKnownAllergies: undefined,
    knownAllergiesDescription: '',
    isPregnantOrBreastfeeding: undefined,
    hasHadMassageBefore: undefined,
    massageFrequency: '',
    massageType: '',
    massageResults: '',
    massageGoals: '',
    specificBodyAreasToFocus: '',
    pressurePreference: 'Moderada',
    pressurePreferenceOther: '',
    isSmoker: undefined,
    smokingDailyQuantity: '',
    drinksAlcohol: undefined,
    alcoholFrequencyQuantity: '',
    regularPhysicalActivity: undefined,
    physicalActivityTypeFrequency: '',
    diet: '',
    sleepQuality: 'Normal',
    sleepOtherDescription: '',
    additionalObservations: '',
  });

  // Step 5: Terms & Digital Signature
  const [termAccepted, setTermAccepted] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState('');

  const topFormRef = useRef<HTMLDivElement | null>(null);

  // Age calculation
  const calculatedAge = React.useMemo(() => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 && age < 120 ? age : null;
  }, [birthDate]);

  // Load Data on Mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let payloadData: string | null = null;
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          payloadData = urlParams.get('d') || urlParams.get('data');
        }

        const data = await api.getPublicAnamnesisData(token, payloadData);
        if (data) {
          if (data.tenant) {
            setClinicData({
              name: data.tenant.tradeName || data.tenant.name || 'Clínica de Massoterapia',
              tradeName: data.tenant.tradeName || data.tenant.name,
              logoUrl: data.tenant.logoUrl,
              phone: data.tenant.phone,
              city: data.tenant.city,
              state: data.tenant.state,
            });
            if (data.tenant.city) setCity(prev => prev || data.tenant.city || '');
            if (data.tenant.state) setState(prev => prev || data.tenant.state || '');
          }

          if (data.professional) {
            setProfessionalName(data.professional.name || 'Osaias Brito');
          }

          if (data.patient) {
            setPatientId(data.patient.id || '');
            setName(data.patient.name || '');
            setCpf(data.patient.cpf || '');
            setRg(data.patient.rg || '');
            setBirthDate(data.patient.birthDate || '');
            setGender(data.patient.gender || 'Feminino');
            setProfession(data.patient.profession || '');
            setPhone(data.patient.phone || data.patient.whatsapp || '');
            setEmail(data.patient.email || '');

            setCep(data.patient.cep || '');
            setStreet(data.patient.street || '');
            setNumber(data.patient.number || '');
            setComplement(data.patient.complement || '');
            setNeighborhood(data.patient.neighborhood || '');
            if (data.patient.city) setCity(data.patient.city);
            if (data.patient.state) setState(data.patient.state);
          }

          // If anamnesis already exists, preload answers
          if (data.anamnesis && data.anamnesis.evaluation) {
            setEvaluation(prev => ({
              ...prev,
              ...data.anamnesis?.evaluation,
            }));
            if (data.anamnesis.patientSignatureUrl) {
              setSignatureUrl(data.anamnesis.patientSignatureUrl);
            }
            if (data.anamnesis.responsibilityTermAccepted) {
              setTermAccepted(true);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do link de anamnese:', err);
        setErrorMessage('Não foi possível carregar os dados. Verifique sua conexão ou tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  // CEP Search
  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const address = await res.json();
        if (address && !address.erro) {
          setStreet(address.logradouro || street);
          setNeighborhood(address.bairro || neighborhood);
          setCity(address.localidade || city);
          setState(address.uf || state);
        }
      } catch (e) {
        console.warn('Erro ao buscar CEP:', e);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  // Mandatory fields checklist
  const pendingErrors: string[] = [];

  if (!name.trim()) pendingErrors.push('Nome Completo');
  if (!phone.trim()) pendingErrors.push('WhatsApp / Celular');

  if (evaluation.hasCurrentMedicalCondition === undefined) {
    pendingErrors.push('Condição médica atual (Responda Sim ou Não)');
  } else if (evaluation.hasCurrentMedicalCondition === true && !evaluation.currentMedicalConditionDescription?.trim()) {
    pendingErrors.push('Descrição da condição médica atual');
  }

  if (evaluation.hasRecentSurgeries === undefined) {
    pendingErrors.push('Cirurgias recentes (Responda Sim ou Não)');
  } else if (evaluation.hasRecentSurgeries === true && !evaluation.recentSurgeriesDescription?.trim()) {
    pendingErrors.push('Descrição das cirurgias recentes');
  }

  if (evaluation.hasKnownAllergies === undefined) {
    pendingErrors.push('Alergias conhecidas (Responda Sim ou Não)');
  } else if (evaluation.hasKnownAllergies === true && !evaluation.knownAllergiesDescription?.trim()) {
    pendingErrors.push('Descrição das alergias conhecidas');
  }

  if (gender !== 'Masculino') {
    if (evaluation.isPregnantOrBreastfeeding === undefined) {
      pendingErrors.push('Gestação ou amamentação (Responda Sim ou Não)');
    }
  }

  if (evaluation.hasHadMassageBefore === undefined) {
    pendingErrors.push('Já fez massagem antes (Responda Sim ou Não)');
  }

  if (!evaluation.massageGoals?.trim()) {
    pendingErrors.push('Objetivos com a sessão de massagem');
  }

  if (!evaluation.specificBodyAreasToFocus?.trim()) {
    pendingErrors.push('Áreas do corpo que precisam de atenção');
  }

  if (!evaluation.pressurePreference) {
    pendingErrors.push('Preferência de pressão da massagem');
  } else if (evaluation.pressurePreference === 'Outra' && !evaluation.pressurePreferenceOther?.trim()) {
    pendingErrors.push('Especificação da preferência de pressão');
  }

  if (evaluation.isSmoker === undefined) {
    pendingErrors.push('Tabagismo (Responda Sim ou Não)');
  } else if (evaluation.isSmoker === true && !evaluation.smokingDailyQuantity?.trim()) {
    pendingErrors.push('Quantidade diária de cigarros');
  }

  if (evaluation.drinksAlcohol === undefined) {
    pendingErrors.push('Consumo de álcool (Responda Sim ou Não)');
  } else if (evaluation.drinksAlcohol === true && !evaluation.alcoholFrequencyQuantity?.trim()) {
    pendingErrors.push('Frequência de bebidas alcoólicas');
  }

  if (evaluation.regularPhysicalActivity === undefined) {
    pendingErrors.push('Atividade física regular (Responda Sim ou Não)');
  } else if (evaluation.regularPhysicalActivity === true && !evaluation.physicalActivityTypeFrequency?.trim()) {
    pendingErrors.push('Tipo e frequência de atividade física');
  }

  if (!evaluation.sleepQuality) {
    pendingErrors.push('Qualidade do sono');
  } else if (evaluation.sleepQuality === 'Outro' && !evaluation.sleepOtherDescription?.trim()) {
    pendingErrors.push('Descrição do sono');
  }

  if (!termAccepted) {
    pendingErrors.push('Aceite dos Termos e Condições');
  }

  if (!signatureUrl || signatureUrl.length < 50) {
    pendingErrors.push('Assinatura digital do cliente');
  }

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setErrorMessage(null);

    if (pendingErrors.length > 0) {
      setErrorMessage(
        `Preenchimento obrigatório incompleto (${pendingErrors.length} pendência(s)): ${pendingErrors.slice(0, 3).join(', ')}${
          pendingErrors.length > 3 ? ' e outros...' : '.'
        } É obrigatório responder Sim ou Não para todas as perguntas e desenhar a assinatura digital.`
      );
      topFormRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (cpf.trim()) {
      const cleanCpf = cpf.replace(/\D/g, '');
      if (cleanCpf.length === 11 && !validateCPF(cleanCpf)) {
        setErrorMessage('O CPF informado é inválido. Por favor, verifique os dígitos.');
        topFormRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    setSubmitting(true);
    try {
      let payloadData: string | null = null;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        payloadData = urlParams.get('d') || urlParams.get('data');
      }

      const patientData: Partial<Patient> = {
        id: patientId || undefined,
        name: name.trim(),
        cpf: cpf.trim() || undefined,
        rg: rg.trim() || undefined,
        birthDate: birthDate || undefined,
        gender: (gender as any) || 'Outro',
        profession: profession.trim() || undefined,
        phone: phone.trim(),
        whatsapp: phone.trim(),
        email: email.trim() || undefined,
        cep: cep.trim() || undefined,
        street: street.trim() || undefined,
        number: number.trim() || undefined,
        complement: complement.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim().toUpperCase() || undefined,
      };

      const anamnesisData: Partial<Anamnesis> = {
        evaluation,
        responsibilityTermAccepted: true,
        patientSignatureUrl: signatureUrl,
        city: city || clinicData.city || '',
        state: state || clinicData.state || '',
      };

      const res = await api.submitPublicAnamnesis({
        token,
        payloadData,
        patientData,
        anamnesisData,
        signatureUrl,
      });

      if (res && res.success) {
        setIsSubmitted(true);
      } else {
        setErrorMessage(res?.message || 'Erro ao enviar os dados. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Erro ao submeter anamnese:', err);
      setErrorMessage(err?.message || 'Erro ao conectar ao servidor. Verifique sua conexão.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-3" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Carregando ficha de cadastro & avaliação segura...
        </p>
      </div>
    );
  }

  // Success Screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-600 dark:text-emerald-400 shadow-sm ring-8 ring-emerald-50 dark:ring-emerald-950/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">
            Ficha Enviada com Sucesso!
          </h2>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-4 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4" /> Assinatura Digital & Anamnese Registradas
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Olá, <strong className="text-slate-800 dark:text-slate-200">{name}</strong>! Suas respostas e assinatura foram sincronizadas com o sistema da clínica. Seu atendimento já está autorizado.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-left text-xs space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-400">Clínica:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{clinicData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Responsável:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{professionalName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Data e Hora:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Você já pode fechar esta aba no seu celular ou navegador. Tenha uma excelente sessão! ✨
          </div>

          {onBackToApp && (
            <button
              type="button"
              onClick={onBackToApp}
              className="mt-6 w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Voltar ao Painel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-6 sm:py-10 px-3 sm:px-6">
      <div ref={topFormRef} className="max-w-3xl mx-auto">
        {/* Header Branding */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-7 mb-5 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[11px] font-bold border border-teal-200 dark:border-teal-800">
                Ficha Obrigatória de Anamnese
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800">
                Assinatura Obrigatória
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {clinicData.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Coleta clínica de saúde, histórico terapêutico e termo de ciência para atendimento com <strong>{professionalName}</strong>.
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center justify-center sm:justify-end">
            <div className="px-3.5 py-2 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/80 text-teal-800 dark:text-teal-300 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Ambiente Criptografado & Seguro</span>
            </div>
          </div>
        </div>

        {/* Validation Alert */}
        {errorMessage && (
          <div className="p-4 mb-5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-3 shadow-sm animate-fade-in">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-900 dark:text-rose-100">Pendências encontradas:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SECTION 1: IDENTIFICAÇÃO DO CLIENTE */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-7">
            <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-black text-xs">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Identificação do Cliente
                </h3>
                <p className="text-[11px] text-slate-400">Seus dados básicos de contato e identificação</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome completo..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    attemptedSubmit && !name.trim() ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  WhatsApp / Celular <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    attemptedSubmit && !phone.trim() ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  CPF (Opcional para cadastro)
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={e => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Data de Nascimento
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  {calculatedAge !== null && (
                    <span className="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold whitespace-nowrap">
                      {calculatedAge} anos
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Sexo / Gênero
                </label>
                <select
                  value={gender}
                  onChange={e => {
                    const val = e.target.value;
                    setGender(val);
                    if (val === 'Masculino') {
                      setEvaluation(prev => ({ ...prev, isPregnantOrBreastfeeding: false }));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro / Prefiro não dizer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Profissão / Ocupação
                </label>
                <input
                  type="text"
                  value={profession}
                  onChange={e => setProfession(e.target.value)}
                  placeholder="Ex: Designer, Advogado(a), Autônomo..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  E-mail (Opcional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Endereço / Localização */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      CEP
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cep}
                        onChange={e => setCep(formatCEP(e.target.value))}
                        onBlur={handleCepBlur}
                        placeholder="00000-000"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      {isSearchingCep && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2.5 top-2.5 text-teal-600" />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Sua cidade"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      UF / Estado
                    </label>
                    <input
                      type="text"
                      value={state}
                      maxLength={2}
                      onChange={e => setState(e.target.value.toUpperCase())}
                      placeholder="UF"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: HISTÓRICO MÉDICO & SAÚDE (SIM OU NÃO OBRIGATÓRIOS) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-7">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-black text-xs">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Histórico Médico & Saúde
                  </h3>
                  <p className="text-[11px] text-slate-400">Responda Sim ou Não para todas as perguntas</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                * Respostas Obrigatórias
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Condição médica atual */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  attemptedSubmit && evaluation.hasCurrentMedicalCondition === undefined
                    ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Possui alguma condição médica atual? <span className="text-rose-500">*</span>
                    </span>
                    {evaluation.hasCurrentMedicalCondition === undefined ? (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        * Selecione Sim ou Não
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ Respondido ({evaluation.hasCurrentMedicalCondition ? 'Sim' : 'Não'})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEvaluation(prev => ({
                          ...prev,
                          hasCurrentMedicalCondition: false,
                          currentMedicalConditionDescription: '',
                        }))
                      }
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        evaluation.hasCurrentMedicalCondition === false
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvaluation(prev => ({ ...prev, hasCurrentMedicalCondition: true }))}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        evaluation.hasCurrentMedicalCondition === true
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>
                {evaluation.hasCurrentMedicalCondition === true && (
                  <div className="mt-3">
                    <label className="text-[11px] font-bold text-teal-800 dark:text-teal-300 block mb-1">
                      Descreva a condição médica atual <span className="text-rose-500">* Obrigatório</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Se sim, descreva a condição médica..."
                      value={evaluation.currentMedicalConditionDescription || ''}
                      onChange={e =>
                        setEvaluation(prev => ({ ...prev, currentMedicalConditionDescription: e.target.value }))
                      }
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
                        attemptedSubmit && !evaluation.currentMedicalConditionDescription?.trim()
                          ? 'border-rose-400 ring-2 ring-rose-400/20'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Cirurgias recentes */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  attemptedSubmit && evaluation.hasRecentSurgeries === undefined
                    ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Já fez cirurgias recentes? <span className="text-rose-500">*</span>
                    </span>
                    {evaluation.hasRecentSurgeries === undefined ? (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        * Selecione Sim ou Não
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ Respondido ({evaluation.hasRecentSurgeries ? 'Sim' : 'Não'})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEvaluation(prev => ({
                          ...prev,
                          hasRecentSurgeries: false,
                          recentSurgeriesDescription: '',
                        }))
                      }
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        evaluation.hasRecentSurgeries === false
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvaluation(prev => ({ ...prev, hasRecentSurgeries: true }))}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        evaluation.hasRecentSurgeries === true
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>
                {evaluation.hasRecentSurgeries === true && (
                  <div className="mt-3">
                    <label className="text-[11px] font-bold text-teal-800 dark:text-teal-300 block mb-1">
                      Quais cirurgias e quando realizou? <span className="text-rose-500">* Obrigatório</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Se sim, quais e quando?"
                      value={evaluation.recentSurgeriesDescription || ''}
                      onChange={e =>
                        setEvaluation(prev => ({ ...prev, recentSurgeriesDescription: e.target.value }))
                      }
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
                        attemptedSubmit && !evaluation.recentSurgeriesDescription?.trim()
                          ? 'border-rose-400 ring-2 ring-rose-400/20'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Alergias conhecidas */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  attemptedSubmit && evaluation.hasKnownAllergies === undefined
                    ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Tem alergias conhecidas (óleos, cosméticos, medicamentos)? <span className="text-rose-500">*</span>
                    </span>
                    {evaluation.hasKnownAllergies === undefined ? (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        * Selecione Sim ou Não
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ Respondido ({evaluation.hasKnownAllergies ? 'Sim' : 'Não'})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEvaluation(prev => ({
                          ...prev,
                          hasKnownAllergies: false,
                          knownAllergiesDescription: '',
                        }))
                      }
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        evaluation.hasKnownAllergies === false
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvaluation(prev => ({ ...prev, hasKnownAllergies: true }))}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        evaluation.hasKnownAllergies === true
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>
                {evaluation.hasKnownAllergies === true && (
                  <div className="mt-3">
                    <label className="text-[11px] font-bold text-teal-800 dark:text-teal-300 block mb-1">
                      Especifique as alergias <span className="text-rose-500">* Obrigatório</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Se sim, quais?"
                      value={evaluation.knownAllergiesDescription || ''}
                      onChange={e =>
                        setEvaluation(prev => ({ ...prev, knownAllergiesDescription: e.target.value }))
                      }
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
                        attemptedSubmit && !evaluation.knownAllergiesDescription?.trim()
                          ? 'border-rose-400 ring-2 ring-rose-400/20'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Gravidez / Amamentação (Apenas para público feminino / outro) */}
              {gender !== 'Masculino' && (
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    attemptedSubmit && evaluation.isPregnantOrBreastfeeding === undefined
                      ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Está grávida ou em período de amamentação? <span className="text-rose-500">*</span>
                      </span>
                      {evaluation.isPregnantOrBreastfeeding === undefined ? (
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          * Selecione Sim ou Não
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          ✓ Respondido ({evaluation.isPregnantOrBreastfeeding ? 'Sim' : 'Não'})
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEvaluation(prev => ({ ...prev, isPregnantOrBreastfeeding: false }))}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          evaluation.isPregnantOrBreastfeeding === false
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Não
                      </button>
                      <button
                        type="button"
                        onClick={() => setEvaluation(prev => ({ ...prev, isPregnantOrBreastfeeding: true }))}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          evaluation.isPregnantOrBreastfeeding === true
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700'
                        }`}
                      >
                        Sim
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: HISTÓRICO DE MASSAGEM & OBJETIVOS DA SESSÃO */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-7">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-black text-xs">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Histórico de Massagem & Objetivos da Sessão
                  </h3>
                  <p className="text-[11px] text-slate-400">Suas preferências e foco terapêutico</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                * Campos Obrigatórios
              </span>
            </div>

            <div className="space-y-4">
              {/* Já fez massagem antes */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  attemptedSubmit && evaluation.hasHadMassageBefore === undefined
                    ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Já fez massagem antes? <span className="text-rose-500">*</span>
                    </span>
                    {evaluation.hasHadMassageBefore === undefined ? (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        * Selecione Sim ou Não
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ Respondido ({evaluation.hasHadMassageBefore ? 'Sim' : 'Não'})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEvaluation(prev => ({
                          ...prev,
                          hasHadMassageBefore: false,
                          massageFrequency: '',
                          massageType: '',
                          massageResults: '',
                        }))
                      }
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        evaluation.hasHadMassageBefore === false
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvaluation(prev => ({ ...prev, hasHadMassageBefore: true }))}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        evaluation.hasHadMassageBefore === true
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>
                {evaluation.hasHadMassageBefore === true && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                    <input
                      type="text"
                      placeholder="Frequência (ex: mensal, quinzenal)"
                      value={evaluation.massageFrequency || ''}
                      onChange={e => setEvaluation(prev => ({ ...prev, massageFrequency: e.target.value }))}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Tipo (ex: relaxante, drenagem)"
                      value={evaluation.massageType || ''}
                      onChange={e => setEvaluation(prev => ({ ...prev, massageType: e.target.value }))}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Resultados percebidos"
                      value={evaluation.massageResults || ''}
                      onChange={e => setEvaluation(prev => ({ ...prev, massageResults: e.target.value }))}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* Objetivos e Áreas de Atenção (Obrigatórios) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Quais são seus objetivos com esta sessão de massagem? <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Alívio de tensão nos ombros, relaxamento, lombalgia..."
                    value={evaluation.massageGoals || ''}
                    onChange={e => setEvaluation(prev => ({ ...prev, massageGoals: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                      attemptedSubmit && !evaluation.massageGoals?.trim()
                        ? 'border-rose-400 ring-2 ring-rose-400/20'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Alguma área específica do corpo precisa de atenção? <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Cervical, escápulas, região lombar, pés..."
                    value={evaluation.specificBodyAreasToFocus || ''}
                    onChange={e => setEvaluation(prev => ({ ...prev, specificBodyAreasToFocus: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                      attemptedSubmit && !evaluation.specificBodyAreasToFocus?.trim()
                        ? 'border-rose-400 ring-2 ring-rose-400/20'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                </div>
              </div>

              {/* Preferência de Pressão */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
                  Alguma preferência quanto à pressão da massagem? <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Leve', 'Moderada', 'Firme', 'Outra'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEvaluation(prev => ({ ...prev, pressurePreference: p }))}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        evaluation.pressurePreference === p
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shadow-sm ring-1 ring-teal-600'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                {evaluation.pressurePreference === 'Outra' && (
                  <input
                    type="text"
                    required
                    placeholder="Especifique sua preferência de pressão... *"
                    value={evaluation.pressurePreferenceOther || ''}
                    onChange={e => setEvaluation(prev => ({ ...prev, pressurePreferenceOther: e.target.value }))}
                    className={`w-full mt-2 px-3.5 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 ${
                      attemptedSubmit && !evaluation.pressurePreferenceOther?.trim()
                        ? 'border-rose-400 ring-2 ring-rose-400/20'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: ESTILO DE VIDA & HÁBITOS (SIM OU NÃO OBRIGATÓRIOS) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-7">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-black text-xs">
                  4
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Estilo de Vida & Hábitos
                  </h3>
                  <p className="text-[11px] text-slate-400">Informações sobre sua rotina diária</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                * Responda Sim ou Não
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Tabagismo */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  attemptedSubmit && evaluation.isSmoker === undefined
                    ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Tabagismo: <span className="text-rose-500">*</span></span>
                    {evaluation.isSmoker === undefined && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Pendente</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEvaluation(prev => ({
                          ...prev,
                          isSmoker: false,
                          smokingDailyQuantity: '',
                        }))
                      }
                      className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                        evaluation.isSmoker === false
                          ? 'bg-slate-800 text-white'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvaluation(prev => ({ ...prev, isSmoker: true }))}
                      className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                        evaluation.isSmoker === true
                          ? 'bg-teal-600 text-white'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>
                {evaluation.isSmoker === true && (
                  <input
                    type="text"
                    required
                    placeholder="Quantidade diária (ex: 5 cigarros/dia)... *"
                    value={evaluation.smokingDailyQuantity || ''}
                    onChange={e => setEvaluation(prev => ({ ...prev, smokingDailyQuantity: e.target.value }))}
                    className={`w-full mt-2 px-3 py-1.5 rounded-xl border text-xs bg-white dark:bg-slate-900 ${
                      attemptedSubmit && !evaluation.smokingDailyQuantity?.trim()
                        ? 'border-rose-400 ring-2 ring-rose-400/20'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                )}
              </div>

              {/* Consumo de álcool */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  attemptedSubmit && evaluation.drinksAlcohol === undefined
                    ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Consumo de álcool: <span className="text-rose-500">*</span></span>
                    {evaluation.drinksAlcohol === undefined && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Pendente</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEvaluation(prev => ({
                          ...prev,
                          drinksAlcohol: false,
                          alcoholFrequencyQuantity: '',
                        }))
                      }
                      className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                        evaluation.drinksAlcohol === false
                          ? 'bg-slate-800 text-white'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvaluation(prev => ({ ...prev, drinksAlcohol: true }))}
                      className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                        evaluation.drinksAlcohol === true
                          ? 'bg-teal-600 text-white'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>
                {evaluation.drinksAlcohol === true && (
                  <input
                    type="text"
                    required
                    placeholder="Frequência / quantidade (ex: socialmente)... *"
                    value={evaluation.alcoholFrequencyQuantity || ''}
                    onChange={e => setEvaluation(prev => ({ ...prev, alcoholFrequencyQuantity: e.target.value }))}
                    className={`w-full mt-2 px-3 py-1.5 rounded-xl border text-xs bg-white dark:bg-slate-900 ${
                      attemptedSubmit && !evaluation.alcoholFrequencyQuantity?.trim()
                        ? 'border-rose-400 ring-2 ring-rose-400/20'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                )}
              </div>

              {/* Atividade física regular */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  attemptedSubmit && evaluation.regularPhysicalActivity === undefined
                    ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Atividade física regular: <span className="text-rose-500">*</span></span>
                    {evaluation.regularPhysicalActivity === undefined && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Pendente</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEvaluation(prev => ({
                          ...prev,
                          regularPhysicalActivity: false,
                          physicalActivityTypeFrequency: '',
                        }))
                      }
                      className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                        evaluation.regularPhysicalActivity === false
                          ? 'bg-slate-800 text-white'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvaluation(prev => ({ ...prev, regularPhysicalActivity: true }))}
                      className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                        evaluation.regularPhysicalActivity === true
                          ? 'bg-teal-600 text-white'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>
                {evaluation.regularPhysicalActivity === true && (
                  <input
                    type="text"
                    required
                    placeholder="Tipo e frequência semanal (ex: musculação 3x/semana)... *"
                    value={evaluation.physicalActivityTypeFrequency || ''}
                    onChange={e =>
                      setEvaluation(prev => ({ ...prev, physicalActivityTypeFrequency: e.target.value }))
                    }
                    className={`w-full mt-2 px-3 py-1.5 rounded-xl border text-xs bg-white dark:bg-slate-900 ${
                      attemptedSubmit && !evaluation.physicalActivityTypeFrequency?.trim()
                        ? 'border-rose-400 ring-2 ring-rose-400/20'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                )}
              </div>

              {/* Qualidade do sono */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                  Qualidade do Sono: <span className="text-rose-500">*</span>
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Normal', 'Insônia', 'Outro'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEvaluation(prev => ({ ...prev, sleepQuality: s }))}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        evaluation.sleepQuality === s
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {evaluation.sleepQuality === 'Outro' && (
                  <input
                    type="text"
                    required
                    placeholder="Descreva seu padrão de sono... *"
                    value={evaluation.sleepOtherDescription || ''}
                    onChange={e => setEvaluation(prev => ({ ...prev, sleepOtherDescription: e.target.value }))}
                    className={`w-full mt-2 px-3 py-1.5 rounded-xl border text-xs bg-white dark:bg-slate-900 ${
                      attemptedSubmit && !evaluation.sleepOtherDescription?.trim()
                        ? 'border-rose-400 ring-2 ring-rose-400/20'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* SECTION 5: TERMOS E CONDIÇÕES (OBRIGATÓRIO) */}
          <div
            className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border p-5 sm:p-7 transition-all ${
              attemptedSubmit && !termAccepted
                ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/10'
                : 'border-amber-200 dark:border-amber-900/50'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 flex items-center justify-center font-black text-xs">
                5
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                  Termos e Condições — Declaração e Ciência
                </h3>
                <p className="text-[11px] text-slate-400">Leia e confirme seu consentimento informado</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 bg-amber-50/40 dark:bg-slate-800/60 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 leading-relaxed max-h-48 overflow-y-auto mb-4">
              <p>
                <strong>Cláusula 01:</strong> Declaro que as informações prestadas nesta ficha de avaliação de saúde são
                verdadeiras, corretas e de minha inteira responsabilidade, não tendo omitido nenhum fato relevante sobre meu
                estado de saúde físico ou histórico clínico.
              </p>
              <p>
                <strong>Cláusula 02:</strong> Estou ciente de que as sessões e procedimentos de massoterapia têm caráter
                preventivo, integrativo e de bem-estar, não substituindo consultas, diagnósticos ou tratamentos médicos
                convencionais.
              </p>
              <p>
                <strong>Cláusula 03:</strong> Comprometo-me a informar prontamente ao profissional qualquer alteração futura em meu
                estado de saúde, gravidez, prescrição de medicamentos ou sensibilidade durante as manobras terapêuticas.
              </p>
              <p>
                <strong>Cláusula 04:</strong> Autorizo a realização do plano de atendimento acordado com a equipe e o registro
                dessas informações no prontuário eletrônico confidencial da clínica.
              </p>
            </div>

            <label className="flex items-start gap-3 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={termAccepted}
                onChange={e => setTermAccepted(e.target.checked)}
                className="w-5 h-5 rounded-lg text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-700 mt-0.5"
              />
              <span>
                Li, compreendi e concordo integralmente com os termos e declarações de saúde acima descritos. <span className="text-rose-500">* (Obrigatório)</span>
              </span>
            </label>
          </div>

          {/* SECTION 6: ASSINATURA DIGITAL DO CLIENTE (OBRIGATÓRIA E CALIBRADA) */}
          <div
            className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border p-5 sm:p-7 transition-all ${
              attemptedSubmit && (!signatureUrl || signatureUrl.length < 50)
                ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/10'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-black text-xs">
                  6
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Assinatura Digital do Cliente
                  </h3>
                  <p className="text-[11px] text-slate-400">Assine com o dedo no celular ou mouse no computador</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                * Assinatura Obrigatória
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Desenhe sua assinatura no quadro abaixo. O sistema possui <strong>calibragem de precisão</strong> para tela sensível ao toque, permitindo traços suaves e contínuos:
            </p>

            <CanvasSignature
              value={signatureUrl}
              onChange={setSignatureUrl}
              label="Assine com o dedo ou caneta digital no quadro abaixo:"
              required={!signatureUrl}
              height={190}
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Local: {city || clinicData.city || 'Clínica'} - {state || clinicData.state || 'UF'}</span>
              <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          {/* Submission Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {pendingErrors.length === 0 ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Todos os campos obrigatórios e assinatura estão prontos!
                </span>
              ) : (
                <span className="text-amber-600 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> {pendingErrors.length} item(ns) pendente(s) antes de enviar
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg shadow-teal-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sincronizando Ficha...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Confirmar & Enviar Ficha de Anamnese
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
