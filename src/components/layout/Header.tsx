import React, { useState } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Search,
  Plus,
  Building2,
  UserCheck,
  Bell,
  X,
  LogOut,
  Camera,
  Image as ImageIcon,
  Wifi,
  WifiOff,
  RefreshCw,
  LayoutGrid,
  Database,
  Lock,
  Sliders,
  Maximize,
  Minimize2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Patient, RealtimeConnectionStatus } from '../../types';
import { UserProfileModal } from './UserProfileModal';
import { ClinicProfileModal } from './ClinicProfileModal';
import { DbConnectionTestModal } from '../database/DbConnectionTestModal';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  onNavigateToHub?: () => void;
  onOpenNewPatient?: () => void;
  onOpenNewSession?: () => void;
  patientsList?: Patient[];
  onSelectPatient?: (patient: Patient) => void;
  user?: any;
  tenant?: any;
  realtimeStatus?: RealtimeConnectionStatus;
  lastSyncTime?: Date;
  onManualRefresh?: () => void;
  resolutionScale?: number;
  onOpenResolutionModal?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu = () => {},
  onNavigateToHub,
  onOpenNewPatient,
  onOpenNewSession,
  patientsList = [],
  onSelectPatient = (_patient: Patient) => {},
  user: propUser,
  tenant: propTenant,
  realtimeStatus = 'connected',
  lastSyncTime,
  onManualRefresh,
  resolutionScale = 100,
  onOpenResolutionModal,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const { tenant: authTenant, user: authUser, logout } = useAuth();
  const user = propUser || authUser;
  const tenant = propTenant || authTenant;

  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
  const [isDbTestModalOpen, setIsDbTestModalOpen] = useState(false);

  const isSuperUser = Boolean(
    user?.isSuperUser ||
    user?.email?.toLowerCase() === 'osaiasbrito@gmail.com' ||
    user?.email?.toLowerCase() === 'senhordispositivos@gmail.com' ||
    user?.role === 'SUPER_ADMIN'
  );

  const filteredPatients = searchTerm.trim()
    ? patientsList.filter(
        p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.cpf.includes(searchTerm) ||
          p.phone.includes(searchTerm)
      )
    : [];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded text-slate-500 hover:text-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Clinic Name & Logo Badge on Header (Clickable to Edit Clinic Logo/Profile) */}
        <button
          type="button"
          onClick={() => setIsClinicModalOpen(true)}
          title="Editar Logomarca e Perfil da Clínica"
          className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-lg bg-teal-600 dark:bg-teal-700 text-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt="Logo da Clínica"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Building2 className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="truncate max-w-[200px] group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
            {tenant?.tradeName || tenant?.name || 'Sua Clínica'}
          </span>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            • Logomarca
          </span>
        </button>

        {/* Global Search Input */}
        <div className="relative w-64 sm:w-80 md:w-96">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            placeholder="Pesquisar paciente por CPF ou nome..."
            className="w-full pl-10 pr-8 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-xs outline-none transition-all dark:text-white"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Search Dropdown */}
          {showSearchResults && filteredPatients.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden z-50 py-1 max-h-60 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 dark:bg-slate-800">
                Pacientes Encontrados ({filteredPatients.length})
              </div>
              {filteredPatients.map(patient => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => {
                    onSelectPatient(patient);
                    setShowSearchResults(false);
                    setSearchTerm('');
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{patient.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      CPF: {patient.cpf} • Tel: {patient.phone}
                    </p>
                  </div>
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right User Info Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4">
        {/* Real-time Status Badge with Fixed Width to prevent any layout shifts/shaking */}
        <div
          title={
            realtimeStatus === 'connected'
              ? 'Sincronização em tempo real ativa (WebSockets/SSE). Alterações em qualquer aparelho aparecem instantaneamente.'
              : realtimeStatus === 'fallback_sse'
              ? 'Sincronização em tempo real ativa via SSE.'
              : realtimeStatus === 'connecting'
              ? 'Conectando ao canal de tempo real...'
              : 'Modo offline resiliente / Reconectando...'
          }
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border select-none bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 w-[124px] shrink-0 justify-between"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              {(realtimeStatus === 'connected' || realtimeStatus === 'fallback_sse') && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  realtimeStatus === 'connected' || realtimeStatus === 'fallback_sse'
                    ? 'bg-emerald-500'
                    : realtimeStatus === 'connecting'
                    ? 'bg-amber-400'
                    : 'bg-slate-400'
                }`}
              />
            </span>
            <span className="text-slate-600 dark:text-slate-300 truncate">
              {realtimeStatus === 'connected' || realtimeStatus === 'fallback_sse'
                ? 'Tempo Real'
                : realtimeStatus === 'connecting'
                ? 'Conectando'
                : 'Offline'}
            </span>
          </div>
          {onManualRefresh && (
            <button
              type="button"
              onClick={onManualRefresh}
              title="Forçar sincronização com o banco central"
              className="p-0.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition shrink-0"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${realtimeStatus === 'connecting' ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          )}
        </div>

        {/* Super User Database Connection Diagnostic Quick Action */}
        {isSuperUser && (
          <button
            type="button"
            onClick={() => setIsDbTestModalOpen(true)}
            title="Diagnóstico & Teste de Conexão com o Banco de Dados (Exclusivo Super Usuário)"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded-full text-[11px] font-bold transition shadow-2xs cursor-pointer group"
          >
            <Database className="w-3 h-3 text-amber-600 dark:text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>Testar Banco</span>
            <Lock className="w-2.5 h-2.5 text-amber-500 opacity-75" />
          </button>
        )}

        {/* Screen Resolution / Zoom Adjuster Button */}
        {onOpenResolutionModal && (
          <button
            type="button"
            onClick={onOpenResolutionModal}
            title="Ajustar Resolução / Escala da Tela (Ideal para tablets e celulares)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-500" />
            <span className="hidden sm:inline">Escala:</span>
            <span className="text-teal-600 dark:text-teal-400">{resolutionScale}%</span>
          </button>
        )}

        {/* Fullscreen Mode Toggle Button (Hide browser on tablets / PC) */}
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={
              isFullscreen
                ? 'Sair da Tela Cheia (ESC)'
                : 'Modo Tela Cheia (Oculta a barra do navegador no tablet/computador)'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs border ${
              isFullscreen
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 ring-1 ring-rose-400/40'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden md:inline">Sair Tela Cheia</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5 text-teal-500" />
                <span className="hidden md:inline">Tela Cheia</span>
              </>
            )}
          </button>
        )}

        {onNavigateToHub && (
          <button
            type="button"
            onClick={onNavigateToHub}
            title="Abrir Painel Tátil 3D (Modo Tablet / Smartphone)"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-slate-900 to-blue-950 hover:from-blue-950 hover:to-slate-900 text-teal-300 hover:text-white border border-teal-500/40 hover:border-teal-400 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Hub Tátil</span>
          </button>
        )}

        {onOpenNewPatient && (
          <button
            type="button"
            onClick={onOpenNewPatient}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Paciente</span>
          </button>
        )}

        {/* Profile Card & Avatar Trigger */}
        <button
          type="button"
          onClick={() => setIsProfileModalOpen(true)}
          title="Ver e editar meu perfil / foto"
          className="flex items-center gap-2.5 p-1 -m-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer group text-left"
        >
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px] group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
              {user?.name || 'Profissional'}
            </span>
            <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 truncate max-w-[140px]">
              {user?.role === 'SUPER_ADMIN' ? 'Super Administrador' : user?.role === 'ADMIN' ? 'Administrador' : 'Profissional'}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-xs flex items-center justify-center border border-teal-200 dark:border-teal-800 overflow-hidden shrink-0 shadow-2xs group-hover:ring-2 group-hover:ring-teal-500/40 transition">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user?.name || 'User'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
        </button>

        {/* Logout Quick Action */}
        <button
          type="button"
          onClick={logout}
          title="Sair da Conta"
          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* User Profile & Photo Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

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
    </header>
  );
};
