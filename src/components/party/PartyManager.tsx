import React, { useState } from 'react';
import { 
  X, 
  PartyPopper, 
  Plus, 
  UserPlus, 
  ArrowRight, 
  LogOut, 
  Trash2, 
  ShieldCheck, 
  Users,
  Settings2,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Party, UserProfile } from '../../types';
import { cn } from '../../lib/utils';

export function PartyManager({ 
  isOpen, 
  onClose, 
  initialMode = 'select',
  parties, 
  userProfile,
  onSelectParty,
  onCreateParty,
  onJoinParty,
  onLeaveParty,
  onDeleteParty,
  onUpdateMemberRole,
  onRemoveMember
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  initialMode: 'select' | 'create' | 'join',
  parties: Party[], 
  userProfile: UserProfile,
  onSelectParty: (id: string) => Promise<void>,
  onCreateParty: (name: string) => Promise<void>,
  onJoinParty: (code: string) => Promise<void>,
  onLeaveParty: (id: string) => Promise<void>,
  onDeleteParty: (id: string) => Promise<void>,
  onUpdateMemberRole: (partyId: string, uid: string, role: 'organizer' | 'participant') => Promise<void>,
  onRemoveMember: (partyId: string, uid: string) => Promise<void>
}) {
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'manage'>(initialMode);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Update mode when initialMode changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const currentParty = parties.find(w => w.id === userProfile.partyId);
  const isOwner = currentParty?.ownerUid === userProfile.uid;

  const handleAction = async () => {
    if (!inputValue.trim()) return;
    setIsProcessing(true);
    try {
      if (mode === 'create') await onCreateParty(inputValue);
      if (mode === 'join') await onJoinParty(inputValue);
      setInputValue('');
      setMode('select');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col my-auto max-h-[95vh]">
        <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-pink-100">
              <PartyPopper className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Gestione Feste</h3>
              <p className="text-xs text-slate-500">Seleziona o crea la tua festa</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'select' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3">
                {parties.length > 0 ? (
                  parties.map(w => (
                    <button
                      key={w.id}
                      onClick={() => onSelectParty(w.id!)}
                      className={cn(
                        "p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group",
                        userProfile.partyId === w.id 
                          ? "border-pink-600 bg-pink-50" 
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                          userProfile.partyId === w.id ? "bg-pink-600 text-white" : "bg-white text-slate-400 group-hover:text-pink-600"
                        )}>
                          <PartyPopper className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{w.name}</p>
                          <p className="text-xs text-slate-500">
                            {w.ownerUid === userProfile.uid ? 'Organizzatore' : (w.memberRoles?.[userProfile.uid] === 'organizer' ? 'Organizzatore' : 'Partecipante')}
                          </p>
                        </div>
                      </div>
                      {userProfile.partyId === w.id && (
                        <CheckCircle2 className="w-6 h-6 text-pink-600" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <PartyPopper className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Non hai ancora creato o partecipato a nessuna festa.</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setMode('create')}
                  className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-pink-50 hover:border-pink-100 transition-all group"
                >
                  <div className="w-10 h-10 bg-white text-slate-400 rounded-xl flex items-center justify-center group-hover:text-pink-600 shadow-sm transition-all">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-600">Crea Nuova Festa</span>
                </button>
                <button 
                  onClick={() => setMode('join')}
                  className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-pink-50 hover:border-pink-100 transition-all group"
                >
                  <div className="w-10 h-10 bg-white text-slate-400 rounded-xl flex items-center justify-center group-hover:text-pink-600 shadow-sm transition-all">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-600">Unisciti a Festa</span>
                </button>
              </div>

              {isOwner && (
                <button 
                  onClick={() => setMode('manage')}
                  className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                >
                  <Settings2 className="w-5 h-5" />
                  Gestisci Amici e Permessi
                </button>
              )}
            </div>
          )}

          {(mode === 'create' || mode === 'join') && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {mode === 'create' ? <Plus className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
                </div>
                <h4 className="text-xl font-bold text-slate-900">
                  {mode === 'create' ? 'Crea una nuova festa' : 'Unisciti a una festa'}
                </h4>
                <p className="text-sm text-slate-500 mt-2">
                  {mode === 'create' 
                    ? 'Dai un nome alla tua festa per iniziare a organizzare la dispensa.' 
                    : 'Inserisci il codice di invito ricevuto dall\'organizzatore.'}
                </p>
              </div>

              <div className="space-y-4">
                <input 
                  autoFocus
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold text-center outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                  placeholder={mode === 'create' ? "es. Festa di Compleanno" : "es. ABC-123-XYZ"}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAction()}
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setMode('select'); setInputValue(''); }}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Annulla
                  </button>
                  <button 
                    onClick={handleAction}
                    disabled={isProcessing || !inputValue.trim()}
                    className="flex-[2] py-4 bg-pink-600 text-white font-bold rounded-2xl hover:bg-pink-700 transition-all shadow-xl shadow-pink-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                    {mode === 'create' ? 'Crea Festa' : 'Unisciti'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === 'manage' && currentParty && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <button onClick={() => setMode('select')} className="text-sm font-bold text-pink-600 hover:underline flex items-center gap-1">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Torna alla selezione
                </button>
                <div className="px-3 py-1.5 bg-pink-50 text-pink-600 rounded-xl text-xs font-bold border border-pink-100">
                  Codice Invito: {currentParty.inviteCode}
                </div>
              </div>

              <div className="space-y-3">
                {currentParty.members.map(memberUid => (
                  <div key={memberUid} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white text-slate-400 rounded-xl flex items-center justify-center border border-slate-200">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{memberUid === userProfile.uid ? 'Tu (Organizzatore)' : memberUid}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                            currentParty.memberRoles?.[memberUid] === 'organizer' ? "bg-purple-100 text-purple-700" : "bg-pink-100 text-pink-700"
                          )}>
                            {currentParty.memberRoles?.[memberUid] || 'participant'}
                          </span>
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                            currentParty.memberStatus?.[memberUid] === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {currentParty.memberStatus?.[memberUid] || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {memberUid !== userProfile.uid && (
                      <div className="flex items-center gap-2">
                        <select 
                          className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-pink-500"
                          value={currentParty.memberRoles?.[memberUid] || 'participant'}
                          onChange={(e) => onUpdateMemberRole(currentParty.id!, memberUid, e.target.value as any)}
                        >
                          <option value="participant">Partecipante</option>
                          <option value="organizer">Organizzatore</option>
                        </select>
                        <button 
                          onClick={() => onRemoveMember(currentParty.id!, memberUid)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={() => onDeleteParty(currentParty.id!)}
                  className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-100"
                >
                  <Trash2 className="w-5 h-5" />
                  Elimina Festa Definitivamente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
