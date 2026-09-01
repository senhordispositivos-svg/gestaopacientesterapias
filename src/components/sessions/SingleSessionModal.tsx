import React, { useState, useEffect } from 'react';
import { Patient, User } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CalendarCheck, DollarSign, Clock, UserCheck, Stethoscope } from 'lucide-react';
import { formatCurrencyInput, parseCurrencyInput } from '../../utils/currency';

interface SingleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  professionals: User[];
  onSessionCreated: () => void;
  preselectedPatientId?: string;
}

export const SingleSessionModal: React.FC<SingleSessionModalProps> = ({
  isOpen,
  onClose,
  patients,
  professionals,
  onSessionCreated,
  preselectedPatientId,
}) => {
  const { tenant, user } = useAuth();
  const [patientId, setPatientId] = useState(preselectedPatientId || (patients[0]?.id || ''));
  const [professionalId, setProfessionalId] = useState(user?.id || (professionals[0]?.id || ''));
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('14:00');
  const [procedureName, setProcedureName] = useState('Massagem Relaxante Integrativa');
  const [priceDisplay, setPriceDisplay] = useState('R$ 180,00');
  const [price, setPrice] = useState(180.0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setProfessionalId(user?.id || professionals[0].id);
      }
    }
  }, [isOpen, preselectedPatientId, patients, professionals, user]);

  if (!isOpen) return null;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setPriceDisplay(formatted);
    setPrice(parseCurrencyInput(formatted));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !patientId || !professionalId) return;

    const pat = patients.find(p => p.id === patientId);
    const prof = professionals.find(p => p.id === professionalId);

    setIsSubmitting(true);
    try {
      await api.createSingleSession(tenant.id, {
        patientId,
        patientName: pat?.name || 'Paciente',
        professionalId,
        professionalName: prof?.name || 'Profissional',
        scheduledDate,
        scheduledTime,
        procedures: [procedureName],
        price: price || 180,
        evolutionText: notes,
      });
      onSessionCreated();
      onClose();
    } catch (err) {
      alert('Erro ao agendar sessão avulsa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Nova Sessão Avulsa</h3>
            <p className="text-[11px] text-slate-500">Atendimento individual sem vínculo com pacote</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Paciente
            </label>
            <select
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-semibold"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (CPF: {p.cpf})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Profissional Responsável
            </label>
            <select
              value={professionalId}
              onChange={e => setProfessionalId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-semibold"
            >
              {professionals.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.specialty || 'Profissional'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Procedimento / Terapia
            </label>
            <input
              type="text"
              required
              value={procedureName}
              onChange={e => setProcedureName(e.target.value)}
              placeholder="Ex: Massagem Desportiva + Ventosa"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Data
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Horário
              </label>
              <input
                type="time"
                required
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Valor da Sessão
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={priceDisplay}
                onChange={handlePriceChange}
                placeholder="R$ 180,00"
                className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-teal-600 dark:text-teal-400 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Observações Iniciais
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anotações para a sessão avulsa..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
            >
              {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento Avulso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
