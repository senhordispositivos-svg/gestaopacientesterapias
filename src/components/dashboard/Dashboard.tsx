import React from 'react';
import {
  Users,
  CalendarCheck,
  Clock,
  Package,
  Cake,
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  Building2,
  Shield,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Patient, Session, SessionPackage } from '../../types';
import { isBirthdayTomorrow, isBirthdayToday, calculateAge, formatDate } from '../../utils/crypto';

interface DashboardProps {
  patients: Patient[];
  sessions: Session[];
  packages: SessionPackage[];
  onNavigateTab: (tab: string) => void;
  onSelectPatient: (patient: Patient) => void;
  onSendWhatsAppBirthday: (patient: Patient) => void;
  onOpenNewPatient?: () => void;
  onOpenAnamnesis?: (patient: Patient) => void;
  onOpenPackageModal?: (patient: Patient) => void;
  onOpenSingleSessionModal?: (patient: Patient) => void;
  onAttendSession?: (session: Session) => void;
  onSendWhatsApp?: (session: Session) => void;
  onRefreshList?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  patients,
  sessions,
  packages,
  onNavigateTab,
  onSelectPatient,
  onSendWhatsAppBirthday,
  onOpenNewPatient,
}) => {
  const { tenant, user } = useAuth();

  const totalPatients = patients.length;
  const todayStr = new Date().toISOString().split('T')[0];

  const sessionsToday = sessions.filter(s => s.scheduledDate === todayStr);
  const sessionsCompletedToday = sessionsToday.filter(s => s.status === 'COMPLETED').length;
  const sessionsPendingToday = sessionsToday.length - sessionsCompletedToday;

  const activePackages = packages.filter(p => p.status === 'ACTIVE');

  // Birthdays
  const birthdaysTomorrow = patients.filter(p => isBirthdayTomorrow(p.birthDate));
  const birthdaysToday = patients.filter(p => isBirthdayToday(p.birthDate));
  const totalBirthdays = birthdaysToday.length + birthdaysTomorrow.length;

  const isIndividualMode = user?.role === 'PROFESSIONAL' && user?.accessMode === 'INDIVIDUAL';

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Clinic Personalized Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 md:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Building2 className="w-3 h-3" />
                {tenant?.tradeName || 'Sua Clínica'}
              </span>
              <span className="text-xs text-slate-400">
                • {tenant?.city || 'São Paulo'}/{tenant?.state || 'SP'}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Olá, {user?.name || 'Profissional'}!</span>
            </h1>

            <p className="text-xs md:text-sm text-slate-300">
              {isIndividualMode ? (
                <span className="text-amber-300 font-medium">
                  🔒 Nível Individual: Exibindo apenas os <strong>{totalPatients} pacientes</strong> e sessões sob seus cuidados.
                </span>
              ) : (
                <span>
                  Visão Geral Administrativa da <strong className="text-teal-300">{tenant?.tradeName}</strong>.
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-right">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Nível de Acesso</span>
              <span className="text-xs font-bold text-teal-400 flex items-center justify-end gap-1">
                <Shield className="w-3 h-3" />
                {user?.role === 'ADMIN' ? 'Administrador Geral' : 'Profissional Clínico'}
              </span>
            </div>
            {onOpenNewPatient && (
              <button
                type="button"
                onClick={onOpenNewPatient}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 transition cursor-pointer"
              >
                + Cadastrar Paciente
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Banner Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {/* Card 1: Pacientes Totais */}
        <div
          onClick={() => onNavigateTab('patients')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-teal-500 transition group"
        >
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>{isIndividualMode ? 'Meus Pacientes' : 'Pacientes da Clínica'}</span>
            <Users className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalPatients}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            {isIndividualMode ? 'Sob seu acompanhamento' : 'Ativos no sistema'}
          </div>
        </div>

        {/* Card 2: Sessões Hoje */}
        <div
          onClick={() => onNavigateTab('sessions')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-teal-500 transition group"
        >
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Sessões Hoje</span>
            <CalendarCheck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{sessionsToday.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {sessionsCompletedToday} atendidas / {sessionsPendingToday} agendadas
          </div>
        </div>

        {/* Card 3: Pacotes Ativos */}
        <div
          onClick={() => onNavigateTab('packages')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-teal-500 transition group"
        >
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Pacotes de Sessões</span>
            <Package className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{activePackages.length}</div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">Planos em andamento</div>
        </div>

        {/* Card 4: Aniversariantes */}
        <div
          onClick={() => onNavigateTab('birthdays')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-teal-500 transition group"
        >
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Aniversariantes</span>
            <Cake className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalBirthdays}</div>
          <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-1">
            {birthdaysToday.length} hoje • {birthdaysTomorrow.length} amanhã
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Sessions & Birthdays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sessions List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-500" />
              <span>Agenda de Atendimentos de Hoje ({sessionsToday.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('sessions')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {sessionsToday.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Nenhuma sessão agendada para hoje nesta clínica.
            </div>
          ) : (
            <div className="space-y-2.5">
              {sessionsToday.map(session => (
                <div
                  key={session.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 flex items-center justify-center font-bold text-xs text-teal-600 dark:text-teal-400">
                      {session.scheduledTime || '10:00'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {session.patientName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Sessão #{session.sessionNumber} • Profissional: {session.professionalName || user?.name}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      session.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {session.status === 'COMPLETED' ? 'Atendida' : 'Agendada'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Patients Quick List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-500" />
              <span>{isIndividualMode ? 'Meus Pacientes' : 'Pacientes Recentes'}</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('patients')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {patients.slice(0, 5).map(patient => (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className="p-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center justify-between cursor-pointer transition"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {patient.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Tel: {patient.phone}
                  </p>
                </div>
                <UserCheck className="w-4 h-4 text-teal-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
