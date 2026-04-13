import React from 'react';
import { ShieldCheck, Calendar, User, Info, Tag, Package, Users, Settings2, History } from 'lucide-react';
import { AuditLog } from '../../types';
import { cn } from '../../lib/utils';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export function AuditLogsView({ logs }: AuditLogsViewProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <Tag className="w-3.5 h-3.5 text-green-500" />;
      case 'update': return <Settings2 className="w-3.5 h-3.5 text-blue-500" />;
      case 'delete': return <Info className="w-3.5 h-3.5 text-red-500" />;
      case 'move': return <History className="w-3.5 h-3.5 text-pink-500" />;
      case 'auth': return <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />;
      default: return <Info className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'product': return <Package className="w-4 h-4" />;
      case 'participant': return <Users className="w-4 h-4" />;
      case 'party': return <ShieldCheck className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-pink-500" />
            Registro Audit
          </h2>
          <p className="text-sm text-slate-500 font-medium">Cronologia completa delle azioni amministrative</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data e Ora</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Utente</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Azione</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entità</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dettagli</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <History className="w-8 h-8 text-slate-200" />
                      <p className="text-sm font-medium text-slate-400">Nessuna attività registrata</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">
                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-pink-50 rounded-full flex items-center justify-center border border-pink-100">
                          <User className="w-3 h-3 text-pink-500" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">{log.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {getActionIcon(log.action)}
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="text-slate-400">
                          {getEntityIcon(log.entityType)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{log.entityType}</span>
                          <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{log.entityName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 font-medium line-clamp-1 group-hover:line-clamp-none transition-all">
                        {log.details}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
