import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  Zap,
  HardDrive,
  Lock,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DbConnectionTestResult } from '../../types';
import { DbConnectionTestModal } from './DbConnectionTestModal';

export const DbConnectionTestCard: React.FC = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<DbConnectionTestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isSuperUser = Boolean(
    user?.isSuperUser ||
    user?.email?.toLowerCase() === 'osaiasbrito@gmail.com' ||
    user?.email?.toLowerCase() === 'senhordispositivos@gmail.com' ||
    user?.role === 'SUPER_ADMIN'
  );

  const handleRunTest = async () => {
    if (!isSuperUser) return;
    setIsRunning(true);
    try {
      const res = await api.testDbConnection(user);
      setTestResult(res);
    } catch (err) {
      console.error('Erro ao testar conexão:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isSuperUser && !testResult) {
      handleRunTest();
    }
  }, [isSuperUser]);

  if (!isSuperUser) return null;

  return (
    <>
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 shadow-xs">
              <Database className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Teste de Conexão com o Banco de Dados
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Exclusivo Super Usuário
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Diagnóstico em tempo real de integridade da infraestrutura PostgreSQL, Supabase e snapshots em disco.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleRunTest}
              disabled={isRunning}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Verificando...' : 'Testar Conexão'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <span>Ver Diagnóstico Completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Status 1: Overall */}
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {testResult?.status === 'ONLINE' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : testResult?.status === 'DEGRADED' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="text-xs text-slate-300 font-medium">Status Geral:</span>
            </div>
            <span
              className={`text-xs font-bold ${
                testResult?.status === 'ONLINE'
                  ? 'text-emerald-400'
                  : testResult?.status === 'DEGRADED'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {testResult?.status === 'ONLINE'
                ? 'Conectado (Online)'
                : testResult?.status === 'DEGRADED'
                ? 'Contingência Local'
                : isRunning
                ? 'Verificando...'
                : 'Offline'}
            </span>
          </div>

          {/* Status 2: PostgreSQL Latency */}
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">PostgreSQL Pool:</span>
            </div>
            <span className="text-xs font-mono font-bold text-teal-300">
              {testResult?.details.postgresql.connected
                ? `${testResult.details.postgresql.latencyMs || testResult.responseTimeMs}ms`
                : testResult?.details.postgresql.configured
                ? 'Sem resposta'
                : 'Standby'}
            </span>
          </div>

          {/* Status 3: Tables & Records */}
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">Persistência Atômica:</span>
            </div>
            <span className="text-xs font-bold text-slate-200">
              {testResult?.details.localStorageStore.recordsCount.patients || 0} pacientes
            </span>
          </div>
        </div>
      </div>

      <DbConnectionTestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
