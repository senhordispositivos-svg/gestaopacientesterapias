import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  HeartPulse,
  Stethoscope,
  PenTool,
  DollarSign,
  TrendingUp,
  FileSignature,
  Send,
  Eye,
  ShieldCheck,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  X,
  Package,
} from 'lucide-react';
import { Patient, Session, SessionPackage, User } from '../../types';
import { PatientList } from '../patients/PatientList';
import { formatCurrencyAccounting } from '../../utils/currency';
import { formatDate, formatDateTime } from '../../utils/crypto';
import { formatPhone } from '../../utils/cpf';

interface SessionsViewProps {
  sessions: Session[];
  patients: Patient[];
  professionals: User[];
  packages: SessionPackage[];
  onRefreshData?: () => void;
  onOpenSingleSessionModal: (patient?: Patient) => void;
  onOpenCreatePatientModal: () => void;
  onOpenEditPatientModal: (patient: Patient) => void;
  onSelectPatient: (patient: Patient) => void;
  onOpenAttendanceModal?: (session: Session) => void;
  onOpenWhatsAppModal?: (session: Session) => void;
}

export const SessionsView: React.FC<SessionsViewProps> = ({
  sessions = [],
  patients = [],
  professionals = [],
  packages = [],
  onRefreshData,
  onOpenSingleSessionModal,
  onOpenCreatePatientModal,
  onOpenEditPatientModal,
  onSelectPatient,
  onOpenAttendanceModal,
  onOpenWhatsAppModal,
}) => {
  const [activeTab, setActiveTab] = useState<'sessions_list' | 'patients_view'>('sessions_list');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SINGLE' | 'PACKAGE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'SCHEDULED'>('ALL');

  // Signature modal state
  const [viewingSignatureSession, setViewingSignatureSession] = useState<Session | null>(null);

  // Current month string
  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return (sessions || []).filter(sess => {
      // Type filter
      if (typeFilter === 'SINGLE' && sess.packageId) return false;
      if (typeFilter === 'PACKAGE' && !sess.packageId) return false;

      // Status filter
      if (statusFilter === 'COMPLETED' && sess.status !== 'COMPLETED') return false;
      if (statusFilter === 'SCHEDULED' && sess.status === 'COMPLETED') return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const patName = (sess.patientName || '').toLowerCase();
        const profName = (sess.professionalName || '').toLowerCase();
        const procs = (sess.procedures || []).join(' ').toLowerCase();
        const date = sess.scheduledDate || '';
        if (!patName.includes(term) && !profName.includes(term) && !procs.includes(term) && !date.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [sessions, typeFilter, statusFilter, searchTerm]);

  // Metrics
  const metrics = useMemo(() => {
    const thisMonthSessions = (sessions || []).filter(s => {
      const d = s.scheduledDate || s.attendedAt || '';
      return d.startsWith(currentMonth);
    });

    const singleSessions = thisMonthSessions.filter(s => !s.packageId);
    const packageSessions = thisMonthSessions.filter(s => Boolean(s.packageId));

    const totalSingleRevenue = singleSessions.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
    const completedCount = thisMonthSessions.filter(s => s.status === 'COMPLETED').length;

    return {
      totalThisMonth: thisMonthSessions.length,
      completedCount,
      singleCount: singleSessions.length,
      singleRevenue: totalSingleRevenue,
      packageCount: packageSessions.length,
    };
  }, [sessions, currentMonth]);

  return (
    <div className="space-y-5">
      {/* Top Banner & Action Header */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Histórico e Agenda de Sessões
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Integração Financeira Ativa
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Gerencie atendimentos clínicos, registre sessões avulsas com entrada no caixa do mês e evolução com
              assinatura do cliente.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenSingleSessionModal()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>+ Acrescentar Sessão Avulsa</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreatePatientModal}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Paciente</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Atendimentos no Mês
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {metrics.totalThisMonth}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ({metrics.completedCount} realizados)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                Sessões Avulsas
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-200/70 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                💰 No Caixa
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                {formatCurrencyAccounting(metrics.singleRevenue)}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                ({metrics.singleCount} sessões)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/40">
            <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">
              Sessões de Pacotes
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-teal-700 dark:text-teal-400">
                {metrics.packageCount}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                presenças computadas
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Sistema Financeiro
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Conectado / Auto-Sync</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Lista de Sessões vs Gestão por Pacientes */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('sessions_list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'sessions_list'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Lista de Sessões & Atendimentos ({filteredSessions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('patients_view')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'patients_view'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestão por Pacientes ({patients.length})</span>
          </button>
        </div>

        {activeTab === 'sessions_list' && (
          <button
            type="button"
            onClick={() => onOpenSingleSessionModal()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition"
          >
            <Plus className="w-3.5 h-3.5" /> + Sessão Avulsa
          </button>
        )}
      </div>

      {/* View 1: Sessões List */}
      {activeTab === 'sessions_list' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome do cliente, técnica utilizada, data..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 outline-none text-slate-900 dark:text-white focus:border-teal-600"
              />
            </div>

            {/* Type & Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    typeFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('SINGLE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    typeFilter === 'SINGLE'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sessões Avulsas
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('PACKAGE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    typeFilter === 'PACKAGE'
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Pacotes
                </button>
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-200 font-semibold"
              >
                <option value="ALL">Status: Todos</option>
                <option value="COMPLETED">Concluídos</option>
                <option value="SCHEDULED">Agendados</option>
              </select>
            </div>
          </div>

          {/* Sessions List */}
          {filteredSessions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <CalendarCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Nenhuma sessão encontrada
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Não encontramos atendimentos com os filtros aplicados. Você pode acrescentar uma nova sessão avulsa
                  a qualquer momento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenSingleSessionModal()}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm inline-flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Acrescentar Sessão Avulsa
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map(sess => {
                const isSingle = !sess.packageId;
                const isCompleted = sess.status === 'COMPLETED';
                const hasSignature = Boolean(sess.clientSignatureUrl);

                return (
                  <div
                    key={sess.id}
                    className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 dark:hover:border-teal-500/40 shadow-2xs hover:shadow-sm transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Patient & Session info */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                            isSingle
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          }`}
                        >
                          {(sess.patientName || 'P').charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              {sess.patientName || 'Paciente'}
                            </h4>

                            {/* Badge: Tipo & Valor */}
                            {isSingle ? (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                                <DollarSign className="w-3 h-3" />
                                <span>Sessão Avulsa • {formatCurrencyAccounting(sess.price || 180)}</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                <span>Pacote (Sessão #{sess.sessionNumber || 1})</span>
                              </span>
                            )}

                            {/* Status badge */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                isCompleted
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {isCompleted ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Realizado</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Agendado</span>
                                </>
                              )}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {sess.scheduledDate ? formatDate(sess.scheduledDate) : 'Hoje'} às{' '}
                              {sess.scheduledTime || '14:00'}
                            </span>
                            {sess.professionalName && (
                              <span>• Profissional: <strong>{sess.professionalName}</strong></span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {onOpenWhatsAppModal && (
                          <button
                            type="button"
                            onClick={() => onOpenWhatsAppModal(sess)}
                            title="Enviar confirmação / recibo no WhatsApp"
                            className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 transition"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        {onOpenAttendanceModal && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => onOpenAttendanceModal(sess)}
                            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Atender / Evoluir</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Middle details: Pressão Arterial, Técnicas, Assinatura */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      {/* Pressão Arterial */}
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                        <HeartPulse className="w-4 h-4 text-rose-500 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Pressão Arterial:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {sess.bloodPressure || 'Não aferida'}
                          </span>
                        </div>
                      </div>

                      {/* Técnicas Utilizadas */}
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl md:col-span-1">
                        <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
                        <div className="overflow-hidden">
                          <span className="text-[10px] text-slate-400 block font-semibold">Técnicas:</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {(sess.procedures && sess.procedures.length > 0
                              ? sess.procedures
                              : ['Massoterapia']
                            ).map((proc, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-semibold border border-slate-200 dark:border-slate-600"
                              >
                                {proc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Assinatura do Cliente */}
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                        <div className="flex items-center gap-2">
                          <FileSignature className="w-4 h-4 text-teal-600 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Assinatura Cliente:</span>
                            {hasSignature ? (
                              <button
                                type="button"
                                onClick={() => setViewingSignatureSession(sess)}
                                className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Assinada (Ver)
                              </button>
                            ) : (
                              <span className="text-slate-400 font-medium">Opcional / Não coletada</span>
                            )}
                          </div>
                        </div>

                        {/* If not signed yet and completed, allow collecting */}
                        {!hasSignature && isCompleted && onOpenAttendanceModal && (
                          <button
                            type="button"
                            onClick={() => onOpenAttendanceModal(sess)}
                            className="px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-[10px] font-bold border border-teal-200 dark:border-teal-800 transition"
                          >
                            Assinar no Tablet
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Evolution text if present */}
                    {sess.evolutionText && (
                      <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">
                          Evolução Clínica / Queixas:
                        </span>
                        <p className="leading-relaxed">{sess.evolutionText}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View 2: Gestão por Pacientes */}
      {activeTab === 'patients_view' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <PatientList
            patients={patients}
            professionals={professionals}
            onSelectPatient={onSelectPatient}
            onOpenCreateModal={onOpenCreatePatientModal}
            onOpenEditModal={onOpenEditPatientModal}
            onDeletePatient={() => {}}
            onOpenSingleSessionModal={patient => onOpenSingleSessionModal(patient)}
          />
        </div>
      )}

      {/* Signature Viewer Modal */}
      {viewingSignatureSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Assinatura Digital do Cliente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingSignatureSession(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <p className="text-slate-700 dark:text-slate-300">
                <strong>Paciente:</strong> {viewingSignatureSession.patientName}
              </p>
              <p className="text-slate-500">
                <strong>Data do Atendimento:</strong>{' '}
                {viewingSignatureSession.scheduledDate
                  ? formatDate(viewingSignatureSession.scheduledDate)
                  : 'N/D'}{' '}
                às {viewingSignatureSession.scheduledTime}
              </p>
              {viewingSignatureSession.price && (
                <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                  <strong>Valor:</strong> {formatCurrencyAccounting(viewingSignatureSession.price)} (Entrou no Caixa)
                </p>
              )}
            </div>

            {/* Signature image */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner flex items-center justify-center">
              {viewingSignatureSession.clientSignatureUrl ? (
                <img
                  src={viewingSignatureSession.clientSignatureUrl}
                  alt="Assinatura do Cliente"
                  className="max-h-48 object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <p className="text-xs text-slate-400 py-6">Nenhuma imagem de assinatura encontrada.</p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Comprovante autenticado digitalmente com token de validação{' '}
                <code className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {viewingSignatureSession.validationToken || 'SESS-OK'}
                </code>
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingSignatureSession(null)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
