import React, { useState, useEffect } from 'react';
import { User, Role, AccessMode, Patient } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ImageUploadInput } from '../common/ImageUploadInput';
import {
  Users,
  Plus,
  Shield,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Edit3,
  Lock,
  ArrowRightLeft,
  UserCheck,
  UserX,
  AlertTriangle,
  Filter,
} from 'lucide-react';

interface ProfessionalsViewProps {
  onRefreshList?: () => void;
}

export const ProfessionalsView: React.FC<ProfessionalsViewProps> = ({ onRefreshList }) => {
  const { tenant, user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Modal State for Reassign Patients
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [userToReassignFrom, setUserToReassignFrom] = useState<User | null>(null);
  const [targetProfessionalId, setTargetProfessionalId] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState<Role>('PROFESSIONAL');
  const [accessMode, setAccessMode] = useState<AccessMode>('INDIVIDUAL');
  const [specialty, setSpecialty] = useState('');
  const [councilType, setCouncilType] = useState('');
  const [councilNumber, setCouncilNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState<string | null>(null);

  const isSuperUser = !!(currentUser?.isSuperUser || currentUser?.email?.toLowerCase() === 'osaiasbrito@gmail.com');
  const isAdmin = isSuperUser || currentUser?.role === 'ADMIN';

  const loadData = async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const [usersData, patientsData] = await Promise.all([
        api.getUsers(tenant.id),
        api.getPatients(tenant.id),
      ]);
      setUsersList(usersData);
      setPatientsList(patientsData);
    } catch (err) {
      console.error('Erro ao carregar corpo clínico:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant]);

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setName('');
    setEmail('');
    setAvatarUrl('');
    setRole('PROFESSIONAL');
    setAccessMode('INDIVIDUAL');
    setSpecialty('Massoterapia & Terapias Integrativas');
    setCouncilType('');
    setCouncilNumber('');
    setPhone('');
    setActive(true);
    setFormErrors({});
    setServerError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: User) => {
    setSelectedUser(u);
    setName(u.name);
    setEmail(u.email);
    setAvatarUrl(u.avatarUrl || '');
    setRole(u.role);
    setAccessMode(u.accessMode);
    setSpecialty(u.specialty || '');
    setCouncilType(u.councilType || '');
    setCouncilNumber(u.councilNumber || '');
    setPhone(u.phone || '');
    setActive(u.active !== false);
    setFormErrors({});
    setServerError(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (u: User) => {
    if (!tenant) return;
    const targetState = !u.active;
    const actionText = targetState ? 'reativar' : 'tornar inativo';

    if (!window.confirm(`Deseja realmente ${actionText} o profissional "${u.name}"?`)) {
      return;
    }

    setStatusActionLoading(u.id);
    try {
      await api.toggleProfessionalActive(tenant.id, u.id, targetState);
      await loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      console.error('Erro ao alterar status do profissional:', err);
      alert(err.message || 'Erro ao atualizar status do profissional.');
    } finally {
      setStatusActionLoading(null);
    }
  };

  const handleOpenReassignModal = (fromUser: User) => {
    setUserToReassignFrom(fromUser);
    const firstActive = usersList.find(u => u.id !== fromUser.id && u.active !== false);
    setTargetProfessionalId(firstActive ? firstActive.id : '');
    setIsReassignModalOpen(true);
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !userToReassignFrom) return;

    const targetProf = usersList.find(u => u.id === targetProfessionalId);
    const targetName = targetProf ? targetProf.name : 'Geral (Sem Profissional Específico)';

    setIsReassigning(true);
    try {
      const res = await api.reassignProfessionalPatients(
        tenant.id,
        userToReassignFrom.id,
        targetProfessionalId,
        targetName
      );
      alert(`Transferência concluída! ${res.reassignedCount} paciente(s) foram transferidos para ${targetName}.`);
      setIsReassignModalOpen(false);
      setUserToReassignFrom(null);
      await loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      console.error('Erro ao reatribuir pacientes:', err);
      alert(err.message || 'Erro ao transferir pacientes.');
    } finally {
      setIsReassigning(false);
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!name.trim()) {
      errors.name = 'O Nome Completo é obrigatório.';
    }
    if (!email.trim()) {
      errors.email = 'O E-mail de acesso é obrigatório.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Informe um e-mail válido (ex: nome@exemplo.com).';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    if (!tenant) {
      setServerError('Clínica/Tenant não identificado. Recarregue a página.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedUser) {
        await api.updateProfessional(tenant.id, selectedUser.id, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          avatarUrl: avatarUrl || undefined,
          role,
          accessMode,
          specialty: specialty.trim(),
          councilType: councilType.trim(),
          councilNumber: councilNumber.trim(),
          phone: phone.trim(),
          active,
        });
      } else {
        await api.createProfessional(tenant.id, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          avatarUrl: avatarUrl || undefined,
          role,
          accessMode,
          specialty: specialty.trim(),
          councilType: councilType.trim(),
          councilNumber: councilNumber.trim(),
          phone: phone.trim(),
          active,
        });
      }
      setIsModalOpen(false);
      await loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      console.error('Erro ao salvar profissional:', err);
      setServerError(err.message || 'Erro ao salvar profissional no banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = usersList.filter(u => {
    if (filterStatus === 'ACTIVE') return u.active !== false;
    if (filterStatus === 'INACTIVE') return u.active === false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Corpo Clínico & Níveis de Acesso
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão de profissionais ativos e inativos, com controle de permissões e transferência de pacientes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Cadastrar Novo Profissional
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setFilterStatus('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            filterStatus === 'ALL'
              ? 'bg-teal-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Todos ({usersList.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('ACTIVE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
            filterStatus === 'ACTIVE'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" /> Ativos ({usersList.filter(u => u.active !== false).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('INACTIVE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
            filterStatus === 'INACTIVE'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserX className="w-3.5 h-3.5" /> Inativos ({usersList.filter(u => u.active === false).length})
        </button>
      </div>

      {/* Grid of Professionals */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Carregando corpo clínico...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(u => {
            const isUserActive = u.active !== false;
            const assignedPatients = patientsList.filter(p => p.assignedProfessionalId === u.id);

            return (
              <div
                key={u.id}
                className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border transition shadow-2xs flex flex-col justify-between space-y-4 ${
                  isUserActive
                    ? 'border-slate-200 dark:border-slate-800'
                    : 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 ${
                          isUserActive
                            ? 'border-teal-500/50'
                            : 'border-rose-400 opacity-60 grayscale'
                        }`}
                      >
                        <img
                          src={
                            u.avatarUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={u.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                            {u.name}
                          </h3>
                          {u.isSuperUser && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                              SUPER
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
                          {u.specialty || 'Profissional'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(u)}
                      title="Editar Dados do Profissional"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                    {u.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{u.phone}</span>
                      </div>
                    )}
                    {u.councilNumber && (
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Shield className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>
                          {u.councilType ? `${u.councilType}: ` : 'Registro: '}
                          <strong>{u.councilNumber}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Role & Access Mode Badges */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-800'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      {u.role === 'ADMIN' ? 'Administrador' : 'Profissional'}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        u.accessMode === 'INDIVIDUAL'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      {u.accessMode === 'INDIVIDUAL' ? 'Fichas Próprias' : 'Acesso Total'}
                    </span>
                  </div>

                  {/* Assigned Patients Info */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Pacientes atribuídos:</span>
                    <span
                      className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                        assignedPatients.length > 0
                          ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                          : 'text-slate-400 bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {assignedPatients.length} paciente(s)
                    </span>
                  </div>

                  {/* Notice if Inactive with Patients */}
                  {!isUserActive && assignedPatients.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Profissional Inativo com Pacientes!</p>
                        <p className="text-[10px] mt-0.5 text-amber-700 dark:text-amber-400">
                          Reatribua os {assignedPatients.length} pacientes para outro profissional ativo.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status and Action Buttons */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium text-xs">Status no Sistema:</span>
                    <span
                      className={`font-bold text-xs flex items-center gap-1 ${
                        isUserActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isUserActive ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Ativo
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" /> Inativo
                        </>
                      )}
                    </span>
                  </div>

                  {/* Actions for Super User and Admins */}
                  {isAdmin && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={statusActionLoading === u.id}
                        onClick={() => handleToggleActive(u)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          isUserActive
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                        }`}
                      >
                        {isUserActive ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Tornar Inativo</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Reativar</span>
                          </>
                        )}
                      </button>

                      {assignedPatients.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenReassignModal(u)}
                          title="Transferir todos os pacientes deste profissional para outro"
                          className="py-2 px-3 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/50 text-xs font-bold flex items-center justify-center gap-1 transition"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Transferir</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal create / edit professional */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 my-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {selectedUser ? 'Editar Profissional' : 'Novo Cadastro de Profissional'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="text-rose-500 font-bold">*</span> Campos marcados com asterisco são de preenchimento obrigatório.
              </p>
            </div>

            {serverError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-xs text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-semibold">{serverError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <ImageUploadInput
                  label="Foto do Profissional (Opcional)"
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  fallbackInitials={name || 'P'}
                  helperText="Upload de foto de perfil para identificação clínica."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (formErrors.name) {
                      setFormErrors(prev => ({ ...prev, name: '' }));
                    }
                  }}
                  placeholder="Ex: Dra. Juliana Lima"
                  className={`w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border outline-none text-slate-900 dark:text-white transition ${
                    formErrors.name
                      ? 'border-rose-500 ring-1 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  E-mail de Acesso <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (formErrors.email) {
                      setFormErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  placeholder="juliana@clinicazen.com.br"
                  className={`w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border outline-none text-slate-900 dark:text-white transition ${
                    formErrors.email
                      ? 'border-rose-500 ring-1 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.email && (
                  <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Especialidade
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                    placeholder="Ex: Massoterapia"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Council / Professional Registration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tipo de Conselho
                  </label>
                  <select
                    value={councilType}
                    onChange={e => setCouncilType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="">Nenhum / Não informado</option>
                    <option value="CREFITO">CREFITO</option>
                    <option value="CBO">CBO (Massoterapia)</option>
                    <option value="CRM">CRM</option>
                    <option value="CRBM">CRBM (Biomedicina)</option>
                    <option value="COREN">COREN (Enfermagem)</option>
                    <option value="CRTR">CRTR</option>
                    <option value="Outro">Outro Conselho</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Número do Registro
                  </label>
                  <input
                    type="text"
                    value={councilNumber}
                    onChange={e => setCouncilNumber(e.target.value)}
                    placeholder="Ex: 12345/SP"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Função no Sistema
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="PROFESSIONAL">PROFISSIONAL</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                    <option value="RECEPTIONIST">RECEPCIONISTA</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nível de Acesso às Fichas
                  </label>
                  <select
                    value={accessMode}
                    onChange={e => setAccessMode(e.target.value as AccessMode)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="INDIVIDUAL">INDIVIDUAL (Só as suas)</option>
                    <option value="COMPREHENSIVE">GERAL (Todas as fichas)</option>
                  </select>
                </div>
              </div>

              {/* Status Toggle (Ativo / Inativo) */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Status de Ativação
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActive(true)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                  </button>

                  <button
                    type="button"
                    onClick={() => setActive(false)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                      !active
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Inativo
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Profissionais marcados como <strong>Inativos</strong> não têm acesso ao sistema e seus pacientes podem ser gerenciados e reatribuídos por Super Usuários e Administradores.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Salvando no Banco...</span>
                    </>
                  ) : (
                    <span>Salvar no Banco</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reassign Patients */}
      {isReassignModalOpen && userToReassignFrom && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Transferir Pacientes
                </h3>
                <p className="text-xs text-slate-500">
                  De: <strong className="text-slate-800 dark:text-slate-200">{userToReassignFrom.name}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Selecione o novo profissional ativo que assumirá a responsabilidade clínica pelos pacientes cadastrados:
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Profissional de Destino
                </label>
                <select
                  value={targetProfessionalId}
                  onChange={e => setTargetProfessionalId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-semibold"
                >
                  <option value="">Geral / Nenhum específico</option>
                  {usersList
                    .filter(u => u.id !== userToReassignFrom.id && u.active !== false)
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.specialty || 'Massoterapia'}) - Ativo
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-900/50 text-[11px] text-teal-800 dark:text-teal-300">
                Todos os prontuários, fichas de anamnese e sessões deste profissional serão reatribuídos para o profissional selecionado.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsReassignModalOpen(false);
                    setUserToReassignFrom(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isReassigning}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  {isReassigning ? 'Transferindo...' : 'Confirmar Transferência'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
