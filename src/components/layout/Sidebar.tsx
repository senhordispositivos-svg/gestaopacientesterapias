import React, { useState } from 'react';
import {
  LayoutDashboard,
  LayoutGrid,
  Users,
  ClipboardList,
  Package,
  CalendarCheck2,
  FileText,
  FolderOpen,
  Cake,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  Settings,
  Database,
  LogOut,
  Building2,
  ChevronDown,
  Sparkles,
  Headset,
  Heart,
  Code2,
  Plus,
  X,
  Pencil,
  MapPin,
  DollarSign,
  ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ClinicProfileModal } from './ClinicProfileModal';
import { DbConnectionTestModal } from '../database/DbConnectionTestModal';

interface SidebarProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  activeView?: string;
  onSelectView?: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  currentTenant?: any;
  onSwitchTenant?: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  activeView,
  onSelectView,
  isOpenMobile = false,
  onCloseMobile = () => {},
}) => {
  const { user, tenant, allTenants, switchTenant, createClinic, logout } = useAuth();
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [isNewClinicModalOpen, setIsNewClinicModalOpen] = useState(false);
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
  const [isDbTestModalOpen, setIsDbTestModalOpen] = useState(false);
  const [newClinicName, setNewClinicName] = useState('');
  const [newClinicCity, setNewClinicCity] = useState('São Paulo');
  const [newClinicState, setNewClinicState] = useState('SP');
  const [newClinicPhone, setNewClinicPhone] = useState('');

  const selectedTab = activeView || currentTab || 'dashboard';
  const handleTabClick = (id: string) => {
    if (onSelectView) onSelectView(id);
    if (onTabChange) onTabChange(id);
    onCloseMobile();
  };

  const handleCreateNewClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName.trim()) return;

    try {
      const created = await createClinic({
        name: newClinicName.trim(),
        tradeName: newClinicName.trim(),
        corporateName: `${newClinicName.trim()} Serviços de Saúde`,
        city: newClinicCity,
        state: newClinicState,
        phone: newClinicPhone,
        customHeader: `${newClinicName.trim()} - Fisioterapia e Massoterapia Integrativa`,
      });
      await switchTenant(created.id);
      setIsNewClinicModalOpen(false);
      setShowTenantDropdown(false);
      setNewClinicName('');
      setNewClinicPhone('');
    } catch (err) {
      alert('Erro ao criar clínica.');
    }
  };

  const menuItems = [
    { id: 'hub', label: 'Painel Tátil (Tablet Hub)', icon: LayoutGrid, roles: ['ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'] },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'] },
    { id: 'patients', label: 'Pacientes', icon: Users, roles: ['ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'] },
    { id: 'anamnesis', label: 'Anamnese', icon: ClipboardList, roles: ['ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'] },
    { id: 'packages', label: 'Pacotes', icon: Package, roles: ['ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'] },
    { id: 'sessions', label: 'Sessões', icon: CalendarCheck2, roles: ['ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'] },
    { id: 'birthdays', label: 'Aniversariantes', icon: Cake, roles: ['ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'] },
    { id: 'professionals', label: 'Usuários & Permissões', icon: Users, roles: ['ADMIN', 'RECEPTIONIST'] },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, roles: ['ADMIN', 'PROFESSIONAL'] },
  ];

  const systemItems = [
    { id: 'financial', label: 'Fluxo de Caixa', icon: DollarSign, roles: ['ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'] },
    { id: 'financial-integration', label: 'Integração Financeira', icon: ArrowLeftRight, roles: ['ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'] },
    { id: 'backup', label: 'Backup & Segurança', icon: Database, roles: ['ADMIN'] },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, roles: ['ADMIN'] },
    { id: 'audit', label: 'Auditoria & LGPD', icon: ShieldCheck, roles: ['ADMIN'] },
    { id: 'settings', label: 'Configurações', icon: Settings, roles: ['ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(
    item => !user || item.roles.includes(user.role)
  );

  const filteredSystemItems = systemItems.filter(
    item => !user || item.roles.includes(user.role)
  );

  const isSuperUser = user?.isSuperUser || user?.email === 'osaiasbrito@gmail.com';

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-[#0F172A] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-700/50 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => setIsClinicModalOpen(true)}
              title="Clique para alterar a logomarca e perfil da clínica"
              className="flex items-center gap-2.5 min-w-0 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm shadow-emerald-500/20 overflow-hidden group-hover:ring-2 group-hover:ring-emerald-400 transition bg-slate-800">
                {tenant?.logoUrl ? (
                  <img
                    src={tenant.logoUrl}
                    alt="Logo da Clínica"
                    className="w-full h-full object-cover rounded-lg"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback if image fails to render
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  (tenant?.tradeName || tenant?.name || 'F').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-extrabold text-white tracking-tight text-[10px] uppercase block truncate leading-tight group-hover:text-emerald-400 transition">
                  FISIOTERAPIA & MASSOTERAPIA
                </span>
                <span className="text-[10px] text-emerald-400 font-bold block truncate">
                  {tenant?.tradeName || 'Clínica Principal'}
                </span>
              </div>
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Fechar menu"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Multi-Tenant Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTenantDropdown(!showTenantDropdown)}
              className="w-full px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-[11px] text-slate-300 transition"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="font-medium truncate">{tenant?.tradeName || tenant?.name}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {showTenantDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden py-1">
                <div className="px-2.5 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 flex items-center justify-between">
                  <span>Clínica / Unidade</span>
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                </div>
                {allTenants.map(t => (
                  <div
                    key={t.id}
                    className={`w-full px-2.5 py-1.5 text-left text-[11px] flex items-center justify-between hover:bg-slate-700/60 transition group ${
                      t.id === tenant?.id ? 'text-emerald-400 font-semibold bg-emerald-500/10' : 'text-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        switchTenant(t.id);
                        setShowTenantDropdown(false);
                      }}
                      className="flex-1 min-w-0 text-left truncate cursor-pointer flex flex-col"
                    >
                      <span className="truncate font-semibold">{t.tradeName || t.name}</span>
                      <span className="text-[9px] text-slate-400 font-normal">
                        {t.city || 'São Paulo'}/{t.state || 'SP'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        switchTenant(t.id);
                        setIsClinicModalOpen(true);
                        setShowTenantDropdown(false);
                      }}
                      title="Editar dados e endereço desta clínica"
                      className="p-1 text-slate-400 hover:text-teal-300 hover:bg-slate-600/50 rounded transition shrink-0 ml-1 cursor-pointer opacity-70 group-hover:opacity-100"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Add new clinic button for Admin / Super User */}
                {(isSuperUser || user?.role === 'ADMIN') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewClinicModalOpen(true);
                      setShowTenantDropdown(false);
                    }}
                    className="w-full px-2.5 py-2 text-left text-[11px] flex items-center gap-1.5 text-teal-400 hover:bg-teal-500/10 font-bold border-t border-slate-700/80 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Cadastrar Nova Clínica</span>
                  </button>
                )}
              </div>

            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2.5 space-y-0.5 text-[13px] overflow-y-auto">
          {filteredMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = selectedTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded transition text-left ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.id === 'birthdays' && (
                  <span className="ml-auto px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 text-[10px] font-extrabold">
                    Mês
                  </span>
                )}
              </button>
            );
          })}

          {filteredSystemItems.length > 0 && (
            <>
              <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Sistema
              </div>
              {filteredSystemItems.map(item => {
                const Icon = item.icon;
                const isActive = selectedTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded transition text-left ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* Super User Badge button */}
          {isSuperUser && (
            <div className="pt-2 space-y-1.5">
              <button
                type="button"
                onClick={() => setIsDbTestModalOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition text-left text-xs font-bold"
              >
                <Database className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">Testar Banco de Dados</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNewClinicModalOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20 transition text-left text-xs font-bold"
              >
                <Plus className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="truncate">Cadastrar Clínica</span>
              </button>
            </div>
          )}

          {/* Direct Link to Support Contact */}
          <button
            type="button"
            onClick={() => handleTabClick('settings')}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-950/60 border border-teal-800/60 text-teal-300 hover:bg-teal-900/60 transition text-left text-xs font-bold"
          >
            <Headset className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="truncate">Suporte Técnico</span>
          </button>
        </nav>

        {/* Footer Tenant Info & Creator Credits */}
        <div className="p-3.5 bg-slate-900 mt-auto border-t border-slate-800 text-[11px] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
              <span className="text-slate-100 font-medium truncate">
                {tenant?.tradeName || 'Clínica Principal'}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sair do Sistema"
              className="text-slate-500 hover:text-rose-400 transition ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="font-semibold text-teal-400 flex items-center gap-1">
              <Code2 className="w-3 h-3 text-teal-400" /> Criado por Osaias Brito
            </span>
            <span className="text-slate-500">v2.5</span>
          </div>
        </div>
      </aside>

      {/* Modal for Super User to create a new Clinic */}
      {isNewClinicModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-base">Cadastrar Nova Clínica</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewClinicModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewClinic} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome da Clínica / Fantasia:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Clínica Pilates & Fisioterapia"
                  value={newClinicName}
                  onChange={e => setNewClinicName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cidade:</label>
                  <input
                    type="text"
                    value={newClinicCity}
                    onChange={e => setNewClinicCity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estado (UF):</label>
                  <input
                    type="text"
                    value={newClinicState}
                    onChange={e => setNewClinicState(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Telefone / WhatsApp:</label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={newClinicPhone}
                  onChange={e => setNewClinicPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewClinicModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 hover:bg-teal-400 font-bold shadow-md"
                >
                  Criar e Acessar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clinic Profile & Logo Modal */}
      <ClinicProfileModal
        isOpen={isClinicModalOpen}
        onClose={() => setIsClinicModalOpen(false)}
      />

      {/* Super User Database Connection Diagnostic Modal */}
      <DbConnectionTestModal
        isOpen={isDbTestModalOpen}
        onClose={() => setIsDbTestModalOpen(false)}
      />
    </>
  );
};
