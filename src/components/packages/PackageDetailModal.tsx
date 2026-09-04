import React, { useState } from 'react';
import { SessionPackage, Session, PackageStatus } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CanvasSignature } from '../common/CanvasSignature';
import { copyToClipboard } from '../../utils/clipboard';
import {
  Package,
  CheckCircle2,
  Clock,
  FileSignature,
  UserCheck,
  X,
  Edit2,
  Save,
  MessageCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertTriangle,
  Filter,
  Trash2,
} from 'lucide-react';

interface PackageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: SessionPackage | null;
  sessions: Session[];
  onRefresh: () => void;
  onAttendSession?: (session: Session) => void;
  onSendWhatsApp?: (session: Session) => void;
  onDeletePackage?: (pkg: SessionPackage) => Promise<void>;
  onOpenEditModal?: (pkg: SessionPackage) => void;
}

export const PackageDetailModal: React.FC<PackageDetailModalProps> = ({
  isOpen,
  onClose,
  pkg,
  sessions,
  onRefresh,
  onAttendSession,
  onSendWhatsApp,
  onDeletePackage,
  onOpenEditModal,
}) => {
  const { tenant } = useAuth();

  // Package Delete State
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeletingPkg, setIsDeletingPkg] = useState(false);

  // Package Edit State
  const [isEditingPkg, setIsEditingPkg] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTreatmentType, setEditTreatmentType] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStatus, setEditStatus] = useState<PackageStatus>('ACTIVE');
  const [isSavingPkg, setIsSavingPkg] = useState(false);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'NEEDS_SIGNATURE' | 'PENDING'>('ALL');

  // Individual Session Editing & Expansion
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [editingProcedures, setEditingProcedures] = useState<{ [key: string]: string }>({});
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});
  const [editingDate, setEditingDate] = useState<{ [key: string]: string }>({});
  const [editingTime, setEditingTime] = useState<{ [key: string]: string }>({});
  const [isSavingSession, setIsSavingSession] = useState<string | null>(null);

  // Tablet Signature per Session Drawer
  const [activeTabletSessionId, setActiveTabletSessionId] = useState<string | null>(null);
  const [sessionSignatureUrl, setSessionSignatureUrl] = useState('');
  const [isSavingSignature, setIsSavingSignature] = useState(false);

  // Tablet Signature for Entire Package Drawer
  const [showPackageTabletSign, setShowPackageTabletSign] = useState(false);
  const [packageSignatureUrl, setPackageSignatureUrl] = useState('');

  // Link state tracking
  const [sessionLinks, setSessionLinks] = useState<{ [key: string]: string }>({});
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
  const [packageLink, setPackageLink] = useState('');
  const [copiedPackageLink, setCopiedPackageLink] = useState(false);

  if (!isOpen || !pkg) return null;

  // Build the complete list of sessions up to pkg.sessionCount
  const existingPkgSessions = sessions.filter(s => s.packageId === pkg.id);
  const allSessions: Session[] = [];

  for (let i = 1; i <= pkg.sessionCount; i++) {
    const existing = existingPkgSessions.find(s => s.sessionNumber === i);
    if (existing) {
      allSessions.push(existing);
    } else {
      // Create virtual session slot if DB record does not exist yet
      const scheduledDate = new Date(Date.now() + (i - 1) * 7 * 86400000).toISOString().split('T')[0];
      allSessions.push({
        id: `sess-stub-${pkg.id}-${i}`,
        tenantId: pkg.tenantId,
        packageId: pkg.id,
        patientId: pkg.patientId,
        patientName: pkg.patientName,
        professionalId: pkg.professionalId,
        professionalName: pkg.professionalName,
        sessionNumber: i,
        scheduledDate,
        scheduledTime: '10:00',
        status: 'PENDING',
        procedures: [pkg.treatmentType || 'Massoterapia'],
        createdAt: pkg.createdAt,
      });
    }
  }

  // Counters
  const completedSessions = allSessions.filter(s => s.status === 'COMPLETED');
  const needsSignatureSessions = allSessions.filter(s => s.status === 'COMPLETED' && !s.clientSignatureUrl);
  const completedWithSignature = allSessions.filter(s => s.status === 'COMPLETED' && !!s.clientSignatureUrl);
  const pendingSessions = allSessions.filter(s => s.status !== 'COMPLETED');

  // Filtered Sessions List
  const filteredSessions = allSessions.filter(s => {
    if (statusFilter === 'COMPLETED') return s.status === 'COMPLETED';
    if (statusFilter === 'NEEDS_SIGNATURE') return s.status === 'COMPLETED' && !s.clientSignatureUrl;
    if (statusFilter === 'PENDING') return s.status !== 'COMPLETED';
    return true;
  });

  // Package Edit handlers
  const startEditingPackage = () => {
    setEditTitle(pkg.title);
    setEditTreatmentType(pkg.treatmentType);
    setEditPrice(pkg.price.toString());
    setEditStatus(pkg.status);
    setIsEditingPkg(true);
  };

  const handleSavePackage = async () => {
    if (!tenant) return;
    setIsSavingPkg(true);
    try {
      await api.updatePackage(tenant.id, pkg.id, {
        title: editTitle,
        treatmentType: editTreatmentType,
        price: parseFloat(editPrice) || pkg.price,
        status: editStatus,
      });
      setIsEditingPkg(false);
      onRefresh();
    } catch (err) {
      alert('Erro ao atualizar dados do pacote');
    } finally {
      setIsSavingPkg(false);
    }
  };

  const handleDeletePackage = async () => {
    const tenantId = tenant?.id || pkg.tenantId || 'tenant-demo-1';
    setIsDeletingPkg(true);
    try {
      if (onDeletePackage) {
        await onDeletePackage(pkg);
      } else {
        await api.deletePackage(tenantId, pkg.id);
      }
      onRefresh();
      onClose();
    } catch (err) {
      console.error('Erro ao excluir o pacote:', err);
      alert('Erro ao excluir o pacote.');
    } finally {
      setIsDeletingPkg(false);
    }
  };

  // Toggle Session Status (Realizada <-> Pendente)
  const handleToggleSessionStatus = async (sess: Session) => {
    if (!tenant) return;
    setIsSavingSession(sess.id);
    try {
      const isCompleted = sess.status === 'COMPLETED';
      const newStatus = isCompleted ? 'SCHEDULED' : 'COMPLETED';

      await api.updateSession(sess.id, tenant.id, {
        status: newStatus,
        packageId: pkg.id,
        patientId: pkg.patientId,
        patientName: pkg.patientName,
        sessionNumber: sess.sessionNumber,
        procedures: sess.procedures,
        scheduledDate: sess.scheduledDate,
        scheduledTime: sess.scheduledTime,
        attendedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
      });

      onRefresh();
    } catch (err) {
      alert('Erro ao alterar status da sessão');
    } finally {
      setIsSavingSession(null);
    }
  };

  // Save Techniques & Session Details
  const handleSaveSessionDetails = async (sess: Session) => {
    if (!tenant) return;
    setIsSavingSession(sess.id);
    try {
      const proceduresStr = editingProcedures[sess.id] ?? sess.procedures.join(', ');
      const proceduresArr = proceduresStr
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);

      const evolutionText = editingNotes[sess.id] ?? (sess.evolutionText || sess.siNotes || '');
      const scheduledDate = editingDate[sess.id] ?? sess.scheduledDate;
      const scheduledTime = editingTime[sess.id] ?? sess.scheduledTime;

      await api.updateSession(sess.id, tenant.id, {
        packageId: pkg.id,
        patientId: pkg.patientId,
        patientName: pkg.patientName,
        sessionNumber: sess.sessionNumber,
        procedures: proceduresArr.length > 0 ? proceduresArr : sess.procedures,
        evolutionText,
        scheduledDate,
        scheduledTime,
        status: sess.status,
      });

      setExpandedSessionId(null);
      onRefresh();
    } catch (err) {
      alert('Erro ao salvar detalhes da sessão');
    } finally {
      setIsSavingSession(null);
    }
  };

  // Generate individual session validation token / link
  const getOrCreateSessionLink = async (sess: Session): Promise<string | null> => {
    if (!tenant) return null;
    if (sessionLinks[sess.id]) return sessionLinks[sess.id];

    try {
      // Ensure session exists on backend if virtual
      if (sess.id.startsWith('sess-stub-')) {
        await api.updateSession(sess.id, tenant.id, {
          packageId: pkg.id,
          patientId: pkg.patientId,
          patientName: pkg.patientName,
          sessionNumber: sess.sessionNumber,
          procedures: sess.procedures,
          scheduledDate: sess.scheduledDate,
          scheduledTime: sess.scheduledTime,
          status: 'COMPLETED',
        });
      }

      const res = await api.sendWhatsAppValidation(sess.id, tenant.id);
      const url = res.validationUrl;
      setSessionLinks(prev => ({ ...prev, [sess.id]: url }));
      return url;
    } catch (err) {
      alert('Erro ao gerar link de validação para a sessão');
      return null;
    }
  };

  const handleShareSessionWhatsApp = async (sess: Session) => {
    const url = await getOrCreateSessionLink(sess);
    if (url) {
      const techniques = sess.procedures.join(', ');
      const dateFormatted = sess.scheduledDate ? sess.scheduledDate.split('-').reverse().join('/') : '';
      const msg =
        `Olá, *${pkg.patientName}*!\n\n` +
        `Sua *Sessão ${sess.sessionNumber} de ${pkg.sessionCount}* do pacote *${pkg.title}* foi realizada!\n\n` +
        `🗓 Data: ${dateFormatted} às ${sess.scheduledTime}\n` +
        `💆‍♀️ Técnicas Utilizadas: ${techniques}\n` +
        (sess.evolutionText ? `📝 Observações/Métodos: ${sess.evolutionText}\n\n` : '\n') +
        `Por favor, acesse o link seguro para assinar o termo de ciente desta sessão:\n${url}`;

      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const handleCopySessionLink = async (sess: Session) => {
    const url = await getOrCreateSessionLink(sess);
    if (url) {
      await copyToClipboard(url);
      setCopiedSessionId(sess.id);
      setTimeout(() => setCopiedSessionId(null), 3000);
    }
  };

  const handleSaveSessionTabletSignature = async (sess: Session) => {
    if (!tenant || !sessionSignatureUrl) {
      alert('Desenhe e confirme a assinatura no quadro');
      return;
    }
    setIsSavingSignature(true);
    try {
      // Ensure session exists if virtual
      if (sess.id.startsWith('sess-stub-')) {
        await api.updateSession(sess.id, tenant.id, {
          packageId: pkg.id,
          patientId: pkg.patientId,
          patientName: pkg.patientName,
          sessionNumber: sess.sessionNumber,
          procedures: sess.procedures,
          scheduledDate: sess.scheduledDate,
          scheduledTime: sess.scheduledTime,
          status: 'COMPLETED',
        });
      }

      await api.signSessionDirect(sess.id, tenant.id, sessionSignatureUrl);
      setActiveTabletSessionId(null);
      setSessionSignatureUrl('');
      onRefresh();
      alert(`Ciente da Sessão ${sess.sessionNumber} registrado com sucesso!`);
    } catch (err) {
      alert('Erro ao salvar assinatura da sessão');
    } finally {
      setIsSavingSignature(false);
    }
  };

  // Entire Package Signoff
  const handleCopyPackageLink = async () => {
    if (!tenant) return;
    try {
      let url = packageLink;
      if (!url) {
        const res = await api.sendPackageSignoff(pkg.id, tenant.id);
        url = res.validationUrl;
        setPackageLink(url);
      }
      if (url) {
        await copyToClipboard(url);
        setCopiedPackageLink(true);
        setTimeout(() => setCopiedPackageLink(false), 3000);
      }
    } catch (err) {
      alert('Erro ao gerar link do pacote');
    }
  };

  const handleSharePackageWhatsApp = async () => {
    if (!tenant) return;
    try {
      let url = packageLink;
      if (!url) {
        const res = await api.sendPackageSignoff(pkg.id, tenant.id);
        url = res.validationUrl;
        setPackageLink(url);
      }
      const msg = `Olá, ${pkg.patientName}! Por favor, acesse o extrato completo e termo de ciente do seu *${pkg.title}*:\n\n${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (err) {
      alert('Erro ao enviar pacote por WhatsApp');
    }
  };

  const handleSavePackageTabletSignature = async () => {
    if (!tenant || !packageSignatureUrl) {
      alert('Desenhe a assinatura primeiro');
      return;
    }
    setIsSavingSignature(true);
    try {
      await fetch(`/api/packages/${pkg.id}/signoff-direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenant.id },
        body: JSON.stringify({ signatureUrl: packageSignatureUrl }),
      });
      setShowPackageTabletSign(false);
      onRefresh();
      alert('Ciente Geral do Pacote registrado com sucesso!');
    } catch (err) {
      alert('Erro ao assinar pacote');
    } finally {
      setIsSavingSignature(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight text-white">{pkg.title}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-black">
                  {pkg.sessionCount} Sessões
                </span>
              </div>
              <p className="text-xs text-teal-200/90 font-medium mt-0.5">
                Paciente: <span className="text-white font-bold">{pkg.patientName}</span> • Tratamento:{' '}
                <span className="text-teal-300">{pkg.treatmentType}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingPkg ? (
              <div className="flex items-center gap-2">
                {onOpenEditModal ? (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenEditModal(pkg);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-500/25 hover:bg-teal-500/40 text-teal-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
                    title="Editar informações completas do pacote"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startEditingPackage}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition"
                    title="Editar informações do pacote"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/25 hover:bg-rose-600 text-rose-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
                  title="Apagar este pacote"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSavePackage}
                  disabled={isSavingPkg}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Save className="w-3.5 h-3.5" /> {isSavingPkg ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPkg(false)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition"
                >
                  Cancelar
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Delete Confirmation Alert Banner */}
          {showConfirmDelete && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2.5 animate-fade-in shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <h4 className="font-extrabold text-sm">Deseja realmente apagar este pacote?</h4>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                Você está prestes a excluir o pacote <strong>"{pkg.title}"</strong> de <strong>{pkg.patientName}</strong> ({pkg.sessionCount} sessões). Todas as sessões vinculadas a este pacote serão removidas do sistema.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDeletePackage}
                  disabled={isDeletingPkg}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeletingPkg ? 'Excluindo...' : 'Sim, Apagar Pacote'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={isDeletingPkg}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
          {/* Package Editor Drawer */}
          {isEditingPkg && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-3 animate-fade-in">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                Editar Informações do Pacote
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nome do Pacote
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tipo de Tratamento
                  </label>
                  <input
                    type="text"
                    value={editTreatmentType}
                    onChange={e => setEditTreatmentType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Valor Total (R$)
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Status do Pacote
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="ACTIVE">Ativo (Em andamento)</option>
                    <option value="COMPLETED">Concluído</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* High-Impact Progress Overview Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-slate-400" /> Total do Pacote
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {pkg.sessionCount}{' '}
                <span className="text-xs font-semibold text-slate-400">sessões</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
              <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Realizadas
              </p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                {completedSessions.length}{' '}
                <span className="text-xs font-semibold text-emerald-600/70">
                  de {pkg.sessionCount}
                </span>
              </p>
            </div>

            <div className={`p-3.5 rounded-2xl border shadow-2xs ${
              needsSignatureSessions.length > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}>
              <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Precisa de Ciente
              </p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {needsSignatureSessions.length}{' '}
                <span className="text-xs font-semibold text-amber-700/70">pendente(s)</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> A Realizar
              </p>
              <p className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">
                {pendingSessions.length}{' '}
                <span className="text-xs font-semibold text-slate-400">restantes</span>
              </p>
            </div>
          </div>

          {/* Filters & Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <h4 className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" /> Detalhamento Individual das Sessões (1 a {pkg.sessionCount})
            </h4>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap ${
                  statusFilter === 'ALL'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Todas ({allSessions.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap flex items-center gap-1 ${
                  statusFilter === 'COMPLETED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                🟢 Realizadas ({completedSessions.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('NEEDS_SIGNATURE')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap flex items-center gap-1 ${
                  statusFilter === 'NEEDS_SIGNATURE'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`}
              >
                🟡 Aguardando Ciente ({needsSignatureSessions.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap flex items-center gap-1 ${
                  statusFilter === 'PENDING'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                ⚪ A Realizar ({pendingSessions.length})
              </button>
            </div>
          </div>

          {/* Sessions Detailed List */}
          <div className="space-y-3.5">
            {filteredSessions.map(sess => {
              const isCompleted = sess.status === 'COMPLETED';
              const hasSignature = !!sess.clientSignatureUrl;
              const needsSignature = isCompleted && !hasSignature;

              const isExpanded = expandedSessionId === sess.id;
              const isTabletOpen = activeTabletSessionId === sess.id;
              const isSaving = isSavingSession === sess.id;

              const dateFormatted = sess.scheduledDate
                ? sess.scheduledDate.split('-').reverse().join('/')
                : 'Não agendada';

              return (
                <div
                  key={sess.id}
                  className={`rounded-2xl border transition overflow-hidden shadow-2xs ${
                    needsSignature
                      ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 ring-2 ring-amber-400/30'
                      : isCompleted
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Session Header Bar */}
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      {/* Main Title Line: e.g. "1 de 4: Realizada dia 10/08/2026" or "2 de 4: Pendente" */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs">
                          {sess.sessionNumber} de {pkg.sessionCount}
                        </span>

                        <h5 className="font-extrabold text-sm sm:text-base leading-tight uppercase">
                          {isCompleted ? (
                            <span className="text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 inline shrink-0" />
                              SESSÃO {sess.sessionNumber} DE {pkg.sessionCount}: REALIZADA DIA {dateFormatted}
                            </span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-amber-500 inline shrink-0" />
                              SESSÃO {sess.sessionNumber} DE {pkg.sessionCount}: PENDENTE
                            </span>
                          )}
                        </h5>

                        {/* Status Badge */}
                        {needsSignature && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Aguardando Ciente
                          </span>
                        )}

                        {hasSignature && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Ciente Assinado
                          </span>
                        )}
                      </div>

                      {/* Applied Techniques / Methods */}
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 pt-0.5">
                        <strong className="text-teal-700 dark:text-teal-400">Técnicas / Métodos:</strong>{' '}
                        {sess.procedures.length > 0 ? sess.procedures.join(', ') : 'Massoterapia Integrativa'}
                      </p>

                      {/* Clinical Notes / Evolution */}
                      {sess.evolutionText && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800 italic">
                          "{sess.evolutionText}"
                        </p>
                      )}
                    </div>

                    {/* Quick Session Status & Techniques Controls */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800 w-full md:w-auto justify-end">
                      {/* Toggle Realizada vs Pendente */}
                      <button
                        type="button"
                        onClick={() => handleToggleSessionStatus(sess)}
                        disabled={isSaving}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-2xs ${
                          isCompleted
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950/80 dark:text-amber-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isSaving ? (
                          'Aguarde...'
                        ) : isCompleted ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" /> Desfazer (Tornar Pendente)
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como Realizada
                          </>
                        )}
                      </button>

                      {/* Edit Techniques button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedSessionId(null);
                          } else {
                            setExpandedSessionId(sess.id);
                            setEditingProcedures(prev => ({
                              ...prev,
                              [sess.id]: sess.procedures.join(', '),
                            }));
                            setEditingNotes(prev => ({
                              ...prev,
                              [sess.id]: sess.evolutionText || sess.siNotes || '',
                            }));
                            setEditingDate(prev => ({ ...prev, [sess.id]: sess.scheduledDate }));
                            setEditingTime(prev => ({ ...prev, [sess.id]: sess.scheduledTime }));
                          }
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-teal-600" /> Descrever Métodos
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Techniques & Methods Editor */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-100/80 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in">
                      <h6 className="text-xs font-extrabold text-teal-800 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5" /> Descrever Técnicas e Métodos da Sessão #{sess.sessionNumber}
                      </h6>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Técnicas / Procedimentos Aplicados (separados por vírgula)
                          </label>
                          <input
                            type="text"
                            value={
                              editingProcedures[sess.id] !== undefined
                                ? editingProcedures[sess.id]
                                : sess.procedures.join(', ')
                            }
                            onChange={e =>
                              setEditingProcedures(prev => ({ ...prev, [sess.id]: e.target.value }))
                            }
                            placeholder="Ex: Ventosaterapia, Liberação Miofascial, Shiatsu"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Data Realizada
                            </label>
                            <input
                              type="date"
                              value={editingDate[sess.id] ?? sess.scheduledDate}
                              onChange={e =>
                                setEditingDate(prev => ({ ...prev, [sess.id]: e.target.value }))
                              }
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Horário
                            </label>
                            <input
                              type="time"
                              value={editingTime[sess.id] ?? sess.scheduledTime}
                              onChange={e =>
                                setEditingTime(prev => ({ ...prev, [sess.id]: e.target.value }))
                              }
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Descrição dos Procedimentos e Observações Clínicas para Acompanhamento do Cliente
                        </label>
                        <textarea
                          rows={2}
                          value={
                            editingNotes[sess.id] !== undefined
                              ? editingNotes[sess.id]
                              : sess.evolutionText || sess.siNotes || ''
                          }
                          onChange={e =>
                            setEditingNotes(prev => ({ ...prev, [sess.id]: e.target.value }))
                          }
                          placeholder="Descreva o método utilizado nesta sessão para o cliente acompanhar no extrato..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSaveSessionDetails(sess)}
                          disabled={isSaving}
                          className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition"
                        >
                          <Save className="w-3.5 h-3.5" />{' '}
                          {isSaving ? 'Salvando...' : 'Salvar Técnicas e Métodos'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Individual Client Ciente / Signature Banner */}
                  <div className={`p-3 sm:px-4 sm:py-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                    needsSignature
                      ? 'bg-amber-100/80 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
                      : hasSignature
                      ? 'bg-emerald-100/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <FileSignature className={`w-4 h-4 shrink-0 ${needsSignature ? 'text-amber-600' : 'text-teal-600'}`} />
                      <div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          Ciente da Sessão #{sess.sessionNumber}:
                        </span>{' '}
                        {hasSignature ? (
                          <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                            Assinado pelo cliente em{' '}
                            {sess.clientConfirmedAt
                              ? new Date(sess.clientConfirmedAt).toLocaleString('pt-BR')
                              : 'Atendimento'}
                          </span>
                        ) : needsSignature ? (
                          <span className="text-amber-800 dark:text-amber-300 font-bold">
                            ⚠️ Atendimento realizado! Envie ao cliente para assinar o termo de ciente.
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">
                            Disponível para assinatura individual do cliente.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Individual Session Signature Actions */}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleShareSessionWhatsApp(sess)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Enviar por WhatsApp
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopySessionLink(sess)}
                        className="px-3 py-1.5 rounded-xl border border-teal-600 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950 text-[11px] font-bold flex items-center gap-1.5 transition"
                      >
                        {copiedSessionId === sess.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copiedSessionId === sess.id ? 'Link Copiado!' : 'Copiar Link'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (isTabletOpen) {
                            setActiveTabletSessionId(null);
                          } else {
                            setActiveTabletSessionId(sess.id);
                            setSessionSignatureUrl('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition"
                      >
                        <FileSignature className="w-3.5 h-3.5" /> Coletar no Tablet
                      </button>
                    </div>
                  </div>

                  {/* In-Person Tablet Signature Canvas for specific session */}
                  {isTabletOpen && (
                    <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border-t border-teal-200 dark:border-teal-800 space-y-3 animate-fade-in">
                      <p className="text-xs font-bold text-teal-900 dark:text-teal-200">
                        Assinatura de Ciente do Cliente para a Sessão #{sess.sessionNumber}:
                      </p>
                      <CanvasSignature onSave={url => setSessionSignatureUrl(url)} width={500} height={150} />

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveTabletSessionId(null)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveSessionTabletSignature(sess)}
                          disabled={isSavingSignature || !sessionSignatureUrl}
                          className="px-4 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold disabled:opacity-40"
                        >
                          {isSavingSignature ? 'Salvando...' : 'Confirmar Ciente da Sessão'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* General Package Signoff / Extrato Completo Section */}
          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-teal-600" />
                <div>
                  <h5 className="font-extrabold text-xs text-teal-900 dark:text-teal-200">
                    Ciente Geral do Pacote Completo
                  </h5>
                  <p className="text-[11px] text-teal-700 dark:text-teal-300">
                    Envie o extrato geral de todas as sessões para o cliente assinar o pacote completo.
                  </p>
                </div>
              </div>

              {pkg.clientSignatureUrl ? (
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 shrink-0">
                  <UserCheck className="w-3.5 h-3.5" /> Pacote Assinado
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-bold text-[10px] shrink-0">
                  Pendente Assinatura Geral
                </span>
              )}
            </div>

            {pkg.clientSignatureUrl && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-teal-200 dark:border-teal-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Pacote assinado pelo cliente em:</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {pkg.clientConfirmedAt ? new Date(pkg.clientConfirmedAt).toLocaleString('pt-BR') : 'Recente'}
                  </p>
                </div>
                <img
                  src={pkg.clientSignatureUrl}
                  alt="Assinatura do Cliente"
                  className="h-10 bg-white p-1 rounded border border-slate-200"
                />
              </div>
            )}

            {!pkg.clientSignatureUrl && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSharePackageWhatsApp}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Enviar Extrato Geral por WhatsApp
                </button>

                <button
                  type="button"
                  onClick={handleCopyPackageLink}
                  className="px-3.5 py-2 rounded-xl border border-teal-600 text-teal-700 dark:text-teal-300 hover:bg-teal-100/50 dark:hover:bg-teal-900/40 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  {copiedPackageLink ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedPackageLink ? 'Link Copiado!' : 'Copiar Link do Pacote'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPackageTabletSign(!showPackageTabletSign)}
                  className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <FileSignature className="w-3.5 h-3.5" /> Coletar Ciente Geral no Tablet
                </button>
              </div>
            )}

            {/* Tablet Canvas for Overall Package */}
            {showPackageTabletSign && (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-teal-300 dark:border-teal-700 space-y-3">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Assinatura do Cliente para o Pacote Completo:
                </p>
                <CanvasSignature onSave={url => setPackageSignatureUrl(url)} width={500} height={160} />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPackageTabletSign(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePackageTabletSignature}
                    disabled={isSavingSignature || !packageSignatureUrl}
                    className="px-4 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold disabled:opacity-40"
                  >
                    {isSavingSignature ? 'Salvando...' : 'Salvar Ciente do Pacote'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
