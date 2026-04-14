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
  Boxes,
  User,
  ShoppingBag
} from 'lucide-react';
import { Product } from '../../types';
import { cn } from '../../lib/utils';

const BottleIcon = ({ level, className, orientation = 'vertical' }: { level: number, className?: string, orientation?: 'vertical' | 'horizontal' }) => {
  if (orientation === 'horizontal') {
    return (
      <div className={cn("relative w-20 h-8 flex items-center justify-center", className)}>
        <svg viewBox="0 0 100 40" className="w-full h-full drop-shadow-sm">
          {/* Bottle Shadow/Background */}
          <path 
            d="M95 12 L95 28 L75 28 C75 28 70 35 60 35 L10 35 C5 35 2 30 2 25 L2 15 C2 10 5 5 10 5 L60 5 C70 5 75 12 75 12 Z" 
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="2.5"
          />
          {/* Liquid Fill */}
          <clipPath id={`bottle-clip-h-${level}`}>
            <path d="M95 12 L95 28 L75 28 C75 28 70 35 60 35 L10 35 C5 35 2 30 2 25 L2 15 C2 10 5 5 10 5 L60 5 C70 5 75 12 75 12 Z" />
          </clipPath>
          <rect 
            x="0" 
            y="0" 
            width={level} 
            height="40" 
            fill={level < 20 ? "#ef4444" : "#3b82f6"} 
            clipPath={`url(#bottle-clip-h-${level})`}
            className="transition-all duration-1000 ease-out"
          />
          {/* Bottle Shine */}
          <path 
            d="M15 12 L55 12" 
            stroke="white" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeOpacity="0.4"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pr-4">
          <span className={cn(
            "text-[10px] font-black leading-none drop-shadow-sm",
            level > 40 ? "text-white" : "text-blue-700"
          )}>
            {level}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-12 h-20 flex items-center justify-center", className)}>
      <svg viewBox="0 0 40 100" className="w-full h-full drop-shadow-sm">
        {/* Bottle Shadow/Background */}
        <path 
          d="M12 5 L28 5 L28 25 C28 25 35 30 35 40 L35 90 C35 95 30 98 25 98 L15 98 C10 98 5 95 5 90 L5 40 C5 30 12 25 12 25 Z" 
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth="2.5"
        />
        {/* Liquid Fill */}
        <clipPath id={`bottle-clip-${level}`}>
          <path d="M12 5 L28 5 L28 25 C28 25 35 30 35 40 L35 90 C35 95 30 98 25 98 L15 98 C10 98 5 95 5 90 L5 40 C5 30 12 25 12 25 Z" />
        </clipPath>
        <rect 
          x="0" 
          y={100 - level} 
          width="40" 
          height={level} 
          fill={level < 20 ? "#ef4444" : "#3b82f6"} 
          clipPath={`url(#bottle-clip-${level})`}
          className="transition-all duration-1000 ease-out"
        />
        {/* Bottle Shine */}
        <path 
          d="M12 40 L12 80" 
          stroke="white" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeOpacity="0.4"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pt-8">
        <span className={cn(
          "text-[10px] font-black leading-none drop-shadow-sm",
          level > 50 ? "text-white" : "text-blue-700"
        )}>
          {level}%
        </span>
      </div>
    </div>
  );
};

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
  
  const isNearExpiry = product.expiryDate ? (() => {
    const expiry = new Date(product.expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  })() : false;

  const isExpired = product.expiryDate ? new Date(product.expiryDate) < new Date() : false;

  const isDrink = product.category === 'Bevanda';
  const isFood = product.category === 'Cibo';
  const isCommon = !product.broughtBy || product.broughtBy === 'Comune';

  const displayBroughtBy = broughtByName ? `Portato da: ${broughtByName}` : (isCommon ? 'In Comune' : 'Privato');

  if (viewMode === 'list') {
    return (
      <div className={cn(
        "bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-4 hover:shadow-md transition-all group relative overflow-hidden",
        isLowStock && "border-red-100 bg-red-50/30"
      )}>
        <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-100 shadow-sm transition-transform group-hover:scale-105">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            isDrink ? <Beer className="w-7 h-7 text-blue-400" /> : <Pizza className="w-7 h-7 text-orange-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="col-span-1 md:col-span-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-pink-600 transition-colors">{product.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border",
                isDrink ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"
              )}>{product.category}</span>
              {product.labels?.slice(0, 1).map((label, i) => (
                <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase tracking-wider border border-slate-200">
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden md:block">
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Messo da</p>
            <p className="text-xs font-bold text-slate-700 truncate">{displayBroughtBy}</p>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Quantità</p>
              <p className={cn("text-sm font-black", isLowStock ? "text-red-600" : "text-slate-900")}>
                {product.quantity} <span className="text-[10px] font-normal text-slate-400">pz</span>
              </p>
            </div>
            {product.price !== undefined && product.price > 0 && (
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Prezzo Totale</p>
                <p className="text-sm font-black text-slate-900">
                  €{(product.price * product.quantity).toFixed(2)}
                  <span className="text-[10px] font-normal text-slate-400 ml-1">(€{product.price.toFixed(2)}/pz)</span>
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            {isDrink && (
              <div className="flex items-center gap-3">
                {product.labels?.includes('Alcolico') && product.alcoholContent !== undefined && (
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-bold text-red-400 uppercase">Alcol</span>
                    <span className="text-xs font-black text-red-600">{product.alcoholContent}%</span>
                  </div>
                )}
                {product.fillLevel !== undefined && (
                  <BottleIcon level={product.fillLevel} orientation="horizontal" className="hidden sm:flex" />
                )}
              </div>
            )}
            
            <div className="flex flex-col items-end min-w-[80px]">
              {isExpired ? (
                <span className="text-[9px] font-black text-red-600 uppercase bg-red-100 px-2 py-0.5 rounded-full border border-red-200">Scaduto</span>
              ) : isNearExpiry ? (
                <span className="text-[9px] font-black text-orange-600 uppercase bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200 animate-pulse">In Scadenza</span>
              ) : null}
              {product.expiryDate && (
                <p className={cn(
                  "text-[10px] font-bold mt-1",
                  isExpired ? "text-red-600" : isNearExpiry ? "text-orange-600" : "text-slate-400"
                )}>
                  {new Date(product.expiryDate).toLocaleDateString()}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={onMove}
                className="p-2 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all"
                title="Preleva/Aggiungi"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              {canManage && (
                <button 
                  onClick={onEdit}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  title="Modifica"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200 transition-all hover:shadow-xl group relative overflow-hidden",
      isLowStock && "border-red-100",
      isNearExpiry && "border-orange-100",
      isExpired && "border-red-200 bg-red-50/10"
    )}>
      {isExpired ? (
        <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl z-10 flex items-center gap-1 shadow-lg">
          <AlertTriangle className="w-3 h-3" />
          Prodotto Scaduto!
        </div>
      ) : isNearExpiry ? (
        <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl z-10 flex items-center gap-1 shadow-lg animate-pulse">
          <Calendar className="w-3 h-3" />
          Scade a Breve!
        </div>
      ) : isLowStock ? (
        <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl z-10 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Quasi Finito!
        </div>
      ) : null}
      
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
      {isDrink && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {product.labels?.includes('Alcolico') && product.alcoholContent !== undefined && (
            <div className="bg-red-50 p-2 rounded-xl border border-red-100 flex flex-col justify-center">
              <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Alcol</p>
              <p className="text-sm font-black text-red-700">{product.alcoholContent}%</p>
            </div>
          )}
          {product.fillLevel !== undefined && (
            <div className={cn(
              "p-2 rounded-xl border flex items-center justify-between",
              product.fillLevel < 20 ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"
            )}>
              <div>
                <p className={cn(
                  "text-[9px] font-bold uppercase tracking-wider",
                  product.fillLevel < 20 ? "text-red-400" : "text-blue-400"
                )}>Livello</p>
                <p className={cn(
                  "text-sm font-black",
                  product.fillLevel < 20 ? "text-red-700" : "text-blue-700"
                )}>{product.fillLevel}%</p>
              </div>
              <BottleIcon level={product.fillLevel} className="scale-90 origin-right" />
            </div>
          )}
        </div>
      )}

      {/* Expiry & Allergens */}
      {(product.expiryDate || product.allergens) && (
        <div className="space-y-2 mb-4">
          {product.expiryDate && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border",
              isExpired ? "bg-red-100 border-red-200 text-red-700" : 
              isNearExpiry ? "bg-orange-50 border-orange-100 text-orange-700" : 
              "bg-slate-50 border-slate-100 text-slate-600"
            )}>
              <Calendar className={cn("w-4 h-4", isExpired ? "text-red-500" : isNearExpiry ? "text-orange-500" : "text-slate-400")} />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5">Data di Scadenza</span>
                <span className="text-xs font-black">{new Date(product.expiryDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          )}
          {product.allergens && (
            <div className="flex items-center gap-2 text-amber-600 px-3 py-1">
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
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Prezzo Totale</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-black text-slate-900">€{(product.price * product.quantity).toFixed(2)}</p>
                <p className="text-[10px] text-slate-400 font-bold">€{product.price.toFixed(2)}/pz</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
