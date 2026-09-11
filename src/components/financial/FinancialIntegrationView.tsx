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

  const [mode, setMode] = useState<'SUPABASE' | 'REST_API'>('REST_API');
  const [enabled, setEnabled] = useState(true);
  const [supabaseUrl, setSupabaseUrl] = useState('https://dpaylubvupjjokpukuxy.supabase.co');
  const [supabaseKey, setSupabaseKey] = useState('sb_publishable_uDVtjc0J1dGBgS510tpphg_oSrmPUTu');
  const [supabaseTable, setSupabaseTable] = useState('extra_incomes');
  const [endpointUrl, setEndpointUrl] = useState(
    'https://ais-dev-ca2j6yzl6qm4otgueyocuu-440149738355.us-east1.run.app/api/integrations/massoterapia'
  );
  const [accessEmail, setAccessEmail] = useState('osaiasbrito@gmail.com');
  const [accessPassword, setAccessPassword] = useState('Ojf6994@#gestaoPessoas');
  const [category, setCategory] = useState('SERVIÇO');
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
  const [activeCodeTab, setActiveCodeTab] = useState<'ENVIO' | 'SQL' | 'EXPRESS' | 'PROMPT'>('ENVIO');
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
        setSupabaseUrl(cfg.supabaseUrl || 'https://dpaylubvupjjokpukuxy.supabase.co');
        setSupabaseKey(cfg.supabaseKey || 'sb_publishable_uDVtjc0J1dGBgS510tpphg_oSrmPUTu');
        setSupabaseTable(cfg.supabaseTable || 'extra_incomes');
        setEndpointUrl(
          cfg.endpointUrl && !cfg.endpointUrl.includes('ais-pre')
            ? cfg.endpointUrl
            : 'https://ais-dev-ca2j6yzl6qm4otgueyocuu-440149738355.us-east1.run.app/api/integrations/massoterapia'
        );
        setAccessEmail(cfg.accessEmail || 'osaiasbrito@gmail.com');
        setAccessPassword(cfg.accessPassword || 'Ojf6994@#gestaoPessoas');
        setCategory(cfg.category || 'SERVIÇO');
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
        supabaseTable: supabaseTable.trim() || 'extra_incomes',
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
        supabaseTable: supabaseTable.trim() || 'extra_incomes',
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
-- A tabela "extra_incomes" (Renda Extra) recebe os lançamentos de Massoterapia

CREATE TABLE IF NOT EXISTS extra_incomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description VARCHAR(255) NOT NULL DEFAULT 'MASSOTERAPIA',
    origin VARCHAR(100) NOT NULL DEFAULT 'SERVIÇO',
    category VARCHAR(100) DEFAULT 'Renda Extra',
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    month VARCHAR(7) NOT NULL, -- Exemplo: '2026-08', '2026-09'
    notes TEXT,
    client_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para agilizar a soma automática mensal na tela de Renda Extra
CREATE INDEX IF NOT EXISTS idx_extra_incomes_month ON extra_incomes(month);
CREATE INDEX IF NOT EXISTS idx_extra_incomes_desc ON extra_incomes(description);

-- Habilitar RLS e criar política de leitura e inserção
ALTER TABLE extra_incomes ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'extra_incomes' AND policyname = 'Permitir integracao massoterapia'
  ) THEN
    CREATE POLICY "Permitir integracao massoterapia" 
    ON extra_incomes FOR ALL 
    TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);
  END IF;
END $$;
`;

  // 1. Script de Envio do Sistema de Gestão de Pessoas (Massoterapia/Fisioterapia)
  const sendingScriptSnippet = `/**
 * Script de Envio - Sistema de Gestão de Pessoas (Massoterapia/Fisioterapia)
 */
const INTEGRATION_CONFIG = {
  apiUrl: 'https://ais-dev-ca2j6yzl6qm4otgueyocuu-440149738355.us-east1.run.app/api/integrations/massoterapia',
  authEmail: 'osaiasbrito@gmail.com',
  authPassword: 'Ojf6994@#gestaoPessoas',
  supabaseUrl: 'https://dpaylubvupjjokpukuxy.supabase.co',
  supabaseKey: 'sb_publishable_uDVtjc0J1dGBgS510tpphg_oSrmPUTu',
  tableName: 'extra_incomes'
};

async function enviarAtendimentoParaFinanceiro(dadosAtendimento) {
  const dataAtual = dadosAtendimento.data || new Date().toISOString().split('T')[0];
  const mesAtual = dadosAtendimento.mesReferencia || dataAtual.substring(0, 7);
  const valorNum = Number(dadosAtendimento.valor || 0);
  const cliente = dadosAtendimento.clienteNome || 'Cliente Não Informado';
  const procedimento = dadosAtendimento.procedimento || 'Atendimento Massoterapia';

  const payload = {
    email: INTEGRATION_CONFIG.authEmail,
    password: INTEGRATION_CONFIG.authPassword,
    clientName: cliente,
    amount: valorNum,
    description: 'MASSOTERAPIA',
    category: 'SERVIÇO',
    source: 'SERVIÇO',
    date: dataAtual,
    referenceMonth: mesAtual,
    status: 'RECEIVED',
    procedimento: procedimento,
    alsoAddToSalary: true,
    notes: \`Cliente/Paciente: \${cliente} | Procedimento: \${procedimento}\`
  };

  try {
    const response = await fetch(INTEGRATION_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const resultado = await response.json();
    if (!response.ok) throw new Error(resultado.error || resultado.message || 'Erro na API');
    
    console.log('✅ Sucesso (API Financeira):', resultado);
    return resultado;
  } catch (error) {
    console.warn('⚠️ Falha na API. Executando Fallback no Supabase...', error.message);
    return await enviarViaSupabaseDireto(payload);
  }
}

async function enviarViaSupabaseDireto(payload) {
  const endpoint = \`\${INTEGRATION_CONFIG.supabaseUrl}/rest/v1/\${INTEGRATION_CONFIG.tableName}\`;
  
  // Mapeamento compatível com o banco da Gestão Financeira
  const corpoSupabase = {
    description: payload.description,
    descricao: payload.description,
    origin: 'SERVIÇO',
    origem_renda: 'SERVIÇO',
    category: 'Renda Extra',
    categoria: 'Renda Extra',
    amount: payload.amount,
    valor: payload.amount,
    date: payload.date,
    data: payload.date,
    month: payload.referenceMonth,
    mes_referencia: payload.referenceMonth,
    client_name: payload.clientName,
    cliente_paciente: payload.clientName,
    notes: payload.notes,
    observacao: payload.notes,
    somar_ao_salario: true,
    created_at: new Date().toISOString()
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': INTEGRATION_CONFIG.supabaseKey,
        'Authorization': \`Bearer \${INTEGRATION_CONFIG.supabaseKey}\`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(corpoSupabase)
    });

    if (!res.ok) throw new Error(\`HTTP \${res.status}: \${await res.text()}\`);
    const data = await res.json();
    console.log('✅ Salvo no Supabase via Fallback:', data);
    return { success: true, data };
  } catch (err) {
    console.error('❌ Erro no fallback Supabase:', err);
    return { success: false, error: err.message };
  }
}
`;

  // 2. Código de rota Express (Node.js) para o server.ts do Controle Financeiro
  const expressSnippet = `// COLE NO ARQUIVO server.ts DO SEU APLICATIVO "CONTROLE FINANCEIRO"
// Rota dedicada para receber as entradas do Sistema de Massoterapia

app.post('/api/integrations/massoterapia', async (req, res) => {
  try {
    const {
      email,
      password,
      clientName = 'Cliente Não Informado',
      amount = 0,
      description = 'MASSOTERAPIA',
      category = 'SERVIÇO',
      source = 'SERVIÇO',
      date = new Date().toISOString().split('T')[0],
      referenceMonth = date.substring(0, 7),
      status = 'RECEIVED',
      procedimento = 'Atendimento Massoterapia',
      alsoAddToSalary = true,
      notes = ''
    } = req.body;

    const valorNum = Number(amount) || 0;
    const mesVigor = referenceMonth || date.substring(0, 7);

    // Validação de Credenciais (Opcional)
    if (email && email !== 'osaiasbrito@gmail.com') {
      return res.status(401).json({ success: false, message: 'Credencial inválida' });
    }

    // 1. Inserir no Supabase / PostgreSQL do Controle Financeiro (extra_incomes)
    if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
      const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      await fetch(\`\${process.env.SUPABASE_URL.replace(/\\/+$/, '')}/rest/v1/extra_incomes\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': sbKey,
          'Authorization': \`Bearer \${sbKey}\`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          description: 'MASSOTERAPIA',
          descricao: 'MASSOTERAPIA',
          origin: 'SERVIÇO',
          origem_renda: 'SERVIÇO',
          category: 'Renda Extra',
          categoria: 'Renda Extra',
          amount: valorNum,
          valor: valorNum,
          date,
          data: date,
          month: mesVigor,
          mes_referencia: mesVigor,
          client_name: clientName,
          cliente_paciente: clientName,
          notes: notes || \`Cliente: \${clientName} | Procedimento: \${procedimento}\`,
          observacao: notes || \`Cliente: \${clientName} | Procedimento: \${procedimento}\`,
          somar_ao_salario: alsoAddToSalary,
          created_at: new Date().toISOString()
        })
      });
    }

    return res.status(200).json({
      success: true,
      message: \`Lançamento de R$ \${valorNum.toFixed(2)} registrado com sucesso no mês \${mesVigor} como MASSOTERAPIA (SERVIÇO)!\`,
      clientName,
      amount: valorNum,
      referenceMonth: mesVigor
    });
  } catch (error) {
    console.error('Erro na integração de massoterapia:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
`;

  // 3. Prompt pronto para colar no chat da IA do aplicativo Controle Financeiro
  const promptForFinancialChat = `Substitua o script de envio da Gestão de Pessoas pelo código ajustado abaixo, padronizando os nomes das variáveis para o contrato que a Gestão Financeira espera:

${sendingScriptSnippet}`;

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
              onClick={() => {
                setMode('SUPABASE');
                if (!supabaseUrl) setSupabaseUrl('https://dpaylubvupjjokpukuxy.supabase.co');
                if (!supabaseTable) setSupabaseTable('extra_incomes');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'SUPABASE'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>PostgreSQL / Supabase (Direto)</span>
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                Recomendado
              </span>
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
              <span>API Express / Webhook</span>
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
                  Chave pública (anon) ou service_role do seu Supabase com permissão na tabela.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome da Tabela de Renda Extra *
                </label>
                <input
                  type="text"
                  value={supabaseTable}
                  onChange={e => setSupabaseTable(e.target.value)}
                  placeholder="extra_incomes"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-slate-800"
                />
                <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
                  Tabela identificada no seu Supabase: <code>extra_incomes</code>
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
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Aviso para Netlify e Vercel:</strong> O endereço <code>gestaofinanceirafacil.netlify.app</code> hospeda apenas a interface estática e não possui servidor backend para rotas <code>/api/*</code>. Para integrar perfeitamente com o seu banco de dados, utilize a aba <strong>PostgreSQL / Supabase (Direto)</strong>.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('SUPABASE');
                      if (!supabaseUrl) setSupabaseUrl('https://dpaylubvupjjokpukuxy.supabase.co');
                      if (!supabaseTable) setSupabaseTable('extra_incomes');
                    }}
                    className="shrink-0 px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-md transition cursor-pointer shadow-xs"
                  >
                    Usar Supabase Direto
                  </button>
                </div>
              </div>

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
              <div className="text-sm flex-1">
                <strong className="font-semibold block mb-0.5">
                  {testResult.success ? 'Conexão Estabelecida com Sucesso!' : 'Diagnóstico da Conexão'}
                </strong>
                <p>{testResult.message}</p>
                {testResult.details && (
                  <div className="mt-2 text-xs font-mono bg-white/60 p-2 rounded border border-emerald-200/50">
                    Tabela: {testResult.details.table} | Descrição: {testResult.details.description} | Origem: {testResult.details.originIncome}
                  </div>
                )}
                {!testResult.success && mode === 'REST_API' && (
                  <div className="mt-3 pt-2.5 border-t border-amber-200/80 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('SUPABASE');
                        if (!supabaseUrl) setSupabaseUrl('https://dpaylubvupjjokpukuxy.supabase.co');
                        if (!supabaseTable) setSupabaseTable('extra_incomes');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Alternar para PostgreSQL / Supabase (Direto)</span>
                    </button>
                    <span className="text-xs text-amber-800">
                      Conecta diretamente ao banco sem bloqueios de rede.
                    </span>
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
          <div className="flex flex-wrap bg-slate-800 p-1 rounded-lg border border-slate-700 gap-1">
            <button
              type="button"
              onClick={() => setActiveCodeTab('ENVIO')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                activeCodeTab === 'ENVIO'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              1. Script de Envio (Gestão de Pessoas)
            </button>
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
              2. Script SQL (Supabase)
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
              3. Rota Express (server.ts)
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
              4. Prompt para Chat IA
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Tab 0: Script de Envio (Gestão de Pessoas) */}
          {activeCodeTab === 'ENVIO' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Script de Envio - Sistema de Gestão de Pessoas (Massoterapia/Fisioterapia)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Script com nomes de variáveis padronizadas para o contrato que a Gestão Financeira espera (inclui fallback automático para o Supabase).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(sendingScriptSnippet, 'envio')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedTab === 'envio' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar Script de Envio</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96 border border-slate-800 leading-relaxed">
                {sendingScriptSnippet}
              </pre>
            </div>
          )}

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
