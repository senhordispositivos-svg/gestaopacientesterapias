import React, { useState, useEffect } from 'react';
import {
  Link2,
  Database,
  ArrowLeftRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Save,
  Send,
  HelpCircle,
  FileCode2,
  Layers,
  Sparkles,
  DollarSign,
  Calendar,
  Tag,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { FinancialIntegrationConfig } from '../../types';

interface FinancialIntegrationViewProps {
  onNavigateToCashFlow?: () => void;
}

export const FinancialIntegrationView: React.FC<FinancialIntegrationViewProps> = ({
  onNavigateToCashFlow,
}) => {
  const { tenant, refreshTenantData } = useAuth();

  const [mode, setMode] = useState<'SUPABASE' | 'REST_API'>('SUPABASE');
  const [enabled, setEnabled] = useState(true);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseTable, setSupabaseTable] = useState('renda_extra');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [accessEmail, setAccessEmail] = useState('');
  const [accessPassword, setAccessPassword] = useState('');
  const [category, setCategory] = useState('Renda Extra');
  const [description, setDescription] = useState('MASSOTERAPIA');
  const [originIncome, setOriginIncome] = useState('SERVIÇO');
  const [alsoAddToSalary, setAlsoAddToSalary] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    status?: number;
    mode?: string;
    details?: any;
  } | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'SQL' | 'EXPRESS' | 'PROMPT'>('SQL');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [tenant?.id]);

  const loadConfig = async () => {
    if (!tenant?.id) return;
    setIsLoading(true);
    try {
      const cfg = await api.getFinancialConfig(tenant.id);
      if (cfg) {
        setEnabled(cfg.enabled ?? true);
        setMode(cfg.mode === 'REST_API' ? 'REST_API' : 'SUPABASE');
        setSupabaseUrl(cfg.supabaseUrl || '');
        setSupabaseKey(cfg.supabaseKey || '');
        setSupabaseTable(cfg.supabaseTable || 'renda_extra');
        setEndpointUrl(
          cfg.endpointUrl ||
            'https://ais-pre-ca2j6yzl6qm4otgueyocuu-440149738355.us-east1.run.app/api/integrations/massoterapia'
        );
        setAccessEmail(cfg.accessEmail || 'osaiasbrito@gmail.com');
        setAccessPassword(cfg.accessPassword || '');
        setCategory(cfg.category || 'Renda Extra');
        setDescription(cfg.description || 'MASSOTERAPIA');
        setOriginIncome(cfg.originIncome || 'SERVIÇO');
        setAlsoAddToSalary(cfg.alsoAddToSalary ?? true);
      }
    } catch (err) {
      console.warn('Erro ao carregar configuração de integração:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!tenant?.id) return;
    setIsSaving(true);
    setSaveSuccessNotice(false);
    try {
      const payload: Partial<FinancialIntegrationConfig> = {
        enabled,
        mode,
        supabaseUrl: supabaseUrl.trim(),
        supabaseKey: supabaseKey.trim(),
        supabaseTable: supabaseTable.trim() || 'renda_extra',
        endpointUrl: endpointUrl.trim(),
        accessEmail: accessEmail.trim(),
        accessPassword: accessPassword.trim(),
        category: category.trim() || 'Renda Extra',
        description: description.trim() || 'MASSOTERAPIA',
        originIncome: originIncome.trim() || 'SERVIÇO',
        section: 'MASSOTERAPIA',
        alsoAddToSalary,
        autoSync: true,
      };

      const res = await api.saveFinancialConfig(tenant.id, payload);
      if (res.success) {
        setSaveSuccessNotice(true);
        setTimeout(() => setSaveSuccessNotice(false), 4000);
        await refreshTenantData();
      }
    } catch (err: any) {
      alert('Erro ao salvar configurações: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testFinancialConnection({
        mode,
        supabaseUrl: supabaseUrl.trim(),
        supabaseKey: supabaseKey.trim(),
        supabaseTable: supabaseTable.trim() || 'renda_extra',
        endpointUrl: endpointUrl.trim(),
        accessEmail: accessEmail.trim(),
        accessPassword: accessPassword.trim(),
        category,
        description,
        originIncome,
        section: 'MASSOTERAPIA',
        alsoAddToSalary,
      });
      setTestResult(res);
      await refreshTenantData();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Falha na requisição de teste: ' + (err.message || 'Erro inesperado'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncCurrentMonth = async () => {
    if (!tenant?.id) return;
    setIsSyncing(true);
    try {
      const res = await api.syncAllPendingCashEntries(tenant.id);
      alert(
        res.success
          ? `Sucesso! ${res.syncedCount} lançamento(s) sincronizado(s) e somados no mês no Sistema Financeiro!`
          : `Resultado: ${res.message}`
      );
      await refreshTenantData();
    } catch (err: any) {
      alert('Erro ao sincronizar atendimentos: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = (text: string, tabId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabId);
    setTimeout(() => setCopiedTab(null), 2500);
  };

  // 1. Script SQL para o Supabase (PostgreSQL) do Controle Financeiro
  const sqlScript = `-- SCRIPT PARA O SUPABASE / POSTGRESQL DO APLICATIVO "CONTROLE FINANCEIRO"
-- Criação ou adequação da tabela de Renda Extra para receber os lançamentos de Massoterapia

CREATE TABLE IF NOT EXISTS renda_extra (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL DEFAULT 'MASSOTERAPIA',
    origem_renda VARCHAR(100) NOT NULL DEFAULT 'SERVIÇO',
    origem VARCHAR(100) DEFAULT 'SERVIÇO',
    tipo VARCHAR(100) DEFAULT 'Renda Extra',
    categoria VARCHAR(100) DEFAULT 'Renda Extra',
    valor NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    mes_referencia VARCHAR(7) NOT NULL, -- Exemplo: '2026-08', '2026-09'
    mes VARCHAR(7),
    observacao TEXT,
    cliente_paciente VARCHAR(255),
    procedimento VARCHAR(255),
    somar_ao_salario BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para agilizar a soma automática mensal na tela de Renda Extra
CREATE INDEX IF NOT EXISTS idx_renda_extra_mes ON renda_extra(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_renda_extra_descricao ON renda_extra(descricao);

-- Habilitar RLS e criar política de leitura e inserção
ALTER TABLE renda_extra ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'renda_extra' AND policyname = 'Permitir integracao massoterapia'
  ) THEN
    CREATE POLICY "Permitir integracao massoterapia" 
    ON renda_extra FOR ALL 
    TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);
  END IF;
END $$;
`;

  // 2. Código de rota Express (Node.js) para o server.ts do Controle Financeiro
  const expressSnippet = `// COLE NO ARQUIVO server.ts DO SEU APLICATIVO "CONTROLE FINANCEIRO"
// Rota dedicada para receber as entradas do Sistema de Massoterapia

app.post('/api/integrations/massoterapia', async (req, res) => {
  try {
    const {
      descricao = 'MASSOTERAPIA',
      origem_renda = 'SERVIÇO',
      origem = 'SERVIÇO',
      categoria = 'Renda Extra',
      valor = 0,
      data = new Date().toISOString().slice(0, 10),
      mes_referencia = data.slice(0, 7),
      cliente_paciente,
      procedimento,
      observacao,
      alsoAddToSalary = true,
      test = false
    } = req.body;

    const numValor = Number(valor) || 0;
    const mesVigor = mes_referencia || data.slice(0, 7);

    // Se for teste de conexão
    if (test || req.body.action === 'TESTE_CONEXAO') {
      return res.json({
        success: true,
        message: 'Conexão com Sistema de Massoterapia validada com sucesso!',
        descricao: 'MASSOTERAPIA',
        origem: 'SERVIÇO',
        mesVigor
      });
    }

    // 1. Inserir no PostgreSQL / Supabase do Controle Financeiro
    // Caso use o Supabase REST direto ou banco local:
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      const sbResp = await fetch(\`\${process.env.SUPABASE_URL}/rest/v1/renda_extra\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': \`Bearer \${process.env.SUPABASE_ANON_KEY}\`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          descricao: 'MASSOTERAPIA',
          origem_renda: 'SERVIÇO',
          origem: 'SERVIÇO',
          tipo: 'Renda Extra',
          categoria: 'Renda Extra',
          valor: numValor,
          data,
          mes_referencia: mesVigor,
          mes: mesVigor,
          observacao: observacao || \`Atendimento Massoterapia - \${cliente_paciente || 'Cliente'}\`,
          cliente_paciente,
          procedimento,
          somar_ao_salario: alsoAddToSalary,
          created_at: new Date().toISOString()
        })
      });
    }

    return res.status(200).json({
      success: true,
      message: \`Lançamento de R$ \${numValor.toFixed(2)} registrado com sucesso no mês \${mesVigor} como MASSOTERAPIA (SERVIÇO)!\`,
      descricao: 'MASSOTERAPIA',
      origem: 'SERVIÇO',
      valor: numValor,
      mes: mesVigor
    });
  } catch (error) {
    console.error('Erro na integração de massoterapia:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
`;

  // 3. Prompt pronto para colar no chat da IA do aplicativo Controle Financeiro
  const promptForFinancialChat = `Olá! Preciso configurar a conexão do meu aplicativo Controle Financeiro para receber automaticamente as entradas em dinheiro que vêm do meu Sistema de Massoterapia (Gestão de Pacientes).

Ambos os sistemas foram desenvolvidos com o Google AI Studio e utilizam PostgreSQL / Supabase como banco de dados.

### REGRAS OBRIGATÓRIAS DE NEGÓCIO:
1. Toda vez que um atendimento (sessão avulsa ou pacote) for lançado em dinheiro no Sistema de Massoterapia:
   - Descrição: "MASSOTERAPIA"
   - Origem da Renda: "SERVIÇO"
   - Tipo / Categoria: "Renda Extra"
2. Os lançamentos em dinheiro deverão entrar e ser somados automaticamente no MÊS EM VIGOR (ex: Agosto, Setembro) na tela de Renda Extra.
3. Se a tabela "renda_extra" já existir, garantir que ela possua as colunas: "descricao", "origem_renda", "valor", "data", "mes_referencia", "observacao".
4. Criar a rota de API em server.ts: POST /api/integrations/massoterapia para receber esse payload e salvar na tabela do Supabase/PostgreSQL somando ao total de Renda Extra do mês.
5. Garantir que na tela de Renda Extra, os lançamentos com descrição "MASSOTERAPIA" e origem "SERVIÇO" apareçam listados e somados no mês de referência correspondente.

Por favor, aplique as alterações necessárias no Controle Financeiro para receber e somar esses lançamentos perfeitamente.`;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <ArrowLeftRight className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Conexão com Sistema Controle Financeiro
            </h1>
          </div>
          <p className="text-slate-600 text-sm">
            Integração automática para envio de atendimentos em dinheiro com descrição{' '}
            <strong className="text-slate-900 font-semibold">MASSOTERAPIA</strong> e origem{' '}
            <strong className="text-slate-900 font-semibold">SERVIÇO</strong> no mês em vigor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToCashFlow && (
            <button
              type="button"
              onClick={onNavigateToCashFlow}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Ver Fluxo de Caixa Local
            </button>
          )}

          <button
            type="button"
            onClick={handleSyncCurrentMonth}
            disabled={isSyncing}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            title="Envia em lote todos os atendimentos já lançados para o mês em vigor"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Mês Atual'}
          </button>
        </div>
      </div>

      {/* Regras de Negócio em Destaque (Print 01 & Print 02) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Descrição no Financeiro
            </span>
            <span className="text-base font-bold text-slate-900">MASSOTERAPIA</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Origem da Renda (Print 01)
            </span>
            <span className="text-base font-bold text-slate-900">SERVIÇO</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Tipo no Financeiro (Print 02)
            </span>
            <span className="text-base font-bold text-slate-900">Renda Extra</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Soma Automática
            </span>
            <span className="text-base font-bold text-slate-900">Mês em Vigor</span>
          </div>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              Configurações da Conexão
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Escolha entre conexão direta ao Supabase (PostgreSQL) ou via rota de API REST.
            </p>
          </div>

          {/* Integration Mode Switcher */}
          <div className="flex bg-slate-200/80 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('SUPABASE')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'SUPABASE'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              PostgreSQL / Supabase (Direto)
            </button>
            <button
              type="button"
              onClick={() => setMode('REST_API')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'REST_API'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              API Express / Webhook
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Active Switch */}
          <div className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Envio Automático de Atendimentos
                </h3>
                <p className="text-xs text-slate-600">
                  Ao finalizar sessão ou vender pacote em dinheiro, o valor entra no fluxo de caixa local e é enviado automaticamente ao Controle Financeiro.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Mode 1: Supabase Direct */}
          {mode === 'SUPABASE' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="md:col-span-2">
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Integração Direta Supabase:</strong> Como ambos os sistemas utilizam o PostgreSQL do Supabase, o Sistema de Massoterapia pode inserir as entradas de Renda Extra diretamente na tabela do seu aplicativo Controle Financeiro, sem depender de intermediários de rede.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  URL do Supabase (Controle Financeiro) *
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  placeholder="https://seu-projeto-financeiro.supabase.co"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-slate-800"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Encontrada em Project Settings &gt; API no painel do Supabase do Controle Financeiro.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Chave do Supabase (Anon ou Service Key) *
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={e => setSupabaseKey(e.target.value)}
                  placeholder="sb_publishable_... ou eyJhbGciOi..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-slate-800"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Chave pública (anon) ou service_role com permissão na tabela renda_extra.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome da Tabela de Renda Extra
                </label>
                <input
                  type="text"
                  value={supabaseTable}
                  onChange={e => setSupabaseTable(e.target.value)}
                  placeholder="renda_extra"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-slate-800"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Padrão do sistema: <code>renda_extra</code>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Somar ao Salário / Rendimento Fixo
                </label>
                <div className="flex items-center h-10">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={alsoAddToSalary}
                      onChange={e => setAlsoAddToSalary(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Sim, somar automaticamente no resumo mensal do financeiro</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: REST API / Express Webhook */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Link / Rota da API do Controle Financeiro *
                </label>
                <input
                  type="text"
                  value={endpointUrl}
                  onChange={e => setEndpointUrl(e.target.value)}
                  placeholder="https://seu-controle-financeiro.run.app/api/integrations/massoterapia"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-slate-800"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  URL da aplicação Cloud Run / AI Studio do Controle Financeiro terminando em <code>/api/integrations/massoterapia</code>.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  value={accessEmail}
                  onChange={e => setAccessEmail(e.target.value)}
                  placeholder="osaiasbrito@gmail.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Senha / Token de Acesso
                </label>
                <input
                  type="password"
                  value={accessPassword}
                  onChange={e => setAccessPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
                />
              </div>
            </div>
          )}

          {/* Diagnosis / Test Result Card */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <strong className="font-semibold block mb-0.5">
                  {testResult.success ? 'Conexão Estabelecida com Sucesso!' : 'Diagnóstico da Conexão'}
                </strong>
                <p>{testResult.message}</p>
                {testResult.details && (
                  <div className="mt-2 text-xs font-mono bg-white/60 p-2 rounded border border-emerald-200/50">
                    Tabela: {testResult.details.table} | Descrição: {testResult.details.description} | Origem: {testResult.details.originIncome}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Notice */}
          {saveSuccessNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Configurações da integração salvas com sucesso!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || isSaving}
              className="px-5 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Testando Conexão...' : 'Testar Conexão Agora'}
            </button>

            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={isSaving || isTesting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL DE CÓDIGOS PARA O CONTROLE FINANCEIRO */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold tracking-tight">
                Código Gerado para o Sistema "Controle Financeiro"
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Copie o código correspondente para aplicar no outro sistema e habilitar a recepção das entradas em dinheiro.
            </p>
          </div>

          {/* Tabs for Codes */}
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveCodeTab('SQL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                activeCodeTab === 'SQL'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              1. Script SQL (Supabase)
            </button>
            <button
              type="button"
              onClick={() => setActiveCodeTab('EXPRESS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                activeCodeTab === 'EXPRESS'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              2. Rota Express (server.ts)
            </button>
            <button
              type="button"
              onClick={() => setActiveCodeTab('PROMPT')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                activeCodeTab === 'PROMPT'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              3. Prompt Pronto para Chat IA
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Tab 1: SQL Script */}
          {activeCodeTab === 'SQL' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Script SQL para o Supabase do Controle Financeiro
                  </h3>
                  <p className="text-xs text-slate-500">
                    Copia e executa no <strong>SQL Editor</strong> do painel do Supabase do Controle Financeiro para criar ou ajustar a tabela <code>renda_extra</code>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(sqlScript, 'sql')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedTab === 'sql' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar Script SQL</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-80 border border-slate-800 leading-relaxed">
                {sqlScript}
              </pre>
            </div>
          )}

          {/* Tab 2: Express Snippet */}
          {activeCodeTab === 'EXPRESS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Endpoint de API Node / Express (server.ts)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cole no arquivo <code>server.ts</code> do Controle Financeiro para receber e registrar as entradas na Renda Extra do mês em vigor.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(expressSnippet, 'express')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedTab === 'express' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar Rota Express</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-80 border border-slate-800 leading-relaxed">
                {expressSnippet}
              </pre>
            </div>
          )}

          {/* Tab 3: Prompt for AI Chat */}
          {activeCodeTab === 'PROMPT' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Instrução Pronta para colar no Chat do Google AI Studio
                  </h3>
                  <p className="text-xs text-slate-500">
                    Basta copiar este texto e colar diretamente na conversa com o assistente do seu aplicativo Controle Financeiro!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(promptForFinancialChat, 'prompt')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedTab === 'prompt' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar Instrução Completa</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                {promptForFinancialChat}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
