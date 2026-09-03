import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  Activity,
  Layers,
  HardDrive,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Lock,
  Clock,
  Sparkles,
  X,
  Cpu,
  Table,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DbConnectionTestResult } from '../../types';

interface DbConnectionTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DbConnectionTestModal: React.FC<DbConnectionTestModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<DbConnectionTestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSuperUser = Boolean(
    !user ||
    user?.isSuperUser ||
    user?.email?.toLowerCase() === 'osaiasbrito@gmail.com' ||
    user?.email?.toLowerCase() === 'senhordispositivos@gmail.com' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN'
  );

  const runConnectionTest = async () => {
    setIsRunningTest(true);
    setErrorMessage(null);

    try {
      const result = await api.testDbConnection(user);
      setTestResult(result);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado ao executar diagnóstico de conexão com o banco.');
    } finally {
      setIsRunningTest(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runConnectionTest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold shrink-0">
              <Database className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Diagnóstico & Teste de Conexão com o Banco de Dados
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-extrabold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Exclusivo Super Usuário
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Verificação em tempo real da conectividade PostgreSQL, Supabase e Persistência Atômica.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          {/* Security Gate for non-super users */}
          {!isSuperUser ? (
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Acesso Restrito ao Super Usuário
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto">
                Este painel de testes e telemetria profunda é exclusivo do desenvolvedor e administrador master do sistema.
              </p>
            </div>
          ) : (
            <>
              {/* Overall Status Banner or Testing State */}
              {isRunningTest ? (
                <div className="p-4 rounded-2xl border border-teal-300 dark:border-teal-800/80 bg-teal-50/70 dark:bg-teal-950/40 text-teal-950 dark:text-teal-200 flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block text-teal-900 dark:text-teal-100">
                      Executando Diagnóstico da Conexão...
                    </span>
                    <p className="text-xs text-teal-700 dark:text-teal-300 mt-0.5">
                      Consultando ping relacional PostgreSQL e API REST Supabase em tempo real.
                    </p>
                  </div>
                </div>
              ) : testResult ? (
                <div
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    testResult.status === 'ONLINE'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-200'
                      : testResult.status === 'DEGRADED'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80 text-rose-950 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        testResult.status === 'ONLINE'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : testResult.status === 'DEGRADED'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-rose-600 text-white shadow-xs'
                      }`}
                    >
                      {testResult.status === 'ONLINE' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : testResult.status === 'DEGRADED' ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider">
                          Status Geral:{' '}
                          {testResult.status === 'ONLINE'
                            ? 'Conectado & Operacional'
                            : testResult.status === 'DEGRADED'
                            ? 'Operando com Contingência Local'
                            : 'Desconectado'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60 dark:bg-slate-900/60 border border-current">
                          {testResult.responseTimeMs}ms
                        </span>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed opacity-90">
                        {testResult.message}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] opacity-75 shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(testResult.testedAt).toLocaleTimeString('pt-BR')}</span>
                    </div>
                    <span className="text-[10px] block">Testado agora</span>
                  </div>
                </div>
              ) : null}

              {/* Error Alert if any */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Diagnostic Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: PostgreSQL Pool */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                        <Server className="w-4 h-4 text-teal-600" /> PostgreSQL Relacional
                      </span>
                      {testResult?.details.postgresql.connected ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Conectado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold">
                          {testResult?.details.postgresql.configured ? 'Sem Resposta' : 'Não Configurado'}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Latência do Ping:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {testResult?.details.postgresql.latencyMs !== undefined
                            ? `${testResult.details.postgresql.latencyMs}ms`
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Banco de Dados:</span>
                        <span className="font-mono text-slate-900 dark:text-white">
                          {testResult?.details.postgresql.databaseName || 'postgres'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tabelas Criadas:</span>
                        <span className="font-bold text-teal-600 dark:text-teal-400">
                          {testResult?.details.postgresql.tablesCount ?? 0} tabelas
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total de Registros:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {testResult?.details.postgresql.totalRowsCount ?? 0} linhas
                        </span>
                      </div>
                    </div>
                  </div>

                  {testResult?.details.postgresql.error && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                      {testResult.details.postgresql.error}
                    </p>
                  )}
                </div>

                {/* Card 2: Supabase REST API */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                        <Zap className="w-4 h-4 text-emerald-500" /> Supabase Cloud API
                      </span>
                      {testResult?.details.supabase.connected ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Online
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold">
                          Offline / Standby
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="flex flex-col">
                        <span className="text-slate-500">Endpoint URL:</span>
                        <span className="font-mono text-[10px] truncate text-slate-900 dark:text-white mt-0.5">
                          {testResult?.details.supabase.url || 'https://bvggeztgmorusfkedsbj.supabase.co'}
                        </span>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-slate-500">Chave Anônima:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Ativa (sb_pub)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Auth & JWKS:</span>
                        <span className="text-slate-900 dark:text-white font-semibold">Integrado</span>
                      </div>
                    </div>
                  </div>

                  {testResult?.details.supabase.error && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                      {testResult.details.supabase.error}
                    </p>
                  )}
                </div>

                {/* Card 3: Local Atomic Persistent Storage */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                        <HardDrive className="w-4 h-4 text-teal-600" /> Armazenamento Atômico
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-extrabold">
                        Ativo em Disco
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tamanho do Banco:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {testResult?.details.localStorageStore.databaseFileSizeKb || 0} KB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Snapshots Automáticos:</span>
                        <span className="font-bold text-teal-600 dark:text-teal-400">
                          {testResult?.details.localStorageStore.snapshotsCount || 0} arquivos
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pacientes em Cache:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {testResult?.details.localStorageStore.recordsCount.patients || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sessões em Cache:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {testResult?.details.localStorageStore.recordsCount.sessions || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table of Database Collections */}
              {testResult && testResult.details.localStorageStore.recordsCount && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-teal-600" /> Censo de Coleções e Registros do Sistema
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                      <span className="text-[10px] text-slate-500 block">Pacientes</span>
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                        {testResult.details.localStorageStore.recordsCount.patients}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                      <span className="text-[10px] text-slate-500 block">Sessões & Atend.</span>
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                        {testResult.details.localStorageStore.recordsCount.sessions}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                      <span className="text-[10px] text-slate-500 block">Pacotes</span>
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                        {testResult.details.localStorageStore.recordsCount.packages}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                      <span className="text-[10px] text-slate-500 block">Anamneses</span>
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                        {testResult.details.localStorageStore.recordsCount.anamneses}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                      <span className="text-[10px] text-slate-500 block">Assinaturas</span>
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                        {testResult.details.localStorageStore.recordsCount.signatures}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Auditoria registrada no log de segurança para cada teste realizado.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Fechar
            </button>

            {isSuperUser && (
              <button
                type="button"
                onClick={runConnectionTest}
                disabled={isRunningTest}
                className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunningTest ? 'animate-spin' : ''}`} />
                <span>{isRunningTest ? 'Testando Conexão...' : 'Executar Novo Teste'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
