import React from 'react';
import { 
  Users, 
  Search, 
  Download,
  FileText,
  Boxes,
  User as UserIcon,
  Pizza,
  Beer,
  Euro
} from 'lucide-react';
import { Participant, Product } from '../../types';
import { cn } from '../../lib/utils';

export function ParticipantContributionTable({ 
  participants, 
  products 
}: { 
  participants: Participant[], 
  products: Product[] 
}) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const contributionData = React.useMemo(() => {
    return participants.map(part => {
      const broughtProducts = products.filter(p => p.broughtBy === part.id);
      const totalSpent = broughtProducts.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 0), 0);
      return { ...part, broughtProducts, totalSpent };
    }).filter(part => 
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      part.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.broughtProducts.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [participants, products, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Contributi Amici</h2>
          <p className="text-sm text-slate-500">Visualizza cosa ha portato ogni partecipante alla festa.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Cerca amico o prodotto..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 transition-all text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {contributionData.map(part => (
          <div key={part.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                  {part.imageUrl ? <img src={part.imageUrl} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 text-slate-300" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{part.name} {part.surname}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{part.role || 'Partecipante'}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded-lg mb-1">
                  {part.broughtProducts.length} Prodotti
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Spesa Totale: €{part.totalSpent.toFixed(2)}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Prodotto</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Categoria</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Quantità</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Prezzo Tot.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {part.broughtProducts.length > 0 ? part.broughtProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {p.category === 'Bevanda' ? <Beer className="w-3 h-3 text-blue-400" /> : <Pizza className="w-3 h-3 text-orange-400" />}
                          <span className="text-sm font-bold text-slate-700">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{p.category}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-center font-bold">{p.quantity}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 text-right font-black">€{((p.price || 0) * (p.quantity || 0)).toFixed(2)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400 italic">
                        Nessun prodotto portato.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
