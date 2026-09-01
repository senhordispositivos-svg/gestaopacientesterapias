import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Patient, User, SessionPackage } from '../../types';
import { Package, Calendar, DollarSign, Sparkles } from 'lucide-react';
import { formatCurrencyInput, parseCurrencyInput } from '../../utils/currency';

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  professionals: User[];
  onSavePackage: (pkgData: Partial<SessionPackage>) => Promise<void>;
  preselectedPatientId?: string;
}

export const PackageModal: React.FC<PackageModalProps> = ({
  isOpen,
  onClose,
  patients,
  professionals,
  onSavePackage,
  preselectedPatientId,
}) => {
  const [patientId, setPatientId] = useState(preselectedPatientId || (patients[0]?.id || ''));
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id || '');
  const [title, setTitle] = useState('Pacote de Massoterapia Integrativa');
  const [treatmentType, setTreatmentType] = useState('Massoterapia Integrativa & Shiatsu');
  const [sessionCount, setSessionCount] = useState(4);
  const [priceDisplay, setPriceDisplay] = useState('R$ 500,00');
  const [price, setPrice] = useState(500.0);
  const [validityDate, setValidityDate] = useState(
    new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (preselectedPatientId) {
        setPatientId(preselectedPatientId);
      } else if (patients.length > 0 && !patientId) {
        setPatientId(patients[0].id);
      } else if (patients.length > 0 && !patients.some(p => p.id === patientId)) {
        setPatientId(patients[0].id);
      }

      if (professionals.length > 0 && (!professionalId || !professionals.some(p => p.id === professionalId))) {
        setProfessionalId(professionals[0].id);
      }
      setError('');
    }
  }, [isOpen, preselectedPatientId, patients, professionals]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatCurrencyInput(rawVal);
    setPriceDisplay(formatted);
    setPrice(parseCurrencyInput(formatted));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!patientId) {
      setError('Selecione um paciente.');
      return;
    }

    if (sessionCount <= 0) {
      setError('A quantidade de sessões deve ser maior que zero.');
      return;
    }

    const selectedPat = patients.find(p => p.id === patientId);
    const selectedProf = professionals.find(p => p.id === professionalId);

    setIsSubmitting(true);
    try {
      await onSavePackage({
        patientId,
        patientName: selectedPat?.name || 'Paciente',
        professionalId,
        professionalName: selectedProf?.name || 'Profissional',
        title: title.trim() || 'Pacote de Sessões',
        treatmentType: treatmentType.trim() || 'Massoterapia & Fisioterapia',
        sessionCount: Number(sessionCount) || 4,
        price: Number(price) || 0,
        validityDate,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Erro ao criar pacote.');
      } else {
        setError('Erro ao criar pacote.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Novo Pacote de Sessões"
      subtitle="O pacote gerará automaticamente a quantidade de sessões vinculadas"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Paciente <span className="text-rose-500">*</span>
            </label>
            <select
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              required
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (CPF: {p.cpf})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Profissional Responsável <span className="text-rose-500">*</span>
            </label>
            <select
              value={professionalId}
              onChange={e => setProfessionalId(e.target.value)}
              required
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
            >
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.name} ({prof.specialty || 'Massoterapeuta'})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Título do Pacote
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Pacote 4 Sessões Alívio Cervical"
              required
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Quantidade de Sessões
            </label>
            <select
              value={sessionCount}
              onChange={e => setSessionCount(Number(e.target.value))}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 font-bold"
            >
              <option value={4}>4 Sessões</option>
              <option value={8}>8 Sessões</option>
              <option value={10}>10 Sessões</option>
              <option value={12}>12 Sessões</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tipo de Tratamento Principal
            </label>
            <input
              type="text"
              value={treatmentType}
              onChange={e => setTreatmentType(e.target.value)}
              placeholder="Ex: Shiatsu, Ventosaterapia, Drenagem"
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Valor Total do Pacote
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                inputMode="numeric"
                value={priceDisplay}
                onChange={handlePriceChange}
                placeholder="R$ 500,00"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 font-bold text-teal-700 dark:text-teal-400"
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Formato contábil brasileiro (Ex: R$ 500,00)</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Validade do Pacote
            </label>
            <input
              type="date"
              value={validityDate}
              onChange={e => setValidityDate(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
            />
          </div>
        </div>

        {/* Dynamic preview */}
        <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 text-xs text-teal-800 dark:text-teal-300 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Geração Automática de Sessões
          </p>
          <p className="text-[11px] leading-relaxed">
            Ao salvar, o sistema criará automaticamente {sessionCount} registros individuais de sessão com os status "Pendente/Agendada" para acompanhamento do progresso.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md"
          >
            {isSubmitting ? 'Gerando...' : 'Criar Pacote e Sessões'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
