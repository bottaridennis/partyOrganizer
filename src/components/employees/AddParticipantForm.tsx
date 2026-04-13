import React, { useState } from 'react';
import { 
  X, 
  Save, 
  User as UserIcon, 
  MapPin, 
  Loader2,
  Briefcase,
  Mail,
  Users,
  Heart
} from 'lucide-react';
import { Participant, Group, ParticipantRole } from '../../types';
import { ImageSelector } from '../common/ImageSelector';
import { DEFAULT_EMPLOYEE_IMAGES } from '../../constants';

export function AddParticipantForm({ 
  onAdd, 
  onCancel, 
  groups, 
  roles
}: { 
  onAdd: (participant: Omit<Participant, 'id' | 'createdAt'>) => Promise<void>, 
  onCancel: () => void, 
  groups: Group[], 
  roles: ParticipantRole[]
}) {
  const [formData, setFormData] = useState<Omit<Participant, 'id' | 'createdAt'>>({
    partyId: '',
    name: '',
    surname: '',
    group: '',
    role: '',
    code: `FRI-${Date.now().toString().slice(-4)}`,
    email: '',
    imageUrl: DEFAULT_EMPLOYEE_IMAGES[0]
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onAdd(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Nuovo Amico</h2>
          <p className="text-xs text-slate-500">Aggiungi un nuovo partecipante alla festa</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400">
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <ImageSelector 
            images={DEFAULT_EMPLOYEE_IMAGES} 
            selected={formData.imageUrl || ''} 
            onSelect={(url) => setFormData({ ...formData, imageUrl: url })} 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  required
                  placeholder="es. Mario"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Cognome</label>
              <input 
                required
                placeholder="es. Rossi"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                value={formData.surname}
                onChange={e => setFormData({ ...formData, surname: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Gruppo Amici</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                  value={formData.group}
                  onChange={e => setFormData({ ...formData, group: e.target.value })}
                >
                  <option value="">Seleziona Gruppo</option>
                  {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Ruolo alla Festa</label>
              <div className="relative">
                <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="">Seleziona Ruolo</option>
                  {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email (Opzionale)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email"
                placeholder="mario.rossi@email.it"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex gap-4">
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
            >
              Annulla
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-[2] py-4 bg-pink-600 text-white font-bold rounded-2xl hover:bg-pink-700 transition-all shadow-xl shadow-pink-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              Aggiungi Amico
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
