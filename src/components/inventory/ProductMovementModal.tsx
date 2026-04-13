import React, { useState } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  User as UserIcon, 
  Loader2,
  AlertTriangle,
  RotateCcw,
  Package,
  Send,
  Pizza,
  Beer,
  Plus,
  Minus
} from 'lucide-react';
import { Product, Participant, UserProfile } from '../../types';
import { cn } from '../../lib/utils';

export function ProductMovementModal({ 
  isOpen, 
  onClose, 
  product, 
  participants, 
  userProfile,
  onConfirm,
  isOrganizer
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  product: Product | null, 
  participants: Participant[], 
  userProfile: UserProfile,
  onConfirm: (data: { 
    type: 'withdraw' | 'return', 
    quantity: number, 
    participantId: string, 
    notes: string
  }) => Promise<void>,
  isOrganizer: boolean
}) {
  const [type, setType] = useState<'withdraw' | 'return'>('withdraw');
  const [quantity, setQuantity] = useState(1);
  const [participantId, setParticipantId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !product) return null;

  const currentUserParticipant = participants.find(p => p.uid === userProfile.uid);

  React.useEffect(() => {
    if (!isOrganizer && currentUserParticipant) {
      setParticipantId(currentUserParticipant.id!);
    }
  }, [isOrganizer, currentUserParticipant, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onConfirm({ type, quantity, participantId, notes });
      onClose();
      setQuantity(1);
      setParticipantId('');
      setNotes('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col my-auto max-h-[95vh]">
        <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
              type === 'withdraw' ? "bg-pink-600 text-white shadow-pink-100" : "bg-emerald-600 text-white shadow-emerald-100"
            )}>
              {type === 'withdraw' ? <Minus className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{type === 'withdraw' ? 'Preleva Prodotto' : 'Aggiungi Prodotto'}</h3>
              <p className="text-xs text-slate-500">{product.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('withdraw')}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                type === 'withdraw' ? "bg-white text-pink-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Preleva 🍕
            </button>
            <button
              type="button"
              onClick={() => setType('return')}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                type === 'return' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Aggiungi 🍹
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Quantità</label>
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all"
              >
                <Minus className="w-6 h-6" />
              </button>
              <input 
                type="number"
                min="1"
                max={type === 'withdraw' ? product.quantity : undefined}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all font-black text-center text-xl"
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              />
              <button 
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            {type === 'withdraw' && (
              <p className="text-[10px] text-slate-400 mt-1 ml-1">Disponibili in dispensa: {product.quantity} pz</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Chi sta facendo l'azione?</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                required
                disabled={!isOrganizer}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all disabled:opacity-75"
                value={participantId}
                onChange={e => setParticipantId(e.target.value)}
              >
                <option value="">Seleziona Amico</option>
                <option value="GENERAL">Generale / Festa</option>
                {participants.map(p => <option key={p.id} value={p.id}>{p.name} {p.surname}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Note (Opzionale)</label>
            <textarea 
              placeholder="es. Preso per il brindisi!"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all min-h-[80px] text-sm"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {!isOrganizer && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Come partecipante, la tua azione verrà registrata nel log della festa.
              </p>
            </div>
          )}

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
            >
              Annulla
            </button>
            <button 
              type="submit"
              disabled={isSaving || !participantId}
              className={cn(
                "flex-[2] py-4 text-white font-bold rounded-2xl transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2",
                type === 'withdraw' ? "bg-pink-600 hover:bg-pink-700 shadow-pink-100" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
              )}
            >
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              {type === 'withdraw' ? 'Conferma Prelievo' : 'Conferma Aggiunta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
