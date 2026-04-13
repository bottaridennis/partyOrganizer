import React from 'react';
import { 
  Settings2, 
  Trash2, 
  ArrowLeftRight, 
  Pizza, 
  Beer, 
  Droplet, 
  Calendar, 
  AlertTriangle,
  Tag,
  Boxes
} from 'lucide-react';
import { Product } from '../../types';
import { cn } from '../../lib/utils';

export function ProductCard({ 
  product, 
  viewMode = 'grid',
  onEdit, 
  onDelete, 
  onMove, 
  canManage,
  broughtByName
}: { 
  product: Product, 
  viewMode?: 'grid' | 'list',
  onEdit: () => void, 
  onDelete: () => void, 
  onMove: () => void,
  canManage: boolean,
  broughtByName?: string
}) {
  const isLowStock = (product.quantity === 1 && product.minQuantity === 1)
    ? (product.fillLevel !== undefined && product.fillLevel < 50)
    : product.quantity <= (product.minQuantity || 2);
  const isDrink = product.category === 'Bevanda';
  const isFood = product.category === 'Cibo';
  const isCommon = !product.broughtBy || product.broughtBy === 'Comune';

  const displayBroughtBy = broughtByName ? `Portato da: ${broughtByName}` : (isCommon ? 'In Comune' : 'Privato');

  if (viewMode === 'list') {
    return (
      <div className={cn(
        "bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-4 hover:shadow-sm transition-all group"
      )}>
        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            isDrink ? <Beer className="w-6 h-6 text-blue-400" /> : <Pizza className="w-6 h-6 text-orange-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-pink-600 transition-colors">{product.name}</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              isDrink ? "text-blue-600" : "text-orange-600"
            )}>{product.category}</span>
            <span className="text-[10px] text-slate-300">•</span>
            <span className={cn(
              "text-[10px] font-bold",
              isLowStock ? "text-red-600" : "text-slate-500"
            )}>
              {product.quantity} pz
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onMove}
            className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all"
            title="Preleva/Aggiungi"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          {canManage && (
            <button 
              onClick={onEdit}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Modifica"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200 transition-all hover:shadow-xl group relative overflow-hidden",
      isLowStock && "border-red-100"
    )}>
      {isLowStock && (
        <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl z-10 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Quasi Finito!
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-md shrink-0 transition-transform group-hover:scale-110",
          isDrink ? "bg-blue-50" : "bg-orange-50"
        )}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            isDrink ? <Beer className="w-8 h-8 text-blue-400" /> : <Pizza className="w-8 h-8 text-orange-400" />
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {canManage && (
            <button 
              onClick={() => onEdit()}
              className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-100 shadow-sm"
              title="Modifica Prodotto"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => onMove()}
            className="p-2 bg-pink-500 text-white hover:bg-pink-600 rounded-xl transition-all shadow-md shadow-pink-100 border border-pink-400"
            title={canManage ? "Gestisci Quantità" : "Richiedi Prelievo"}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          {canManage && (
            <button 
              onClick={() => onDelete()}
              className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-100 shadow-sm"
              title="Elimina"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border",
            isDrink ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-orange-50 text-orange-700 border-orange-100"
          )}>
            {product.category}
          </span>
          {product.labels?.map((label, i) => (
            <span key={i} className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full uppercase tracking-wider border border-slate-200">
              {label}
            </span>
          ))}
        </div>
        <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-pink-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1">{displayBroughtBy}</p>
      </div>

      {/* Alcohol & Fill Level */}
      {(product.alcoholContent || product.fillLevel !== undefined) && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {product.alcoholContent !== undefined && (
            <div className="bg-red-50 p-2 rounded-xl border border-red-100">
              <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Alcol</p>
              <p className="text-sm font-black text-red-700">{product.alcoholContent}%</p>
            </div>
          )}
          {product.fillLevel !== undefined && (
            <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Livello</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${product.fillLevel}%` }} />
                </div>
                <span className="text-[10px] font-black text-blue-700">{product.fillLevel}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expiry & Allergens */}
      {(product.expiryDate || product.allergens) && (
        <div className="space-y-2 mb-4">
          {product.expiryDate && (
            <div className="flex items-center gap-2 text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Scade: {new Date(product.expiryDate).toLocaleDateString()}</span>
            </div>
          )}
          {product.allergens && (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold truncate">Allergeni: {product.allergens}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Quantità</p>
          <p className={cn("text-xl font-black", isLowStock ? "text-red-600" : "text-slate-900")}>
            {product.quantity} <span className="text-xs font-normal text-slate-400">pz</span>
          </p>
        </div>
        <div>
          {product.price !== undefined && product.price > 0 && (
            <>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Prezzo</p>
              <p className="text-xl font-black text-slate-900">€{product.price.toFixed(2)}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
