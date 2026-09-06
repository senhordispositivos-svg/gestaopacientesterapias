import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { CanvasSignature } from '../common/CanvasSignature';
import { Patient, Anamnesis, MassotherapyEvaluation } from '../../types';
import {
  ClipboardList,
  Check,
  ShieldAlert,
  Sparkles,
  User,
  FileText,
  Heart,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface AnamnesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  initialData?: Anamnesis | null;
  onSaveAnamnesis: (anamnesisData: Partial<Anamnesis>) => Promise<void>;
}

// Initial evaluation state where Sim/Não questions start undefined (unanswered)
// to require explicit client/practitioner response
const emptyEvaluation: MassotherapyEvaluation = {
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
};

export const AnamnesisModal: React.FC<AnamnesisModalProps> = ({
  isOpen,
  onClose,
  patient,
  initialData,
  onSaveAnamnesis,
}) => {
  const { tenant } = useAuth();
  const [evaluation, setEvaluation] = useState<MassotherapyEvaluation>(emptyEvaluation);
  const [responsibilityTermAccepted, setResponsibilityTermAccepted] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [city, setCity] = useState(patient?.city || tenant?.city || '');
  const [state, setState] = useState(patient?.state || tenant?.state || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [error, setError] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const formTopRef = useRef<HTMLDivElement | null>(null);

  // Sync state whenever modal opens or patient changes
  useEffect(() => {
    if (!isOpen || !patient) return;

    let isMounted = true;
    setError('');
    setAttemptedSubmit(false);

    const applyAnamnesis = (data: Anamnesis | null | undefined) => {
      if (data) {
        setEvaluation({
          ...emptyEvaluation,
          ...(data.evaluation || {}),
        });
        setResponsibilityTermAccepted(
          data.responsibilityTermAccepted !== undefined ? Boolean(data.responsibilityTermAccepted) : Boolean(data.patientSignatureUrl)
        );
        setSignatureUrl(data.patientSignatureUrl || '');
        setCity(data.city || patient.city || tenant?.city || '');
        setState(data.state || patient.state || tenant?.state || '');
      } else {
        setEvaluation({ ...emptyEvaluation });
        setResponsibilityTermAccepted(false);
        setSignatureUrl('');
        setCity(patient.city || tenant?.city || '');
        setState(patient.state || tenant?.state || '');
      }
    };

    if (initialData !== undefined) {
      applyAnamnesis(initialData);
    } else if (patient?.id) {
      setIsLoadingExisting(true);
      const tid = tenant?.id || 'tenant-demo-1';
      api.getAnamnesis(patient.id, tid)
        .then(existing => {
          if (isMounted) {
            applyAnamnesis(existing);
          }
        })
        .catch(err => {
          console.warn('Erro ao carregar anamnese existente:', err);
          if (isMounted) applyAnamnesis(null);
        })
        .finally(() => {
          if (isMounted) setIsLoadingExisting(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, patient, initialData, tenant]);

  // Mandatory questions audit
  const missingFields: string[] = [];

  if (evaluation.hasCurrentMedicalCondition === undefined) {
    missingFields.push('Condição médica atual (Sim ou Não)');
  } else if (evaluation.hasCurrentMedicalCondition === true && !evaluation.currentMedicalConditionDescription?.trim()) {
    missingFields.push('Descrição da condição médica');
  }

  if (evaluation.hasRecentSurgeries === undefined) {
    missingFields.push('Cirurgias recentes (Sim ou Não)');
  } else if (evaluation.hasRecentSurgeries === true && !evaluation.recentSurgeriesDescription?.trim()) {
    missingFields.push('Descrição das cirurgias recentes');
  }

  if (evaluation.hasKnownAllergies === undefined) {
    missingFields.push('Alergias conhecidas (Sim ou Não)');
  } else if (evaluation.hasKnownAllergies === true && !evaluation.knownAllergiesDescription?.trim()) {
    missingFields.push('Descrição das alergias conhecidas');
  }

  if (patient.gender !== 'Masculino') {
    if (evaluation.isPregnantOrBreastfeeding === undefined) {
      missingFields.push('Gestação ou amamentação (Sim ou Não)');
    }
  }

  if (evaluation.hasHadMassageBefore === undefined) {
    missingFields.push('Já fez massagem antes (Sim ou Não)');
  }

  if (!evaluation.massageGoals?.trim()) {
    missingFields.push('Objetivos com a sessão de massagem');
  }

  if (!evaluation.specificBodyAreasToFocus?.trim()) {
    missingFields.push('Áreas do corpo que precisam de atenção');
  }

  if (!evaluation.pressurePreference) {
    missingFields.push('Preferência de pressão da massagem');
  } else if (evaluation.pressurePreference === 'Outra' && !evaluation.pressurePreferenceOther?.trim()) {
    missingFields.push('Especificação da preferência de pressão');
  }

  if (evaluation.isSmoker === undefined) {
    missingFields.push('Tabagismo (Sim ou Não)');
  } else if (evaluation.isSmoker === true && !evaluation.smokingDailyQuantity?.trim()) {
    missingFields.push('Quantidade diária de cigarros');
  }

  if (evaluation.drinksAlcohol === undefined) {
    missingFields.push('Consumo de álcool (Sim ou Não)');
  } else if (evaluation.drinksAlcohol === true && !evaluation.alcoholFrequencyQuantity?.trim()) {
    missingFields.push('Frequência/quantidade de bebidas alcoólicas');
  }

  if (evaluation.regularPhysicalActivity === undefined) {
    missingFields.push('Atividade física regular (Sim ou Não)');
  } else if (evaluation.regularPhysicalActivity === true && !evaluation.physicalActivityTypeFrequency?.trim()) {
    missingFields.push('Tipo e frequência da atividade física');
  }

  if (!evaluation.sleepQuality) {
    missingFields.push('Qualidade do sono');
  } else if (evaluation.sleepQuality === 'Outro' && !evaluation.sleepOtherDescription?.trim()) {
    missingFields.push('Descrição do padrão de sono');
  }

  if (!responsibilityTermAccepted) {
    missingFields.push('Aceite dos Termos e Condições');
  }

  if (!signatureUrl || signatureUrl.length < 50) {
    missingFields.push('Assinatura digital do cliente');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setError('');

    if (missingFields.length > 0) {
      setError(
        `Preenchimento obrigatório incompleto (${missingFields.length} pendência(s)): ${missingFields.slice(0, 3).join(', ')}${
          missingFields.length > 3 ? ' e mais itens...' : '.'
        } Por favor, responda Sim ou Não para todas as perguntas e realize a assinatura digital.`
      );
      formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveAnamnesis({
        evaluation,
        responsibilityTermAccepted,
        patientSignatureUrl: signatureUrl,
        city,
        state,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Erro ao salvar anamnese.');
      } else {
        setError('Erro ao salvar anamnese.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ficha de Anamnese & Avaliação — ${patient.name}`}
      subtitle="Coleta clínica de histórico de saúde, preferências de massagem e assinatura digital"
      maxWidth="4xl"
    >
      <div ref={formTopRef} />
      {isLoadingExisting ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400 animate-fade-in">
          <div className="w-9 h-9 border-3 border-teal-600 dark:border-teal-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Sincronizando ficha clínica e assinatura digital...
          </p>
          <span className="text-xs text-slate-400">Verificando dados enviados pelo cliente no Supabase Cloud</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[78vh] overflow-y-auto pr-1">
        {/* Error Banner if validation fails */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-3 animate-fade-in shadow-xs">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-900 dark:text-rose-100">Campos Obrigatórios Pendentes:</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* 1. DADOS DO CLIENTE RESUMIDOS */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              1. Identificação do Cliente
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Nome Completo</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{patient.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">CPF / RG</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {patient.cpf || 'Não informado'} {patient.rg ? `| ${patient.rg}` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Telefone / WhatsApp</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{patient.phone || patient.whatsapp || 'Não informado'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Gênero / Profissão</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {patient.gender || 'Não informado'} {patient.profession ? `• ${patient.profession}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* 2. HISTÓRICO MÉDICO & SAÚDE (SIM OU NÃO OBRIGATÓRIOS) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                2. Histórico Médico & Saúde
              </h4>
            </div>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
              * Resposta Sim/Não Obrigatória em todos os itens
            </span>
          </div>

          <div className="space-y-3">
            {/* Condição médica atual */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                attemptedSubmit && evaluation.hasCurrentMedicalCondition === undefined
                  ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Possui alguma condição médica atual? <span className="text-rose-500">*</span>
                  </span>
                  {evaluation.hasCurrentMedicalCondition === undefined && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      Pendente de resposta (Selecione Sim ou Não)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEvaluation(prev => ({
                        ...prev,
                        hasCurrentMedicalCondition: false,
                        currentMedicalConditionDescription: '',
                      }))
                    }
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      evaluation.hasCurrentMedicalCondition === false
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, hasCurrentMedicalCondition: true }))}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      evaluation.hasCurrentMedicalCondition === true
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>
              {evaluation.hasCurrentMedicalCondition === true && (
                <div className="mt-2.5">
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
                    className={`w-full px-3 py-2 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
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
              className={`p-3.5 rounded-xl border transition-all ${
                attemptedSubmit && evaluation.hasRecentSurgeries === undefined
                  ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Já fez cirurgias recentes? <span className="text-rose-500">*</span>
                  </span>
                  {evaluation.hasRecentSurgeries === undefined && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      Pendente de resposta (Selecione Sim ou Não)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEvaluation(prev => ({
                        ...prev,
                        hasRecentSurgeries: false,
                        recentSurgeriesDescription: '',
                      }))
                    }
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      evaluation.hasRecentSurgeries === false
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, hasRecentSurgeries: true }))}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      evaluation.hasRecentSurgeries === true
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>
              {evaluation.hasRecentSurgeries === true && (
                <div className="mt-2.5">
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
                    className={`w-full px-3 py-2 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
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
              className={`p-3.5 rounded-xl border transition-all ${
                attemptedSubmit && evaluation.hasKnownAllergies === undefined
                  ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Tem alergias conhecidas (óleos, cosméticos, medicamentos)? <span className="text-rose-500">*</span>
                  </span>
                  {evaluation.hasKnownAllergies === undefined && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      Pendente de resposta (Selecione Sim ou Não)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEvaluation(prev => ({
                        ...prev,
                        hasKnownAllergies: false,
                        knownAllergiesDescription: '',
                      }))
                    }
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      evaluation.hasKnownAllergies === false
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, hasKnownAllergies: true }))}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      evaluation.hasKnownAllergies === true
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>
              {evaluation.hasKnownAllergies === true && (
                <div className="mt-2.5">
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
                    className={`w-full px-3 py-2 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
                      attemptedSubmit && !evaluation.knownAllergiesDescription?.trim()
                        ? 'border-rose-400 ring-2 ring-rose-400/20'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Gravidez / amamentação (Apenas para público feminino / outro) */}
            {patient.gender !== 'Masculino' && (
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  attemptedSubmit && evaluation.isPregnantOrBreastfeeding === undefined
                    ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Está grávida ou em período de amamentação? <span className="text-rose-500">*</span>
                    </span>
                    {evaluation.isPregnantOrBreastfeeding === undefined && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        Pendente de resposta (Selecione Sim ou Não)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEvaluation(prev => ({ ...prev, isPregnantOrBreastfeeding: false }))}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        evaluation.isPregnantOrBreastfeeding === false
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvaluation(prev => ({ ...prev, isPregnantOrBreastfeeding: true }))}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        evaluation.isPregnantOrBreastfeeding === true
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700'
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

        {/* 3. HISTÓRICO DE MASSAGEM & OBJETIVOS DA SESSÃO */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                3. Histórico de Massagem & Objetivos da Sessão
              </h4>
            </div>
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
              * Campos Obrigatórios
            </span>
          </div>

          <div className="space-y-3">
            {/* Já fez massagem antes */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                attemptedSubmit && evaluation.hasHadMassageBefore === undefined
                  ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Já fez massagem antes? <span className="text-rose-500">*</span>
                  </span>
                  {evaluation.hasHadMassageBefore === undefined && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      Pendente de resposta (Selecione Sim ou Não)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
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
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      evaluation.hasHadMassageBefore === false
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, hasHadMassageBefore: true }))}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      evaluation.hasHadMassageBefore === true
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>
              {evaluation.hasHadMassageBefore === true && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5">
                  <input
                    type="text"
                    placeholder="Frequência (ex: mensal, quinzenal)"
                    value={evaluation.massageFrequency || ''}
                    onChange={e => setEvaluation(prev => ({ ...prev, massageFrequency: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Tipo (ex: relaxante, drenagem)"
                    value={evaluation.massageType || ''}
                    onChange={e => setEvaluation(prev => ({ ...prev, massageType: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Resultados percebidos"
                    value={evaluation.massageResults || ''}
                    onChange={e => setEvaluation(prev => ({ ...prev, massageResults: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}
            </div>

            {/* Objetivos da Sessão e Áreas do corpo (Obrigatórios) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                  Quais são seus objetivos com esta sessão de massagem? <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alívio de estresse, dores lombares, relaxamento..."
                  value={evaluation.massageGoals || ''}
                  onChange={e => setEvaluation(prev => ({ ...prev, massageGoals: e.target.value }))}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    attemptedSubmit && !evaluation.massageGoals?.trim()
                      ? 'border-rose-400 ring-2 ring-rose-400/20'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                  Alguma área específica do corpo precisa de atenção? <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ombros, pescoço, região lombar, pernas..."
                  value={evaluation.specificBodyAreasToFocus || ''}
                  onChange={e => setEvaluation(prev => ({ ...prev, specificBodyAreasToFocus: e.target.value }))}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    attemptedSubmit && !evaluation.specificBodyAreasToFocus?.trim()
                      ? 'border-rose-400 ring-2 ring-rose-400/20'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>
            </div>

            {/* Preferência de Pressão (Obrigatório) */}
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
                Alguma preferência quanto à pressão da massagem? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Leve', 'Moderada', 'Firme', 'Outra'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, pressurePreference: p }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      evaluation.pressurePreference === p
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shadow-sm ring-1 ring-teal-600'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
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
                  placeholder="Especifique sua preferência de pressão..."
                  value={evaluation.pressurePreferenceOther || ''}
                  onChange={e => setEvaluation(prev => ({ ...prev, pressurePreferenceOther: e.target.value }))}
                  className={`w-full mt-2 px-3 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
                    attemptedSubmit && !evaluation.pressurePreferenceOther?.trim()
                      ? 'border-rose-400 ring-2 ring-rose-400/20'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              )}
            </div>
          </div>
        </div>

        {/* 4. ESTILO DE VIDA & HÁBITOS (SIM OU NÃO OBRIGATÓRIOS) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                4. Estilo de Vida & Hábitos
              </h4>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
              * Responda Sim ou Não
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Tabagismo */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                attemptedSubmit && evaluation.isSmoker === undefined
                  ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Tabagismo: <span className="text-rose-500">*</span></span>
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
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      evaluation.isSmoker === false
                        ? 'bg-slate-800 text-white'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, isSmoker: true }))}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      evaluation.isSmoker === true
                        ? 'bg-teal-600 text-white'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-teal-50'
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
                  className={`w-full mt-2 px-3 py-1.5 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900 ${
                    attemptedSubmit && !evaluation.smokingDailyQuantity?.trim()
                      ? 'border-rose-400 ring-2 ring-rose-400/20'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              )}
            </div>

            {/* Álcool */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                attemptedSubmit && evaluation.drinksAlcohol === undefined
                  ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Consumo de álcool: <span className="text-rose-500">*</span></span>
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
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      evaluation.drinksAlcohol === false
                        ? 'bg-slate-800 text-white'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, drinksAlcohol: true }))}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      evaluation.drinksAlcohol === true
                        ? 'bg-teal-600 text-white'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-teal-50'
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
                  placeholder="Frequência / quantidade (ex: socialmente aos fins de semana)... *"
                  value={evaluation.alcoholFrequencyQuantity || ''}
                  onChange={e => setEvaluation(prev => ({ ...prev, alcoholFrequencyQuantity: e.target.value }))}
                  className={`w-full mt-2 px-3 py-1.5 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900 ${
                    attemptedSubmit && !evaluation.alcoholFrequencyQuantity?.trim()
                      ? 'border-rose-400 ring-2 ring-rose-400/20'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              )}
            </div>

            {/* Atividade Física */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                attemptedSubmit && evaluation.regularPhysicalActivity === undefined
                  ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Atividade física regular: <span className="text-rose-500">*</span></span>
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
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      evaluation.regularPhysicalActivity === false
                        ? 'bg-slate-800 text-white'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, regularPhysicalActivity: true }))}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      evaluation.regularPhysicalActivity === true
                        ? 'bg-teal-600 text-white'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-teal-50'
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
                  className={`w-full mt-2 px-3 py-1.5 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900 ${
                    attemptedSubmit && !evaluation.physicalActivityTypeFrequency?.trim()
                      ? 'border-rose-400 ring-2 ring-rose-400/20'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              )}
            </div>

            {/* Qualidade do Sono (Obrigatório) */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1.5">
                Qualidade do Sono: <span className="text-rose-500">*</span>
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {['Normal', 'Insônia', 'Outro'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, sleepQuality: s }))}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      evaluation.sleepQuality === s
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
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
                  className={`w-full mt-2 px-3 py-1.5 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900 ${
                    attemptedSubmit && !evaluation.sleepOtherDescription?.trim()
                      ? 'border-rose-400 ring-2 ring-rose-400/20'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              )}
            </div>
          </div>
        </div>

        {/* 5. TERMOS E CONDIÇÕES (OBRIGATÓRIO) */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            attemptedSubmit && !responsibilityTermAccepted
              ? 'border-rose-400 bg-rose-50/30 ring-2 ring-rose-400/20'
              : 'border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              5. Termos e Condições — Declaração e Ciência <span className="text-rose-500">*</span>
            </h4>
          </div>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mb-3 italic">
            Por favor leia o descritivo abaixo e assine no quadro digital ao final para validação jurídica e clínica.
          </p>

          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/30 leading-relaxed max-h-44 overflow-y-auto">
            <p>
              <strong className="text-slate-900 dark:text-slate-100">Cláusula 01:</strong> O(A) cliente declara que as
              informações prestadas nesta ficha de avaliação são verdadeiras, completas e de sua inteira responsabilidade,
              não tendo omitido nenhum fato relevante sobre seu estado de saúde físico ou mental.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-slate-100">Cláusula 02:</strong> O(A) cliente declara estar ciente
              de que os procedimentos de massoterapia e terapias manuais têm finalidade preventiva, relaxante, integrativa ou
              de alívio de tensões, não constituindo diagnósticos médicos nem substituindo consultas, tratamentos ou
              prescrições médicas convencionais.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-slate-100">Cláusula 03:</strong> Compromete-se a comunicar
              imediatamente ao profissional qualquer alteração futura em seu estado de saúde, gravidez, início de novos
              medicamentos ou desconforto durante as sessões.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-slate-100">Cláusula 04:</strong> Autoriza expressamente a realização
              dos atendimentos e sessões conforme o plano terapêutico acordado, concordando com as diretrizes e normas da clínica.
            </p>
          </div>

          <label className="flex items-start gap-3 mt-3.5 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={responsibilityTermAccepted}
              onChange={e => setResponsibilityTermAccepted(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-700 mt-0.5"
            />
            <span>
              Li, concordo e confirmo que estou ciente de todos os termos descritos acima. <span className="text-rose-500">* (Obrigatório)</span>
            </span>
          </label>
        </div>

        {/* 6. ASSINATURA DIGITAL DO CLIENTE (OBRIGATÓRIA E CALIBRADA) */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            attemptedSubmit && (!signatureUrl || signatureUrl.length < 50)
              ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                6. Assinatura Digital do Cliente como Ciente
              </h4>
              <span className="text-rose-500 font-bold text-xs">* Obrigatória</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Cidade"
                className="w-28 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
              <input
                type="text"
                value={state}
                onChange={e => setState(e.target.value.toUpperCase())}
                placeholder="UF"
                maxLength={2}
                className="w-12 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs uppercase text-center font-bold"
              />
              <span className="text-slate-400 font-medium">
                {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
            Desenhe sua assinatura com o dedo (no celular/tablet) ou mouse (no computador). O traço é calibrado e suavizado automaticamente para máxima fidelidade.
          </p>

          <CanvasSignature
            value={signatureUrl}
            onChange={setSignatureUrl}
            label="Assine com o dedo ou mouse no quadro abaixo:"
            required={!signatureUrl}
            height={190}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 flex-wrap">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            {missingFields.length === 0 ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Todos os campos e assinatura preenchidos
              </span>
            ) : (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {missingFields.length} item(ns) pendente(s) para validar
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando Anamnese...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Salvar Anamnese & Assinatura
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      )}
    </Modal>
  );
};
