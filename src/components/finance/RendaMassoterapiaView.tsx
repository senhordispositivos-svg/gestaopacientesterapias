import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Calendar,
  Search,
  RefreshCw,
  ArrowLeftRight,
  Database,
  CheckCircle2,
  Clock,
  Layers,
  Download,
  Info,
  Zap,
} from 'lucide-react';
import { RendaMassoterapiaEntry } from '../../types';
import { api } from '../../services/api';
import { FinancialIntegrationTestModal } from './FinancialIntegrationTestModal';
import { getLocalDateString, getLocalMonthString } from '../../utils/crypto';

interface RendaMassoterapiaViewProps {
  onRefreshData?: () => void;
}

export const RendaMassoterapiaView: React.FC<RendaMassoterapiaViewProps> = ({
  onRefreshData,
}) => {
  const [allEntries, setAllEntries] = useState<RendaMassoterapiaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RECEBIDO' | 'CANCELADO'>('ALL');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [quickTestStatus, setQuickTestStatus] = useState<string | null>(null);

  const fetchRendaEntries = async () => {
    setLoading(true);
    try {
      // Carrega todos os lançamentos compilados (atendimentos avulsos, pacotes e caixa)
      const data = await api.getRendaMassoterapia();
      setAllEntries(data.entries || []);
    } catch (err) {
      console.error('Erro ao carregar lançamentos de renda massoterapia:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncRendaMassoterapiaAll();
      setQuickTestStatus(`Sincronização concluída! ${res.count} lançamentos consolidados.`);
      await fetchRendaEntries();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setQuickTestStatus(`Falha na sincronização: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setQuickTestStatus(null), 5000);
    }
  };

  useEffect(() => {
    // Ao montar a tela, executa uma sincronização preventiva e busca os dados
    (async () => {
      try {
        await api.syncRendaMassoterapiaAll();
      } catch (_) {}
      fetchRendaEntries();
    })();
  }, []);

  // Métricas financeiras calculadas com base em fuso local
  const todayStr = getLocalDateString();
  const currentMonthStr = getLocalMonthString();

  const totalHoje = useMemo(() => {
    return allEntries
      .filter(e => e.dataLancamento === todayStr && e.status === 'RECEBIDO')
      .reduce((sum, e) => sum + (Number(e.valorRecebido) || 0), 0);
  }, [allEntries, todayStr]);

  const totalSemana = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const mondayStr = getLocalDateString(monday);
    return allEntries
      .filter(e => e.dataLancamento >= mondayStr && e.dataLancamento <= todayStr && e.status === 'RECEBIDO')
      .reduce((sum, e) => sum + (Number(e.valorRecebido) || 0), 0);
  }, [allEntries, todayStr]);

  const totalMes = useMemo(() => {
    return allEntries
      .filter(e => e.mesReferencia === currentMonthStr && e.status === 'RECEBIDO')
      .reduce((sum, e) => sum + (Number(e.valorRecebido) || 0), 0);
  }, [allEntries, currentMonthStr]);

  const totalGeral = useMemo(() => {
    return allEntries
      .filter(e => e.status === 'RECEBIDO')
      .reduce((sum, e) => sum + (Number(e.valorRecebido) || 0), 0);
  }, [allEntries]);

  // Filtros aplicados sobre allEntries para a listagem da tabela
  const filteredEntries = useMemo(() => {
    let list = allEntries;

    // Filtro de status
    if (statusFilter !== 'ALL') {
      list = list.filter(e => e.status === statusFilter);
    }

    // Filtro de período
    if (selectedPeriod === 'today') {
      list = list.filter(e => e.dataLancamento === todayStr);
    } else if (selectedPeriod === 'week') {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const mondayStr = getLocalDateString(monday);
      list = list.filter(e => e.dataLancamento >= mondayStr && e.dataLancamento <= todayStr);
    } else if (selectedPeriod === 'month') {
      list = list.filter(e => e.mesReferencia === currentMonthStr);
    }

    // Filtro de busca textual
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(e =>
        (e.pacienteNome || '').toLowerCase().includes(q) ||
        (e.observacao || '').toLowerCase().includes(q) ||
        (e.usuarioResponsavel || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [allEntries, selectedPeriod, searchQuery, statusFilter, todayStr, currentMonthStr]);

  const totalPeriodoFiltrado = useMemo(() => {
    return filteredEntries
      .filter(e => e.status === 'RECEBIDO')
      .reduce((sum, e) => sum + (Number(e.valorRecebido) || 0), 0);
  }, [filteredEntries]);

  const handleQuickConnectionCheck = async () => {
    setQuickTestStatus('Testando conexão com banco...');
    try {
      const res = await api.testFinancialConnection();
      if (res.success) {
        setQuickTestStatus(`Conexão OK! ${res.recordsCount} lançamentos na tabela renda_massoterapia.`);
      } else {
        setQuickTestStatus(`Falha: ${res.message}`);
      }
    } catch (e: any) {
      setQuickTestStatus(`Erro: ${e.message}`);
    }
    setTimeout(() => setQuickTestStatus(null), 5000);
  };

  const handleExportCSV = () => {
    if (filteredEntries.length === 0) return;
    const headers = ['Data', 'Valor (R$)', 'Observacao', 'Paciente', 'Usuario Responsavel', 'Origem', 'Status'];
    const rows = filteredEntries.map(e => [
      e.dataLancamento,
      e.valorRecebido.toFixed(2),
      `"${(e.observacao || '').replace(/"/g, '""')}"`,
      `"${e.pacienteNome.replace(/"/g, '""')}"`,
      `"${(e.usuarioResponsavel || '').replace(/"/g, '""')}"`,
      e.origemTipo,
      e.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `renda_massoterapia_${getLocalDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Integração Financeira Automática
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Renda Massoterapia
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Lançamentos originados automaticamente a partir dos atendimentos avulsos e pacotes de massoterapia.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Sincronizar todos os atendimentos e pacotes com a renda"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar Todos
          </button>

          <button
            onClick={handleQuickConnectionCheck}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Testar Conexão
          </button>

          <button
            onClick={() => setIsTestModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            Testar Integração (7 Passos)
          </button>

          <button
            onClick={() => {
              fetchRendaEntries();
              if (onRefreshData) onRefreshData();
            }}
            disabled={loading}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors disabled:opacity-50"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick feedback banner */}
      {quickTestStatus && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{quickTestStatus}</span>
          </div>
          <button
            onClick={() => setQuickTestStatus(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* Financial Metric Cards (Automatic calculation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hoje */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-medium">Total Recebido Hoje</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              R$ {totalHoje.toFixed(2)}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Lançamentos de {formatDisplayDate(todayStr)}</p>
          </div>
        </div>

        {/* Esta Semana */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-medium">Esta Semana</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              R$ {totalSemana.toFixed(2)}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Segunda-feira até hoje</p>
          </div>
        </div>

        {/* Este Mês */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl shadow-2xs bg-linear-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/10">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-medium text-emerald-700 dark:text-emerald-300">Este Mês (Automático)</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              R$ {totalMes.toFixed(2)}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Mês de referência: {currentMonthStr}</p>
          </div>
        </div>

        {/* Total Geral / Registros */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-medium">Total de Registros</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {filteredEntries.length}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              R$ {totalPeriodoFiltrado.toFixed(2)} no filtro atual (Total geral: R$ {totalGeral.toFixed(2)})
            </p>
          </div>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="p-4 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Regras de Lançamento Automático da Renda de Massoterapia:</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-800 dark:text-blue-300">
            <li><strong>Lançamento Automático:</strong> Toda sessão avulsa ou pacote de massoterapia lançado no sistema aparece instantaneamente nesta tela e no caixa.</li>
            <li><strong>Sem Duplicidade em Pacotes:</strong> O valor total do pacote é contabilizado uma única vez (no cadastro ou 1ª sessão), sem duplicar nas sessões subsequentes.</li>
            <li><strong>Isolamento Fisioterapia vs Massoterapia:</strong> Sessões clínicas exclusivas de Fisioterapia não entram na renda de Massoterapia.</li>
            <li><strong>Sincronização em Tempo Real:</strong> Cancelamentos ou edições de valor atualizam automaticamente os totais e o extrato.</li>
          </ul>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
        {/* Periods */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'today', label: 'Hoje' },
              { id: 'week', label: 'Esta Semana' },
              { id: 'month', label: 'Este Mês' },
              { id: 'all', label: 'Todos' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedPeriod(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedPeriod === tab.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar paciente ou observação..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">Todos os status</option>
            <option value="RECEBIDO">Recebidos</option>
            <option value="CANCELADO">Cancelados</option>
          </select>

          <button
            onClick={handleExportCSV}
            disabled={filteredEntries.length === 0}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-40"
            title="Exportar CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-3.5">Data Lançamento</th>
                <th className="px-4 py-3.5">Paciente</th>
                <th className="px-4 py-3.5">Observação Financeira</th>
                <th className="px-4 py-3.5">Responsável</th>
                <th className="px-4 py-3.5">Origem</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Valor Recebido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                    Carregando lançamentos da renda de massoterapia...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Nenhum lançamento de massoterapia encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      {formatDisplayDate(entry.dataLancamento)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {entry.pacienteNome}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {entry.observacao || 'Atendimento Massoterapia'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {entry.usuarioResponsavel || 'Profissional'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {entry.origemTipo === 'pacote_massoterapia'
                          ? 'Pacote'
                          : entry.origemTipo === 'atendimento_massoterapia'
                          ? 'Atendimento'
                          : 'Avulso'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          entry.status === 'RECEBIDO'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 line-through'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <span
                        className={
                          entry.status === 'RECEBIDO'
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'text-slate-400 line-through'
                        }
                      >
                        R$ {Number(entry.valorRecebido).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration Diagnostic Modal */}
      <FinancialIntegrationTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onSuccess={() => fetchRendaEntries()}
      />
    </div>
  );
};
