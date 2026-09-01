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

        <div className="flex items-center gap-2">
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
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 hover:border-teal-500 cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">{pkg.title}</h5>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {pkg.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Tratamento: {pkg.treatmentType}</p>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-600 h-full rounded-full transition-all"
                      style={{ width: `${(pkg.completedCount / pkg.sessionCount) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>Sessões: {pkg.completedCount} de {pkg.sessionCount} realizadas</span>
                    <span className="text-teal-600">Ver Extrato / Ciente &rarr;</span>
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
        sessions={sessions}
        onRefresh={async () => {
          if (tenant) {
            const pkgs = await api.getPackages(tenant.id).then(p => p.filter(x => x.patientId === patient.id));
            setPackages(pkgs);
          }
        }}
      />
    </div>
  );
};
