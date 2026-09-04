import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Patient, User, SessionPackage, PackageStatus } from '../../types';
import { Package, Calendar, DollarSign, Sparkles, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrencyInput, parseCurrencyInput, formatCurrencyAccounting } from '../../utils/currency';

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  professionals: User[];
  onSavePackage: (pkgData: Partial<SessionPackage>) => Promise<void>;
  onDeletePackage?: (pkg: SessionPackage) => Promise<void>;
  packageToEdit?: SessionPackage | null;
  preselectedPatientId?: string;
}

export const PackageModal: React.FC<PackageModalProps> = ({
  isOpen,
  onClose,
  patients,
  professionals,
  onSavePackage,
  onDeletePackage,
  packageToEdit,
  preselectedPatientId,
}) => {
  const isEditing = !!packageToEdit;

  const [patientId, setPatientId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [title, setTitle] = useState('Pacote de Massoterapia Integrativa');
  const [treatmentType, setTreatmentType] = useState('Massoterapia Integrativa & Shiatsu');
  const [sessionCount, setSessionCount] = useState(4);
  const [priceDisplay, setPriceDisplay] = useState('R$ 500,00');
  const [price, setPrice] = useState(500.0);
  const [status, setStatus] = useState<PackageStatus>('ACTIVE');
  const [validityDate, setValidityDate] = useState(
    new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfirmDelete(false);
      setError('');
      if (packageToEdit) {
        setPatientId(packageToEdit.patientId);
        setProfessionalId(packageToEdit.professionalId || professionals[0]?.id || '');
        setTitle(packageToEdit.title);
        setTreatmentType(packageToEdit.treatmentType);
        setSessionCount(packageToEdit.sessionCount || 4);
        setPrice(packageToEdit.price || 0);
        setPriceDisplay(formatCurrencyAccounting(packageToEdit.price || 0));
        setStatus(packageToEdit.status || 'ACTIVE');
        setValidityDate(
          packageToEdit.validityDate ||
            new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
        );
      } else {
        const initialPatId = preselectedPatientId || (patients[0]?.id || '');
        setPatientId(initialPatId);
        setProfessionalId(professionals[0]?.id || '');
        setTitle('Pacote de Massoterapia Integrativa');
        setTreatmentType('Massoterapia Integrativa & Shiatsu');
        setSessionCount(4);
        setPriceDisplay('R$ 500,00');
        setPrice(500.0);
        setStatus('ACTIVE');
        setValidityDate(
          new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
        );
      }
    }
  }, [isOpen, packageToEdit, preselectedPatientId, patients, professionals]);

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
        patientName: selectedPat?.name || packageToEdit?.patientName || 'Paciente',
        professionalId,
        professionalName: selectedProf?.name || packageToEdit?.professionalName || 'Profissional',
        title: title.trim() || 'Pacote de Sessões',
        treatmentType: treatmentType.trim() || 'Massoterapia & Fisioterapia',
        sessionCount: Number(sessionCount) || 4,
        price: Number(price) || 0,
        status,
        validityDate,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Erro ao salvar pacote.');
      } else {
        setError('Erro ao salvar pacote.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!packageToEdit || !onDeletePackage) return;
    setIsDeleting(true);
    setError('');
    try {
      await onDeletePackage(packageToEdit);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Erro ao excluir pacote.');
      } else {
        setError('Erro ao excluir pacote.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Pacote de Sessões' : 'Criar Novo Pacote de Sessões'}
      subtitle={
        isEditing
          ? 'Atualize as informações, status, valor ou quantidade de sessões'
          : 'O pacote gerará automaticamente a quantidade de sessões vinculadas'
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Delete Confirmation Banner */}
        {confirmDelete && packageToEdit && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <h4 className="font-bold text-sm">Confirmar Exclusão de Pacote?</h4>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              Você está prestes a excluir o pacote <strong>"{packageToEdit.title}"</strong> de{' '}
              <strong>{packageToEdit.patientName}</strong>. Esta ação removerá o pacote e todas as suas sessões vinculadas do banco de dados.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir Pacote'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
              >
                Cancelar
              </button>
            </div>
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
              disabled={isEditing}
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 disabled:opacity-75 disabled:bg-slate-100 dark:disabled:bg-slate-800"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.cpf ? `(CPF: ${p.cpf})` : ''}
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
              Título do Pacote <span className="text-rose-500">*</span>
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
              <option value={2}>2 Sessões</option>
              <option value={4}>4 Sessões</option>
              <option value={5}>5 Sessões</option>
              <option value={6}>6 Sessões</option>
              <option value={7}>7 Sessões</option>
              <option value={8}>8 Sessões</option>
              <option value={10}>10 Sessões</option>
              <option value={12}>12 Sessões</option>
              <option value={15}>15 Sessões</option>
              <option value={20}>20 Sessões</option>
              {![2, 4, 5, 6, 7, 8, 10, 12, 15, 20].includes(sessionCount) && sessionCount > 0 && (
                <option value={sessionCount}>{sessionCount} Sessões</option>
              )}
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

          {isEditing && (
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status do Pacote
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as PackageStatus)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 font-bold"
              >
                <option value="ACTIVE">Ativo (Em andamento)</option>
                <option value="COMPLETED">Concluído (Todas as sessões finalizadas)</option>
                <option value="SUSPENDED">Suspenso / Pausado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          )}
        </div>

        {/* Dynamic preview */}
        {!isEditing ? (
          <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 text-xs text-teal-800 dark:text-teal-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Geração Automática de Sessões
            </p>
            <p className="text-[11px] leading-relaxed">
              Ao salvar, o sistema criará automaticamente {sessionCount} registros individuais de sessão com os status "Pendente/Agendada" para acompanhamento do progresso.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>Sessões concluídas até o momento:</span>
            <span className="font-bold text-teal-700 dark:text-teal-400">
              {packageToEdit.completedCount || 0} de {packageToEdit.sessionCount}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 flex-wrap gap-2">
          <div>
            {isEditing && onDeletePackage && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Pacote
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || confirmDelete}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Pacote e Sessões'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
