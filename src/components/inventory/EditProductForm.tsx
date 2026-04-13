import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Camera, 
  Package, 
  Tag, 
  MapPin, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Boxes,
  FileText,
  Euro,
  Pizza,
  Beer,
  Calendar,
  AlertCircle,
  Heart,
  Droplets,
  Percent
} from 'lucide-react';
import { Product, Category, Party, Participant } from '../../types';
import { ImageSelector } from '../common/ImageSelector';
import { CustomFieldsSection } from '../common/CustomFieldsSection';
import { DEFAULT_RESOURCE_IMAGES } from '../../constants';
import { cn } from '../../lib/utils';

export function EditProductForm({ 
  product, 
  onSave, 
  onCancel, 
  categories, 
  participants
}: { 
  product: Product, 
  onSave: (product: Product) => Promise<void>, 
  onCancel: () => void, 
  categories: Category[], 
  participants: Participant[]
}) {
  const [formData, setFormData] = useState<Product>({ ...product });
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'inventory' | 'details' | 'custom'>('basic');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'basic', label: 'Base', icon: Package },
    { id: 'inventory', label: 'Dispensa', icon: Boxes },
    { id: 'details', label: 'Dettagli', icon: Pizza },
    { id: 'custom', label: 'Campi', icon: Plus },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Modifica Prodotto</h2>
            <p className="text-xs text-slate-500">Aggiorna le informazioni di {product.name}</p>
          </div>
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
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Marca</label>
                    <input 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                      value={formData.brand}
                      onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Prezzo (€)</label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="number"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                        value={formData.price || ''}
                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Chi lo ha portato?</label>
                    <div className="relative">
                      <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                        value={formData.broughtBy || ''}
                        onChange={e => setFormData({ ...formData, broughtBy: e.target.value })}
                      >
                        <option value="">In comune</option>
                        {participants.map(p => <option key={p.id} value={p.id}>{p.name} {p.surname}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'inventory' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Categoria</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Seleziona Categoria</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipo</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    >
                      <option value="consumable">Cibo / Bevanda</option>
                      <option value="material">Attrezzatura (Piatti, Bicchieri...)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Quantità Attuale</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Scorta Minima</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                      value={formData.minQuantity}
                      onChange={e => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data Scadenza</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="date"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                      value={formData.expiryDate || ''}
                      onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'details' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Grado Alcolico (%)</label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="number"
                        step="0.1"
                        placeholder="es. 5.0"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                        value={formData.alcoholContent || ''}
                        onChange={e => setFormData({ ...formData, alcoholContent: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Livello Riempimento (%)</label>
                    <div className="relative">
                      <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                        value={formData.fillLevel || 100}
                        onChange={e => setFormData({ ...formData, fillLevel: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Allergeni</label>
                  <input 
                    placeholder="es. Glutine, Lattosio..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                    value={formData.allergens || ''}
                    onChange={e => setFormData({ ...formData, allergens: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Etichette / Note</label>
                  <input 
                    placeholder="es. Bio, Senza Zucchero..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                    value={formData.labels?.join(', ') || ''}
                    onChange={e => setFormData({ ...formData, labels: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') })}
                  />
                </div>
              </div>
            )}

            {activeSection === 'custom' && (
              <div className="animate-in fade-in duration-300">
                <CustomFieldsSection 
                  fields={formData.customFields || []} 
                  onChange={(fields) => setFormData({ ...formData, customFields: fields })}
                  suggestions={['Volume', 'Peso', 'Calorie', 'Temperatura Servizio']}
                />
              </div>
            )}

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
                Salva Modifiche
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
