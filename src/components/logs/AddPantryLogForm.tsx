import React, { useState } from 'react';
import { X, Plus, Trash2, Package, Search } from 'lucide-react';
import { Product, Participant } from '../../types';

interface AddPantryLogFormProps {
  products: Product[];
  participants: Participant[];
  onAdd: (data: any) => void;
  onCancel: () => void;
}

export function AddPantryLogForm({ products, participants, onAdd, onCancel }: AddPantryLogFormProps) {
  const [description, setDescription] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<{ productId: string; productName: string; quantity: number; type: 'withdraw' | 'return' }[]>([]);
  
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [currentType, setCurrentType] = useState<'withdraw' | 'return'>('withdraw');

  const handleAddProduct = () => {
    if (!currentProductId) return;
    const product = products.find(p => p.id === currentProductId);
    if (!product) return;

    setSelectedProducts([
      ...selectedProducts,
      {
        productId: currentProductId,
        productName: product.name,
        quantity: currentQuantity,
        type: currentType
      }
    ]);
    setCurrentProductId('');
    setCurrentQuantity(1);
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantId || selectedProducts.length === 0) return;

    onAdd({
      date: new Date().toISOString(),
      description,
      participantId,
      productsUsed: selectedProducts
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900">Nuovo Movimento</h2>
            <p className="text-xs text-slate-500 font-medium">Registra prelievi o resi manuali</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Partecipante</label>
              <select
                required
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all outline-none"
              >
                <option value="">Seleziona chi effettua il movimento...</option>
                {participants.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.surname}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Descrizione / Note</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Esempio: Prelievo per cena di gruppo..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all outline-none min-h-[80px]"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Aggiungi Prodotti</label>
              <div className="grid grid-cols-1 gap-3">
                <select
                  value={currentProductId}
                  onChange={(e) => setCurrentProductId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-pink-500"
                >
                  <option value="">Scegli un prodotto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.quantity} pz)</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(parseInt(e.target.value))}
                    className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-pink-500"
                  />
                  <select
                    value={currentType}
                    onChange={(e) => setCurrentType(e.target.value as 'withdraw' | 'return')}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-pink-500"
                  >
                    <option value="withdraw">Prelievo</option>
                    <option value="return">Reso</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="bg-slate-900 text-white p-2 rounded-xl hover:bg-slate-800 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {selectedProducts.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                  {selectedProducts.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.type === 'return' ? 'bg-green-500' : 'bg-blue-500'}`} />
                        <span className="text-xs font-bold text-slate-700">{item.productName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-900">{item.quantity} pz</span>
                        <button type="button" onClick={() => handleRemoveProduct(index)} className="text-slate-300 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:flex-1 px-6 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={!participantId || selectedProducts.length === 0}
            className="w-full sm:flex-[2] px-6 py-3 bg-pink-500 text-white font-bold rounded-2xl hover:bg-pink-600 shadow-lg shadow-pink-200 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            Registra Movimento
          </button>
        </div>
      </div>
    </div>
  );
}
