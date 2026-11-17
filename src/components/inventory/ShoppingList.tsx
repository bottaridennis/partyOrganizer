import { useMemo, useState } from 'react';
import { Check, ClipboardCopy, PartyPopper, Plus, ShoppingCart } from 'lucide-react';
import { useParty } from '../../lib/party-context';
import { Button } from '../ui/Button';
import { Badge, Card, EmptyState, PageHeader, ProductThumb } from '../ui/misc';
import { cn, expiryState, isDrink, isLowStock } from '../../lib/utils';
import { useToast } from '../ui/Toast';
import type { Product } from '../../types';

/** How many to buy so the product is back above its alert threshold. */
const suggestedQty = (p: Product) => Math.max(1, (p.minQuantity || 0) + 1 - p.quantity);

export function ShoppingList() {
  const { data, openMovement, openProductForm, party } = useParty();
  const toast = useToast();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const items = useMemo(() => {
    const low = data.products.filter(isLowStock).map(p => ({ product: p, reason: p.quantity === 0 ? 'Esaurito' : 'Sta finendo', qty: suggestedQty(p) }));
    const expired = data.products
      .filter(p => !isLowStock(p) && expiryState(p) === 'expired')
      .map(p => ({ product: p, reason: 'Scaduto', qty: Math.max(1, p.quantity) }));
    return [...low, ...expired].sort((a, b) => a.product.quantity - b.product.quantity);
  }, [data.products]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const it of items) {
      const key = isDrink(it.product) ? 'Bevande' : it.product.category || 'Altro';
      map.set(key, [...(map.get(key) || []), it]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'it'));
  }, [items]);

  const toggle = (id: string) =>
    setChecked(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const copyList = async () => {
    const text = [`🛒 Spesa per ${party.name}`, ...groups.flatMap(([g, list]) => [``, `${g}:`, ...list.map(i => `• ${i.qty} × ${i.product.name}${i.product.brand ? ` (${i.product.brand})` : ''}`)])].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Lista copiata: incollala in chat!');
    } catch {
      toast.error('Copia non riuscita.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Lista della spesa"
        description="Si compila da sola con i prodotti finiti, quasi finiti o scaduti."
        actions={items.length > 0 && <Button variant="secondary" icon={ClipboardCopy} onClick={copyList}>Copia lista</Button>}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="Non manca niente!"
          description="Tutte le scorte sono sopra la soglia di avviso. Puoi cambiare la soglia di ogni prodotto dalla sua scheda."
          action={<Button variant="secondary" icon={Plus} onClick={() => openProductForm()}>Aggiungi prodotto</Button>}
        />
      ) : (
        <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
          <div className="space-y-6">
            {groups.map(([group, list]) => (
              <section key={group}>
                <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-ink-3 mb-2 px-1">{group}</h2>
                <Card className="divide-y divide-line overflow-hidden">
                  {list.map(({ product: p, reason, qty }) => {
                    const done = checked.has(p.id!);
                    return (
                      <div key={p.id} className="flex items-center gap-3 p-3 sm:p-4">
                        <button
                          onClick={() => toggle(p.id!)}
                          aria-pressed={done}
                          aria-label={done ? `Togli spunta a ${p.name}` : `Segna ${p.name} come preso`}
                          className={cn('w-7 h-7 rounded-lg border-2 grid place-items-center shrink-0 transition-all', done ? 'bg-ok border-ok text-white' : 'border-line-strong hover:border-ok')}
                        >
                          {done && <Check className="w-4 h-4" strokeWidth={3} />}
                        </button>
                        <ProductThumb src={p.imageUrl} drink={isDrink(p)} size={44} />
                        <div className={cn('flex-1 min-w-0', done && 'opacity-50 line-through')}>
                          <p className="font-semibold truncate">{p.name}</p>
                          <p className="text-sm text-ink-3">Ne restano {p.quantity}{p.minQuantity ? ` · soglia ${p.minQuantity}` : ''}</p>
                        </div>
                        <Badge tone={reason === 'Sta finendo' ? 'warn' : 'danger'} className="hidden sm:inline-flex">{reason}</Badge>
                        <span className="font-display text-lg font-extrabold tabular w-12 text-right">×{qty}</span>
                        <Button size="sm" variant={done ? 'primary' : 'secondary'} onClick={() => openMovement(p, 'return')}>
                          {done ? 'Rifornisci' : 'Comprato'}
                        </Button>
                      </div>
                    );
                  })}
                </Card>
              </section>
            ))}
          </div>
          <Card className="p-5 lg:sticky lg:top-6">
            <ShoppingCart className="w-6 h-6 text-brand mb-3" />
            <p className="font-display text-4xl font-extrabold tabular">{items.length - checked.size}</p>
            <p className="text-sm text-ink-2">prodotti ancora da prendere su {items.length}</p>
            <p className="text-xs text-ink-3 mt-4 leading-relaxed">Quando torni dal supermercato premi <strong>Comprato</strong> per aggiornare le quantità in dispensa.</p>
          </Card>
        </div>
      )}
    </div>
  );
}
