import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Session } from '../../types';
import { Activity, Clock, CheckSquare, Stethoscope, DollarSign, Wallet, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '../../utils/crypto';
import { formatCurrencyAccounting, formatCurrencyInput, parseCurrencyInput } from '../../utils/currency';
import { lancarAtendimentoSessao } from '../../services/api';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  onSaveAttendance?: (attendanceData: {
    bloodPressure: string;
    siNotes: string;
    procedures: string[];
    evolutionText: string;
    price?: number;
  }) => Promise<void>;
  onSave?: () => Promise<void>;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  session,
  onSaveAttendance,
  onSave,
}) => {
  const isPackageSession = Boolean(session.packageId);
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [priceDisplay, setPriceDisplay] = useState(
    formatCurrencyAccounting(session.price && session.price > 0 ? session.price : 180)
  );
  const [price, setPrice] = useState(session.price && session.price > 0 ? session.price : 180);
  const [siNotes, setSiNotes] = useState(session.siNotes || '');
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>(
    session.procedures && session.procedures.length > 0 ? session.procedures : ['Shiatsu Dorsal']
  );
  const [evolutionText, setEvolutionText] = useState(
    session.evolutionText ||
      'Atendimento realizado com boa resposta tensional. Paciente relata alívio das dores principais.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatCurrencyInput(rawVal);
    setPriceDisplay(formatted);
    setPrice(parseCurrencyInput(formatted));
  };

  const allProcedures = [
    'Shiatsu Dorsal',
    'Shiatsu Ventral',
    'Shiatsu Cabeça',
    'Escalda-pés',
    'Anmá',
    'TuiNá',
    'Lomi Lomi',
    'Thai Massage',
    'Massagem com Pedras',
    'Massagem com Velas',
    'Ventosaterapia',
    'Bambuterapia',
    'Drenagem',
    'Outros',
  ];

  const toggleProcedure = (proc: string) => {
    setSelectedProcedures(prev =>
      prev.includes(proc) ? prev.filter(p => p !== proc) : [...prev, proc]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const bloodPressure = `${systolic}/${diastolic} mmHg`;
      const finalPrice = isPackageSession ? 0 : (price || 180);

      // Sincronização direta com o sistema financeiro (Print 03)
      if (!isPackageSession) {
        try {
          await lancarAtendimentoSessao({
            valor: finalPrice,
            nomeCliente: session.patientName || 'Mariana Alves',
            procedimento: selectedProcedures.length > 0 ? selectedProcedures.join(' & ') : 'Massagem Relaxante & Drenagem',
            data: new Date().toISOString().substring(0, 10),
            alsoAddToSalary: true,
          });
        } catch (finErr) {
          console.warn('Aviso de envio ao financeiro:', finErr);
        }
      }

      if (onSaveAttendance) {
        await onSaveAttendance({
          bloodPressure,
          siNotes,
          procedures: selectedProcedures,
          evolutionText,
          price: finalPrice,
        });
      } else if (onSave) {
        await onSave();
      }
      onClose();
    } catch (err) {
      console.error('Erro ao registrar atendimento:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nowFormatted = formatDateTime(new Date().toISOString());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tela de Atendimento — Sessão #${session.sessionNumber}`}
      subtitle={`Paciente: ${session.patientName} • Profissional: ${session.professionalName}`}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date/Time Banner (Non-editable as required by item #21) */}
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Data e Hora do Atendimento (Inalterável):</span>
          </div>
          <span className="font-extrabold text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border">
            {nowFormatted}
          </span>
        </div>

        {/* Valor da Sessão / Integração Financeira */}
        <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50/40 dark:bg-teal-950/20 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isPackageSession ? 'Sessão de Pacote Pré-Quitado' : 'Valor do Atendimento (Sessão Avulsa)'}</span>
            </label>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              isPackageSession 
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' 
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
            }`}>
              {isPackageSession ? 'R$ 0,00 • Sem Cobrança Duplicada' : 'Envia ao Financeiro + Salário Fixo'}
            </span>
          </div>

          {isPackageSession ? (
            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Esta sessão pertence a um pacote já faturado. Ao finalizar, o sistema registrará a presença e enviará <strong>amount: 0</strong> ao financeiro sem duplicar a cobrança.
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-full sm:w-56">
                <input
                  type="text"
                  value={priceDisplay}
                  onChange={handlePriceChange}
                  required
                  placeholder="R$ 180,00"
                  className="w-full px-3 py-2 text-sm font-black rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900 text-teal-900 dark:text-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Valor desta sessão individual. Será lançado na categoria <strong>MASSOTERAPIA</strong> e somado ao <strong>Salário Fixo</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Pressão Arterial & Campo S/I */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              Pressão Arterial
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={systolic}
                onChange={e => setSystolic(e.target.value)}
                placeholder="120"
                className="w-16 p-2 text-center rounded-lg border text-xs font-bold bg-white dark:bg-slate-900"
              />
              <span className="text-sm font-extrabold text-slate-400">/</span>
              <input
                type="text"
                value={diastolic}
                onChange={e => setDiastolic(e.target.value)}
                placeholder="80"
                className="w-16 p-2 text-center rounded-lg border text-xs font-bold bg-white dark:bg-slate-900"
              />
              <span className="text-xs text-slate-500 font-bold">mmHg</span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Campo S/I (Subjetivo / Inspecional)
            </label>
            <input
              type="text"
              value={siNotes}
              onChange={e => setSiNotes(e.target.value)}
              placeholder="Queixa relatada na chegada (ex: dor tensional cervical, cansaço nas pernas)..."
              className="w-full p-2.5 rounded-lg border text-xs bg-white dark:bg-slate-900"
            />
          </div>
        </div>

        {/* Procedimentos Realizados (Checkboxes) */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Procedimentos Executados na Sessão
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {allProcedures.map(proc => {
              const isChecked = selectedProcedures.includes(proc);
              return (
                <button
                  type="button"
                  key={proc}
                  onClick={() => toggleProcedure(proc)}
                  className={`p-2 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition ${
                    isChecked
                      ? 'bg-teal-50 border-teal-500 text-teal-800 dark:bg-teal-950 dark:border-teal-700 dark:text-teal-200'
                      : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{proc}</span>
                  <CheckSquare className={`w-3.5 h-3.5 shrink-0 ${isChecked ? 'text-teal-600 dark:text-teal-400' : 'text-slate-300'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Evolução Clínica Textarea */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Evolução Clínica do Atendimento (Prontuário)
          </label>
          <textarea
            value={evolutionText}
            onChange={e => setEvolutionText(e.target.value)}
            rows={4}
            required
            placeholder="Descreva detalhadamente a resposta aos estímulos manuais, pontos gatilhos trabalhados e orientação ao paciente..."
            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 font-medium"
          />
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
            {isSubmitting ? 'Registrando...' : 'Finalizar e Registrar Atendimento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
