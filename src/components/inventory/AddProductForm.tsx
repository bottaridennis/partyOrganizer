import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Package, 
  Tag, 
  Plus, 
  Boxes,
  Euro,
  Loader2,
  Pizza,
  Beer,
  AlertTriangle,
  Droplet,
  Calendar,
  Users
} from 'lucide-react';
import { Product, Category, Group, Participant } from '../../types';
import { ImageSelector } from '../common/ImageSelector';
import { DEFAULT_RESOURCE_IMAGES } from '../../constants';
import { cn } from '../../lib/utils';

export function AddProductForm({ 
  onAdd, 
  onCancel, 
  categories, 
  participants
}: { 
  onAdd: (product: Omit<Product, 'id' | 'lastUpdated' | 'updatedBy'>) => Promise<void>, 
  onCancel: () => void, 
  categories: Category[], 
  participants: Participant[]
}) {
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'lastUpdated' | 'updatedBy'>>({
    partyId: '',
    name: '',
    brand: '',
    code: `PRD-${Date.now().toString().slice(-6)}`,
    quantity: 1,
    initialQuantity: 1,
    minQuantity: 2,
    type: 'food',
    category: 'Cibo',
    price: 0,
    alcoholContent: 0,
    fillLevel: 100,
    expiryDate: '',
    labels: [],
    allergens: '',
    broughtBy: 'Comune',
    imageUrl: DEFAULT_RESOURCE_IMAGES[0]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'details' | 'labels'>('basic');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onAdd(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLabel = (label: string) => {
    const current = formData.labels || [];
    let nextLabels: string[];

    if (current.includes(label)) {
      nextLabels = current.filter(l => l !== label);
    } else {
      nextLabels = [...current, label];
    }
    
    setFormData({ ...formData, labels: nextLabels });
  };

  const toggleAlcoholic = (isAlcoholic: boolean) => {
    const currentLabels = formData.labels || [];
    let nextLabels = currentLabels.filter(l => l !== 'Alcolico' && l !== 'Analcolico');
    nextLabels.push(isAlcoholic ? 'Alcolico' : 'Analcolico');
    
    setFormData({ 
      ...formData, 
      labels: nextLabels,
      alcoholContent: isAlcoholic ? formData.alcoholContent : 0
    });
  };

  const sections = [
    { id: 'basic', label: 'Base', icon: Package },
    { id: 'details', label: 'Dettagli', icon: Boxes },
    { id: 'labels', label: 'Etichette', icon: Tag },
  ];

  const labelSuggestions = [
    'Senza Glutine', 'Vegano', 'Vegetariano', 
    'Fresco', 'Surgelato', 'Snack', 'Dolce', 'Salato'
  ];

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Nuovo Prodotto</h2>
          <p className="text-xs text-slate-500">Aggiungi qualcosa alla dispensa della festa</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-48 bg-slate-50 border-r border-slate-100 p-2 flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                activeSection === s.id ? "bg-white text-pink-600 shadow-sm" : "text-slate-500 hover:bg-white/50"
              )}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-6 md:p-8">
          <div className="max-w-2xl mx-auto space-y-8">
            {activeSection === 'basic' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <ImageSelector 
                  images={DEFAULT_RESOURCE_IMAGES} 
                  selected={formData.imageUrl || ''} 
                  onSelect={(url) => setFormData({ ...formData, imageUrl: url })} 
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Prodotto</label>
                    <input 
                      required
                      placeholder="es. Birra Ichnusa"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Categoria</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                      value={formData.category}
                      onChange={e => {
                        const newCategory = e.target.value;
                        const newType = newCategory === 'Bevanda' ? 'drink' : 'food';
                        setFormData({ 
                          ...formData, 
                          category: newCategory,
                          type: newType,
                          alcoholContent: newCategory === 'Bevanda' ? formData.alcoholContent : 0,
                          fillLevel: newCategory === 'Bevanda' ? formData.fillLevel : 100
                        });
                      }}
                    >
                      <option value="Cibo">Cibo 🍕</option>
                      <option value="Bevanda">Bevanda 🍹</option>
                      {categories.filter(c => c.name !== 'Cibo' && c.name !== 'Bevanda').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Portato da</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                      value={formData.broughtBy}
                      onChange={e => setFormData({ ...formData, broughtBy: e.target.value })}
                    >
                      <option value="Comune">In Comune 🤝</option>
                      {participants.map(p => <option key={p.uid} value={p.uid}>{p.name} {p.surname}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Prezzo Unitario (€)</label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="number"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'details' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Quantità Iniziale</label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                      value={formData.quantity}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 1;
                        setFormData({ ...formData, quantity: val, initialQuantity: val });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Scorta Minima (Alert)</label>
                    <input 
                      type="number"
                      min="0"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                      value={formData.minQuantity}
                      onChange={e => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {formData.category === 'Bevanda' && (
                  <div className="space-y-6 p-4 bg-blue-50/30 rounded-2xl border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          formData.labels?.includes('Alcolico') ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                        )}>
                          <Beer className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Bevanda Alcolica?</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Attiva per inserire la gradazione</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleAlcoholic(!formData.labels?.includes('Alcolico'))}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-all duration-300",
                          formData.labels?.includes('Alcolico') ? "bg-red-500" : "bg-slate-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                          formData.labels?.includes('Alcolico') ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {formData.labels?.includes('Alcolico') && (
                        <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Gradazione Alcolica (%)</label>
                          <div className="relative">
                            <Beer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              type="number"
                              step="0.1"
                              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                              value={formData.alcoholContent}
                              onChange={e => setFormData({ ...formData, alcoholContent: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                      )}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Livello Riempimento (%)</label>
                        <div className="relative">
                          <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                            value={formData.fillLevel}
                            onChange={e => setFormData({ ...formData, fillLevel: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data Scadenza</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="date"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                        value={formData.expiryDate}
                        onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Allergeni</label>
                    <div className="relative">
                      <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        placeholder="es. Glutine, Lattosio"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                        value={formData.allergens}
                        onChange={e => setFormData({ ...formData, allergens: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'labels' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Etichette Suggerite</label>
                  <div className="flex flex-wrap gap-2">
                    {labelSuggestions.map(label => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleLabel(label)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-bold border transition-all",
                          formData.labels?.includes(label)
                            ? "bg-pink-500 text-white border-pink-400 shadow-md shadow-pink-100"
                            : "bg-white text-slate-600 border-slate-200 hover:border-pink-300"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Aggiungi Etichetta Personalizzata</label>
                  <div className="flex gap-2">
                    <input 
                      id="custom-label"
                      placeholder="es. Senza Zucchero"
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.currentTarget;
                          if (input.value) {
                            toggleLabel(input.value);
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('custom-label') as HTMLInputElement;
                        if (input.value) {
                          toggleLabel(input.value);
                          input.value = '';
                        }
                      }}
                      className="p-3 bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-100 transition-all"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
              <button 
                type="button"
                onClick={onCancel}
                className="w-full sm:flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
              >
                Annulla
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="w-full sm:flex-[2] py-4 bg-pink-600 text-white font-bold rounded-2xl hover:bg-pink-700 transition-all shadow-xl shadow-pink-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                Aggiungi alla Festa
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
