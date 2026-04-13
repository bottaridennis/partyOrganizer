import React, { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';

export function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmString 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string, 
  confirmString: string 
}) {
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 mb-6">{message}</p>
          
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Digita "{confirmString}" per confermare</p>
            <input 
              type="text"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-900 outline-none focus:ring-2 focus:ring-red-500 transition-all"
              placeholder={confirmString}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
            >
              Annulla
            </button>
            <button 
              onClick={() => {
                if (input === confirmString) {
                  onConfirm();
                  onClose();
                  setInput('');
                }
              }}
              disabled={input !== confirmString}
              className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
            >
              Elimina Definitivamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
