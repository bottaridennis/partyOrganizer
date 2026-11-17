import { useEffect, useMemo, useState } from 'react';
import { ArrowDownAZ, LayoutGrid, List, PackageOpen, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { useParty } from '../../lib/party-context';
import { Button } from '../ui/Button';
import { Chip, Input, Select } from '../ui/Field';
import { EmptyState, PageHeader, Skeleton } from '../ui/misc';
import { ProductCard } from './ProductCard';
import { COMMON, cn, expiryState, findParticipant, fullName, isCommonOwner, isDrink, isLowStock, normalize, participantKey } from '../../lib/utils';
import type { Product } from '../../types';

type Quick = 'all' | 'food' | 'drink' | 'low' | 'expiring' | 'mine';
type Sort = 'name' | 'qty-asc' | 'qty-desc' | 'recent';

const readPref = <T,>(key: string, fallback: T): T => {
  try {
    return (localStorage.getItem(key) as T) || fallback;
  } catch {
    return fallback;
  }
};

export function InventoryView({ ownerFilter }: { ownerFilter?: string }) {
  const { data, isOrganizer, user, navigate, openProductForm, openMovement, confirmDelete } = useParty();
  const [search, setSearch] = useState('');
  const [quick, setQuick] = useState<Quick>('all');
  const [category, setCategory] = useState('all');
  const [owner, setOwner] = useState(ownerFilter || 'all');
  const [sort, setSort] = useState<Sort>(() => readPref<Sort>('pp-sort', 'name'));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => readPref('pp-view', 'grid'));
  const [showFilters, setShowFilters] = useState(!!ownerFilter);

  useEffect(() => setOwner(ownerFilter || 'all'), [ownerFilter]);
  useEffect(() => {
    try {
      localStorage.setItem('pp-view', viewMode);
      localStorage.setItem('pp-sort', sort);
    } catch {}
  }, [viewMode, sort]);

  const ownerName = (p: Product) => {
    if (isCommonOwner(p.broughtBy)) return 'Tutti';
    if (p.broughtBy === user.uid) return 'Tu';
    return fullName(findParticipant(data.participants, p.broughtBy)) || 'Ex partecipante';
  };

  const categories = useMemo(() => [...new Set(data.products.map(p => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'it')), [data.products]);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    const list = data.products.filter(p => {
      if (q && !normalize(`${p.name} ${p.brand} ${p.category} ${(p.labels || []).join(' ')}`).includes(q)) return false;
      if (category !== 'all' && p.category !== category) return false;
      if (owner !== 'all') {
        if (owner === COMMON ? !isCommonOwner(p.broughtBy) : p.broughtBy !== owner) return false;
      }
      switch (quick) {
        case 'food': return !isDrink(p);
        case 'drink': return isDrink(p);
        case 'low': return isLowStock(p);
        case 'expiring': return ['expired', 'soon'].includes(expiryState(p));
        case 'mine': return p.broughtBy === user.uid;
        default: return true;
      }
    });
    const sorters: Record<Sort, (a: Product, b: Product) => number> = {
      name: (a, b) => a.name.localeCompare(b.name, 'it'),
      'qty-asc': (a, b) => a.quantity - b.quantity,
      'qty-desc': (a, b) => b.quantity - a.quantity,
      recent: (a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''),
    };
    return list.sort(sorters[sort]);
  }, [data.products, search, category, owner, quick, sort, user.uid]);

  const counts = useMemo(() => ({
    low: data.products.filter(isLowStock).length,
    expiring: data.products.filter(p => ['expired', 'soon'].includes(expiryState(p))).length,
  }), [data.products]);

  const activeFilters = (category !== 'all' ? 1 : 0) + (owner !== 'all' ? 1 : 0);
  const reset = () => {
    setSearch('');
    setQuick('all');
    setCategory('all');
    setOwner('all');
    if (ownerFilter) navigate('dispensa');
  };

  const ownerLabel = owner !== 'all' ? (owner === COMMON ? 'In comune' : fullName(findParticipant(data.participants, owner))) : '';

  return (
    <div>
      <PageHeader
        title="Dispensa"
        description={`${data.products.length} prodotti · ${data.products.reduce((s, p) => s + p.quantity, 0)} pezzi disponibili`}
        actions={<Button icon={Plus} onClick={() => openProductForm()} className="hidden sm:inline-flex">Aggiungi prodotto</Button>}
      />

      {/* Toolbar */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <Input icon={Search} type="search" placeholder="Cerca prodotti, marche, etichette…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Cerca nella dispensa" />
        </div>
        <Button variant={showFilters || activeFilters ? 'soft' : 'secondary'} icon={SlidersHorizontal} onClick={() => setShowFilters(s => !s)} aria-expanded={showFilters}>
          <span className="hidden sm:inline">Filtri</span>
          {activeFilters > 0 && <span className="ml-0.5 w-5 h-5 rounded-full bg-brand text-white text-[11px] grid place-items-center">{activeFilters}</span>}
        </Button>
        <div className="hidden sm:flex p-1 rounded-xl bg-surface border border-line" role="radiogroup" aria-label="Vista">
          {([['grid', LayoutGrid], ['list', List]] as const).map(([mode, Icon]) => (
            <button
              key={mode}
              role="radio"
              aria-checked={viewMode === mode}
              aria-label={mode === 'grid' ? 'Griglia' : 'Elenco'}
              onClick={() => setViewMode(mode)}
              className={cn('w-9 h-9 grid place-items-center rounded-lg transition-colors', viewMode === mode ? 'bg-surface-2 text-ink' : 'text-ink-3 hover:text-ink')}
            >
              <Icon className="w-[18px] h-[18px]" />
            </button>
          ))}
        </div>
      </div>

      {showFilters && (
        <div className="grid sm:grid-cols-3 gap-3 p-4 mb-3 rounded-2xl bg-surface border border-line animate-rise">
          <Select aria-label="Categoria" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="all">Tutte le categorie</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select aria-label="Chi lo porta" value={owner} onChange={e => setOwner(e.target.value)}>
            <option value="all">Portati da chiunque</option>
            <option value={COMMON}>In comune</option>
            {data.participants.map(p => <option key={p.id} value={participantKey(p)}>{fullName(p)}</option>)}
          </Select>
          <Select aria-label="Ordina" icon={ArrowDownAZ} value={sort} onChange={e => setSort(e.target.value as Sort)}>
            <option value="name">Nome A→Z</option>
            <option value="qty-asc">Quantità: meno prima</option>
            <option value="qty-desc">Quantità: più prima</option>
            <option value="recent">Aggiornati di recente</option>
          </Select>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 mb-5">
        <Chip active={quick === 'all'} onClick={() => setQuick('all')}>Tutto</Chip>
        <Chip active={quick === 'food'} onClick={() => setQuick('food')}>🍕 Cibo</Chip>
        <Chip active={quick === 'drink'} onClick={() => setQuick('drink')}>🥤 Bevande</Chip>
        <Chip active={quick === 'low'} onClick={() => setQuick('low')}>Sta finendo {counts.low > 0 && `· ${counts.low}`}</Chip>
        <Chip active={quick === 'expiring'} onClick={() => setQuick('expiring')}>In scadenza {counts.expiring > 0 && `· ${counts.expiring}`}</Chip>
        <Chip active={quick === 'mine'} onClick={() => setQuick('mine')}>Portati da me</Chip>
      </div>

      {ownerLabel && (
        <div className="flex items-center justify-between gap-3 mb-5 p-3 pl-4 rounded-2xl bg-brand-soft text-brand-soft-ink">
          <p className="text-sm">Stai vedendo cosa porta <strong>{ownerLabel}</strong></p>
          <Button size="sm" variant="ghost" icon={X} onClick={() => { setOwner('all'); if (ownerFilter) navigate('dispensa'); }}>Rimuovi</Button>
        </div>
      )}

      {data.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-60" />)}
        </div>
      ) : data.products.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="La dispensa è vuota"
          description="Aggiungi il primo prodotto: patatine, bibite, la torta… tutto ciò che serve per la festa."
          action={<Button icon={Plus} onClick={() => openProductForm()}>Aggiungi prodotto</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="Nessun prodotto trovato" description="Prova a cambiare la ricerca o i filtri." action={<Button variant="secondary" onClick={reset}>Azzera filtri</Button>} />
      ) : (
        <div className={cn(viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-2')}>
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              ownerName={ownerName(p)}
              viewMode={viewMode}
              canManage={isOrganizer || p.broughtBy === user.uid}
              canDelete={isOrganizer}
              direct={isOrganizer}
              onMove={() => openMovement(p)}
              onEdit={() => openProductForm(p)}
              onDelete={() => confirmDelete({ type: 'product', id: p.id!, name: p.name })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
