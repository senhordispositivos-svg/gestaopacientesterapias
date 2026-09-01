import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CanvasSignature } from '../common/CanvasSignature';
import { Patient, HealthHistory, MedicalTreatments, Habits, Anamnesis, MassotherapyEvaluation } from '../../types';
import { ClipboardList, Check, X, ShieldAlert, Sparkles, User, FileText, Heart } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface AnamnesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  initialData?: Anamnesis | null;
  onSaveAnamnesis: (anamnesisData: Partial<Anamnesis>) => Promise<void>;
}

const defaultEvaluation: MassotherapyEvaluation = {
  hasCurrentMedicalCondition: false,
  currentMedicalConditionDescription: '',
  hasRecentSurgeries: false,
  recentSurgeriesDescription: '',
  hasKnownAllergies: false,
  knownAllergiesDescription: '',
  isPregnantOrBreastfeeding: false,
  hasHadMassageBefore: false,
  massageFrequency: '',
  massageType: '',
  massageResults: '',
  massageGoals: '',
  specificBodyAreasToFocus: '',
  pressurePreference: 'Moderada',
  pressurePreferenceOther: '',
  isSmoker: false,
  smokingDailyQuantity: '',
  drinksAlcohol: false,
  alcoholFrequencyQuantity: '',
  regularPhysicalActivity: false,
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
  const [evaluation, setEvaluation] = useState<MassotherapyEvaluation>(defaultEvaluation);
  const [responsibilityTermAccepted, setResponsibilityTermAccepted] = useState(true);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [city, setCity] = useState(patient?.city || tenant?.city || '');
  const [state, setState] = useState(patient?.state || tenant?.state || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [error, setError] = useState('');

  // Sync state whenever modal opens or patient / initialData changes
  useEffect(() => {
    if (!isOpen || !patient) return;

    let isMounted = true;
    setError('');

    const applyAnamnesis = (data: Anamnesis | null | undefined) => {
      if (data) {
        setEvaluation(data.evaluation ? { ...defaultEvaluation, ...data.evaluation } : defaultEvaluation);
        setResponsibilityTermAccepted(
          data.responsibilityTermAccepted !== undefined ? data.responsibilityTermAccepted : true
        );
        setSignatureUrl(data.patientSignatureUrl || '');
        setCity(data.city || patient.city || tenant?.city || '');
        setState(data.state || patient.state || tenant?.state || '');
      } else {
        setEvaluation(defaultEvaluation);
        setResponsibilityTermAccepted(true);
        setSignatureUrl('');
        setCity(patient.city || tenant?.city || '');
        setState(patient.state || tenant?.state || '');
      }
    };

    if (initialData !== undefined) {
      applyAnamnesis(initialData);
    } else if (tenant?.id && patient.id) {
      setIsLoadingExisting(true);
      api.getAnamnesis(patient.id, tenant.id)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!responsibilityTermAccepted) {
      setError('É necessário aceitar os Termos e Condições para validar a ficha.');
      return;
    }

    if (!signatureUrl) {
      setError('Por favor, desenhe e confirme a assinatura digital do cliente no quadro abaixo.');
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
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[78vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. DADOS DO CLIENTE RESUMIDOS */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
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
                {patient.cpf} {patient.rg ? `| ${patient.rg}` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Telefone / WhatsApp</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{patient.phone || patient.whatsapp}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Gênero / Profissão</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {patient.gender || 'Não informado'} {patient.profession ? `• ${patient.profession}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* 2. HISTÓRICO MÉDICO */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-rose-500" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              2. Histórico Médico & Saúde
            </h4>
          </div>

          <div className="space-y-3">
            {/* Condição médica */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Possui alguma condição médica atual?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, hasCurrentMedicalCondition: false }))}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      !evaluation.hasCurrentMedicalCondition
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, hasCurrentMedicalCondition: true }))}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      evaluation.hasCurrentMedicalCondition
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>
              {evaluation.hasCurrentMedicalCondition && (
                <input
                  type="text"
                  placeholder="Se sim, descreva a condição médica..."
                  value={evaluation.currentMedicalConditionDescription || ''}
                  onChange={e =>
                    setEvaluation(prev => ({ ...prev, currentMedicalConditionDescription: e.target.value }))
                  }
                  className="w-full mt-2.5 px-3 py-2 rounded border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              )}
            </div>

            {/* Cirurgias */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Já fez cirurgias recentes?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, hasRecentSurgeries: false }))}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      !evaluation.hasRecentSurgeries
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, hasRecentSurgeries: true }))}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      evaluation.hasRecentSurgeries
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>
              {evaluation.hasRecentSurgeries && (
                <input
                  type="text"
                  placeholder="Se sim, quais e quando?"
                  value={evaluation.recentSurgeriesDescription || ''}
                  onChange={e =>
                    setEvaluation(prev => ({ ...prev, recentSurgeriesDescription: e.target.value }))
                  }
                  className="w-full mt-2.5 px-3 py-2 rounded border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              )}
            </div>

            {/* Alergias */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tem alergias conhecidas (óleos, cosméticos, medicamentos)?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, hasKnownAllergies: false }))}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      !evaluation.hasKnownAllergies
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, hasKnownAllergies: true }))}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      evaluation.hasKnownAllergies
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>
              {evaluation.hasKnownAllergies && (
                <input
                  type="text"
                  placeholder="Se sim, quais?"
                  value={evaluation.knownAllergiesDescription || ''}
                  onChange={e =>
                    setEvaluation(prev => ({ ...prev, knownAllergiesDescription: e.target.value }))
                  }
                  className="w-full mt-2.5 px-3 py-2 rounded border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              )}
            </div>

            {/* Gravidez */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Está grávida ou em período de amamentação?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, isPregnantOrBreastfeeding: false }))}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      !evaluation.isPregnantOrBreastfeeding
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, isPregnantOrBreastfeeding: true }))}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      evaluation.isPregnantOrBreastfeeding
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. HISTÓRICO DE MASSAGEM & OBJETIVOS */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              3. Histórico de Massagem & Objetivos da Sessão
            </h4>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Já fez massagem antes?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, hasHadMassageBefore: false }))}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      !evaluation.hasHadMassageBefore
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, hasHadMassageBefore: true }))}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      evaluation.hasHadMassageBefore
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>
              {evaluation.hasHadMassageBefore && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5">
                  <input
                    type="text"
                    placeholder="Frequência (ex: mensal, quinzenal)"
                    value={evaluation.massageFrequency || ''}
                    onChange={e => setEvaluation(prev => ({ ...prev, massageFrequency: e.target.value }))}
                    className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Tipo (ex: relaxante, drenagem)"
                    value={evaluation.massageType || ''}
                    onChange={e => setEvaluation(prev => ({ ...prev, massageType: e.target.value }))}
                    className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Resultados percebidos"
                    value={evaluation.massageResults || ''}
                    onChange={e => setEvaluation(prev => ({ ...prev, massageResults: e.target.value }))}
                    className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Quais são seus objetivos com esta sessão de massagem?
                </label>
                <input
                  type="text"
                  placeholder="Ex: Alívio de estresse, dores lombares, relaxamento..."
                  value={evaluation.massageGoals || ''}
                  onChange={e => setEvaluation(prev => ({ ...prev, massageGoals: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Alguma área específica do corpo precisa de atenção?
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ombros, pescoço, região lombar, pernas..."
                  value={evaluation.specificBodyAreasToFocus || ''}
                  onChange={e => setEvaluation(prev => ({ ...prev, specificBodyAreasToFocus: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Preferência de Pressão */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Alguma preferência quanto à pressão da massagem?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Leve', 'Moderada', 'Firme', 'Outra'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, pressurePreference: p }))}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      evaluation.pressurePreference === p
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {evaluation.pressurePreference === 'Outra' && (
                <input
                  type="text"
                  placeholder="Especifique sua preferência de pressão..."
                  value={evaluation.pressurePreferenceOther || ''}
                  onChange={e => setEvaluation(prev => ({ ...prev, pressurePreferenceOther: e.target.value }))}
                  className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              )}
            </div>
          </div>
        </div>

        {/* 4. ESTILO DE VIDA */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              4. Estilo de Vida & Hábitos
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Tabagismo */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Tabagismo:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, isSmoker: false }))}
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      !evaluation.isSmoker ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, isSmoker: true }))}
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      evaluation.isSmoker ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>
              {evaluation.isSmoker && (
                <input
                  type="text"
                  placeholder="Quantidade diária..."
                  value={evaluation.smokingDailyQuantity || ''}
                  onChange={e => setEvaluation(prev => ({ ...prev, smokingDailyQuantity: e.target.value }))}
                  className="w-full mt-2 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900"
                />
              )}
            </div>

            {/* Álcool */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Consumo de álcool:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, drinksAlcohol: false }))}
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      !evaluation.drinksAlcohol ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, drinksAlcohol: true }))}
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      evaluation.drinksAlcohol ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>
              {evaluation.drinksAlcohol && (
                <input
                  type="text"
                  placeholder="Frequência / quantidade..."
                  value={evaluation.alcoholFrequencyQuantity || ''}
                  onChange={e => setEvaluation(prev => ({ ...prev, alcoholFrequencyQuantity: e.target.value }))}
                  className="w-full mt-2 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900"
                />
              )}
            </div>

            {/* Atividade Física */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Atividade física regular:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, regularPhysicalActivity: false }))}
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      !evaluation.regularPhysicalActivity
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, regularPhysicalActivity: true }))}
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      evaluation.regularPhysicalActivity
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>
              {evaluation.regularPhysicalActivity && (
                <input
                  type="text"
                  placeholder="Tipo e frequência semanal..."
                  value={evaluation.physicalActivityTypeFrequency || ''}
                  onChange={e =>
                    setEvaluation(prev => ({ ...prev, physicalActivityTypeFrequency: e.target.value }))
                  }
                  className="w-full mt-2 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900"
                />
              )}
            </div>

            {/* Sono */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Qualidade do Sono:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {['Normal', 'Insônia', 'Outro'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEvaluation(prev => ({ ...prev, sleepQuality: s }))}
                    className={`py-1 rounded text-xs font-bold transition-all ${
                      evaluation.sleepQuality === s
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {evaluation.sleepQuality === 'Outro' && (
                <input
                  type="text"
                  placeholder="Descreva seu padrão de sono..."
                  value={evaluation.sleepOtherDescription || ''}
                  onChange={e => setEvaluation(prev => ({ ...prev, sleepOtherDescription: e.target.value }))}
                  className="w-full mt-2 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900"
                />
              )}
            </div>
          </div>
        </div>

        {/* 5. TERMOS E CONDIÇÕES (4 Cláusulas do Modelo) */}
        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              5. Termos e Condições — Declaração e Ciência
            </h4>
          </div>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mb-3 italic">
            Por favor leia o descritivo abaixo e assine no quadro digital ao final.
          </p>

          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30 leading-relaxed max-h-44 overflow-y-auto">
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

          <label className="flex items-center gap-2.5 mt-3 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={responsibilityTermAccepted}
              onChange={e => setResponsibilityTermAccepted(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-700"
            />
            <span>Li, concordo e confirmo que estou ciente de todos os termos descritos acima.</span>
          </label>
        </div>

        {/* 6. ASSINATURA DIGITAL DO CLIENTE */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              6. Assinatura do Cliente como Ciente
            </h4>
            <div className="flex items-center gap-2 text-xs">
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Cidade"
                className="w-28 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
              <input
                type="text"
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="UF"
                maxLength={2}
                className="w-12 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs uppercase"
              />
              <span className="text-slate-400 font-medium">
                {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          <CanvasSignature
            value={signatureUrl}
            onChange={setSignatureUrl}
            label="Assine com o dedo ou mouse no quadro abaixo:"
          />
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando Anamnese...
              </>
            ) : (
              'Salvar Anamnese & Assinatura'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
