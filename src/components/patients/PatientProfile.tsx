import React, { useState, useEffect } from 'react';
import {
  User,
  ClipboardList,
  FileText,
  CalendarCheck,
  Package,
  FolderOpen,
  PenTool,
  Activity,
  ArrowLeft,
  Plus,
  Send,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Phone,
  Building2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
} from 'lucide-react';
import {
  Patient,
  Anamnesis,
  SessionPackage,
  Session,
  ClinicalEvolution,
  DocumentFile,
  SignatureRecord,
} from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCPF, formatPhone } from '../../utils/cpf';
import { formatDate, formatDateTime, calculateAge } from '../../utils/crypto';
import { DocumentUploadModal } from './DocumentUploadModal';
import { PackageDetailModal } from '../packages/PackageDetailModal';
import { ClientAnamnesisSheet } from '../reports/ClientAnamnesisSheet';

interface PatientProfileProps {
  patient: Patient;
  onBack: () => void;
  onOpenAnamnesisModal?: () => void;
  onOpenAnamnesis?: () => void;
  onOpenPackageModal?: () => void;
  onOpenSingleSessionModal?: () => void;
  onOpenAttendanceModal?: (session: Session) => void;
  onAttendSession?: (session: Session) => void;
  onSendWhatsAppValidation?: (session: Session) => void;
  onSendWhatsApp?: (session: Session) => void;
  onViewPackageDetail?: (pkg: SessionPackage) => void;
  onEditPatient?: (patient: Patient) => void;
  onRefreshPatient?: () => Promise<void>;
  onOpenSendAnamnesisLink?: (patient?: Patient) => void;
  onDeletePatient?: (patientId: string) => void;
  onEditPackage?: (pkg: SessionPackage) => void;
  onDeletePackage?: (pkg: SessionPackage) => Promise<void>;
}

export const PatientProfile: React.FC<PatientProfileProps> = ({
  patient,
  onBack,
  onOpenAnamnesisModal,
  onOpenAnamnesis,
  onOpenPackageModal,
  onOpenSingleSessionModal,
  onOpenAttendanceModal,
  onAttendSession,
  onSendWhatsAppValidation,
  onSendWhatsApp,
  onViewPackageDetail,
  onEditPatient,
  onRefreshPatient,
  onOpenSendAnamnesisLink,
  onDeletePatient,
  onEditPackage,
  onDeletePackage,
}) => {
  const handleOpenAnamnesis = onOpenAnamnesis || onOpenAnamnesisModal || (() => {});
  const handleOpenPackage = onOpenPackageModal || (() => {});
  const handleOpenAttendance = onAttendSession || onOpenAttendanceModal || (() => {});
  const handleSendWhatsApp = onSendWhatsApp || onSendWhatsAppValidation || (() => {});
  const { tenant, user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'RESUMO' | 'ANAMNESE' | 'PRONTUARIO' | 'SESSÕES' | 'PACOTES' | 'DOCUMENTOS' | 'ASSINATURAS' | 'EVOLUÇÃO'
  >('RESUMO');

  const [anamnesis, setAnamnesis] = useState<Anamnesis | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [evolutions, setEvolutions] = useState<ClinicalEvolution[]>([]);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [signatures, setSignatures] = useState<SignatureRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Modal States
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedPackageDetail, setSelectedPackageDetail] = useState<SessionPackage | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<SessionPackage | null>(null);
  const [isDeletingPackage, setIsDeletingPackage] = useState(false);

  const handleConfirmDeletePackage = async () => {
    if (!packageToDelete || !tenant) return;
    setIsDeletingPackage(true);
    const tenantId = tenant?.id || packageToDelete.tenantId || 'tenant-demo-1';
    try {
      if (onDeletePackage) {
        await onDeletePackage(packageToDelete);
      } else {
        await api.deletePackage(tenantId, packageToDelete.id);
      }
      setPackageToDelete(null);
      if (selectedPackageDetail?.id === packageToDelete.id) {
        setSelectedPackageDetail(null);
      }
      const pkgs = await api.getPackages(tenantId).then(p => p.filter(x => x.patientId === patient.id));
      setPackages(pkgs);
      const sess = await api.getSessions(tenantId, patient.id);
      setSessions(sess);
      if (onRefreshPatient) await onRefreshPatient();
    } catch (err) {
      console.error('Erro ao excluir pacote:', err);
      alert('Erro ao excluir o pacote.');
    } finally {
      setIsDeletingPackage(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDeletePatient) return;
    setIsDeleting(true);
    try {
      await onDeletePatient(patient.id);
      setIsConfirmDeleteOpen(false);
      onBack();
    } catch (err) {
      console.error('Erro ao excluir paciente:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    async function loadPatientData() {
      if (!tenant) return;
      setIsLoadingData(true);
      try {
        const [
          anamRes,
          sessRes,
          pkgRes,
          evolRes,
          docRes,
          sigRes,
        ] = await Promise.all([
          api.getAnamnesis(patient.id, tenant.id),
          api.getSessions(tenant.id, patient.id),
          api.getPackages(tenant.id).then(pkgs => pkgs.filter(p => p.patientId === patient.id)),
          api.getEvolutions(patient.id, tenant.id),
          api.getDocuments(patient.id, tenant.id),
          api.getSignatures(patient.id, tenant.id),
        ]);

        setAnamnesis(anamRes);
        setSessions(sessRes);
        setPackages(pkgRes);
        setEvolutions(evolRes);
        setDocuments(docRes);
        setSignatures(sigRes);
      } catch (err) {
        console.error('Erro ao carregar dados do paciente:', err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadPatientData();
  }, [patient, tenant]);

  const tabs = [
    { id: 'RESUMO', label: 'Resumo', icon: User },
    { id: 'ANAMNESE', label: 'Anamnese', icon: ClipboardList, badge: anamnesis ? 'Preenchida' : 'Pendente' },
    { id: 'PRONTUARIO', label: 'Prontuário', icon: FileText },
    { id: 'SESSÕES', label: 'Sessões', icon: CalendarCheck, count: sessions.length },
    { id: 'PACOTES', label: 'Pacotes', icon: Package, count: packages.length },
    { id: 'DOCUMENTOS', label: 'Documentos', icon: FolderOpen, count: documents.length },
    { id: 'ASSINATURAS', label: 'Assinaturas', icon: PenTool, count: signatures.length },
    { id: 'EVOLUÇÃO', label: 'Evolução Clínica', icon: Activity, count: evolutions.length },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-lg flex items-center justify-center shrink-0 overflow-hidden border-2 border-teal-200 dark:border-teal-800 shadow-2xs">
              {patient.photoUrl || patient.avatarUrl ? (
                <img
                  src={patient.photoUrl || patient.avatarUrl}
                  alt={patient.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                patient.name.charAt(0)
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{patient.name}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  Prontuário #{patient.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                CPF: {formatCPF(patient.cpf)} • Tel: {formatPhone(patient.phone)} • Profissional: {patient.assignedProfessionalName || 'Geral'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenSendAnamnesisLink && (
            <button
              type="button"
              onClick={() => onOpenSendAnamnesisLink(patient)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              title="Enviar Link da Ficha de Cadastro e Anamnese para o Paciente preencher no WhatsApp"
            >
              <Send className="w-4 h-4" /> Enviar Ficha no WhatsApp
            </button>
          )}

          {!anamnesis && (
            <button
              type="button"
              onClick={handleOpenAnamnesis}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <ClipboardList className="w-4 h-4" /> Preencher Anamnese
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenPackage}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Criar Pacote
          </button>

          {onDeletePatient && (
            <button
              type="button"
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold flex items-center gap-1.5 transition"
              title="Excluir cadastro deste paciente"
            >
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar - Responsive for Mobile, Tablet & Desktop */}
      <div className="space-y-2">
        {/* Mobile Fast Select Dropdown (Visible on Small Screens) */}
        <div className="md:hidden flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
            Aba Ativa:
          </span>
          <select
            value={activeTab}
            onChange={e => setActiveTab(e.target.value as any)}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            {tabs.map(tab => (
              <option key={tab.id} value={tab.id}>
                {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''} {tab.badge ? `[${tab.badge}]` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Scrollable Horizontal Tabs Strip (Optimized for Mobile Touch, Tablet & Desktop) */}
        <div className="relative group">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto scroll-smooth overscroll-x-contain touch-pan-x [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold shrink-0 ${
                        tab.badge === 'Preenchida'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                  {tab.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                      isActive ? 'bg-teal-700 text-white' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* 1. RESUMO */}
        {activeTab === 'RESUMO' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Informações de Contato
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 space-y-2 text-xs">
                  <p><span className="font-bold text-slate-700 dark:text-slate-300">Telefone:</span> {formatPhone(patient.phone)}</p>
                  <p><span className="font-bold text-slate-700 dark:text-slate-300">WhatsApp:</span> {formatPhone(patient.whatsapp)}</p>
                  <p><span className="font-bold text-slate-700 dark:text-slate-300">Profissão:</span> {patient.profession || 'Não informada'}</p>
                  <p><span className="font-bold text-slate-700 dark:text-slate-300">Nascimento:</span> {patient.birthDate ? `${formatDate(patient.birthDate)} (${calculateAge(patient.birthDate)} anos)` : '-'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Endereço Cadastrado
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 space-y-2 text-xs">
                  <p><span className="font-bold text-slate-700 dark:text-slate-300">Logradouro:</span> {patient.street || '-'}, {patient.number || 'S/N'}</p>
                  <p><span className="font-bold text-slate-700 dark:text-slate-300">Bairro/Cidade:</span> {patient.neighborhood || '-'} - {patient.city}/{patient.state}</p>
                  <p><span className="font-bold text-slate-700 dark:text-slate-300">CEP:</span> {patient.cep || '-'}</p>
                  <p><span className="font-bold text-slate-700 dark:text-slate-300">Ref:</span> {patient.referencePoint || 'Nenhum'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Status da Anamnese
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 space-y-2 text-xs">
                  {anamnesis ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Anamnese Digital Assinada
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Assinada em {formatDateTime(anamnesis.signedAt)} (IP: {anamnesis.signedByIp})
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                        <AlertTriangle className="w-4 h-4" /> PENDENTE
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Preencha a anamnese para registrar o histórico de saúde do paciente.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenAnamnesis}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs"
                      >
                        Preencher Agora
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Observações do Paciente
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 text-xs text-slate-700 dark:text-slate-300">
                {patient.notes || 'Nenhuma observação cadastrada.'}
              </div>
            </div>
          </div>
        )}

        {/* 2. ANAMNESE */}
        {activeTab === 'ANAMNESE' && (
          <div>
            {!anamnesis ? (
              <div className="text-center py-10 space-y-3">
                <ClipboardList className="w-10 h-10 mx-auto text-amber-500 opacity-60" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nenhuma anamnese registrada para este paciente.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAnamnesis}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs"
                >
                  Preencher Anamnese Digital
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 print:hidden">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Ficha de Anamnese Completa & Assinada pelo Cliente
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenAnamnesis}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
                    </button>
                  </div>
                </div>

                <div className="p-3 sm:p-5 bg-slate-100 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                  <ClientAnamnesisSheet
                    patient={patient}
                    anamnesis={anamnesis}
                    tenant={tenant}
                    packages={packages}
                    sessions={sessions}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. PRONTUÁRIO */}
        {activeTab === 'PRONTUARIO' && (
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Linha do Tempo Clínica</h4>
            {evolutions.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum histórico registrado no prontuário.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {evolutions.map(evol => (
                  <div key={evol.id} className="relative pl-8 space-y-1">
                    <span className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-teal-600 ring-4 ring-white dark:ring-slate-900" />
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-600 dark:text-teal-400">
                          {formatDateTime(evol.date)}
                        </span>
                        <span className="text-[10px] text-slate-400">Profissional: {evol.professionalName || 'Geral'}</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200">{evol.notes}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                        <span>Procedimentos: {(evol.procedures || []).join(', ') || 'Atendimento Geral'}</span>
                        {evol.bloodPressure && <span>• PA: {evol.bloodPressure}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. SESSÕES */}
        {activeTab === 'SESSÕES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Histórico de Sessões</h4>
            </div>

            <div className="space-y-3">
              {sessions.map(sess => (
                <div
                  key={sess.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                        Sessão #{sess.sessionNumber}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {(sess.procedures || []).join(', ') || 'Sessão de Atendimento'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Data: {formatDate(sess.scheduledDate)} às {sess.scheduledTime || '09:00'} • Prof: {sess.professionalName || 'Profissional'}
                    </p>
                    {sess.evolutionText && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic mt-1">
                        Evolução: "{sess.evolutionText}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {sess.status === 'COMPLETED' ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Realizada
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenAttendance(sess)}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                      >
                        Realizar Atendimento
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(sess)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Validar WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. PACOTES */}
        {activeTab === 'PACOTES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Pacotes Contratados</h4>
              <button
                type="button"
                onClick={onOpenPackageModal}
                className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Novo Pacote
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map(pkg => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackageDetail(pkg)}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 hover:border-teal-500 cursor-pointer transition bg-white dark:bg-slate-850 shadow-xs group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{pkg.title}</h5>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                      {pkg.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tratamento: <strong className="text-slate-700 dark:text-slate-300">{pkg.treatmentType}</strong>
                  </p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      <span>Progresso: {pkg.completedCount} de {pkg.sessionCount} sessões</span>
                      <span>{Math.round(((pkg.completedCount || 0) / (pkg.sessionCount || 1)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, ((pkg.completedCount || 0) / (pkg.sessionCount || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {pkg.price ? `R$ ${pkg.price.toFixed(2).replace('.', ',')}` : 'Sob consulta'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPackageDetail(pkg);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1"
                        title="Ver detalhes do pacote"
                      >
                        Ver Detalhes
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEditPackage) {
                            onEditPackage(pkg);
                          } else {
                            setSelectedPackageDetail(pkg);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 text-xs font-bold transition flex items-center gap-1 border border-teal-200 dark:border-teal-800"
                        title="Editar pacote"
                      >
                        <Edit3 className="w-3 h-3" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPackageToDelete(pkg);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold transition flex items-center gap-1 border border-rose-200 dark:border-rose-800"
                        title="Apagar pacote"
                      >
                        <Trash2 className="w-3 h-3" /> Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. DOCUMENTOS */}
        {activeTab === 'DOCUMENTOS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Documentos, Atestados e Exames</h4>
              <button
                type="button"
                onClick={() => setIsDocModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" /> Anexar Documento / Atestado
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <p className="text-xs font-bold text-slate-500">Nenhum documento ou atestado médico anexado nesta ficha.</p>
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-xs"
                >
                  Anexar Primeiro Documento
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map(doc => (
                  <div key={doc.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                          {doc.category}
                        </span>
                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{doc.fileName}</p>
                      </div>
                      {doc.notes && <p className="text-[11px] text-slate-500 truncate">{doc.notes}</p>}
                      <p className="text-[10px] text-slate-400">Enviado por {doc.uploadedByName} em {formatDate(doc.uploadedAt)}</p>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white dark:bg-slate-800 text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-xs border border-slate-200 dark:border-slate-700 shrink-0"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. ASSINATURAS */}
        {activeTab === 'ASSINATURAS' && (
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Histórico de Assinaturas Digitais</h4>
            <div className="space-y-3">
              {signatures.map(sig => (
                <div key={sig.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{sig.documentType}</span>
                    <p className="text-[10px] text-slate-400">Assinado em {formatDateTime(sig.signedAt)} • IP: {sig.ipAddress}</p>
                    <p className="text-[10px] font-mono text-teal-600 dark:text-teal-400">Hash: {sig.hash}</p>
                  </div>
                  {sig.signatureUrl && (
                    <img src={sig.signatureUrl} alt="Assinatura" className="h-10 bg-white p-1 border rounded" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. EVOLUÇÃO */}
        {activeTab === 'EVOLUÇÃO' && (
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Evolução Clínica e Notas</h4>
            <div className="space-y-3">
              {evolutions.map(evol => (
                <div key={evol.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-600">{formatDateTime(evol.date)}</span>
                    <span className="text-[10px] text-slate-400">Versão v{evol.version}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200">{evol.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        patientId={patient.id}
        patientName={patient.name}
        onDocumentUploaded={async () => {
          if (tenant) {
            const docs = await api.getDocuments(patient.id, tenant.id);
            setDocuments(docs);
          }
        }}
      />

      {/* Package Detail & Signoff Modal */}
      <PackageDetailModal
        isOpen={!!selectedPackageDetail}
        onClose={() => setSelectedPackageDetail(null)}
        pkg={selectedPackageDetail}
        sessions={sessions.filter(s => s.packageId === selectedPackageDetail?.id)}
        onOpenEditModal={(pkg) => {
          setSelectedPackageDetail(null);
          if (onEditPackage) {
            onEditPackage(pkg);
          }
        }}
        onDeletePackage={async (pkg) => {
          const tenantId = tenant?.id || pkg.tenantId || 'tenant-demo-1';
          await api.deletePackage(tenantId, pkg.id);
          setSelectedPackageDetail(null);
          const pkgs = await api.getPackages(tenantId).then(p => p.filter(x => x.patientId === patient.id));
          setPackages(pkgs);
          const sess = await api.getSessions(tenantId, patient.id);
          setSessions(sess);
          if (onRefreshPatient) await onRefreshPatient();
        }}
        onRefresh={async () => {
          if (tenant) {
            const pkgs = await api.getPackages(tenant.id).then(p => p.filter(x => x.patientId === patient.id));
            setPackages(pkgs);
            const sess = await api.getSessions(tenant.id, patient.id);
            setSessions(sess);
            if (onRefreshPatient) await onRefreshPatient();
          }
        }}
      />

      {/* Delete Package Confirmation Modal */}
      {packageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Excluir Pacote de Sessões
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Confirme a exclusão definitiva deste pacote.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/50 space-y-2 text-xs text-rose-900 dark:text-rose-200">
              <p className="font-bold text-sm">
                "{packageToDelete.title}"
              </p>
              <p className="leading-relaxed">
                Tratamento: <strong>{packageToDelete.treatmentType}</strong> ({packageToDelete.sessionCount} sessões)
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Todas as sessões associadas a este pacote serão removidas do sistema. Esta ação não poderá ser desfeita.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingPackage}
                onClick={() => setPackageToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingPackage}
                onClick={handleConfirmDeletePackage}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {isDeletingPackage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Excluindo pacote...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sim, Excluir Pacote
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Patient Confirmation Modal */}
      {isConfirmDeleteOpen && (
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
                {patient.name}
              </div>
              {patient.cpf && (
                <div className="text-slate-500 dark:text-slate-400">
                  CPF: {formatCPF(patient.cpf)}
                </div>
              )}
              {patient.phone && (
                <div className="text-slate-500 dark:text-slate-400">
                  Telefone: {formatPhone(patient.phone)}
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
                onClick={() => setIsConfirmDeleteOpen(false)}
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
