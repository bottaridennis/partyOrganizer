import React from 'react';
import { 
  Settings2, 
  Trash2, 
  Users, 
  ShieldCheck, 
  Filter,
  Pizza,
  Beer,
  Heart
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Participant, Party } from '../../types';
import { cn } from '../../lib/utils';

export function ParticipantCard({ 
  participant, 
  onEdit, 
  onDelete, 
  onFilter,
  canManage,
  party
}: { 
  participant: Participant, 
  onEdit: () => void, 
  onDelete: () => void, 
  onFilter: () => void,
  canManage: boolean,
  party?: Party | null
}) {
  const isMember = participant.id?.startsWith('member-');
  const status = party?.memberStatus?.[participant.uid!] || 'pending';
  const isActive = status === 'active';

  return (
    <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200 transition-all hover:shadow-xl group relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-md transition-transform group-hover:scale-110",
          isActive ? "bg-pink-50 text-pink-600" : "bg-slate-50 text-slate-400"
        )}>
          {participant.imageUrl ? (
            <img src={participant.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <Users className="w-8 h-8" />
          )}
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button 
              onClick={onEdit}
              className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-100 shadow-sm"
              title="Modifica"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            {!isMember && (
              <button 
                onClick={onDelete}
                className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-100 shadow-sm"
                title="Elimina"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">{participant.group || 'Amico'}</span>
          {participant.role && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• {participant.role}</span>
          )}
          {isMember && (
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border",
              isActive ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-amber-600 bg-amber-50 border-amber-100"
            )}>
              {isActive ? 'Membro Attivo' : 'In Attesa'}
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-pink-600 transition-colors">
          {participant.name} {participant.surname}
        </h3>
        {participant.email && (
          <p className="text-xs text-slate-400 truncate mt-0.5">{participant.email}</p>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
        {isMember && status === 'pending' && canManage && (
          <button 
            onClick={async () => {
              await updateDoc(doc(db, 'parties', party!.id!), {
                [`memberStatus.${participant.uid}`]: 'active'
              });
            }}
            className="w-full py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-100"
          >
            <ShieldCheck className="w-4 h-4" />
            Accetta alla Festa
          </button>
        )}
        <button 
          onClick={onFilter}
          className="w-full py-2.5 bg-pink-50 text-pink-600 text-sm font-bold rounded-xl hover:bg-pink-100 transition-all flex items-center justify-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Vedi cosa ha portato
        </button>
      </div>
    </div>
  );
}
