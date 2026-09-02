import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Tenant } from '../types';
import { api } from '../services/api';
import { INITIAL_TENANTS, INITIAL_USERS } from '../services/mockSeed';

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  allTenants: Tenant[];
  theme: 'light' | 'dark';
  isLoading: boolean;
  login: (email: string, password?: string, tenantId?: string) => Promise<void>;
  register: (data: { name: string; email: string; password?: string; clinicName: string; phone?: string }) => Promise<void>;
  logout: () => void;
  switchTenant: (tenantId: string) => Promise<void>;
  createClinic: (clinicData: Partial<Tenant>) => Promise<Tenant>;
  updateTenantConfig: (updates: Partial<Tenant>) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<User | void>;
  toggleTheme: () => void;
  refreshTenantData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'clinica_session_auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Retrieve persisted session if user has previously logged in
  const [tenant, setTenant] = useState<Tenant | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.tenant || null;
      }
    } catch (e) {
      console.warn('Error reading saved session:', e);
    }
    return null;
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.user || null;
      }
    } catch (e) {
      console.warn('Error reading saved session:', e);
    }
    return null;
  });

  const [allTenants, setAllTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(false);

  // Refresh active tenant from server
  const refreshTenantData = async (targetId?: string) => {
    try {
      const fetchedTenants = await api.getTenants();
      if (fetchedTenants && fetchedTenants.length > 0) {
        setAllTenants(fetchedTenants);
        const activeId = targetId || tenant?.id || fetchedTenants[0].id;
        const updated = fetchedTenants.find(t => t.id === activeId) || fetchedTenants[0];
        if (updated) {
          setTenant(prev => {
            if (!prev || prev.logoUrl !== updated.logoUrl || prev.tradeName !== updated.tradeName || prev.customHeader !== updated.customHeader || prev.primaryColor !== updated.primaryColor) {
              return updated;
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.warn('Error refreshing tenant data:', err);
    }
  };

  // Load latest tenants list and synchronize active tenant with server data on mount
  useEffect(() => {
    refreshTenantData();

    // Listen for storage events (e.g. logo changed in another tab/window or background sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'clinica_tenants' || e.key === AUTH_STORAGE_KEY) {
        refreshTenantData();
      }
    };

    const handleFocus = () => {
      refreshTenantData();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshTenantData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // Periodic check every 8 seconds to ensure instant sync between smartphone and computer
    const interval = setInterval(() => {
      refreshTenantData();
    }, 8000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  // Update root dark class when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Inject White-Label CSS Variables dynamically for current Tenant
  useEffect(() => {
    if (tenant) {
      document.documentElement.style.setProperty('--primary-color', tenant.primaryColor || '#0d9488');
      document.documentElement.style.setProperty('--secondary-color', tenant.secondaryColor || '#0f766e');
    }
  }, [tenant]);

  // Persist session to localStorage on change
  useEffect(() => {
    try {
      if (user && tenant) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, tenant }));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Error saving session:', e);
    }
  }, [user, tenant]);

  const login = async (email: string, password?: string, tenantId?: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password || '', tenantId);
      setUser(res.user);
      setTenant(res.tenant);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password?: string; clinicName: string; phone?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.registerUser(data);
      setUser(res.user);
      setTenant(res.tenant);
      setAllTenants(prev => [...prev, res.tenant]);
    } finally {
      setIsLoading(false);
    }
  };

  const createClinic = async (clinicData: Partial<Tenant>): Promise<Tenant> => {
    setIsLoading(true);
    try {
      const newClinic = await api.createTenant(clinicData);
      setAllTenants(prev => [...prev, newClinic]);
      return newClinic;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setTenant(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const switchTenant = async (tenantId: string) => {
    setIsLoading(true);
    try {
      const targetTenant = await api.getTenantById(tenantId);
      setTenant(targetTenant);

      const usersList = await api.getUsers(tenantId);
      if (usersList.length > 0) {
        // Find an admin or first user
        const newUser = usersList.find(u => u.role === 'ADMIN') || usersList[0];
        setUser(newUser);
      }
    } catch (err) {
      console.error('Error switching tenant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTenantConfig = async (updates: Partial<Tenant>) => {
    if (!tenant) return;
    const updated = await api.updateTenant(tenant.id, updates);
    setTenant(updated);
    setAllTenants(prev => prev.map(t => (t.id === updated.id ? updated : t)));
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const updated = await api.updateUser(tenant?.id || user.tenantId, user.id, updates);
      setUser(prev => (prev ? { ...prev, ...updated, ...updates } : null));
      return updated;
    } catch (err) {
      console.warn('Erro ao atualizar perfil do usuário na API, aplicando localmente:', err);
      setUser(prev => (prev ? { ...prev, ...updates } : null));
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        allTenants,
        theme,
        isLoading,
        login,
        register,
        logout,
        switchTenant,
        createClinic,
        updateTenantConfig,
        updateUserProfile,
        toggleTheme,
        refreshTenantData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
