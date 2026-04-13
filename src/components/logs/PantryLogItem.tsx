import React from 'react';
import { History, User, Package, Trash2 } from 'lucide-react';
import { PantryLog, Participant } from '../../types';

interface PantryLogItemProps {
  log: PantryLog;
  participants: Participant[];
  onDelete?: () => void;
  canManage?: boolean;
}

export function PantryLogItem({ log, participants, onDelete, canManage }: PantryLogItemProps) {
  const participant = participants.find(p => p.id === log.participantId);
  const participantName = participant ? `${participant.name} ${participant.surname}` : 'Partecipante Sconosciuto';
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
            <History className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <User className="w-3 h-3 text-pink-500" />
              <p className="text-sm font-bold text-slate-900">{participantName || 'Partecipante Sconosciuto'}</p>
            </div>
          </div>
        </div>
        {canManage && onDelete && (
          <button 
            onClick={onDelete}
            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-sm text-slate-600 mb-3 italic">"{log.description}"</p>

      <div className="space-y-2">
        {log.productsUsed.map((item, index) => (
          <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-700">{item.productName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                item.type === 'return' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {item.type === 'return' ? 'Reso' : 'Prelievo'}
              </span>
              <span className="text-xs font-black text-slate-900">{item.quantity} pz</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
