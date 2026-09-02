import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  UserCheck,
  Edit2,
  Trash2,
  Eye,
  Phone,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Building2,
  Filter,
  UserX,
  AlertTriangle,
  ArrowRightLeft,
  FileSignature,
  Send,
} from 'lucide-react';
import { Patient, User } from '../../types';
import { validateCPF, formatCPF, formatPhone } from '../../utils/cpf';
import { calculateAge, formatDate } from '../../utils/crypto';

interface PatientListProps {
  patients?: Patient[];
  professionals?: User[];
  onSelectPatient: (patient: Patient) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  onOpenSendAnamnesisLink?: (patient?: Patient) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients = [],
  professionals = [],
  onSelectPatient,
  onOpenCreateModal,
  onOpenEditModal,
  onDeletePatient,
  onOpenSendAnamnesisLink,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfFilter, setSelectedProfFilter] = useState<string>('ALL');
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    try {
      await onDeletePatient(patientToDelete.id);
      setPatientToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir paciente:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const inactiveProfIds = new Set(
    professionals.filter(p => p.active === false).map(p => p.id)
  );

  const filtered = (patients || []).filter(patient => {
    const matchesSearch =
      (patient.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.cpf || '').includes(searchTerm) ||
      (patient.phone || '').includes(searchTerm) ||
      (patient.whatsapp || '').includes(searchTerm);

    let matchesProf = true;
    if (selectedProfFilter === 'ALL') {
      matchesProf = true;
    } else if (selectedProfFilter === 'ONLY_ACTIVE_PROFS') {
      matchesProf =
        !patient.assignedProfessionalId || !inactiveProfIds.has(patient.assignedProfessionalId);
    } else if (selectedProfFilter === 'ONLY_INACTIVE_PROFS') {
      matchesProf =
        !!patient.assignedProfessionalId && inactiveProfIds.has(patient.assignedProfessionalId);
    } else {
      matchesProf = patient.assignedProfessionalId === selectedProfFilter;
    }

    return matchesSearch && matchesProf;
  });

  const inactivePatientsCount = (patients || []).filter(
    p => p.assignedProfessionalId && inactiveProfIds.has(p.assignedProfessionalId)
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Gestão de Pacientes ({filtered.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cadastro de pacientes com prontuário clínico individual e controle por profissional responsável.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenSendAnamnesisLink && (
            <button
              type="button"
              onClick={() => onOpenSendAnamnesisLink()}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
              title="Gerar e Enviar Link de Cadastro e Anamnese no WhatsApp"
            >
              <FileSignature className="w-4 h-4" /> Enviar Link no WhatsApp
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Cadastrar Novo Paciente
          </button>
        </div>
      </div>

      {/* Banner if there are patients with inactive professionals */}
      {inactivePatientsCount > 0 && selectedProfFilter !== 'ONLY_INACTIVE_PROFS' && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Existem <strong>{inactivePatientsCount} paciente(s)</strong> vinculados a profissionais inativos no sistema.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedProfFilter('ONLY_INACTIVE_PROFS')}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shrink-0 transition"
          >
            Filtrar Inativos
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por Nome, CPF, Telefone ou WhatsApp..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 dark:text-slate-100 transition"
          />
        </div>

        {/* Professional Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedProfFilter}
            onChange={e => setSelectedProfFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 dark:text-slate-100 transition font-medium"
          >
            <option value="ALL">Todos os Profissionais</option>
            <option value="ONLY_ACTIVE_PROFS">🟢 Apenas Profissionais Ativos</option>
            {inactivePatientsCount > 0 && (
              <option value="ONLY_INACTIVE_PROFS">🔴 Pacientes de Profissionais Inativos ({inactivePatientsCount})</option>
            )}
            <optgroup label="Filtrar por Profissional Específico">
              {(professionals || []).map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.active === false ? '❌ [INATIVO]' : '✅ [ATIVO]'}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Patients Container: Responsive Cards on Mobile & Tablet, Table on Desktop */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
            <p className="text-xs font-semibold">Nenhum paciente encontrado.</p>
            <p className="text-[11px] text-slate-500">
              Tente alterar os termos de pesquisa ou cadastre um novo paciente.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile / Small Tablet Card View (md:hidden) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-2">
              {filtered.map(pat => {
                const isCpfValid = validateCPF(pat.cpf);
                const isProfInactive =
                  !!pat.assignedProfessionalId && inactiveProfIds.has(pat.assignedProfessionalId);

                return (
                  <div
                    key={pat.id}
                    className={`p-3.5 space-y-3 rounded-xl transition ${
                      isProfInactive
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-teal-200 dark:border-teal-800">
                          {pat.photoUrl || pat.avatarUrl ? (
                            <img
                              src={pat.photoUrl || pat.avatarUrl}
                              alt={pat.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            pat.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3
                            onClick={() => onSelectPatient(pat)}
                            className="font-bold text-sm text-slate-900 dark:text-white truncate cursor-pointer hover:text-teal-600 dark:hover:text-teal-400"
                          >
                            {pat.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>CPF: {formatCPF(pat.cpf)}</span>
                            {pat.cpf && pat.cpf.replace(/\D/g, '').length > 0 ? (
                              isCpfValid ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                              ) : (
                                <span title="CPF não validado">
                                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                                </span>
                              )
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-block px-2 py-0.5 rounded font-semibold text-[10px] shrink-0 ${
                          isProfInactive
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isProfInactive ? `⚠️ Inativo (${pat.assignedProfessionalName})` : (pat.assignedProfessionalName || 'Geral')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Contato:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{formatPhone(pat.phone)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Idade:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {pat.birthDate ? `${calculateAge(pat.birthDate)} anos` : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onSelectPatient(pat)}
                        className="flex-1 py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Prontuário</span>
                      </button>

                      {onOpenSendAnamnesisLink && (
                        <button
                          type="button"
                          onClick={() => onOpenSendAnamnesisLink(pat)}
                          title="Enviar Ficha no WhatsApp"
                          className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenEditModal(pat)}
                        title="Editar Paciente"
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPatientToDelete(pat)}
                        title="Excluir Paciente"
                        className="p-2 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Paciente</th>
                    <th className="px-4 py-3">CPF</th>
                    <th className="px-4 py-3">Contato & WhatsApp</th>
                    <th className="px-4 py-3">Profissão / Idade</th>
                    <th className="px-4 py-3">Profissional Responsável</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map(pat => {
                    const isCpfValid = validateCPF(pat.cpf);
                    const isProfInactive =
                      !!pat.assignedProfessionalId && inactiveProfIds.has(pat.assignedProfessionalId);

                    return (
                      <tr
                        key={pat.id}
                        className={`transition group ${
                          isProfInactive
                            ? 'bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/50 dark:hover:bg-rose-950/30'
                            : 'hover:bg-teal-50/30 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => onSelectPatient(pat)}
                            className="text-left font-bold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition flex items-center gap-2"
                          >
                            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-teal-200 dark:border-teal-800">
                              {pat.photoUrl || pat.avatarUrl ? (
                                <img
                                  src={pat.photoUrl || pat.avatarUrl}
                                  alt={pat.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                pat.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <span className="block font-bold">{pat.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                Cadastrado em {formatDate(pat.createdAt)}
                              </span>
                            </div>
                          </button>
                        </td>

                        <td className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <span>{formatCPF(pat.cpf)}</span>
                            {pat.cpf && pat.cpf.replace(/\D/g, '').length > 0 ? (
                              isCpfValid ? (
                                <span title="CPF Válido">
                                 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                               </span>
                              ) : (
                                <span title="CPF Não Validado">
                                 <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                               </span>
                              )
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatPhone(pat.phone)}
                          </p>
                          {pat.whatsapp && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                              WhatsApp: {formatPhone(pat.whatsapp)}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{pat.profession || 'Não informada'}</p>
                          <p className="text-[10px] text-slate-400">
                            {pat.birthDate ? `${calculateAge(pat.birthDate)} anos (${formatDate(pat.birthDate)})` : '-'}
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          {isProfInactive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-800">
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                              {pat.assignedProfessionalName} (Inativo)
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                              {pat.assignedProfessionalName || 'Geral'}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onOpenSendAnamnesisLink && (
                              <button
                                type="button"
                                onClick={() => onOpenSendAnamnesisLink(pat)}
                                title="Enviar Ficha de Cadastro & Anamnese via WhatsApp"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onSelectPatient(pat)}
                              title="Abrir Perfil e Prontuário"
                              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenEditModal(pat)}
                              title="Editar Dados / Reatribuir Profissional"
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPatientToDelete(pat)}
                              title="Excluir Paciente"
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* In-App Delete Confirmation Modal */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Excluir Cadastro do Paciente
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta ação removerá o paciente e sincronizará imediatamente.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {patientToDelete.name}
              </div>
              {patientToDelete.cpf && (
                <div className="text-slate-500 dark:text-slate-400">
                  CPF: {formatCPF(patientToDelete.cpf)}
                </div>
              )}
              {patientToDelete.phone && (
                <div className="text-slate-500 dark:text-slate-400">
                  Telefone: {formatPhone(patientToDelete.phone)}
                </div>
              )}
              {patientToDelete.assignedProfessionalName && (
                <div className="text-slate-500 dark:text-slate-400">
                  Profissional: {patientToDelete.assignedProfessionalName}
                </div>
              )}
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              Aviso: Os registros e pacotes vinculados a este paciente serão arquivados do sistema.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPatientToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Excluindo e sincronizando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sim, Excluir Paciente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
