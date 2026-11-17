import React, { useMemo, useState } from 'react';
import { Euro, Plus, Tag, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Chip, Field, Input, Segmented, Select, Stepper, Switch } from '../ui/Field';
import { ImageSelector } from '../common/ImageSelector';
import { DEFAULT_RESOURCE_IMAGES } from '../../constants';
import { useParty } from '../../lib/party-context';
import { COMMON, fullName, isCommonOwner, participantKey } from '../../lib/utils';
import { useToast } from '../ui/Toast';
import type { Product } from '../../types';

const LABEL_SUGGESTIONS = ['Senza glutine', 'Vegano', 'Vegetariano', 'Senza lattosio', 'Fresco', 'Surgelato', 'Piccante', 'Da tenere in frigo'];

type Draft = Omit<Product, 'id' | 'partyId' | 'lastUpdated' | 'updatedBy'>;

const empty = (broughtBy: string): Draft => ({
  name: '',
  brand: '',
  code: `PRD-${Date.now().toString(36).toUpperCase()}`,
  quantity: 1,
  initialQuantity: 1,
  minQuantity: 1,
  type: 'food',
  category: 'Cibo',
  price: 0,
  alcoholContent: 0,
  fillLevel: 100,
  expiryDate: '',
  labels: [],
  allergens: '',
  broughtBy,
  imageUrl: '',
});

export function ProductForm({ open, onClose, product }: { open: boolean; onClose: () => void; product?: Product | null }) {
  const { data, actions, isOrganizer, user } = useParty();
  const toast = useToast();
  const editing = !!product;
  const [draft, setDraft] = useState<Draft>(() => {
    if (!product) return empty(isOrganizer ? COMMON : user.uid);
    const { id, partyId, lastUpdated, updatedBy, ...rest } = product;
    return { ...empty(COMMON), ...rest, broughtBy: isCommonOwner(rest.broughtBy) ? COMMON : rest.broughtBy, initialQuantity: rest.initialQuantity ?? rest.quantity };
  });
  const [customLabel, setCustomLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(d => ({ ...d, [key]: value }));
  const drink = draft.type === 'drink';
  const alcoholic = draft.labels.includes('Alcolico');

  const categories = useMemo(() => {
    const names = new Set(data.categories.map(c => c.name));
    ['Cibo', 'Bevanda'].forEach(n => names.add(n));
    if (draft.category) names.add(draft.category);
    return [...names].sort((a, b) => a.localeCompare(b, 'it'));
  }, [data.categories, draft.category]);

  // Non-organizers can only assign a product to themselves or to everyone.
  const owners = isOrganizer ? data.participants : data.participants.filter(p => p.uid === user.uid);

  const toggleLabel = (label: string) =>
    set('labels', draft.labels.includes(label) ? draft.labels.filter(l => l !== label) : [...draft.labels, label]);

  const setAlcoholic = (on: boolean) => {
    const labels = draft.labels.filter(l => l !== 'Alcolico' && l !== 'Analcolico');
    setDraft(d => ({ ...d, labels: [...labels, on ? 'Alcolico' : 'Analcolico'], alcoholContent: on ? d.alcoholContent || 5 : 0 }));
  };

  const setType = (type: 'food' | 'drink') => {
    setDraft(d => ({
      ...d,
      type,
      category: d.category === 'Cibo' || d.category === 'Bevanda' || !d.category ? (type === 'drink' ? 'Bevanda' : 'Cibo') : d.category,
      labels: type === 'food' ? d.labels.filter(l => l !== 'Alcolico' && l !== 'Analcolico') : d.labels,
      alcoholContent: type === 'food' ? 0 : d.alcoholContent,
      fillLevel: type === 'food' ? 100 : d.fillLevel,
    }));
  };

  const addCustomLabel = () => {
    const l = customLabel.trim();
    if (l && !draft.labels.includes(l)) set('labels', [...draft.labels, l]);
    setCustomLabel('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    setSaving(true);
    const payload: Draft = {
      ...draft,
      name: draft.name.trim(),
      brand: draft.brand.trim(),
      allergens: draft.allergens.trim(),
      initialQuantity: editing ? Math.max(draft.initialQuantity ?? 0, draft.quantity) : draft.quantity,
    };
    const ok = await toast.run(
      () => (editing ? actions.updateProduct({ ...product!, ...payload }) : actions.addProduct(payload)),
      editing ? 'Prodotto aggiornato' : `${payload.name} aggiunto alla dispensa 🎉`
    );
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Modifica prodotto' : 'Nuovo prodotto'}
      description={editing ? product!.name : 'Aggiungi qualcosa alla dispensa della festa.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annulla</Button>
          <Button type="submit" form="product-form" loading={saving} disabled={!draft.name.trim()}>
            {editing ? 'Salva modifiche' : 'Aggiungi alla dispensa'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="space-y-7">
        <section className="space-y-4">
          <Segmented
            className="w-full"
            value={draft.type}
            onChange={setType}
            options={[
              { value: 'food', label: '🍕 Cibo', tone: 'accent' },
              { value: 'drink', label: '🥤 Bevanda', tone: 'brand' },
            ]}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome" htmlFor="p-name">
              <Input id="p-name" required autoFocus maxLength={80} placeholder={drink ? 'es. Spritz Aperol' : 'es. Pizza margherita'} value={draft.name} onChange={e => set('name', e.target.value)} />
            </Field>
            <Field label="Marca" htmlFor="p-brand" optional>
              <Input id="p-brand" maxLength={60} placeholder="es. Barilla" value={draft.brand} onChange={e => set('brand', e.target.value)} />
            </Field>
            <Field label="Categoria" htmlFor="p-cat">
              <Select id="p-cat" value={draft.category} onChange={e => set('category', e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Chi lo porta" htmlFor="p-owner">
              <Select id="p-owner" value={draft.broughtBy} onChange={e => set('broughtBy', e.target.value)}>
                <option value={COMMON}>🤝 In comune</option>
                {owners.map(p => <option key={p.id} value={participantKey(p)}>{fullName(p)}{p.uid === user.uid ? ' (tu)' : ''}</option>)}
              </Select>
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-ink">Quantità e prezzo</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label={editing ? 'Disponibili ora' : 'Quantità'}>
              <Stepper value={draft.quantity} min={0} onChange={v => set('quantity', v)} />
            </Field>
            <Field label="Avvisami sotto i" hint="Finisce in lista della spesa.">
              <Stepper value={draft.minQuantity} min={0} onChange={v => set('minQuantity', v)} />
            </Field>
            <Field label="Prezzo per pezzo" htmlFor="p-price" optional>
              <Input
                id="p-price"
                icon={Euro}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="0,00"
                value={draft.price || ''}
                onChange={e => set('price', Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </Field>
          </div>
          {editing && (
            <Field label="Pezzi acquistati in totale" hint="Serve per calcolare la spesa nei report.">
              <Stepper value={draft.initialQuantity ?? draft.quantity} min={0} onChange={v => set('initialQuantity', v)} />
            </Field>
          )}
        </section>

        {drink && (
          <section className="space-y-4 p-4 rounded-2xl bg-surface-2">
            <Switch checked={alcoholic} onChange={setAlcoholic} label="Bevanda alcolica" description="Viene segnalata nella dispensa e nelle statistiche." />
            {alcoholic && (
              <Field label="Gradazione" htmlFor="p-abv">
                <Input id="p-abv" type="number" inputMode="decimal" min={0} max={100} step="0.1" suffix="% vol" value={draft.alcoholContent || ''} onChange={e => set('alcoholContent', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))} />
              </Field>
            )}
            <Field label={`Quanto è piena la bottiglia aperta: ${draft.fillLevel}%`} htmlFor="p-fill">
              <input id="p-fill" type="range" min={0} max={100} step={5} value={draft.fillLevel} onChange={e => set('fillLevel', parseInt(e.target.value, 10))} className="w-full accent-[var(--brand)]" />
            </Field>
          </section>
        )}

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-ink">Dettagli</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Scadenza" htmlFor="p-exp" optional>
              <Input id="p-exp" type="date" value={draft.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
            </Field>
            <Field label="Allergeni" htmlFor="p-all" optional>
              <Input id="p-all" maxLength={120} placeholder="es. glutine, frutta a guscio" value={draft.allergens} onChange={e => set('allergens', e.target.value)} />
            </Field>
          </div>
          <Field label="Etichette">
            <div className="flex flex-wrap gap-2">
              {[...new Set([...LABEL_SUGGESTIONS, ...draft.labels.filter(l => l !== 'Alcolico' && l !== 'Analcolico')])].map(l => (
                <Chip key={l} active={draft.labels.includes(l)} onClick={() => toggleLabel(l)}>{l}</Chip>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                icon={Tag}
                placeholder="Aggiungi un'etichetta"
                value={customLabel}
                maxLength={30}
                onChange={e => setCustomLabel(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomLabel();
                  }
                }}
              />
              <Button variant="secondary" icon={Plus} onClick={addCustomLabel} disabled={!customLabel.trim()} aria-label="Aggiungi etichetta" />
            </div>
          </Field>
          <Field label="Immagine" optional>
            <ImageSelector images={DEFAULT_RESOURCE_IMAGES} selected={draft.imageUrl || ''} onSelect={url => set('imageUrl', url)} />
          </Field>
          {draft.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {draft.labels.map(l => (
                <span key={l} className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-lg bg-brand-soft text-brand-soft-ink text-xs font-semibold">
                  {l}
                  <button type="button" aria-label={`Rimuovi ${l}`} onClick={() => toggleLabel(l)} className="w-5 h-5 grid place-items-center rounded-md hover:bg-black/5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>
      </form>
    </Modal>
  );
}
