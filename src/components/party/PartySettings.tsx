import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Settings2, 
  Users, 
  ShieldCheck, 
  PartyPopper, 
  Users2,
  UserPlus,
  Layers,
  X,
  Loader2,
  LogOut,
  Beer,
  Pizza
} from 'lucide-react';
import { Category, Group, ParticipantRole, Party, UserProfile } from '../../types';
import { cn } from '../../lib/utils';

export function PartySettings({ 
  categories, 
  groups, 
  roles, 
  parties,
  userProfile,
  onAddCategory, 
  onDeleteCategory,
  onAddGroup, 
  onDeleteGroup,
  onAddRole, 
  onDeleteRole,
  onAddParty,
  onDeleteParty,
  onLeaveParty,
  onUpdateMemberRole,
  onRemoveMember,
  onClose
}: { 
  categories: Category[], 
  groups: Group[], 
  roles: ParticipantRole[], 
  parties: Party[],
  userProfile: UserProfile,
  onAddCategory: (name: string) => Promise<void>, 
  onDeleteCategory: (id: string) => Promise<void>,
  onAddGroup: (name: string) => Promise<void>, 
  onDeleteGroup: (id: string) => Promise<void>,
  onAddRole: (name: string) => Promise<void>, 
  onDeleteRole: (id: string) => Promise<void>,
  onAddParty: (name: string) => Promise<void>,
  onDeleteParty: (id: string) => Promise<void>,
  onLeaveParty: (id: string) => Promise<void>,
  onUpdateMemberRole: (partyId: string, uid: string, role: 'organizer' | 'participant') => Promise<void>,
  onRemoveMember: (partyId: string, uid: string) => Promise<void>,
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<'categories' | 'groups' | 'roles' | 'parties'>('categories');
  const [newValue, setNewValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const currentParty = parties.find(w => w.id === userProfile.partyId);
  const isOwner = currentParty?.ownerUid === userProfile.uid;

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    setIsAdding(true);
    try {
      if (activeTab === 'categories') await onAddCategory(newValue);
      if (activeTab === 'groups') await onAddGroup(newValue);
      if (activeTab === 'roles') await onAddRole(newValue);
      if (activeTab === 'parties') await onAddParty(newValue);
      setNewValue('');
    } finally {
      setIsAdding(false);
    }
  };

  const tabs = [
    { id: 'categories', label: 'Categorie', icon: Layers },
    { id: 'groups', label: 'Gruppi Amici', icon: Users2 },
    { id: 'roles', label: 'Ruoli Festa', icon: ShieldCheck },
    { id: 'parties', label: 'Feste', icon: PartyPopper },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col my-auto max-h-[95vh]">
        <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-pink-100">
              <Settings2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Impostazioni Festa</h3>
              <p className="text-xs text-slate-500">Gestisci dizionari, feste e permessi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="w-full md:w-56 bg-slate-50 border-r border-slate-100 p-2 flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  activeTab === tab.id ? "bg-white text-pink-600 shadow-sm" : "text-slate-500 hover:bg-white/50"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="flex gap-3">
                <input 
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                  placeholder={`Nuovo ${activeTab === 'groups' ? 'gruppo' : activeTab === 'roles' ? 'ruolo' : activeTab === 'parties' ? 'festa' : 'categoria'}...`}
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAdd()}
                />
                <button 
                  onClick={handleAdd}
                  disabled={isAdding || !newValue.trim()}
                  className="px-6 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 transition-all shadow-lg shadow-pink-100 disabled:opacity-50 flex items-center gap-2"
                >
                  {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Aggiungi
                </button>
              </div>

              <div className="space-y-3">
                {activeTab === 'categories' && categories.map(item => (
                  <DictionaryItem key={item.id} name={item.name} onDelete={() => onDeleteCategory(item.id!)} />
                ))}
                {activeTab === 'groups' && groups.map(item => (
                  <DictionaryItem key={item.id} name={item.name} onDelete={() => onDeleteGroup(item.id!)} />
                ))}
                {activeTab === 'roles' && roles.map(item => (
                  <DictionaryItem key={item.id} name={item.name} onDelete={() => onDeleteRole(item.id!)} />
                ))}
                {activeTab === 'parties' && parties.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between group hover:border-pink-200 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-pink-50 group-hover:text-pink-600 transition-all">
                        <PartyPopper className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">ID: {item.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.ownerUid === userProfile.uid ? (
                        <button 
                          onClick={() => onDeleteParty(item.id!)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Elimina Festa"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => onLeaveParty(item.id!)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                          title="Abbandona Festa"
                        >
                          <LogOut className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {activeTab === 'parties' && isOwner && currentParty && (
                <div className="mt-12 pt-8 border-t border-slate-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">Gestione Amici</h4>
                      <p className="text-xs text-slate-500">Gestisci gli accessi per la festa {currentParty.name}</p>
                    </div>
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DictionaryItem({ name, onDelete }: { name: string, onDelete: () => void }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between group hover:border-pink-200 transition-all">
      <span className="font-bold text-slate-700">{name}</span>
      <button 
        onClick={onDelete}
        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}
