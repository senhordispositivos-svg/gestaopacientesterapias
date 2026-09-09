import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Plus,
  Package,
  User,
  Calendar,
  FileText,
  Loader2,
  ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { CashEntry } from '../../types';
import { FinancialIntegrationView } from './FinancialIntegrationView';

interface FinancialViewProps {
  initialTab?: 'cashflow' | 'integration';
  onNavigateToSettings?: () => void;
  onNavigateToIntegration?: () => void;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  initialTab = 'cashflow',
  onNavigateToSettings,
  onNavigateToIntegration,
}) => {
  const { tenant } = useAuth();
  const currentTenantId = tenant?.id || 'tenant-demo-1';

  const [activeTab, setActiveTab] = useState<'cashflow' | 'integration'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New manual entry modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newType, setNewType] = useState<'SINGLE_SESSION' | 'PACKAGE' | 'MANUAL_ADJUSTMENT'>('SINGLE_SESSION');
  const [newDesc, setNewDesc] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [newAmount, setNewAmount] = useState('180');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentTenantId) return;
    setIsLoading(true);
    try {
      const [entriesRes, summaryRes] = await Promise.all([
        api.getCashEntries(currentTenantId, {
          month: selectedMonth,
          type: selectedType,
          search: searchTerm,
        }),
        api.getMonthlyFinancialSummary(currentTenantId, selectedMonth),
      ]);

      setCashEntries(entriesRes.entries || []);
      setMonthlySummary(summaryRes);
    } catch (err) {
      console.error('Erro ao carregar dados do fluxo de caixa:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentTenantId, selectedMonth, selectedType, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor, informe um valor válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createCashEntry(currentTenantId, {
        type: newType,
        description: newDesc.trim() || (newType === 'PACKAGE' ? 'Venda de Novo Pacote' : 'Atendimento Massoterapia'),
        patientName: newPatientName.trim() || 'Paciente Geral',
        amount: parsedAmount,
        effectiveAmount: parsedAmount,
        date: newDate,
        month: newDate.slice(0, 7),
        category: 'MASSOTERAPIA',
        section: 'MASSOTERAPIA',
        notes: 'Lançamento manual registrado no fluxo de caixa.',
      });

      setIsModalOpen(false);
      setNewDesc('');
      setNewPatientName('');
      setNewAmount('180');
      await loadData();
    } catch (err: any) {
      alert(`Erro ao registrar lançamento: ${err.message || 'Falha desconhecida'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Financial Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-2xs flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('cashflow')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'cashflow'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Fluxo de Caixa (Entradas do Mês)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('integration')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'integration'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Integração Controle Financeiro</span>
          <span className="px-1.5 py-0.5 text-[10px] uppercase font-extrabold rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 ml-1">
            Novo
          </span>
        </button>
      </div>

      {activeTab === 'integration' ? (
        <FinancialIntegrationView onNavigateToCashFlow={() => setActiveTab('cashflow')} />
      ) : (
        <>
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Fluxo de Caixa (Gestão de Entradas do Mês)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle de receitas, atendimentos individuais, vendas de pacotes e saldo financeiro do mês.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigateToIntegration && (
            <button
              type="button"
              onClick={onNavigateToIntegration}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-2xs"
              title="Configurar conexão com o app Controle Financeiro"
            >
              <ArrowLeftRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Conectar com Controle Financeiro
            </button>
          )}

          <button
            type="button"
            onClick={() => loadData()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
            title="Atualizar dados do caixa"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            Atualizar
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </button>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-extrabold text-emerald-200">
              <TrendingUp className="w-4 h-4" />
              Resumo Consolidado do Mês
            </div>
            <div className="text-lg font-bold">
              Gestão Financeira &middot; Entradas em Caixa
            </div>
          </div>

          {/* Month picker inside the card */}
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
            <Calendar className="w-4 h-4 text-emerald-200" />
            <span className="text-xs text-emerald-100 font-medium">Mês:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Main Total Received Box */}
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-xs border border-white/10 space-y-1">
            <span className="text-xs font-medium text-emerald-100 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Total Recebido no Mês
            </span>
            <div className="text-2xl font-black tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                monthlySummary?.totalMonthReceived || 0
              )}
            </div>
            <p className="text-[10px] text-emerald-200">
              Receita líquida total em caixa
            </p>
          </div>

          {/* Single Sessions Count */}
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-xs border border-white/10 space-y-1">
            <span className="text-xs font-medium text-emerald-100 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Sessões Avulsas
            </span>
            <div className="text-xl font-bold">
              {monthlySummary?.singleSessionsCount || 0} lançamentos
            </div>
            <p className="text-[10px] text-emerald-200">
              Atendimentos com valor integral
            </p>
          </div>

          {/* New Packages Count */}
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-xs border border-white/10 space-y-1">
            <span className="text-xs font-medium text-emerald-100 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              Novos Pacotes
            </span>
            <div className="text-xl font-bold">
              {monthlySummary?.packagesCount || 0} contratados
            </div>
            <p className="text-[10px] text-emerald-200">
              Valor do pacote creditado integralmente
            </p>
          </div>

          {/* 2nd+ Sessions Zero Count */}
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-xs border border-white/10 space-y-1">
            <span className="text-xs font-medium text-emerald-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sessões de Pacote (2ª+)
            </span>
            <div className="text-xl font-bold">
              {monthlySummary?.packageSessionsZeroCount || 0} atendimentos
            </div>
            <p className="text-[10px] text-emerald-200">
              R$ 0,00 no caixa (já quitado no pacote)
            </p>
          </div>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Regra Financeira:</strong> Atendimentos avulsos e novos pacotes entram no caixa no momento da confirmação. As sessões subsequentes de um pacote já contratado registram <strong>R$ 0,00</strong> no caixa para controle de presença sem duplicar a cobrança.
        </span>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por paciente, descrição ou profissional..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="SINGLE_SESSION">Sessões Avulsas</option>
            <option value="PACKAGE">Novos Pacotes</option>
            <option value="PACKAGE_SESSION">Sessões de Pacote</option>
            <option value="MANUAL_ADJUSTMENT">Ajustes Manuais</option>
          </select>
        </div>
      </div>

      {/* Cash Entries Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Lançamentos de Caixa ({cashEntries.length})
          </h3>
          <span className="text-xs font-bold text-emerald-600">
            Total Efetivo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              cashEntries.reduce((acc, c) => acc + (Number(c.effectiveAmount) || 0), 0)
            )}
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs">Carregando fluxo de caixa...</span>
          </div>
        ) : cashEntries.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <DollarSign className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p>Nenhum lançamento de caixa encontrado para este mês ou filtro.</p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer"
            >
              Registrar o primeiro lançamento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Paciente / Descrição</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Valor Bruto</th>
                  <th className="py-3 px-4">Valor Caixa</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cashEntries.map(entry => {
                  const isZero = entry.effectiveAmount === 0;
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {entry.patientName}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {entry.description}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {entry.type === 'SINGLE_SESSION' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            Sessão Avulsa
                          </span>
                        )}
                        {entry.type === 'PACKAGE' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            Novo Pacote
                          </span>
                        )}
                        {entry.type === 'PACKAGE_SESSION' && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isZero
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            Pacote (Sessão {entry.sessionNumber || 'N/A'})
                          </span>
                        )}
                        {entry.type === 'MANUAL_ADJUSTMENT' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Ajuste Manual
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount || 0)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`font-bold ${isZero ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.effectiveAmount || 0)}
                        </span>
                        {isZero && (
                          <span className="block text-[9px] text-slate-400 font-normal">
                            (2ª+ sessão: R$ 0,00)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isZero ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                            <CheckCircle2 className="w-3 h-3 text-slate-400" />
                            Contabilizado no pacote
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Registrado no Caixa
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Manual Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Novo Lançamento no Caixa
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Tipo de Lançamento
                </label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                >
                  <option value="SINGLE_SESSION">Sessão Avulsa (R$ 180,00)</option>
                  <option value="PACKAGE">Venda de Novo Pacote</option>
                  <option value="MANUAL_ADJUSTMENT">Ajuste Manual / Outra Entrada</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Nome do Paciente / Cliente
                </label>
                <input
                  type="text"
                  value={newPatientName}
                  onChange={e => setNewPatientName(e.target.value)}
                  placeholder="Ex: Maria Silva"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Valor Recebido (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-emerald-600"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Data do Recebimento
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Descrição (Opcional)
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Ex: Atendimento Massoterapia Relaxante"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Registrar no Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
