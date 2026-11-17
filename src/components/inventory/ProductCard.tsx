import { AlertTriangle, ArrowLeftRight, CalendarClock, MoreHorizontal, Pencil, Trash2, Wine } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge, Meter, ProductThumb } from '../ui/misc';
import { cn, expiryState, formatDate, formatEuro, isAlcoholic, isDrink, isLowStock } from '../../lib/utils';
import type { Product } from '../../types';

export interface ProductCardProps {
  product: Product;
  ownerName: string;
  viewMode: 'grid' | 'list';
  canManage: boolean;
  canDelete: boolean;
  /** True when the user moves stock directly instead of filing a request. */
  direct: boolean;
  onMove: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function StatusBadges({ product }: { product: Product }) {
  const exp = expiryState(product);
  const low = isLowStock(product);
  return (
    <>
      {product.quantity === 0 ? <Badge tone="danger">Esaurito</Badge> : low && <Badge tone="warn" icon={AlertTriangle}>Sta finendo</Badge>}
      {exp === 'expired' && <Badge tone="danger" icon={CalendarClock}>Scaduto</Badge>}
      {exp === 'soon' && <Badge tone="warn" icon={CalendarClock}>Scade {formatDate(product.expiryDate, { day: 'numeric', month: 'short' })}</Badge>}
    </>
  );
}

function ActionsMenu({ onEdit, onDelete, canDelete }: { onEdit: () => void; onDelete: () => void; canDelete: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Altre azioni"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 grid place-items-center rounded-xl text-ink-3 hover:bg-surface-2 hover:text-ink"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-20 w-44 p-1.5 rounded-2xl bg-surface border border-line shadow-[var(--shadow-pop)] animate-pop">
          <button onClick={() => { setOpen(false); onEdit(); }} className="w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-sm font-semibold hover:bg-surface-2">
            <Pencil className="w-4 h-4" /> Modifica
          </button>
          {canDelete && (
            <button onClick={() => { setOpen(false); onDelete(); }} className="w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-sm font-semibold text-danger hover:bg-danger-soft">
              <Trash2 className="w-4 h-4" /> Elimina
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ProductCard({ product, ownerName, viewMode, canManage, canDelete, direct, onMove, onEdit, onDelete }: ProductCardProps) {
  const drink = isDrink(product);
  const low = isLowStock(product);
  const total = (product.initialQuantity ?? product.quantity) || 0;
  const stockPct = total > 0 ? (product.quantity / total) * 100 : 0;
  const tone = product.quantity === 0 ? 'danger' : low ? 'warn' : 'ok';

  if (viewMode === 'list') {
    return (
      <div className={cn('group flex items-center gap-3 sm:gap-4 p-3 pr-2 rounded-2xl bg-surface border border-line hover:border-line-strong transition-colors', product.quantity === 0 && 'opacity-75')}>
        <ProductThumb src={product.imageUrl} drink={drink} size={52} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-bold truncate">{product.name}</p>
            <span className="hidden sm:flex gap-1.5"><StatusBadges product={product} /></span>
          </div>
          <p className="text-sm text-ink-3 truncate">{product.category} · {ownerName}</p>
        </div>
        <div className="hidden md:block w-28 text-right">
          {product.price > 0 && <p className="text-sm font-semibold tabular">{formatEuro(product.price)}<span className="text-ink-3 font-normal">/pz</span></p>}
        </div>
        <div className="w-16 text-right">
          <p className={cn('font-display text-xl font-extrabold tabular', tone === 'danger' ? 'text-danger' : tone === 'warn' ? 'text-warn' : 'text-ink')}>{product.quantity}</p>
          <p className="text-[11px] text-ink-3 -mt-0.5">pz</p>
        </div>
        <button onClick={onMove} aria-label={`Movimento ${product.name}`} className="w-10 h-10 grid place-items-center rounded-xl bg-brand-soft text-brand-soft-ink hover:brightness-95">
          <ArrowLeftRight className="w-[18px] h-[18px]" />
        </button>
        {canManage ? <ActionsMenu onEdit={onEdit} onDelete={onDelete} canDelete={canDelete} /> : <span className="w-9" />}
      </div>
    );
  }

  return (
    <article className={cn('group flex flex-col rounded-3xl bg-surface border border-line shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-pop)] hover:-translate-y-0.5 transition-all overflow-hidden', product.quantity === 0 && 'opacity-80')}>
      <div className="p-4 pb-3 flex gap-3">
        <ProductThumb src={product.imageUrl} drink={drink} size={64} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="flex-1 font-sans text-[16px] font-bold leading-snug line-clamp-2 tracking-normal">{product.name}</h3>
            {canManage && <div className="-mr-2 -mt-1.5"><ActionsMenu onEdit={onEdit} onDelete={onDelete} canDelete={canDelete} /></div>}
          </div>
          <p className="text-[13px] text-ink-3 truncate mt-0.5">{[product.brand, product.category].filter(Boolean).join(' · ')}</p>
        </div>
      </div>

      <div className="px-4 flex flex-wrap gap-1.5 min-h-6">
        <StatusBadges product={product} />
        {drink && isAlcoholic(product) && <Badge tone="brand" icon={Wine}>{product.alcoholContent ? `${product.alcoholContent}%` : 'Alcolico'}</Badge>}
        {product.labels?.filter(l => l !== 'Alcolico' && l !== 'Analcolico').slice(0, 2).map(l => <Badge key={l}>{l}</Badge>)}
      </div>

      <div className="px-4 pt-4 mt-auto">
        <div className="flex items-end justify-between mb-2">
          <p className="font-display text-3xl font-extrabold leading-none tabular">
            {product.quantity}
            <span className="text-sm font-semibold text-ink-3 ml-1">/ {total} pz</span>
          </p>
          {product.price > 0 && <p className="text-sm text-ink-2 tabular">{formatEuro(product.price)}/pz</p>}
        </div>
        <Meter value={stockPct} tone={tone} />
        {drink && (product.fillLevel ?? 100) < 100 && product.quantity > 0 && (
          <p className="text-xs text-ink-3 mt-2">Bottiglia aperta al {product.fillLevel}%</p>
        )}
        {product.allergens && <p className="text-xs text-warn-soft-ink mt-2 truncate">⚠︎ Allergeni: {product.allergens}</p>}
      </div>

      <div className="flex items-center gap-2 p-4 pt-4">
        <p className="flex-1 min-w-0 text-[13px] text-ink-2 truncate" title={ownerName}>
          <span className="text-ink-3">Porta </span>
          <span className="font-semibold">{ownerName}</span>
        </p>
        <button onClick={onMove} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-brand-soft text-brand-soft-ink text-sm font-bold hover:brightness-95 active:scale-95 transition-all">
          <ArrowLeftRight className="w-4 h-4" />
          {direct ? 'Movimento' : 'Richiedi'}
        </button>
      </div>
    </article>
  );
}
