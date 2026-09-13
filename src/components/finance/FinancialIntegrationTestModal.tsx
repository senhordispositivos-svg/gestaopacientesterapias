import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  ArrowLeftRight,
  RefreshCw,
  Clock,
  Layers,
  ShieldCheck,
  UserCheck,
  FileCheck,
  DollarSign,
  Activity,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';
import { FinancialConnectionTestResult, FinancialIntegrationTestResult } from '../../types';

interface FinancialIntegrationTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FinancialIntegrationTestModal: React.FC<FinancialIntegrationTestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'connection' | 'integration'>('connection');
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [isTestingInt, setIsTestingInt] = useState(false);
  const [connectionResult, setConnectionResult] = useState<FinancialConnectionTestResult | null>(null);
  const [integrationResult, setIntegrationResult] = useState<FinancialIntegrationTestResult | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    try {
      const res = await api.testFinancialConnection();
      setConnectionResult(res);
      if (res.success && onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setConnectionResult({
        success: false,
        message: err.message || 'Falha ao testar conexão com o banco',
        database: 'PostgreSQL',
        table: 'renda_massoterapia',
        recordsCount: 0,
        currentMonthTotal: 0,
        responseTimeMs: 0,
        testedAt: new Date().toISOString(),
        error: err.message,
      });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleTestIntegration = async () => {
    setIsTestingInt(true);
    try {
      const res = await api.testFinancialIntegration();
      setIntegrationResult(res);
      if (res.success && onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setIntegrationResult({
        success: false,
        summary: err.message || 'Falha geral no teste de integração dos 7 passos',
        steps: [
          { step: 1, name: 'Banco PostgreSQL acessível', status: 'ERROR', details: err.message || 'Erro de comunicação' },
        ],
        checkedAt: new Date().toISOString(),
      });
    } finally {
      setIsTestingInt(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                Diagnóstico da Integração Financeira
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PostgreSQL Compartilhado • Tabela: <span className="font-mono text-emerald-600 dark:text-emerald-400">renda_massoterapia</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2 bg-slate-50/30 dark:bg-slate-800/30">
          <button
            onClick={() => setActiveTab('connection')}
            className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'connection'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            Testar Conexão
          </button>
          <button
            onClick={() => setActiveTab('integration')}
            className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'integration'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Testar Integração (7 Passos)
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'connection' ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200">
                      Verificação de Acesso ao Banco e Tabela Financeira
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Verifica se o PostgreSQL está acessível, a tabela <code className="text-emerald-600 dark:text-emerald-400 font-mono">renda_massoterapia</code> existe e as permissões de leitura/escrita estão operacionais.
                    </p>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={isTestingConn}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 shrink-0 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin' : ''}`} />
                    {isTestingConn ? 'Testando...' : 'Executar Teste de Conexão'}
                  </button>
                </div>
              </div>

              {connectionResult && (
                <div
                  className={`p-4 rounded-xl border ${
                    connectionResult.success
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {connectionResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-2 flex-1">
                      <div>
                        <span className="font-semibold text-sm">
                          {connectionResult.success ? 'Conexão Estabelecida com Sucesso' : 'Falha na Conexão'}
                        </span>
                        <p className="text-xs mt-0.5 opacity-90">{connectionResult.message}</p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-current/10 text-xs">
                        <div className="p-2 rounded bg-white/60 dark:bg-slate-900/50">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Banco</span>
                          <span className="font-semibold">{connectionResult.database}</span>
                        </div>
                        <div className="p-2 rounded bg-white/60 dark:bg-slate-900/50">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Tabela</span>
                          <span className="font-semibold font-mono">{connectionResult.table}</span>
                        </div>
                        <div className="p-2 rounded bg-white/60 dark:bg-slate-900/50">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Lançamentos</span>
                          <span className="font-semibold">{connectionResult.recordsCount}</span>
                        </div>
                        <div className="p-2 rounded bg-white/60 dark:bg-slate-900/50">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Mês Atual</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            R$ {connectionResult.currentMonthTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] opacity-75 pt-1">
                        <span>Tempo de resposta: {connectionResult.responseTimeMs} ms</span>
                        <span>Testado em: {new Date(connectionResult.testedAt).toLocaleTimeString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200">
                      Validação Completa do Fluxo (7 Passos Obrigatórios)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Verifica banco, tabela, usuário, 15 colunas obrigatórias, permissões de INSERT/SELECT e a regra de vínculo anti-duplicidade.
                    </p>
                  </div>
                  <button
                    onClick={handleTestIntegration}
                    disabled={isTestingInt}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 shrink-0 transition-all disabled:opacity-50"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isTestingInt ? 'animate-spin' : ''}`} />
                    {isTestingInt ? 'Executando...' : 'Executar Teste de Integração'}
                  </button>
                </div>
              </div>

              {integrationResult && (
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium ${
                      integrationResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200'
                        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    {integrationResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>{integrationResult.summary}</span>
                  </div>

                  <div className="space-y-2">
                    {integrationResult.steps.map(s => (
                      <div
                        key={s.step}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 text-xs"
                      >
                        <div className="mt-0.5 shrink-0">
                          {s.status === 'OK' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {s.status === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          {s.status === 'ERROR' && <XCircle className="w-4 h-4 text-rose-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              Passo {s.step}: {s.name}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                s.status === 'OK'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : s.status === 'WARNING'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {s.status}
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {s.details}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-400 text-right">
                    Verificado em: {new Date(integrationResult.checkedAt).toLocaleTimeString('pt-BR')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center text-xs text-slate-500">
          <span>Diferenciação automática: Atendimentos de fisioterapia não geram lançamentos em massoterapia.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
