import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Lock,
  HardDrive,
  History,
  ShieldAlert,
  Server,
  FileText,
  Users,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DbConnectionTestCard } from '../database/DbConnectionTestCard';

interface BackupManagerViewProps {
  onRefreshAllData?: () => Promise<void>;
}

export const BackupManagerView: React.FC<BackupManagerViewProps> = ({ onRefreshAllData }) => {
  const { user, tenant } = useAuth();

  const [isLoadingExport, setIsLoadingExport] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Restore State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackupData, setParsedBackupData] = useState<any | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Snapshots State
  const [snapshots, setSnapshots] = useState<Array<{ filename: string; sizeBytes: number; createdAt: string }>>([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load snapshots from server
  const loadSnapshots = async () => {
    setIsLoadingSnapshots(true);
    try {
      const list = await api.getSnapshots();
      setSnapshots(list);
    } catch (err) {
      console.warn('Erro ao carregar snapshots do servidor:', err);
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  // Handle Full Export Download
  const handleExportBackup = async () => {
    if (!tenant) return;
    setIsLoadingExport(true);
    setExportSuccessMessage(null);
    try {
      const backup = await api.exportBackup(tenant.id, user);

      // Create Blob and trigger download
      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const dateStr = new Date().toISOString().slice(0, 10);
      const clinicClean = (tenant.tradeName || tenant.name || 'clinica')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      link.href = url;
      link.download = `backup-${clinicClean}-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccessMessage(
        `Backup exportado com sucesso! Arquivo gerado com verificação de integridade e ${
          backup.summary?.patientsCount || 'todos os'
        } pacientes.`
      );
      loadSnapshots();
    } catch (err: any) {
      alert(`Falha ao exportar backup: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoadingExport(false);
    }
  };

  // Handle File Selection for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setRestoreMessage(null);

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.database && !parsed.patients && !parsed.store) {
          throw new Error('O arquivo selecionado não contém uma estrutura de banco de dados válida.');
        }
        setParsedBackupData(parsed);
      } catch (err: any) {
        setRestoreMessage({
          type: 'error',
          text: `Arquivo inválido: ${err.message || 'Não foi possível ler o arquivo JSON.'}`,
        });
        setParsedBackupData(null);
      }
    };
    reader.readAsText(file);
  };

  // Execute Restore from Uploaded File
  const handleConfirmRestore = async () => {
    if (!parsedBackupData || !tenant) return;

    const confirmMsg =
      'ATENÇÃO: A restauração irá carregar todos os dados contidos neste backup.\n\nUm snapshot automático de segurança do estado atual será criado antes da restauração.\n\nDeseja continuar?';
    if (!window.confirm(confirmMsg)) return;

    setIsRestoring(true);
    setRestoreMessage(null);

    try {
      const payload = parsedBackupData.database
        ? parsedBackupData
        : { database: parsedBackupData.store || parsedBackupData };

      const res = await api.restoreBackup(payload, tenant.id, user);

      setRestoreMessage({
        type: 'success',
        text: res.message || 'Banco de dados restaurado com sucesso!',
      });
      setSelectedFile(null);
      setParsedBackupData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onRefreshAllData) {
        await onRefreshAllData();
      }
      loadSnapshots();
    } catch (err: any) {
      setRestoreMessage({
        type: 'error',
        text: `Erro na restauração: ${err.message || 'Falha ao processar os dados.'}`,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Create Manual Snapshot on Demand
  const handleCreateSnapshot = async () => {
    setIsCreatingSnapshot(true);
    setActionMessage(null);
    try {
      await api.createSnapshot('manual');
      setActionMessage('Snapshot de segurança gerado com sucesso no servidor!');
      await loadSnapshots();
    } catch (err: any) {
      alert('Erro ao criar snapshot: ' + err.message);
    } finally {
      setIsCreatingSnapshot(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Restore from an existing server snapshot
  const handleRestoreSnapshot = async (filename: string) => {
    const confirm = window.confirm(
      `Deseja restaurar o banco de dados para o snapshot ${filename}?\n\nUm snapshot de segurança será gerado antes desta ação.`
    );
    if (!confirm) return;

    try {
      await api.restoreSnapshot(filename);
      alert(`Snapshot ${filename} restaurado com sucesso!`);
      if (onRefreshAllData) {
        await onRefreshAllData();
      }
      loadSnapshots();
    } catch (err: any) {
      alert(`Erro ao restaurar snapshot: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 shrink-0 shadow-xs">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Segurança do Banco de Dados & Backup
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Proteção contra perda de informações, cópias de segurança completas com integridade criptográfica e blindagem contra vazamento de dados clínicos (LGPD / HIPAA).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportBackup}
          disabled={isLoadingExport}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition shrink-0 cursor-pointer"
        >
          {isLoadingExport ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Baixar Backup Agora (.JSON)
        </button>
      </div>

      {/* Super User Database Connection Diagnostic Widget */}
      <DbConnectionTestCard />

      {exportSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-900 dark:text-emerald-200 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{exportSuccessMessage}</span>
        </div>
      )}

      {actionMessage && (
        <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center gap-3 text-teal-900 dark:text-teal-200 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Security Architecture Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-xs">Persistência Permanente</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Gravação atômica direta no disco com proteção contra desligamentos e falhas de processo. Zero perda em atualizações.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-xs">Isolamento Multi-Tenant</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Separação hermética de registros clínicos entre clínicas e bloqueio de visualização não autorizada por terceiros.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-xs">Bloqueio de Inativos</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Profissionais desativados têm o acesso imediatamente revogado no servidor, impedindo login e consultas de dados.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-xs">Snapshots Automáticos</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Cópias pontuais criadas automaticamente no disco a cada inicialização e antes de qualquer operação de restauração.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-teal-600" /> Exportação de Backup Completo
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              Formato JSON Seguro
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Gere uma cópia completa de todos os prontuários, fichas de avaliação física, contratos de pacotes, histórico de sessões, assinaturas digitais e logs de auditoria da clínica.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 space-y-2">
            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-teal-600" /> Dados incluídos na exportação:
            </div>
            <ul className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
              <li>• Cadastro Geral de Pacientes</li>
              <li>• Fichas de Anamnese e Avaliação</li>
              <li>• Pacotes de Tratamento & Saldos</li>
              <li>• Sessões Realizadas e Agendadas</li>
              <li>• Evoluções Clínicas</li>
              <li>• Assinaturas Digitais Coletadas</li>
              <li>• Documentos e Anexos</li>
              <li>• Histórico Completo de Auditoria</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleExportBackup}
            disabled={isLoadingExport}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            {isLoadingExport ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Gerando Cópia de Segurança...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Fazer Download do Backup Completo (.JSON)
              </>
            )}
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-teal-600" /> Restaurar Backup a partir de Arquivo
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Com Proteção Prévia
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Selecione um arquivo de backup (.json) exportado previamente para restaurar os dados no sistema.
          </p>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center hover:border-teal-500 transition">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              id="backup-file-upload"
            />
            <label
              htmlFor="backup-file-upload"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <Upload className="w-8 h-8 text-teal-600" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {selectedFile ? selectedFile.name : 'Clique para selecionar arquivo de backup (.JSON)'}
              </span>
              <span className="text-[11px] text-slate-400">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                  : 'Apenas arquivos JSON gerados pelo sistema'}
              </span>
            </label>
          </div>

          {parsedBackupData && (
            <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-xs space-y-2">
              <div className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-teal-600" /> Resumo do Arquivo Identificado:
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                <span>
                  • Pacientes:{' '}
                  <strong>
                    {parsedBackupData.summary?.patientsCount ||
                      parsedBackupData.database?.patients?.length ||
                      parsedBackupData.store?.patients?.length ||
                      0}
                  </strong>
                </span>
                <span>
                  • Sessões:{' '}
                  <strong>
                    {parsedBackupData.summary?.sessionsCount ||
                      parsedBackupData.database?.sessions?.length ||
                      parsedBackupData.store?.sessions?.length ||
                      0}
                  </strong>
                </span>
                <span>
                  • Anamneses:{' '}
                  <strong>
                    {parsedBackupData.summary?.anamnesesCount ||
                      parsedBackupData.database?.anamneses?.length ||
                      parsedBackupData.store?.anamneses?.length ||
                      0}
                  </strong>
                </span>
                <span>
                  • Pacotes:{' '}
                  <strong>
                    {parsedBackupData.summary?.packagesCount ||
                      parsedBackupData.database?.packages?.length ||
                      parsedBackupData.store?.packages?.length ||
                      0}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {restoreMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                restoreMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {restoreMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{restoreMessage.text}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleConfirmRestore}
            disabled={!parsedBackupData || isRestoring}
            className="w-full py-3 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 disabled:opacity-40 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            {isRestoring ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Restaurando Dados...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Confirmar e Restaurar Banco de Dados
              </>
            )}
          </button>
        </div>
      </div>

      {/* Server Snapshots Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-600" /> Snapshots Automáticos Gravados no Servidor
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pontos de restauração no disco gerados automaticamente pelo sistema a cada inicialização e modificação de segurança.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateSnapshot}
              disabled={isCreatingSnapshot}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              {isCreatingSnapshot ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              )}
              Criar Snapshot Manual
            </button>

            <button
              type="button"
              onClick={loadSnapshots}
              disabled={isLoadingSnapshots}
              className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
              title="Atualizar lista de snapshots"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingSnapshots ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {snapshots.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Nenhum snapshot em disco registrado ainda. Clique em "Criar Snapshot Manual" para gerar o primeiro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Identificador do Snapshot</th>
                  <th className="py-2.5 px-3">Data e Hora</th>
                  <th className="py-2.5 px-3">Tamanho</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {snapshots.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <HardDrive className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate max-w-xs">{item.filename}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(item.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {(item.sizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      <a
                        href={`/api/backup/snapshot-download/${encodeURIComponent(item.filename)}`}
                        download
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[11px] transition"
                      >
                        <Download className="w-3 h-3 text-teal-600" /> Baixar
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRestoreSnapshot(item.filename)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold text-[11px] hover:bg-teal-100 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Restaurar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
