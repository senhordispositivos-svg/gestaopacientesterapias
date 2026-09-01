import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Search, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { formatDateTime } from '../../utils/crypto';

export const AuditLogView: React.FC = () => {
  const { tenant } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      if (!tenant) return;
      setIsLoading(true);
      try {
        const res = await api.getAuditLogs(tenant.id);
        setLogs(res);
      } catch (err) {
        console.error('Erro ao carregar auditoria:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, [tenant]);

  const filteredLogs = logs.filter(
    l =>
      l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ipAddress.includes(searchTerm) ||
      (l.details && l.details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            Trilha de Auditoria & Segurança LGPD
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registro imutável de todas as ações de acesso a dados clínicos, logins e assinaturas do Tenant {tenant?.tradeName}.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Filtrar por Usuário, Ação, IP..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Carregando logs de auditoria...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Nenhum registro de auditoria encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Data & Hora</th>
                  <th className="px-4 py-3">Usuário / Papel</th>
                  <th className="px-4 py-3">Ação Executada</th>
                  <th className="px-4 py-3">Entidade</th>
                  <th className="px-4 py-3">Endereço IP</th>
                  <th className="px-4 py-3">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-mono text-[11px]">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{log.userName}</p>
                      <p className="text-[10px] text-teal-600 dark:text-teal-400">{log.userRole}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-bold">
                      {log.action}
                      {log.details && (
                        <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                          {log.details}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {log.entity} ({log.entityId})
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{log.ipAddress}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" /> SUCCESS
                      </span>
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
