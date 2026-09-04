import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { PatientList } from './components/patients/PatientList';
import { PatientProfile } from './components/patients/PatientProfile';
import { BirthdaysView } from './components/patients/BirthdaysView';
import { AuditLogView } from './components/audit/AuditLogView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { ProfessionalsView } from './components/professionals/ProfessionalsView';
import { BackupManagerView } from './components/backup/BackupManagerView';
import { PatientFormModal } from './components/patients/PatientFormModal';
import { AnamnesisModal } from './components/anamnesis/AnamnesisModal';
import { PackageModal } from './components/packages/PackageModal';
import { SingleSessionModal } from './components/sessions/SingleSessionModal';
import { AttendanceModal } from './components/sessions/AttendanceModal';
import { WhatsAppModal } from './components/whatsapp/WhatsAppModal';
import { PublicValidationPage } from './components/public/PublicValidationPage';
import { PublicPackageValidationPage } from './components/public/PublicPackageValidationPage';
import { PublicAnamnesisPage } from './components/public/PublicAnamnesisPage';
import { SendAnamnesisLinkModal } from './components/whatsapp/SendAnamnesisLinkModal';
import { PackageDetailModal } from './components/packages/PackageDetailModal';
import { PackagesTrackerView } from './components/packages/PackagesTrackerView';
import { LoginView } from './components/auth/LoginView';
import { MobileTabletHub } from './components/MobileTabletHub';
import {
  LayoutDashboard,
  LayoutGrid,
  Users,
  CalendarCheck2,
  Package,
  ArrowLeft,
  Menu as MenuIcon,
  FileSignature,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Patient, User, Session, SessionPackage } from './types';
import { api } from './services/api';
import { INITIAL_PATIENTS, INITIAL_USERS, INITIAL_SESSIONS, INITIAL_PACKAGES } from './services/mockSeed';
import { useRealtimeSync } from './hooks/useRealtimeSync';

export function App() {
  const { tenant, user, switchTenant, isLoading: isAuthLoading, refreshTenantData } = useAuth();

  // Reactive URL token detection for public mobile & desktop validation
  const getPublicTokens = () => {
    if (typeof window === 'undefined') return { sessionToken: null, packageToken: null, anamnesisToken: null };
    const query = new URLSearchParams(window.location.search);
    const hash = window.location.hash || '';

    // Session token detection
    let sessToken = query.get('sessao') || query.get('session') || query.get('s') || query.get('token');
    if (!sessToken && hash.includes('validar-sessao=')) {
      const match = hash.split('validar-sessao=')[1];
      sessToken = match ? match.split('&')[0].split('?')[0] : null;
    }
    if (!sessToken && hash.includes('sessao=')) {
      const match = hash.split('sessao=')[1];
      sessToken = match ? match.split('&')[0].split('?')[0] : null;
    }

    // Package token detection
    let pkgToken = query.get('pacote') || query.get('package') || query.get('pkg');
    if (!pkgToken && hash.includes('validar-pacote=')) {
      const match = hash.split('validar-pacote=')[1];
      pkgToken = match ? match.split('&')[0].split('?')[0] : null;
    }
    if (!pkgToken && hash.includes('pacote=')) {
      const match = hash.split('pacote=')[1];
      pkgToken = match ? match.split('&')[0].split('?')[0] : null;
    }

    // Anamnesis / Patient Intake token detection
    let anamnesisToken = query.get('ficha') || query.get('anamnese') || query.get('cadastro') || query.get('intake');
    if (!anamnesisToken && hash.includes('ficha=')) {
      const match = hash.split('ficha=')[1];
      anamnesisToken = match ? match.split('&')[0].split('?')[0] : null;
    }
    if (!anamnesisToken && hash.includes('anamnese=')) {
      const match = hash.split('anamnese=')[1];
      anamnesisToken = match ? match.split('&')[0].split('?')[0] : null;
    }
    if (!anamnesisToken && hash.includes('cadastro=')) {
      const match = hash.split('cadastro=')[1];
      anamnesisToken = match ? match.split('&')[0].split('?')[0] : null;
    }

    return { sessionToken: sessToken, packageToken: pkgToken, anamnesisToken };
  };

  const [tokens, setTokens] = useState(getPublicTokens);

  useEffect(() => {
    const handleUrlChange = () => {
      setTokens(getPublicTokens());
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const clearPublicUrl = () => {
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
      setTokens({ sessionToken: null, packageToken: null, anamnesisToken: null });
    }
  };

  // Active view state - auto-detect mobile / tablet screen on launch
  const [activeView, setActiveView] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 'hub';
    }
    return 'dashboard';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Shared Data States with instant initial values
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [professionals, setProfessionals] = useState<User[]>(INITIAL_USERS);
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [packages, setPackages] = useState<SessionPackage[]>(INITIAL_PACKAGES);
  const [isLoading, setIsLoading] = useState(false);

  // Selected Entities
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<Session | null>(null);
  const [selectedSessionForWhatsApp, setSelectedSessionForWhatsApp] = useState<Session | null>(null);
  const [selectedPackageDetail, setSelectedPackageDetail] = useState<SessionPackage | null>(null);

  // Modal Visibility States
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);

  const [isAnamnesisModalOpen, setIsAnamnesisModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageToEdit, setPackageToEdit] = useState<SessionPackage | null>(null);
  const [isSingleSessionModalOpen, setIsSingleSessionModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isSendAnamnesisModalOpen, setIsSendAnamnesisModalOpen] = useState(false);
  const [anamnesisModalPatient, setAnamnesisModalPatient] = useState<Patient | null>(null);
  const [newSubmissionToast, setNewSubmissionToast] = useState<{ patientName: string; patientId?: string } | null>(null);

  // Auto-clear toast
  useEffect(() => {
    if (newSubmissionToast) {
      const timer = setTimeout(() => setNewSubmissionToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [newSubmissionToast]);

  // Load tenant data & filter according to user role and tenant
  const loadData = async () => {
    if (!tenant) return;
    try {
      const [pats, profs, sess, pkgs] = await Promise.all([
        api.getPatients(tenant.id, user),
        api.getProfessionals(tenant.id),
        api.getSessions(tenant.id),
        api.getPackages(tenant.id),
      ]);

      // Tenant and user-level isolation filter with admin safety and general patients support
      const isAdmin = !user || user.role === 'ADMIN' || (user as any).isSuperUser;
      let filteredPatients = pats.filter(p => !tenant || p.tenantId === tenant.id || p.tenantId === 'tenant-demo-1' || isAdmin);
      if (user && user.role === 'PROFESSIONAL' && user.accessMode === 'INDIVIDUAL' && !isAdmin) {
        filteredPatients = filteredPatients.filter(
          p => p.assignedProfessionalId === user.id || !p.assignedProfessionalId || p.assignedProfessionalName === 'Geral'
        );
      }

      let filteredSessions = sess.filter(s => !tenant || s.tenantId === tenant.id || s.tenantId === 'tenant-demo-1' || isAdmin || pats.some(p => p.id === s.patientId));
      if (user && user.role === 'PROFESSIONAL' && user.accessMode === 'INDIVIDUAL' && !isAdmin) {
        filteredSessions = filteredSessions.filter(s => s.professionalId === user.id);
      }

      let filteredPackages = pkgs.filter(pkg => !tenant || pkg.tenantId === tenant.id || pkg.tenantId === 'tenant-demo-1' || isAdmin || pats.some(p => p.id === pkg.patientId));

      setPatients(filteredPatients);
      setProfessionals(profs.filter(pr => !tenant || pr.tenantId === tenant.id || profs.length === 1));
      setSessions(filteredSessions);
      setPackages(filteredPackages);

      // If viewing a selected patient, update their reference
      if (selectedPatient) {
        const updated = filteredPatients.find(p => p.id === selectedPatient.id);
        setSelectedPatient(updated || null);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do tenant, mantendo dados locais:', err);
    }
  };

  // Real-time Centralized WebSockets/SSE sync callback memoized
  const handleRealtimeSync = useCallback(() => {
    loadData();
    refreshTenantData();
  }, [tenant?.id, user?.id]);

  const { status: realtimeStatus, lastSyncTime } = useRealtimeSync({
    tenantId: tenant?.id,
    onSync: handleRealtimeSync,
  });

  useEffect(() => {
    if (tenant?.id && user?.id) {
      loadData();
      refreshTenantData();

      // Listen for instant local updates across tabs / storage events
      const handleStorageChange = (e: StorageEvent) => {
        if (
          e.key === 'fisiopro_last_signature_sync' ||
          e.key === 'fisiopro_sessions' ||
          e.key === 'fisiopro_packages' ||
          e.key === 'fisiopro_patients' ||
          e.key?.startsWith('clinica_')
        ) {
          loadData();
          refreshTenantData();
        }
      };

      const handleCustomSync = () => {
        loadData();
        refreshTenantData();
      };

      const handleAnamnesisSubmitted = (e: any) => {
        loadData();
        refreshTenantData();
        const pName = e.detail?.patient?.name || 'Um paciente';
        const pId = e.detail?.patient?.id;
        setNewSubmissionToast({ patientName: pName, patientId: pId });
      };

      const handlePatientDeleted = (e: any) => {
        const deletedId = e.detail?.id;
        if (deletedId) {
          setPatients(prev => prev.filter(p => p.id !== deletedId));
          setSelectedPatient(curr => (curr?.id === deletedId ? null : curr));
        }
        loadData();
        refreshTenantData();
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('session-signed', handleCustomSync);
      window.addEventListener('anamnesis-submitted', handleAnamnesisSubmitted);
      window.addEventListener('patient-deleted', handlePatientDeleted);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('session-signed', handleCustomSync);
        window.removeEventListener('anamnesis-submitted', handleAnamnesisSubmitted);
        window.removeEventListener('patient-deleted', handlePatientDeleted);
      };
    }
  }, [tenant?.id, user?.id]);

  // Handle Public Links (Without requiring authentication - patient has access ONLY to the public form)
  if (tokens.anamnesisToken) {
    return <PublicAnamnesisPage token={tokens.anamnesisToken} onBackToApp={clearPublicUrl} />;
  }

  if (tokens.packageToken) {
    return <PublicPackageValidationPage token={tokens.packageToken} onBackToApp={clearPublicUrl} />;
  }

  if (tokens.sessionToken) {
    return <PublicValidationPage token={tokens.sessionToken} onBackToApp={clearPublicUrl} />;
  }

  // If user is not authenticated or clinic not chosen, display Login Screen
  if (!user || !tenant) {
    return <LoginView />;
  }

  const handleDeletePatient = async (patientId: string) => {
    if (!tenant) return;
    // Optimistic UI state update
    setPatients(prev => prev.filter(p => p.id !== patientId));
    if (selectedPatient?.id === patientId) {
      setSelectedPatient(null);
    }
    try {
      await api.deletePatient(patientId, tenant.id);
      await loadData();
      refreshTenantData();
    } catch (err) {
      console.error('Erro ao excluir paciente:', err);
      await loadData();
    }
  };

  const handleDeletePackage = async (pkg: SessionPackage) => {
    if (!tenant) return;
    setPackages(prev => prev.filter(p => p.id !== pkg.id));
    setSessions(prev => prev.filter(s => s.packageId !== pkg.id));
    if (selectedPackageDetail?.id === pkg.id) {
      setSelectedPackageDetail(null);
    }
    try {
      await api.deletePackage(tenant.id, pkg.id);
      await loadData();
    } catch (err) {
      console.error('Erro ao excluir pacote:', err);
      await loadData();
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* Dynamic Brand Sidebar */}
      <Sidebar
        activeView={activeView}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onSelectView={view => {
          setActiveView(view);
          if (view !== 'patients') {
            setSelectedPatient(null);
          }
          setIsMobileMenuOpen(false);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header with Clinic Name, Search, & User Profile */}
        <Header
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          onNavigateToHub={() => setActiveView(activeView === 'hub' ? 'dashboard' : 'hub')}
          onOpenNewPatient={() => {
            setPatientToEdit(null);
            setIsPatientModalOpen(true);
          }}
          onSelectPatient={patient => {
            setSelectedPatient(patient);
            setActiveView('patients');
          }}
          patientsList={patients}
          realtimeStatus={realtimeStatus}
          lastSyncTime={lastSyncTime}
          onManualRefresh={loadData}
        />

        {/* Scrollable Viewport */}
        <main className={`flex-1 overflow-y-auto ${activeView === 'hub' ? 'p-2 sm:p-3 md:p-4' : 'p-3 sm:p-4 md:p-5 lg:p-6'} space-y-4 pb-20 lg:pb-6`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Back to 3D Hub Quick Bar on Mobile & Tablet */}
              {activeView !== 'hub' && (
                <div className="lg:hidden flex items-center justify-between bg-slate-900/90 dark:bg-slate-900 border border-slate-700/80 rounded-xl p-2 shadow-md mb-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('hub');
                      setSelectedPatient(null);
                    }}
                    className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-600/30 to-blue-600/30 border border-teal-500/50 text-teal-300 hover:text-white font-bold transition shadow-sm cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar ao Menu Tátil (Hub)</span>
                  </button>
                  <div className="flex items-center space-x-1.5 text-slate-400 font-semibold uppercase text-[10px]">
                    <LayoutGrid className="w-3.5 h-3.5 text-teal-400" />
                    <span>Painel Tátil</span>
                  </div>
                </div>
              )}

              {/* 3D Touch Hub for Tablet & Mobile (and desktop quick launcher) */}
              {activeView === 'hub' && (
                <MobileTabletHub
                  tenant={tenant}
                  user={user}
                  activeView={activeView}
                  onNavigate={view => {
                    setActiveView(view);
                    if (view !== 'patients') setSelectedPatient(null);
                  }}
                  onOpenPatientModal={() => {
                    setPatientToEdit(null);
                    setIsPatientModalOpen(true);
                  }}
                  onOpenAnamnesisModal={() => {
                    setIsAnamnesisModalOpen(true);
                  }}
                  onSwitchToDesktop={() => {
                    setActiveView('dashboard');
                  }}
                />
              )}

              {/* Dashboard View */}
              {activeView === 'dashboard' && (
                <Dashboard
                  patients={patients}
                  sessions={sessions}
                  packages={packages}
                  onNavigateTab={tab => {
                    setActiveView(tab);
                    if (tab !== 'patients') setSelectedPatient(null);
                  }}
                  onSelectPatient={patient => {
                    setSelectedPatient(patient);
                    setActiveView('patients');
                  }}
                  onSendWhatsAppBirthday={patient => {
                    setSelectedPatient(patient);
                    setIsWhatsAppModalOpen(true);
                  }}
                  onOpenNewPatient={() => {
                    setPatientToEdit(null);
                    setIsPatientModalOpen(true);
                  }}
                  onOpenAnamnesis={patient => {
                    setSelectedPatient(patient);
                    setIsAnamnesisModalOpen(true);
                  }}
                  onOpenPackageModal={patient => {
                    setSelectedPatient(patient);
                    setIsPackageModalOpen(true);
                  }}
                  onOpenSingleSessionModal={patient => {
                    setSelectedPatient(patient);
                    setIsSingleSessionModalOpen(true);
                  }}
                  onAttendSession={session => {
                    setSelectedSessionForAttendance(session);
                    setIsAttendanceModalOpen(true);
                  }}
                  onSendWhatsApp={session => {
                    setSelectedSessionForWhatsApp(session);
                    setIsWhatsAppModalOpen(true);
                  }}
                />
              )}

              {/* Patients View & Detail Profiles */}
              {activeView === 'patients' && (
                <>
                  {selectedPatient ? (
                    <PatientProfile
                      patient={selectedPatient}
                      onBack={() => setSelectedPatient(null)}
                      onOpenAnamnesis={() => setIsAnamnesisModalOpen(true)}
                      onOpenPackageModal={() => setIsPackageModalOpen(true)}
                      onOpenSingleSessionModal={() => setIsSingleSessionModalOpen(true)}
                      onOpenSendAnamnesisLink={pat => {
                        setAnamnesisModalPatient(pat || selectedPatient);
                        setIsSendAnamnesisModalOpen(true);
                      }}
                      onAttendSession={session => {
                        setSelectedSessionForAttendance(session);
                        setIsAttendanceModalOpen(true);
                      }}
                      onSendWhatsApp={session => {
                        setSelectedSessionForWhatsApp(session);
                        setIsWhatsAppModalOpen(true);
                      }}
                      onViewPackageDetail={pkg => setSelectedPackageDetail(pkg)}
                      onEditPatient={pat => {
                        setPatientToEdit(pat);
                        setIsPatientModalOpen(true);
                      }}
                      onRefreshPatient={async () => {
                        await loadData();
                      }}
                      onDeletePatient={handleDeletePatient}
                      onEditPackage={pkg => {
                        setPackageToEdit(pkg);
                        setIsPackageModalOpen(true);
                      }}
                      onDeletePackage={handleDeletePackage}
                    />
                  ) : (
                    <PatientList
                      patients={patients}
                      professionals={professionals}
                      onSelectPatient={patient => setSelectedPatient(patient)}
                      onOpenSendAnamnesisLink={pat => {
                        setAnamnesisModalPatient(pat || null);
                        setIsSendAnamnesisModalOpen(true);
                      }}
                      onOpenCreateModal={() => {
                        setPatientToEdit(null);
                        setIsPatientModalOpen(true);
                      }}
                      onOpenEditModal={patient => {
                        setPatientToEdit(patient);
                        setIsPatientModalOpen(true);
                      }}
                      onDeletePatient={handleDeletePatient}
                    />
                  )}
                </>
              )}

              {/* Anamnesis Quick Tab */}
              {activeView === 'anamnesis' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Fichas de Anamnese</h2>
                    <p className="text-sm text-slate-500 mb-6">
                      Selecione um paciente na lista abaixo para preencher ou visualizar a ficha de avaliação completa.
                    </p>
                    <PatientList
                      patients={patients}
                      professionals={professionals}
                      onSelectPatient={patient => {
                        setSelectedPatient(patient);
                        setIsAnamnesisModalOpen(true);
                      }}
                      onOpenCreateModal={() => {
                        setPatientToEdit(null);
                        setIsPatientModalOpen(true);
                      }}
                      onOpenEditModal={patient => {
                        setPatientToEdit(patient);
                        setIsPatientModalOpen(true);
                      }}
                      onDeletePatient={handleDeletePatient}
                    />
                  </div>
                </div>
              )}

              {/* Packages Tab */}
              {activeView === 'packages' && (
                <PackagesTrackerView
                  packages={packages}
                  sessions={sessions}
                  patients={patients}
                  professionals={professionals}
                  onRefreshData={loadData}
                  onOpenCreatePackage={() => {
                    setSelectedPatient(null);
                    setPackageToEdit(null);
                    setIsPackageModalOpen(true);
                  }}
                  onOpenAttendanceModal={session => {
                    setSelectedSessionForAttendance(session);
                    setIsAttendanceModalOpen(true);
                  }}
                  onOpenWhatsAppModal={session => {
                    setSelectedSessionForWhatsApp(session);
                    setIsWhatsAppModalOpen(true);
                  }}
                  onOpenPackageDetail={pkg => {
                    setSelectedPackageDetail(pkg);
                  }}
                  onOpenEditPackage={pkg => {
                    setPackageToEdit(pkg);
                    setIsPackageModalOpen(true);
                  }}
                  onDeletePackage={async pkg => {
                    if (!tenant) return;
                    await api.deletePackage(tenant.id, pkg.id);
                    if (selectedPackageDetail?.id === pkg.id) {
                      setSelectedPackageDetail(null);
                    }
                    await loadData();
                  }}
                />
              )}

              {/* Sessions Tab */}
              {activeView === 'sessions' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Histórico e Agenda de Sessões
                    </h2>
                    <p className="text-sm text-slate-500 mb-4">
                      Selecione um paciente para registrar a evolução de atendimento, assinar digitalmente ou enviar lembretes.
                    </p>
                    <PatientList
                      patients={patients}
                      professionals={professionals}
                      onSelectPatient={patient => {
                        setSelectedPatient(patient);
                        setActiveView('patients');
                      }}
                      onOpenCreateModal={() => {
                        setPatientToEdit(null);
                        setIsPatientModalOpen(true);
                      }}
                      onOpenEditModal={patient => {
                        setPatientToEdit(patient);
                        setIsPatientModalOpen(true);
                      }}
                      onDeletePatient={() => {}}
                    />
                  </div>
                </div>
              )}

              {/* Birthdays Tab */}
              {activeView === 'birthdays' && (
                <BirthdaysView
                  patients={patients}
                  onSelectPatient={patient => {
                    setSelectedPatient(patient);
                    setActiveView('patients');
                  }}
                  onSendWhatsApp={patient => {
                    setSelectedPatient(patient);
                    setIsWhatsAppModalOpen(true);
                  }}
                />
              )}

              {/* Professionals & Access Control */}
              {activeView === 'professionals' && (
                <ProfessionalsView onRefreshList={loadData} />
              )}

              {/* Reports */}
              {activeView === 'reports' && (
                <ReportsView
                  patients={patients}
                  sessions={sessions}
                  packages={packages}
                  currentTenant={tenant}
                  onRefreshData={loadData}
                />
              )}

              {/* WhatsApp Automation */}
              {activeView === 'whatsapp' && (
                <WhatsAppModal
                  isOpen={true}
                  onClose={() => setActiveView('dashboard')}
                  patient={selectedPatient || patients[0]}
                  session={selectedSessionForWhatsApp || sessions[0]}
                />
              )}

              {/* Audit Logs */}
              {activeView === 'audit' && <AuditLogView />}

              {/* Database Backup & Security */}
              {activeView === 'backup' && <BackupManagerView onRefreshAllData={loadData} />}

              {/* Settings / White-label */}
              {activeView === 'settings' && <SettingsView onUpdate={loadData} onNavigateToBackup={() => setActiveView('backup')} />}
            </>
          )}
        </main>

        {/* Mobile & Tablet Bottom Navigation Bar */}
        <nav
          aria-label="Navegação móvel"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around text-[10px] font-bold shadow-2xl"
        >
          <button
            type="button"
            onClick={() => {
              setActiveView('hub');
              setSelectedPatient(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition min-w-[50px] ${
              activeView === 'hub'
                ? 'text-teal-400 bg-teal-500/20 border border-teal-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4 mb-0.5" />
            <span>Hub Tátil</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('dashboard');
              setSelectedPatient(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition min-w-[50px] ${
              activeView === 'dashboard'
                ? 'text-teal-400 bg-teal-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('patients');
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition min-w-[50px] ${
              activeView === 'patients'
                ? 'text-teal-400 bg-teal-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span>Pacientes</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('sessions');
              setSelectedPatient(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition min-w-[50px] ${
              activeView === 'sessions'
                ? 'text-teal-400 bg-teal-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarCheck2 className="w-4 h-4 mb-0.5" />
            <span>Sessões</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('packages');
              setSelectedPatient(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition min-w-[50px] ${
              activeView === 'packages'
                ? 'text-teal-400 bg-teal-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4 mb-0.5" />
            <span>Pacotes</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-400 hover:text-teal-400 transition min-w-[50px]"
          >
            <MenuIcon className="w-4 h-4 mb-0.5" />
            <span>Menu</span>
          </button>
        </nav>
      </div>

      {/* MODALS */}
      {/* Patient Create / Edit Modal */}
      <PatientFormModal
        isOpen={isPatientModalOpen}
        onClose={() => {
          setIsPatientModalOpen(false);
          setPatientToEdit(null);
        }}
        professionals={professionals}
        onSave={async (patientData) => {
          const tenantId = tenant?.id || 'tenant-demo-1';
          let savedPatient: Patient;
          if (patientToEdit) {
            savedPatient = await api.updatePatient(patientToEdit.id, tenantId, patientData);
            setPatients(prev => prev.map(p => p.id === savedPatient.id ? savedPatient : p));
          } else {
            savedPatient = await api.createPatient(tenantId, patientData);
            setPatients(prev => {
              const exists = prev.some(p => p.id === savedPatient.id);
              return exists ? prev.map(p => p.id === savedPatient.id ? savedPatient : p) : [savedPatient, ...prev];
            });
          }
          if (selectedPatient && selectedPatient.id === savedPatient.id) {
            setSelectedPatient(savedPatient);
          }
          await loadData();
          setIsPatientModalOpen(false);
          setPatientToEdit(null);
        }}
        patientToEdit={patientToEdit}
      />

      {/* Anamnesis Modal */}
      {selectedPatient && (
        <AnamnesisModal
          isOpen={isAnamnesisModalOpen}
          onClose={() => setIsAnamnesisModalOpen(false)}
          patient={selectedPatient}
          onSaveAnamnesis={async (anamnesisData) => {
            if (!tenant) return;
            await api.saveAnamnesis(selectedPatient.id, tenant.id, anamnesisData);
            await loadData();
            setIsAnamnesisModalOpen(false);
          }}
        />
      )}

      {/* Create or Edit Package Modal */}
      <PackageModal
        isOpen={isPackageModalOpen}
        onClose={() => {
          setIsPackageModalOpen(false);
          setPackageToEdit(null);
          setSelectedPatient(null);
        }}
        patients={patients}
        professionals={professionals}
        preselectedPatientId={packageToEdit ? packageToEdit.patientId : selectedPatient?.id}
        packageToEdit={packageToEdit}
        onDeletePackage={async pkg => {
          if (!tenant) return;
          await api.deletePackage(tenant.id, pkg.id);
          if (selectedPackageDetail?.id === pkg.id) {
            setSelectedPackageDetail(null);
          }
          await loadData();
        }}
        onSavePackage={async (pkgData) => {
          if (!tenant) return;
          if (packageToEdit) {
            await api.updatePackage(tenant.id, packageToEdit.id, pkgData);
          } else {
            await api.createPackage(tenant.id, pkgData);
          }
          await loadData();
          setIsPackageModalOpen(false);
          setPackageToEdit(null);
          setSelectedPatient(null);
        }}
      />

      {/* Create Single Session Modal */}
      <SingleSessionModal
        isOpen={isSingleSessionModalOpen}
        onClose={() => {
          setIsSingleSessionModalOpen(false);
          setSelectedPatient(null);
        }}
        patients={patients}
        professionals={professionals}
        preselectedPatientId={selectedPatient?.id}
        onSessionCreated={async () => {
          await loadData();
          setIsSingleSessionModalOpen(false);
          setSelectedPatient(null);
        }}
      />

      {/* Attend Session Modal */}
      {selectedSessionForAttendance && (
        <AttendanceModal
          isOpen={isAttendanceModalOpen}
          onClose={() => {
            setIsAttendanceModalOpen(false);
            setSelectedSessionForAttendance(null);
          }}
          session={selectedSessionForAttendance}
          onSave={async () => {
            await loadData();
            setIsAttendanceModalOpen(false);
            setSelectedSessionForAttendance(null);
          }}
        />
      )}

      {/* WhatsApp Message Modal */}
      {isWhatsAppModalOpen && (
        <WhatsAppModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => {
            setIsWhatsAppModalOpen(false);
            setSelectedSessionForWhatsApp(null);
          }}
          patient={selectedPatient || patients[0]}
          session={selectedSessionForWhatsApp || undefined}
        />
      )}

      {/* Package Detail Modal */}
      {selectedPackageDetail && (
        <PackageDetailModal
          isOpen={!!selectedPackageDetail}
          onClose={() => setSelectedPackageDetail(null)}
          pkg={selectedPackageDetail}
          sessions={sessions.filter(s => s.packageId === selectedPackageDetail.id)}
          onAttendSession={session => {
            setSelectedPackageDetail(null);
            setSelectedSessionForAttendance(session);
            setIsAttendanceModalOpen(true);
          }}
          onSendWhatsApp={session => {
            setSelectedPackageDetail(null);
            setSelectedSessionForWhatsApp(session);
            setIsWhatsAppModalOpen(true);
          }}
          onDeletePackage={async pkg => {
            if (!tenant) return;
            await api.deletePackage(tenant.id, pkg.id);
            setSelectedPackageDetail(null);
            await loadData();
          }}
          onOpenEditModal={pkg => {
            setSelectedPackageDetail(null);
            setPackageToEdit(pkg);
            setIsPackageModalOpen(true);
          }}
          onRefresh={loadData}
        />
      )}

      {/* Send WhatsApp Anamnesis / Registration Link Modal */}
      {isSendAnamnesisModalOpen && (
        <SendAnamnesisLinkModal
          isOpen={isSendAnamnesisModalOpen}
          onClose={() => {
            setIsSendAnamnesisModalOpen(false);
            setAnamnesisModalPatient(null);
          }}
          patient={anamnesisModalPatient || undefined}
          patients={patients}
          professionals={professionals}
        />
      )}

      {/* Real-time Toast Notification when Patient Submits Anamnesis */}
      {newSubmissionToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-emerald-700 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-start gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="w-10 h-10 rounded-xl bg-emerald-800/80 flex items-center justify-center shrink-0 border border-emerald-400/30">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Nova Ficha Recebida!
            </p>
            <p className="text-sm font-semibold mt-0.5">
              <strong>{newSubmissionToast.patientName}</strong> acabou de preencher e assinar a ficha de cadastro e anamnese!
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (newSubmissionToast.patientId) {
                    const pat = patients.find(p => p.id === newSubmissionToast.patientId);
                    if (pat) {
                      setSelectedPatient(pat);
                      setActiveView('patients');
                    }
                  }
                  setNewSubmissionToast(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-white text-emerald-900 text-xs font-bold hover:bg-emerald-50 transition shadow-xs"
              >
                Visualizar Prontuário
              </button>
              <button
                type="button"
                onClick={() => setNewSubmissionToast(null)}
                className="text-xs text-emerald-200 hover:text-white underline font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNewSubmissionToast(null)}
            className="text-emerald-200 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
