import React, { useState, useMemo } from 'react';
import {
  Package,
  CheckCircle2,
  Clock,
  UserCheck,
  Share2,
  PenTool,
  Search,
  Plus,
  Filter,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  ExternalLink,
  ShieldCheck,
  Edit2,
  Eye,
  History,
  CheckSquare,
  Layers,
  ChevronRight,
  Printer,
  Download,
  X,
} from 'lucide-react';
import { Patient, Session, SessionPackage, User } from '../../types';
import { CanvasSignature } from '../common/CanvasSignature';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrencyAccounting } from '../../utils/currency';
import { formatDateTime } from '../../utils/crypto';
import { createSessionValidationUrl, createPackageValidationUrl } from '../../utils/validationPayload';
import { copyToClipboard } from '../../utils/clipboard';

interface PackagesTrackerViewProps {
  packages: SessionPackage[];
  sessions: Session[];
  patients: Patient[];
  professionals: User[];
  onRefreshData: () => void;
  onOpenCreatePackage: () => void;
  onOpenAttendanceModal?: (session: Session) => void;
  onOpenWhatsAppModal?: (session: Session) => void;
  onOpenPackageDetail?: (pkg: SessionPackage) => void;
}

export const PackagesTrackerView: React.FC<PackagesTrackerViewProps> = ({
  packages,
  sessions,
  patients,
  professionals,
  onRefreshData,
  onOpenCreatePackage,
  onOpenAttendanceModal,
  onOpenWhatsAppModal,
  onOpenPackageDetail,
}) => {
  const { tenant, user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>('ALL');

  // Collapse / Expand Packages state
  const [collapsedPackageIds, setCollapsedPackageIds] = useState<{ [id: string]: boolean }>({});

  // History Consultation Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyPatientFilter, setHistoryPatientFilter] = useState('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');

  // Direct In-Device Signature Modal State
  const [signingSession, setSigningSession] = useState<{
    session: Session;
    pkg: SessionPackage;
  } | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [isSavingSignature, setIsSavingSignature] = useState(false);

  // View Client Signature Modal State
  const [viewingSignatureSession, setViewingSignatureSession] = useState<{
    session: Session;
    pkg?: SessionPackage;
    patient?: Patient;
  } | null>(null);

  // Optional Clinical Details Modal State
  const [optionalDetailsSession, setOptionalDetailsSession] = useState<{
    session: Session;
    pkg: SessionPackage;
  } | null>(null);
  const [techniquesInput, setTechniquesInput] = useState('');
  const [bloodPressureInput, setBloodPressureInput] = useState('');
  const [evolutionInput, setEvolutionInput] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Expanded techniques preview on session cards
  const [expandedSessionIds, setExpandedSessionIds] = useState<{ [id: string]: boolean }>({});
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  // Helper to determine if a package is fully completed
  const isPackageCompleted = (pkg: SessionPackage) => {
    if (pkg.status === 'COMPLETED') return true;
    const pkgSessions = sessions.filter(s => s.packageId === pkg.id);
    const completedCount = pkgSessions.filter(s => s.status === 'COMPLETED').length;
    return pkg.sessionCount > 0 && completedCount >= pkg.sessionCount;
  };

  // Filter packages
  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        pkg.patientName.toLowerCase().includes(q) ||
        pkg.title.toLowerCase().includes(q) ||
        pkg.treatmentType.toLowerCase().includes(q);

      const isCompleted = isPackageCompleted(pkg);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && !isCompleted) ||
        (statusFilter === 'COMPLETED' && isCompleted);

      const matchesPatient =
        selectedPatientFilter === 'ALL' || pkg.patientId === selectedPatientFilter;

      return matchesSearch && matchesStatus && matchesPatient;
    });
  }, [packages, sessions, searchQuery, statusFilter, selectedPatientFilter]);

  // Calculate Metrics
  const totalPackages = packages.length;
  const activePackagesCount = packages.filter(p => !isPackageCompleted(p)).length;
  const completedPackagesCount = packages.filter(p => isPackageCompleted(p)).length;

  const allExistingPackageSessions = sessions.filter(s => !!s.packageId);
  const completedSessionsCount = allExistingPackageSessions.filter(
    s => s.status === 'COMPLETED'
  ).length;
  const pendingSessionsCount = allExistingPackageSessions.filter(
    s => s.status !== 'COMPLETED'
  ).length;
  const awaitingSignatureCount = allExistingPackageSessions.filter(
    s => s.status === 'COMPLETED' && !s.clientSignatureUrl
  ).length;

  // Collapse / Expand handlers
  const togglePackageCollapse = (pkgId: string) => {
    setCollapsedPackageIds(prev => ({
      ...prev,
      [pkgId]: !prev[pkgId],
    }));
  };

  const handleCollapseAll = () => {
    const newCollapsed: { [id: string]: boolean } = {};
    packages.forEach(p => {
      newCollapsed[p.id] = true;
    });
    setCollapsedPackageIds(newCollapsed);
  };

  const handleExpandAll = () => {
    setCollapsedPackageIds({});
  };

  // Toggle Session Status
  const handleToggleSessionStatus = async (
    session: Session,
    pkg: SessionPackage,
    forceCompleted?: boolean
  ) => {
    if (!tenant) return;
    const isNowCompleted = forceCompleted !== undefined ? forceCompleted : session.status !== 'COMPLETED';

    try {
      if (session.id.startsWith('sess-stub-')) {
        // Create actual session from virtual stub
        await api.createSession(tenant.id, {
          packageId: pkg.id,
          patientId: pkg.patientId,
          patientName: pkg.patientName,
          professionalId: pkg.professionalId || user?.id || 'prof-1',
          professionalName: pkg.professionalName || user?.name || 'Profissional',
          sessionNumber: session.sessionNumber,
          scheduledDate: session.scheduledDate,
          scheduledTime: session.scheduledTime || '14:00',
          procedures: session.procedures.length > 0 ? session.procedures : [pkg.treatmentType],
          status: isNowCompleted ? 'COMPLETED' : 'PENDING',
          attendedAt: isNowCompleted ? new Date().toISOString() : undefined,
        });
      } else {
        await api.updateSession(session.id, tenant.id, {
          status: isNowCompleted ? 'COMPLETED' : 'PENDING',
          attendedAt: isNowCompleted ? new Date().toISOString() : undefined,
        });
      }
      onRefreshData();
    } catch (err) {
      alert('Erro ao atualizar status da sessão.');
    }
  };

  // Open Direct In-Device Signature
  const handleOpenDirectSignature = (session: Session, pkg: SessionPackage) => {
    setSigningSession({ session, pkg });
    setSignatureDataUrl('');
  };

  // Save Direct In-Device Signature
  const handleSaveDirectSignature = async () => {
    if (!signingSession || !tenant) return;
    if (!signatureDataUrl) {
      alert('Por favor, desenhe a assinatura antes de confirmar.');
      return;
    }

    setIsSavingSignature(true);
    const { session, pkg } = signingSession;

    try {
      let targetSessionId = session.id;

      if (session.id.startsWith('sess-stub-')) {
        const created = await api.createSession(tenant.id, {
          packageId: pkg.id,
          patientId: pkg.patientId,
          patientName: pkg.patientName,
          professionalId: pkg.professionalId || user?.id || 'prof-1',
          professionalName: pkg.professionalName || user?.name || 'Profissional',
          sessionNumber: session.sessionNumber,
          scheduledDate: session.scheduledDate,
          scheduledTime: session.scheduledTime || '14:00',
          procedures: session.procedures.length > 0 ? session.procedures : [pkg.treatmentType],
          status: 'COMPLETED',
          attendedAt: new Date().toISOString(),
        });
        targetSessionId = created.id;
      }

      await api.signSessionDirect(tenant.id, targetSessionId, signatureDataUrl);
      setSigningSession(null);
      onRefreshData();
    } catch (err) {
      alert('Erro ao salvar assinatura de ciente.');
    } finally {
      setIsSavingSignature(false);
    }
  };

  // Open Optional Details Modal
  const handleOpenOptionalDetails = (session: Session, pkg: SessionPackage) => {
    setOptionalDetailsSession({ session, pkg });
    setTechniquesInput(session.procedures.length > 0 ? session.procedures.join(', ') : pkg.treatmentType);
    setBloodPressureInput(session.bloodPressure || '');
    setEvolutionInput(session.evolutionText || session.siNotes || '');
  };

  // Save Optional Details
  const handleSaveOptionalDetails = async () => {
    if (!optionalDetailsSession || !tenant) return;
    setIsSavingDetails(true);
    const { session, pkg } = optionalDetailsSession;

    try {
      const proceduresList = techniquesInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      if (session.id.startsWith('sess-stub-')) {
        await api.createSession(tenant.id, {
          packageId: pkg.id,
          patientId: pkg.patientId,
          patientName: pkg.patientName,
          professionalId: pkg.professionalId || user?.id || 'prof-1',
          professionalName: pkg.professionalName || user?.name || 'Profissional',
          sessionNumber: session.sessionNumber,
          scheduledDate: session.scheduledDate,
          scheduledTime: session.scheduledTime || '14:00',
          procedures: proceduresList.length > 0 ? proceduresList : [pkg.treatmentType],
          bloodPressure: bloodPressureInput.trim() || undefined,
          evolutionText: evolutionInput.trim() || undefined,
          status: session.status,
        });
      } else {
        await api.updateSession(session.id, tenant.id, {
          procedures: proceduresList.length > 0 ? proceduresList : [pkg.treatmentType],
          bloodPressure: bloodPressureInput.trim() || undefined,
          evolutionText: evolutionInput.trim() || undefined,
        });
      }
      setOptionalDetailsSession(null);
      onRefreshData();
    } catch (err) {
      alert('Erro ao salvar detalhes da sessão.');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Generate and Send WhatsApp Validation Link (No login required for client)
  const handleSendWhatsAppSession = async (session: Session, pkg: SessionPackage) => {
    let targetSessionId = session.id;

    if (session.id.startsWith('sess-stub-') && tenant) {
      try {
        const created = await api.createSession(tenant.id, {
          packageId: pkg.id,
          patientId: pkg.patientId,
          patientName: pkg.patientName,
          professionalId: pkg.professionalId || user?.id || 'prof-1',
          professionalName: pkg.professionalName || user?.name || 'Profissional',
          sessionNumber: session.sessionNumber,
          scheduledDate: session.scheduledDate,
          scheduledTime: session.scheduledTime || '14:00',
          procedures: session.procedures.length > 0 ? session.procedures : [pkg.treatmentType],
          status: session.status,
        });
        targetSessionId = created.id;
        onRefreshData();
      } catch (e) {
        console.warn('Could not pre-create session, fallback to stub token', e);
      }
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://clinica.app';
    const clinicName = tenant?.tradeName || tenant?.name || 'Clínica';
    const validationUrl = createSessionValidationUrl(
      origin,
      { ...session, id: targetSessionId },
      pkg,
      sessions,
      clinicName
    );

    const pat = patients.find(p => p.id === pkg.patientId);
    const phone = pat?.whatsapp || pat?.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');

    const message = `Olá, ${pkg.patientName.split(' ')[0]}!\n\nSua *Sessão ${session.sessionNumber} de ${
      pkg.sessionCount
    }* do pacote *${pkg.title}* na *${clinicName}* foi realizada.\n\nPor favor, acesse o link abaixo para assinar como ciente pelo seu celular (sem necessidade de login):\n👉 ${validationUrl}\n\nAgradecemos a confiança!`;

    if (cleanPhone) {
      const url = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } else {
      await copyToClipboard(message);
      alert('Paciente sem telefone cadastrado. O texto e o link foram copiados para a sua área de transferência!');
    }
  };

  // Copy Validation Link
  const handleCopySessionLink = async (session: Session, pkg: SessionPackage) => {
    let targetSessionId = session.id;

    if (session.id.startsWith('sess-stub-') && tenant) {
      try {
        const created = await api.createSession(tenant.id, {
          packageId: pkg.id,
          patientId: pkg.patientId,
          patientName: pkg.patientName,
          professionalId: pkg.professionalId || user?.id || 'prof-1',
          professionalName: pkg.professionalName || user?.name || 'Profissional',
          sessionNumber: session.sessionNumber,
          scheduledDate: session.scheduledDate,
          scheduledTime: session.scheduledTime || '14:00',
          procedures: session.procedures.length > 0 ? session.procedures : [pkg.treatmentType],
          status: session.status,
        });
        targetSessionId = created.id;
        onRefreshData();
      } catch (e) {
        console.warn('Could not pre-create session, fallback to stub token', e);
      }
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://clinica.app';
    const clinicName = tenant?.tradeName || tenant?.name || 'Clínica';
    const validationUrl = createSessionValidationUrl(
      origin,
      { ...session, id: targetSessionId },
      pkg,
      sessions,
      clinicName
    );
    await copyToClipboard(validationUrl);
    setCopiedSessionId(session.id);
    setTimeout(() => setCopiedSessionId(null), 3000);
  };

  // Sessions for History Consultation
  const historySessions = useMemo(() => {
    return sessions
      .filter(s => {
        const q = historySearchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          s.patientName.toLowerCase().includes(q) ||
          (s.procedures && s.procedures.some(p => p.toLowerCase().includes(q))) ||
          (s.evolutionText && s.evolutionText.toLowerCase().includes(q));

        const matchesPatient =
          historyPatientFilter === 'ALL' || s.patientId === historyPatientFilter;

        const matchesStatus =
          historyStatusFilter === 'ALL' ||
          (historyStatusFilter === 'COMPLETED' && s.status === 'COMPLETED') ||
          (historyStatusFilter === 'PENDING' && s.status !== 'COMPLETED');

        return matchesQuery && matchesPatient && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = a.attendedAt || a.scheduledDate || a.createdAt;
        const dateB = b.attendedAt || b.scheduledDate || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [sessions, historySearchQuery, historyPatientFilter, historyStatusFilter]);

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. CABEÇALHO & BARRA DE AÇÕES PRINCIPAL */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Acompanhamento de Pacotes & Sessões
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gerencie pacotes ativos e concluídos, retraia ou expanda sessões e consulte o histórico a qualquer momento.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Botão Consultar Histórico */}
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition shadow-2xs"
            title="Consultar histórico de sessões e pacotes"
          >
            <History className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Consultar Histórico
          </button>

          {/* Botão Criar Pacote */}
          <button
            type="button"
            onClick={onOpenCreatePackage}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Criar Novo Pacote
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. CARDS DE MÉTRICAS / RESUMO GERAL */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pacotes Ativos */}
        <div
          onClick={() => setStatusFilter('ACTIVE')}
          className={`p-4 rounded-2xl border shadow-2xs cursor-pointer transition ${
            statusFilter === 'ACTIVE'
              ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/20'
              : 'bg-white dark:bg-slate-900 border-teal-200/80 dark:border-teal-800/40 hover:border-teal-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">
              Pacotes Ativos
            </span>
            <Layers className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-teal-700 dark:text-teal-300 mt-1">{activePackagesCount}</p>
          <span className="text-[11px] text-teal-600/90 font-medium">Em andamento (não finalizados)</span>
        </div>

        {/* Pacotes Concluídos */}
        <div
          onClick={() => setStatusFilter('COMPLETED')}
          className={`p-4 rounded-2xl border shadow-2xs cursor-pointer transition ${
            statusFilter === 'COMPLETED'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-emerald-200/80 dark:border-emerald-800/40 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              Pacotes Concluídos
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {completedPackagesCount}
          </p>
          <span className="text-[11px] text-emerald-600/90 font-medium">100% das sessões utilizadas</span>
        </div>

        {/* Sessões Realizadas */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Sessões Realizadas
            </span>
            <CheckSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {completedSessionsCount}
          </p>
          <span className="text-[11px] text-slate-500">De {allExistingPackageSessions.length || totalPackages * 4} totais</span>
        </div>

        {/* Aguardando Ciente */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Aguardando Ciente
            </span>
            <UserCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {awaitingSignatureCount}
          </p>
          <span className="text-[11px] text-slate-400">Assinaturas pendentes</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. FILTROS, BUSCA & CONTROLES DE EXPANDIR / RETRAIR */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por paciente, pacote ou terapia..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Todos
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-black">
                {totalPackages}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Ativos
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 font-black">
                {activePackagesCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'COMPLETED'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Concluídos
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-black">
                {completedPackagesCount}
              </span>
            </button>
          </div>

          {/* Patient Filter */}
          <select
            value={selectedPatientFilter}
            onChange={e => setSelectedPatientFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="ALL">Todos os Pacientes</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Global Expand/Collapse Buttons */}
          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition"
              title="Expandir todas as sessões dos pacotes"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              Expandir Todos
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition"
              title="Recolher e compactar a lista de pacotes"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              Recolher Todos
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. LISTA DE PACOTES COM SUPORTE A EXPANDIR / RETRAIR */}
      {/* ------------------------------------------------------------- */}
      {filteredPackages.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Nenhum pacote encontrado
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {packages.length === 0
              ? 'Clique no botão "+ Criar Novo Pacote" acima para iniciar o acompanhamento de sessões de um paciente.'
              : 'Nenhum pacote corresponde aos filtros de busca selecionados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPackages.map(pkg => {
            const pat = patients.find(p => p.id === pkg.patientId);
            const existingPkgSessions = sessions.filter(s => s.packageId === pkg.id);
            const isCompleted = isPackageCompleted(pkg);
            const isCollapsed = !!collapsedPackageIds[pkg.id];

            // Build all sessions slots from 1 to pkg.sessionCount
            const allPkgSessions: Session[] = [];
            for (let i = 1; i <= pkg.sessionCount; i++) {
              const existing = existingPkgSessions.find(s => s.sessionNumber === i);
              if (existing) {
                allPkgSessions.push(existing);
              } else {
                const scheduledDate = new Date(Date.now() + (i - 1) * 7 * 86400000)
                  .toISOString()
                  .split('T')[0];
                allPkgSessions.push({
                  id: `sess-stub-${pkg.id}-${i}`,
                  tenantId: pkg.tenantId,
                  packageId: pkg.id,
                  patientId: pkg.patientId,
                  patientName: pkg.patientName,
                  professionalId: pkg.professionalId,
                  professionalName: pkg.professionalName,
                  sessionNumber: i,
                  scheduledDate,
                  scheduledTime: '14:00',
                  procedures: [pkg.treatmentType],
                  status: 'PENDING',
                  createdAt: new Date().toISOString(),
                });
              }
            }

            const completedSessions = allPkgSessions.filter(s => s.status === 'COMPLETED');
            const pendingSessions = allPkgSessions.filter(s => s.status !== 'COMPLETED');
            const progressPercent = Math.round(
              (completedSessions.length / (pkg.sessionCount || 1)) * 100
            );

            return (
              <div
                key={pkg.id}
                className={`bg-white dark:bg-slate-900 border rounded-3xl shadow-sm transition overflow-hidden ${
                  isCompleted
                    ? 'border-emerald-200 dark:border-emerald-900/60'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Package Header Card */}
                <div
                  onClick={() => togglePackageCollapse(pkg.id)}
                  className={`p-4 sm:p-5 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer transition select-none ${
                    isCompleted
                      ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950'
                      : 'bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          togglePackageCollapse(pkg.id);
                        }}
                        className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                        title={isCollapsed ? 'Expandir sessões' : 'Recolher sessões'}
                      >
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </button>

                      <h3 className="text-base sm:text-lg font-black text-white">{pkg.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-bold">
                        {pkg.sessionCount} Sessões
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black">
                        {formatCurrencyAccounting(pkg.price)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                          isCompleted
                            ? 'bg-emerald-500 text-white flex items-center gap-1'
                            : 'bg-teal-600 text-white'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-3 h-3 inline" />}
                        {isCompleted ? 'PACOTE CONCLUÍDO' : 'EM ANDAMENTO (ATIVO)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                      <span>
                        Paciente: <strong className="text-white">{pkg.patientName}</strong>{' '}
                        {pat?.cpf ? `(CPF: ${pat.cpf})` : ''}
                      </span>
                      <span>•</span>
                      <span>
                        Terapia: <strong className="text-teal-300">{pkg.treatmentType}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Validade: <strong className="text-slate-200">{pkg.validityDate || 'Indeterminada'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start lg:self-center" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => togglePackageCollapse(pkg.id)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      {isCollapsed ? (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" /> Expandir Sessões
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" /> Recolher Sessões
                        </>
                      )}
                    </button>

                    {onOpenPackageDetail && (
                      <button
                        type="button"
                        onClick={() => onOpenPackageDetail(pkg)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detalhes
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar (Always visible in both expanded & collapsed states for easy scanning) */}
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-850/70 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      Progresso do Pacote: {completedSessions.length} de {pkg.sessionCount} sessões realizadas
                    </span>
                    <div className="w-full max-w-xs bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isCollapsed && (
                      <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {completedSessions.length} realizadas
                        </span>
                        <span>•</span>
                        <span className="text-amber-600 dark:text-amber-400">
                          {pendingSessions.length} pendentes
                        </span>
                      </div>
                    )}
                    <span
                      className={`text-xs font-black shrink-0 ${
                        isCompleted
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-teal-700 dark:text-teal-400'
                      }`}
                    >
                      {progressPercent}% Concluído
                    </span>
                  </div>
                </div>

                {/* SESSIONS LIST (COLLAPSIBLE) */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Acompanhamento das Sessões do Pacote
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Clique em "Marcar Realizada" ou colete a assinatura de ciente
                      </span>
                    </div>

                    <div className="space-y-3">
                      {allPkgSessions.map(sess => {
                        const isSessCompleted = sess.status === 'COMPLETED';
                        const hasSignature = !!sess.clientSignatureUrl;

                        // Format date in Brazilian standard: DD/MM/AAAA
                        const dateObj = sess.attendedAt
                          ? new Date(sess.attendedAt)
                          : sess.scheduledDate
                          ? new Date(sess.scheduledDate + 'T12:00:00')
                          : new Date();

                        const formattedDayMonthYear = dateObj.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        });

                        return (
                          <div
                            key={sess.id}
                            className={`rounded-2xl border transition overflow-hidden ${
                              isSessCompleted
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
                            }`}
                          >
                            {/* Session Header Card */}
                            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="space-y-1">
                                {/* Title Format:
                                    SESSÃO 1 DE 4: REALIZADA DIA 16/08/2026
                                    SESSÃO 2 DE 4: PENDENTE
                                */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {isSessCompleted ? (
                                      <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 inline shrink-0" />
                                        SESSÃO {sess.sessionNumber} DE {pkg.sessionCount}: REALIZADA DIA{' '}
                                        {formattedDayMonthYear}
                                      </span>
                                    ) : (
                                      <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-amber-500 inline shrink-0" />
                                        SESSÃO {sess.sessionNumber} DE {pkg.sessionCount}: PENDENTE
                                      </span>
                                    )}
                                  </h5>

                                  {/* Status Badges */}
                                  {isSessCompleted && (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[10px] font-black uppercase">
                                      REALIZADA
                                    </span>
                                  )}
                                  {!isSessCompleted && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 text-[10px] font-black uppercase">
                                      PENDENTE
                                    </span>
                                  )}

                                  {/* Client Signature Badge */}
                                  {hasSignature ? (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black flex items-center gap-1">
                                      <UserCheck className="w-3 h-3" /> Ciente Assinado
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-[10px] font-semibold flex items-center gap-1">
                                      Aguardando Assinatura
                                    </span>
                                  )}
                                </div>

                                {/* Secondary information / Clinical info */}
                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                  {sess.procedures && sess.procedures.length > 0 && (
                                    <span>
                                      Técnicas: <strong className="text-slate-700 dark:text-slate-200">{sess.procedures.join(', ')}</strong>
                                    </span>
                                  )}
                                  {sess.bloodPressure && (
                                    <span>
                                      • PA: <strong className="text-slate-700 dark:text-slate-200">{sess.bloodPressure}</strong>
                                    </span>
                                  )}
                                  {sess.evolutionText && (
                                    <span className="italic truncate max-w-md">
                                      • "{sess.evolutionText}"
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Session Quick Actions */}
                              <div className="flex flex-wrap items-center gap-2 self-start md:self-center justify-end">
                                {/* 1. Toggle Status Realizada / Pendente */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleSessionStatus(sess, pkg)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                                    isSessCompleted
                                      ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                  }`}
                                  title={isSessCompleted ? 'Desmarcar e tornar pendente' : 'Marcar sessão como realizada'}
                                >
                                  {isSessCompleted ? (
                                    <>
                                      <RotateCcw className="w-3.5 h-3.5" /> Reabrir
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Realizada
                                    </>
                                  )}
                                </button>

                                {/* 2. Direct In-Device Signature OR View Signature */}
                                {hasSignature ? (
                                  <button
                                    type="button"
                                    onClick={() => setViewingSignatureSession({ session: sess, pkg, patient: pat })}
                                    className="px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                    title="Visualizar o comprovante e a assinatura digital do cliente"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Ver Assinatura
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDirectSignature(sess, pkg)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-2xs bg-teal-600 hover:bg-teal-700 text-white"
                                    title="Paciente assina na tela do dispositivo (sem login)"
                                  >
                                    <PenTool className="w-3.5 h-3.5" />
                                    Assinar no Dispositivo
                                  </button>
                                )}

                                {/* 3. Send WhatsApp Validation Link (No Login Required) */}
                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsAppSession(sess, pkg)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 transition"
                                  title="Enviar link pelo WhatsApp para o cliente assinar sem login"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  WhatsApp
                                </button>

                                {/* 4. Copy Direct Validation Link */}
                                <button
                                  type="button"
                                  onClick={() => handleCopySessionLink(sess, pkg)}
                                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs transition"
                                  title="Copiar link de assinatura pública"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>

                                {/* 5. Optional Techniques / Clinical Form */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenOptionalDetails(sess, pkg)}
                                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition"
                                  title="Informar técnicas, pressão arterial e observações (opcional)"
                                >
                                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                                  Técnicas (Opcional)
                                </button>
                              </div>
                            </div>

                            {/* Signature and Confirmation Details if Signed */}
                            {hasSignature && (
                              <div className="px-4 py-2.5 bg-emerald-100/40 dark:bg-emerald-950/30 border-t border-emerald-200/60 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    Ciente Registrado pelo Cliente:
                                  </span>
                                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                                    {sess.clientConfirmedAt
                                      ? formatDateTime(sess.clientConfirmedAt)
                                      : 'Autenticado digitalmente'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setViewingSignatureSession({ session: sess, pkg, patient: pat })}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[11px] font-bold shadow-2xs transition"
                                    title="Clique para visualizar o comprovante da assinatura"
                                  >
                                    <img
                                      src={sess.clientSignatureUrl}
                                      alt="Assinatura do Cliente"
                                      referrerPolicy="no-referrer"
                                      className="h-6 max-w-[100px] object-contain"
                                    />
                                    <Eye className="w-3 h-3 text-emerald-600" />
                                    <span>Ver Assinatura</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {copiedSessionId === sess.id && (
                              <div className="px-4 py-1.5 bg-teal-500 text-white text-[11px] font-bold text-center">
                                Link de assinatura copiado com sucesso! Pode colar no WhatsApp ou enviar ao cliente.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: CONSULTA DE HISTÓRICO DE SESSÕES & PACOTES */}
      {/* ------------------------------------------------------------- */}
      {isHistoryModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsHistoryModalOpen(false)}
          title="Histórico Completo de Sessões & Pacotes"
          subtitle="Consulte registros de atendimentos passados, assinaturas de ciente e detalhes clínicos"
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* History Filter Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por paciente, técnica ou anotação..."
                  value={historySearchQuery}
                  onChange={e => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <select
                value={historyPatientFilter}
                onChange={e => setHistoryPatientFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-900 w-full md:w-auto"
              >
                <option value="ALL">Todos os Pacientes</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={historyStatusFilter}
                onChange={e => setHistoryStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-900 w-full md:w-auto"
              >
                <option value="ALL">Todos os Status</option>
                <option value="COMPLETED">Apenas Realizadas</option>
                <option value="PENDING">Apenas Pendentes</option>
              </select>
            </div>

            {/* History Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total no Histórico</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{historySessions.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] text-emerald-600 font-bold uppercase block">Realizadas</span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                  {historySessions.filter(s => s.status === 'COMPLETED').length}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
                <span className="text-[10px] text-teal-600 font-bold uppercase block">Com Ciente Assinado</span>
                <span className="text-lg font-black text-teal-700 dark:text-teal-300">
                  {historySessions.filter(s => !!s.clientSignatureUrl).length}
                </span>
              </div>
            </div>

            {/* History Table / Records List */}
            <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1">
              {historySessions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum registro encontrado no histórico para os filtros selecionados.
                </div>
              ) : (
                historySessions.map(sess => {
                  const pkg = packages.find(p => p.id === sess.packageId);
                  const isDone = sess.status === 'COMPLETED';
                  const dateStr = sess.attendedAt || sess.scheduledDate || sess.createdAt;
                  const formattedDate = new Date(dateStr).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={sess.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {sess.patientName}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-teal-700 dark:text-teal-300 font-medium">
                            {pkg ? `${pkg.title} (Sessão ${sess.sessionNumber}/${pkg.sessionCount})` : 'Sessão Avulsa'}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-md text-[10px] font-black ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                            }`}
                          >
                            {isDone ? 'REALIZADA' : 'PENDENTE'}
                          </span>
                          {sess.clientSignatureUrl && (
                            <span className="px-2 py-0.2 rounded-md bg-emerald-600 text-white text-[10px] font-black flex items-center gap-1">
                              <UserCheck className="w-2.5 h-2.5" /> Assinado
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-3 flex-wrap">
                          <span>Data: <strong>{formattedDate}</strong></span>
                          {sess.procedures && sess.procedures.length > 0 && (
                            <span>• Técnicas: <strong>{sess.procedures.join(', ')}</strong></span>
                          )}
                          {sess.bloodPressure && (
                            <span>• PA: <strong>{sess.bloodPressure}</strong></span>
                          )}
                        </div>

                        {sess.evolutionText && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                            "{sess.evolutionText}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                        {sess.clientSignatureUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              const pat = patients.find(p => p.id === sess.patientId);
                              setViewingSignatureSession({ session: sess, pkg, patient: pat });
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold transition"
                            title="Visualizar comprovante de assinatura digital"
                          >
                            <img
                              src={sess.clientSignatureUrl}
                              alt="Assinatura"
                              referrerPolicy="no-referrer"
                              className="h-5 max-w-[70px] object-contain"
                            />
                            <Eye className="w-3 h-3 text-emerald-600" />
                            <span>Ver Assinatura</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
              >
                Fechar Consulta
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: VISUALIZADOR OFICIAL DA ASSINATURA DIGITAL DO CLIENTE */}
      {/* ------------------------------------------------------------- */}
      {viewingSignatureSession && (
        <Modal
          isOpen={true}
          onClose={() => setViewingSignatureSession(null)}
          title="Comprovante de Assinatura Digital"
          subtitle={`Paciente: ${viewingSignatureSession.session.patientName} • Sessão #${viewingSignatureSession.session.sessionNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Header Shield Info */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 flex-1">
                <h4 className="text-xs font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-wide">
                  Atendimento Autenticado com Sucesso
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  A assinatura abaixo foi prestada pelo cliente como prova de ciência e realização deste atendimento.
                </p>
              </div>
            </div>

            {/* Session Metadata Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Paciente:</span>
                <strong className="text-slate-900 dark:text-white font-black text-sm">
                  {viewingSignatureSession.session.patientName}
                </strong>
              </div>

              {viewingSignatureSession.patient?.cpf && (
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500 dark:text-slate-400">CPF do Paciente:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                    {viewingSignatureSession.patient.cpf}
                  </span>
                </div>
              )}

              {viewingSignatureSession.pkg && (
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500 dark:text-slate-400">Pacote / Tratamento:</span>
                  <strong className="text-teal-700 dark:text-teal-400 font-bold">
                    {viewingSignatureSession.pkg.title} ({viewingSignatureSession.pkg.treatmentType})
                  </strong>
                </div>
              )}

              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Sessão:</span>
                <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-black text-[11px]">
                  Sessão {viewingSignatureSession.session.sessionNumber}
                  {viewingSignatureSession.pkg ? ` de ${viewingSignatureSession.pkg.sessionCount}` : ''}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Data do Atendimento:</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">
                  {viewingSignatureSession.session.attendedAt
                    ? new Date(viewingSignatureSession.session.attendedAt).toLocaleDateString('pt-BR')
                    : viewingSignatureSession.session.scheduledDate
                    ? new Date(viewingSignatureSession.session.scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR')
                    : new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Data/Hora da Assinatura:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-black">
                  {viewingSignatureSession.session.clientConfirmedAt
                    ? formatDateTime(viewingSignatureSession.session.clientConfirmedAt)
                    : formatDateTime(viewingSignatureSession.session.attendedAt || new Date().toISOString())}
                </span>
              </div>

              {viewingSignatureSession.session.procedures && viewingSignatureSession.session.procedures.length > 0 && (
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500 dark:text-slate-400">Procedimentos:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {viewingSignatureSession.session.procedures.join(', ')}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Canal de Validação:</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  Assinatura Digital Manuscrita Eletrônica
                </span>
              </div>
            </div>

            {/* Signature Certificate Display Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
                Assinatura do Paciente / Cliente
              </label>

              <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-emerald-400/80 shadow-inner text-center space-y-2">
                {viewingSignatureSession.session.clientSignatureUrl ? (
                  <img
                    src={viewingSignatureSession.session.clientSignatureUrl}
                    alt="Assinatura Digital do Paciente"
                    referrerPolicy="no-referrer"
                    className="max-h-36 mx-auto object-contain py-2"
                  />
                ) : (
                  <div className="py-8 text-slate-400 text-xs italic">
                    Nenhuma imagem de assinatura encontrada para este registro.
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Autenticação: SIG-{viewingSignatureSession.session.id.slice(-8).toUpperCase()}</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Registro Válido
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Comprovante
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingSignatureSession(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: ASSINATURA DIRETA NO DISPOSITIVO (SEM LOGIN) */}
      {/* ------------------------------------------------------------- */}
      {signingSession && (
        <Modal
          isOpen={true}
          onClose={() => setSigningSession(null)}
          title={`Assinatura do Cliente — Sessão ${signingSession.session.sessionNumber} de ${signingSession.pkg.sessionCount}`}
          subtitle={`Paciente: ${signingSession.pkg.patientName} • Pacote: ${signingSession.pkg.title}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/80 rounded-xl text-xs text-teal-900 dark:text-teal-200 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Declaração de Ciência do Atendimento
              </p>
              <p>
                O(A) cliente declara estar ciente da realização da <strong>Sessão #{signingSession.session.sessionNumber}</strong> de <strong>{signingSession.pkg.treatmentType}</strong>, prestando sua assinatura digital abaixo.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Desenhe a assinatura no quadro abaixo:
              </label>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-300 dark:border-slate-700">
                <CanvasSignature
                  onSave={dataUrl => setSignatureDataUrl(dataUrl)}
                  initialDataUrl={signingSession.session.clientSignatureUrl}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSigningSession(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveDirectSignature}
                disabled={isSavingSignature || !signatureDataUrl}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                {isSavingSignature ? 'Salvando...' : 'Confirmar e Salvar Assinatura'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: TÉCNICAS E DADOS CLÍNICOS (TOTALMENTE OPCIONAIS) */}
      {/* ------------------------------------------------------------- */}
      {optionalDetailsSession && (
        <Modal
          isOpen={true}
          onClose={() => setOptionalDetailsSession(null)}
          title={`Informações Clínicas — Sessão #${optionalDetailsSession.session.sessionNumber}`}
          subtitle="Os campos abaixo são opcionais e servem para o registro clínico da sessão"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Técnicas / Métodos Utilizados (Opcional)
              </label>
              <input
                type="text"
                value={techniquesInput}
                onChange={e => setTechniquesInput(e.target.value)}
                placeholder="Ex: Shiatsu, Ventosaterapia, Drenagem Linfática"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Separe por vírgulas se houver mais de uma técnica.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Pressão Arterial (Opcional)
              </label>
              <input
                type="text"
                value={bloodPressureInput}
                onChange={e => setBloodPressureInput(e.target.value)}
                placeholder="Ex: 120/80 mmHg"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Evolução Clínica / Anotações (Opcional)
              </label>
              <textarea
                rows={3}
                value={evolutionInput}
                onChange={e => setEvolutionInput(e.target.value)}
                placeholder="Ex: Paciente relatou alívio imediato nas dores lombares. Boa resposta à liberação miofascial..."
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setOptionalDetailsSession(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveOptionalDetails}
                disabled={isSavingDetails}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition"
              >
                {isSavingDetails ? 'Salvando...' : 'Salvar Informações'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

