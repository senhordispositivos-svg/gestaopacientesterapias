import React, { useState, useEffect, useRef } from 'react';
import {
  FileSignature,
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
  Activity,
  Sparkles,
  Eraser,
  Send,
  Loader2,
  Search,
  Check,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatCPF, validateCPF, formatPhone, formatCEP } from '../../utils/cpf';
import { Anamnesis, Patient } from '../../types';

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

  // Clinic & Professional Data
  const [clinicData, setClinicData] = useState<{
    name: string;
    tradeName?: string;
    logoUrl?: string;
    phone?: string;
    city?: string;
    state?: string;
  }>({
    name: 'Clínica de Fisioterapia & Terapias Integradas',
    tradeName: 'Clínica de Fisioterapia & Terapias Integradas',
  });
  const [professionalName, setProfessionalName] = useState('Equipe Terapêutica');

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

  // Step 2: Health History
  const [healthHistory, setHealthHistory] = useState({
    hipertensao: false,
    hipotensao: false,
    diabetes: false,
    cardiopatia: false,
    varizes: false,
    trombose: false,
    protese: false,
    artrite: false,
    fibromialgia: false,
    osteoporose: false,
    epilepsia: false,
    cancerEmTratamento: false,
    historicoCancer: false,
    alergias: false,
    fumante: false,
    ansiedade: false,
    depressao: false,
    doencaPeleContagiosa: false,
    menstruacaoNormal: true,
  });

  const [hasSurgery, setHasSurgery] = useState(false);
  const [surgeryDetails, setSurgeryDetails] = useState('');
  const [hasMedications, setHasMedications] = useState(false);
  const [medicationDetails, setMedicationDetails] = useState('');
  const [allergyDetails, setAllergyDetails] = useState('');

  // Step 3: Therapy Preferences & Evaluation
  const [treatments, setTreatments] = useState({
    fisioterapia: false,
    tratamentoMedico: false,
    medicamentos: false,
    outroTratamento: false,
  });
  const [habits, setHabits] = useState({
    jaRealizouMassoterapia: false,
    dormeBem: true,
    atividadeFisica: false,
    bebidaAlcoolica: false,
  });
  const [pressurePreference, setPressurePreference] = useState<'LEVE' | 'MODERADA' | 'FORTE'>('MODERADA');
  const [mainComplaint, setMainComplaint] = useState('');
  const [focusAreas, setFocusAreas] = useState('');

  // Step 4: Terms & Digital Signature
  const [termAccepted, setTermAccepted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

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
              name: data.tenant.tradeName || data.tenant.name || 'Clínica de Fisioterapia & Terapias',
              tradeName: data.tenant.tradeName || data.tenant.name,
              logoUrl: data.tenant.logoUrl,
              phone: data.tenant.phone,
              city: data.tenant.city,
              state: data.tenant.state,
            });
          }
          if (data.professionalName) {
            setProfessionalName(data.professionalName);
          }
          if (data.patient) {
            if (data.patient.id) setPatientId(data.patient.id);
            if (data.patient.name) setName(data.patient.name);
            if (data.patient.cpf) setCpf(formatCPF(data.patient.cpf));
            if (data.patient.phone) setPhone(formatPhone(data.patient.phone));
            if (data.patient.email) setEmail(data.patient.email);
            if (data.patient.birthDate) setBirthDate(data.patient.birthDate);
            if (data.patient.gender) setGender(data.patient.gender);
            if (data.patient.profession) setProfession(data.patient.profession);
            if (data.patient.cep) setCep(formatCEP(data.patient.cep));
            if (data.patient.street) setStreet(data.patient.street);
            if (data.patient.number) setNumber(data.patient.number);
            if (data.patient.complement) setComplement(data.patient.complement);
            if (data.patient.neighborhood) setNeighborhood(data.patient.neighborhood);
            if (data.patient.city) setCity(data.patient.city);
            if (data.patient.state) setState(data.patient.state);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar dados da ficha:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  // Handle CEP Lookup
  const handleCepBlur = async () => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsSearchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const json = await res.json();
        if (!json.erro) {
          setStreet(json.logradouro || '');
          setNeighborhood(json.bairro || '');
          setCity(json.localidade || '');
          setState(json.uf || '');
        }
      } catch (e) {
        console.warn('Erro na busca de CEP:', e);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  // Canvas Drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a';
  }, [loading, isSubmitted]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu Nome Completo.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Por favor, informe seu número de WhatsApp / Telefone.');
      return;
    }
    if (cpf.trim() && !validateCPF(cpf)) {
      setErrorMessage('O CPF informado parece inválido. Por favor, verifique os dígitos.');
      return;
    }
    if (!termAccepted) {
      setErrorMessage('É necessário aceitar a declaração de veracidade e o termo de consentimento.');
      return;
    }
    if (!hasSignature || !canvasRef.current) {
      setErrorMessage('Por favor, faça sua assinatura digital no campo indicado antes de enviar.');
      return;
    }

    const signatureUrl = canvasRef.current.toDataURL('image/png');

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
        cpf: cpf.trim(),
        rg: rg.trim(),
        gender: gender as any,
        profession: profession.trim(),
        birthDate: birthDate || undefined,
        phone: phone.trim(),
        whatsapp: phone.trim(),
        email: email.trim(),
        cep: cep.trim(),
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim(),
      };

      const finalHealthHistory = {
        ...healthHistory,
        alergias: healthHistory.alergias || !!allergyDetails.trim(),
      };

      const anamnesisData: Partial<Anamnesis> = {
        healthHistory: finalHealthHistory,
        treatments: {
          ...treatments,
          medicamentos: hasMedications || !!medicationDetails.trim(),
        },
        habits: {
          ...habits,
        },
        evaluation: {
          massageGoals: mainComplaint.trim(),
          specificBodyAreasToFocus: focusAreas.trim(),
          pressurePreference: pressurePreference,
          hasRecentSurgeries: hasSurgery,
          recentSurgeriesDescription: hasSurgery ? surgeryDetails.trim() : undefined,
          hasCurrentMedicalCondition: hasMedications,
          currentMedicalConditionDescription: hasMedications ? medicationDetails.trim() : undefined,
          hasKnownAllergies: !!allergyDetails.trim(),
          knownAllergiesDescription: allergyDetails.trim() || undefined,
        },
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
          Carregando formulário seguro de cadastro...
        </p>
      </div>
    );
  }

  // Success Confirmation Screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center notranslate" translate="no">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-6 animate-fade-in notranslate">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Ficha Enviada com Sucesso!
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Obrigado, <strong className="text-slate-900 dark:text-white">{name}</strong>. Seus dados de cadastro, histórico de saúde e assinatura digital foram recebidos com segurança pela <strong className="text-teal-600 dark:text-teal-400">{clinicData.name}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-left space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Status do Prontuário:</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                GRAVADO & SINCRONIZADO
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Profissional Responsável:</span>
              <strong className="text-slate-800 dark:text-slate-200">{professionalName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Data do Preenchimento:</span>
              <strong className="text-slate-800 dark:text-slate-200">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 shrink-0 text-teal-600" />
            <span className="text-left text-[11px] leading-snug">
              Seu cadastro foi salvo diretamente no prontuário eletrônico. Você já pode fechar esta página.
            </span>
          </div>

          {onBackToApp && (
            <button
              type="button"
              onClick={onBackToApp}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition notranslate"
            >
              <span>Voltar ao Painel da Clínica</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 sm:py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center notranslate" translate="no">
      <div className="max-w-3xl w-full space-y-6">
        {/* Header with Clinic Branding & Security Badge */}
        <header className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-4">
            {clinicData.logoUrl ? (
              <img
                src={clinicData.logoUrl}
                alt={clinicData.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                {clinicData.name.charAt(0)}
              </div>
            )}
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50 mb-1">
                <ShieldCheck className="w-3 h-3 text-teal-600" />
                Ambiente Seguro de Auto-Cadastro
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {clinicData.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ficha de Cadastro e Avaliação de Saúde (Anamnese)
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Profissional:</p>
            <p className="text-teal-600 dark:text-teal-400 font-bold">{professionalName}</p>
          </div>
        </header>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Dados Pessoais & Contato */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <User className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  1. Dados Pessoais & Contato
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preencha seus dados de identificação para o prontuário clínico.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={e => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  {calculatedAge !== null && (
                    <span className="px-2.5 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-xs shrink-0 border border-teal-200 dark:border-teal-900">
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
                  onChange={e => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro / Prefiro não informar</option>
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
                  placeholder="Ex: Arquiteta, Advogado, Estudante"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Address Details */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Endereço Residencial
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    CEP
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cep}
                      onChange={e => setCep(formatCEP(e.target.value))}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                      maxLength={9}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none pr-8"
                    />
                    {isSearchingCep && (
                      <Loader2 className="w-4 h-4 animate-spin absolute right-2.5 top-2.5 text-teal-600" />
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Rua / Logradouro
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    placeholder="Rua, Avenida, etc."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    value={number}
                    onChange={e => setNumber(e.target.value)}
                    placeholder="123"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={e => setNeighborhood(e.target.value)}
                    placeholder="Bairro"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Cidade / Estado
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Cidade"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={state}
                      onChange={e => setState(e.target.value.toUpperCase())}
                      placeholder="UF"
                      maxLength={2}
                      className="w-12 px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-center text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Histórico de Saúde & Condições */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <HeartPulse className="w-5 h-5 text-rose-500" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  2. Histórico de Saúde & Condições Clínicas
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Marque se possui ou já teve alguma das condições abaixo para segurança das técnicas aplicadas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: 'hipertensao', label: 'Hipertensão (Pressão Alta)' },
                { key: 'hipotensao', label: 'Hipotensão (Pressão Baixa)' },
                { key: 'diabetes', label: 'Diabetes' },
                { key: 'cardiopatia', label: 'Cardiopatia / Marca-passo' },
                { key: 'varizes', label: 'Varizes' },
                { key: 'trombose', label: 'Histórico de Trombose' },
                { key: 'protese', label: 'Próteses / Pinos Metálicos' },
                { key: 'artrite', label: 'Artrite / Artrose' },
                { key: 'fibromialgia', label: 'Fibromialgia' },
                { key: 'osteoporose', label: 'Osteoporose' },
                { key: 'epilepsia', label: 'Epilepsia / Convulsões' },
                { key: 'cancerEmTratamento', label: 'Câncer (em tratamento)' },
                { key: 'historicoCancer', label: 'Histórico de Câncer' },
                { key: 'ansiedade', label: 'Ansiedade / Estresse Severo' },
                { key: 'alergias', label: 'Alergias a óleos / cremes' },
              ].map(item => {
                const isChecked = (healthHistory as any)[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setHealthHistory(prev => ({
                        ...prev,
                        [item.key]: !(prev as any)[item.key],
                      }))
                    }
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2 ${
                      isChecked
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 shadow-sm'
                        : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-semibold">{item.label}</span>
                    <span
                      className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs shrink-0 font-bold transition ${
                        isChecked
                          ? 'bg-rose-600 text-white'
                          : 'border border-slate-300 dark:border-slate-600 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Additional details for surgeries and medications */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSurgery}
                    onChange={e => setHasSurgery(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  Realizou alguma cirurgia recente ou possui cicatriz importante?
                </label>
                {hasSurgery && (
                  <input
                    type="text"
                    value={surgeryDetails}
                    onChange={e => setSurgeryDetails(e.target.value)}
                    placeholder="Especifique qual cirurgia e há quanto tempo..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasMedications}
                    onChange={e => setHasMedications(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  Faz uso de medicamentos de forma contínua?
                </label>
                {hasMedications && (
                  <input
                    type="text"
                    value={medicationDetails}
                    onChange={e => setMedicationDetails(e.target.value)}
                    placeholder="Ex: Anti-hipertensivo, ansiolítico, anticoagulante..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: Preferências & Queixas Terapêuticas */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Activity className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  3. Avaliação & Preferências do Atendimento
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Conte-nos sobre seus objetivos e preferências para personalizarmos seu atendimento.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Qual é o seu principal objetivo ou queixa hoje?
                </label>
                <textarea
                  rows={2}
                  value={mainComplaint}
                  onChange={e => setMainComplaint(e.target.value)}
                  placeholder="Ex: Alívio de dor na lombar, relaxamento por estresse, tensão no pescoço/ombros..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Regiões do corpo que gostaria de mais foco ou atenção
                </label>
                <input
                  type="text"
                  value={focusAreas}
                  onChange={e => setFocusAreas(e.target.value)}
                  placeholder="Ex: Costas, pescoço, pernas, pés, braços"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Qual intensidade de pressão você prefere na massagem / terapia?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'LEVE', label: 'Suave / Leve', desc: 'Relaxamento sutil' },
                    { id: 'MODERADA', label: 'Moderada', desc: 'Equilíbrio e alívio' },
                    { id: 'FORTE', label: 'Firme / Profunda', desc: 'Liberação muscular' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPressurePreference(item.id as any)}
                      className={`p-3 rounded-2xl border text-center transition ${
                        pressurePreference === item.id
                          ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-900 dark:text-teal-200 shadow-sm font-bold'
                          : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <p className="text-xs">{item.label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Termo de Responsabilidade & Consentimento */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <FileSignature className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  4. Termo de Consentimento & Assinatura Digital
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Conforme a LGPD e normas de saúde clínica.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed max-h-40 overflow-y-auto">
              <p className="font-bold text-slate-900 dark:text-white">
                DECLARAÇÃO DE VERACIDADE E AUTORIZAÇÃO DE ATENDIMENTO
              </p>
              <p>
                Declaro, para os devidos fins legais e clínicos, que todas as informações prestadas neste formulário de cadastro e anamnese são verdadeiras, não tendo omitido qualquer enfermidade, alergia ou condição de saúde relevante.
              </p>
              <p>
                Autorizo a realização das sessões de fisioterapia/massoterapia e procedimentos complementares adequados à minha avaliação clínica pela equipe da <strong>{clinicData.name}</strong>.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Os dados aqui coletados serão tratados com sigilo profissional e utilizados exclusivamente para acompanhamento e segurança do seu tratamento.
              </p>
            </div>

            <label className="flex items-start gap-3 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer pt-2">
              <input
                type="checkbox"
                required
                checked={termAccepted}
                onChange={e => setTermAccepted(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 mt-0.5"
              />
              <span>
                Li, compreendi e concordo com os termos acima, confirmando a veracidade de todas as informações fornecidas. <span className="text-rose-500">*</span>
              </span>
            </label>

            {/* Signature Pad */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  Assine no campo abaixo com o dedo (no celular) ou mouse (no PC) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  Limpar Assinatura
                </button>
              </div>

              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white overflow-hidden shadow-inner touch-none">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 cursor-crosshair block"
                />
                {!hasSignature && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs gap-1">
                    <FileSignature className="w-6 h-6 opacity-40" />
                    <span>Faça sua assinatura aqui</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Pronto para enviar?
              </p>
              <p>
                Ao clicar em enviar, seus dados serão gravados com segurança na clínica.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition disabled:opacity-50 notranslate"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Gravando Ficha no Sistema...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="w-4 h-4 shrink-0" />
                  <span>Concluir e Enviar Ficha</span>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
