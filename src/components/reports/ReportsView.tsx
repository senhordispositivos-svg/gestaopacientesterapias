import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  Search,
  UserCheck,
  Building2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Edit3,
  PenTool,
  Share2,
  BarChart3,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Patient, Session, SessionPackage, Anamnesis, Tenant, User } from '../../types';
import { ClientAnamnesisSheet } from './ClientAnamnesisSheet';
import { AnamnesisModal } from '../anamnesis/AnamnesisModal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ReportsViewProps {
  patients: Patient[];
  sessions: Session[];
  packages: SessionPackage[];
  currentTenant?: Tenant | null;
  onRefreshData?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  patients,
  sessions,
  packages,
  currentTenant,
  onRefreshData,
}) => {
  const { tenant: authTenant } = useAuth();
  const activeTenant = currentTenant || authTenant;

  const [activeTab, setActiveTab] = useState<'sheet' | 'metrics'>('sheet');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentAnamnesis, setCurrentAnamnesis] = useState<Anamnesis | null>(null);
  const [isLoadingAnamnesis, setIsLoadingAnamnesis] = useState(false);
  const [isAnamnesisModalOpen, setIsAnamnesisModalOpen] = useState(false);
  const [isQuickSignatureOpen, setIsQuickSignatureOpen] = useState(false);

  // Auto-select first patient if available
  useEffect(() => {
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selectedPatientId]);

  // Load anamnesis when selected patient changes
  useEffect(() => {
    async function loadPatientAnamnesis() {
      if (!selectedPatientId || !activeTenant) {
        setCurrentAnamnesis(null);
        return;
      }
      setIsLoadingAnamnesis(true);
      try {
        const anam = await api.getAnamnesis(selectedPatientId, activeTenant.id);
        setCurrentAnamnesis(anam);
      } catch (err) {
        console.error('Error loading anamnesis:', err);
        setCurrentAnamnesis(null);
      } finally {
        setIsLoadingAnamnesis(false);
      }
    }

    loadPatientAnamnesis();
  }, [selectedPatientId, activeTenant]);

  const filteredPatients = patients.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      p.cpf.includes(query) ||
      p.phone.includes(query) ||
      (p.email && p.email.toLowerCase().includes(query))
    );
  });

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const patientPackages = packages.filter(p => p.patientId === selectedPatient?.id);
  const patientSessions = sessions.filter(s => s.patientId === selectedPatient?.id);

  // Handle Print / PDF Action with high-fidelity document window
  const handlePrint = () => {
    const printContent = document.getElementById('printable-client-sheet');
    if (!printContent) {
      window.print();
      return;
    }

    try {
      const printWindow = window.open('', '_blank', 'width=950,height=900');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <title>Ficha Clínica - ${selectedPatient?.name || 'Paciente'}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              body {
                font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background-color: #ffffff;
                color: #0f172a;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @media print {
                .no-print { display: none !important; }
                body { padding: 0; margin: 0; background: transparent; }
                #printable-client-sheet { border: none !important; box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
              }
            </style>
          </head>
          <body class="p-6 bg-slate-100/50">
            <div class="no-print max-w-4xl mx-auto mb-4 flex items-center justify-between p-3.5 bg-teal-900 text-white rounded-xl shadow-md">
              <div>
                <span class="text-sm font-bold block">Documento Pronto para Impressão / Salvar como PDF</span>
                <span class="text-[11px] text-teal-200">Clique no botão para abrir o diálogo de impressão do seu navegador.</span>
              </div>
              <button onclick="window.print()" class="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 text-xs font-black rounded-lg shadow-sm transition">
                🖨️ Imprimir / Salvar em PDF
              </button>
            </div>
            <div class="max-w-4xl mx-auto">
              ${printContent.outerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 350);
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        window.print();
      }
    } catch (err) {
      console.warn('Fallback to standard window.print()', err);
      window.print();
    }
  };

  // Handle Save Anamnesis
  const handleSaveAnamnesis = async (data: Partial<Anamnesis>) => {
    if (!selectedPatient || !activeTenant) return;
    try {
      const saved = await api.saveAnamnesis(selectedPatient.id, activeTenant.id, data);
      setCurrentAnamnesis(saved);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Erro ao salvar anamnese.');
    }
  };

  // Handle WhatsApp Share
  const handleShareWhatsApp = () => {
    if (!selectedPatient) return;
    const phone = selectedPatient.whatsapp || selectedPatient.phone;
    if (!phone) {
      alert('Paciente não possui WhatsApp cadastrado.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Olá, ${selectedPatient.name.split(' ')[0]}!\n\nSua Ficha de Anamnese e Avaliação Clínica na *${
      activeTenant?.tradeName || 'Nossa Clínica'
    }* foi emitida e autenticada com sucesso.\n\nQualquer dúvida, estamos à disposição!`;
    const url = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* CONTROLE SUPERIOR & NAVEGAÇÃO ENTRE ABAS (OCULTO NA IMPRESSÃO) */}
      {/* ------------------------------------------------------------- */}
      <div className="print:hidden space-y-4">
        {/* Header Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              Relatórios & Ficha Clínica do Cliente
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Visualização da ficha de anamnese completa com logomarca, termos legais, assinatura do cliente e exportação para PDF/Impressão.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('sheet')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'sheet'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Ficha do Cliente (PDF/Print)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'metrics'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Métricas Gerais
            </button>
          </div>
        </div>

        {/* Barra de Seleção de Paciente & Ações */}
        {activeTab === 'sheet' && (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Seletor com busca */}
            <div className="w-full md:w-auto flex-1 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar paciente por nome ou CPF..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div className="w-full sm:w-80">
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 truncate"
                >
                  {filteredPatients.length === 0 ? (
                    <option value="">Nenhum paciente cadastrado</option>
                  ) : (
                    filteredPatients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.cpf ? `• CPF: ${p.cpf}` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Botões de Ação da Ficha */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsAnamnesisModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Editar respostas da anamnese e coletar assinatura"
              >
                <Edit3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                {currentAnamnesis ? 'Editar Anamnese' : 'Preencher Anamnese'}
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Compartilhar confirmação no WhatsApp"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                title="Abrir diálogo de impressão e salvar como PDF"
              >
                <Printer className="w-4 h-4" />
                Imprimir / Gerar PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ABA 1: FICHA DE ANAMNESE COMPLETA (MODELO PRINTS 1 & 2) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'sheet' && (
        <div className="space-y-4">
          {patients.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Nenhum Paciente Cadastrado no Sistema
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Para visualizar a ficha de anamnese e gerar o relatório em PDF com a logomarca da clínica, cadastre o primeiro paciente na aba Pacientes.
              </p>
            </div>
          ) : selectedPatient ? (
            <div className="space-y-4">
              {/* Badge de status da assinatura (oculto na impressão) */}
              <div className="print:hidden flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  {currentAnamnesis?.patientSignatureUrl ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        Ficha Digital Assinada pelo Cliente como Ciente
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-amber-700 dark:text-amber-300">
                        Assinatura Digital Pendente — Clique em &quot;Preencher Anamnese&quot; para assinar na tela
                      </span>
                    </>
                  )}
                </div>

                <span className="text-slate-400 font-mono text-[11px]">
                  Atualizado em: {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* Folha Oficial de Anamnese para visualização na tela e impressão */}
              <div className="p-2 sm:p-4 bg-slate-100 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner print:p-0 print:bg-white print:border-none print:shadow-none">
                <ClientAnamnesisSheet
                  patient={selectedPatient}
                  anamnesis={currentAnamnesis}
                  tenant={activeTenant}
                  packages={patientPackages}
                  sessions={patientSessions}
                />
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ABA 2: MÉTRICAS GERAIS & ESTATÍSTICAS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Pacientes Reais</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-2">
                <Users className="w-6 h-6 text-teal-600" />
                {patients.length}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sessões Realizadas</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {sessions.filter(s => s.status === 'COMPLETED').length}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sessões Agendadas</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                {sessions.filter(s => s.status === 'SCHEDULED' || s.status === 'PENDING').length}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturamento de Pacotes</p>
              <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-2">
                R${' '}
                {packages
                  .reduce((acc, p) => acc + (p.price || 0), 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Anamnese Completa */}
      {isAnamnesisModalOpen && selectedPatient && (
        <AnamnesisModal
          isOpen={isAnamnesisModalOpen}
          onClose={() => setIsAnamnesisModalOpen(false)}
          patient={selectedPatient}
          initialData={currentAnamnesis}
          onSaveAnamnesis={handleSaveAnamnesis}
        />
      )}
    </div>
  );
};
