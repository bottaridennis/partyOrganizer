import React, { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Info } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Segmented, Select, Stepper, Textarea } from '../ui/Field';
import { ProductThumb } from '../ui/misc';
import { useParty } from '../../lib/party-context';
import { fullName, isDrink } from '../../lib/utils';
import { useToast } from '../ui/Toast';
import type { MovementType } from '../../hooks/usePantryActions';
import type { Product } from '../../types';

export function ProductMovementModal({ product, onClose, initialType = 'withdraw' }: { product: Product; onClose: () => void; initialType?: MovementType }) {
  const { data, actions, isOrganizer, me } = useParty();
  const toast = useToast();
  const [type, setType] = useState<MovementType>(product.quantity === 0 ? 'return' : initialType);
  const [quantity, setQuantity] = useState(1);
  const [participantId, setParticipantId] = useState(isOrganizer ? me?.id || 'GENERAL' : me?.id || 'GENERAL');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const max = type === 'withdraw' ? product.quantity : undefined;
  const tooMany = type === 'withdraw' && quantity > product.quantity;
  const after = type === 'withdraw' ? product.quantity - quantity : product.quantity + quantity;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const outcome: { result: 'done' | 'requested' } = { result: 'done' };
    const ok = await toast.run(async () => {
      outcome.result = await actions.handleProductMovement(product, { type, quantity, participantId, notes });
    });
    setSaving(false);
    if (ok) {
      toast.success(outcome.result === 'requested' ? 'Richiesta inviata agli organizzatori' : type === 'withdraw' ? `Prelevati ${quantity} × ${product.name}` : `Aggiunti ${quantity} × ${product.name}`);
      onClose();
    }
  };

  const verb = type === 'withdraw' ? 'Preleva' : 'Rifornisci';

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={isOrganizer ? 'Movimento' : 'Richiedi movimento'}
      icon={<ProductThumb src={product.imageUrl} drink={isDrink(product)} size={48} />}
      description={<><span className="font-semibold text-ink">{product.name}</span> · {product.quantity} disponibili</>}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annulla</Button>
          <Button type="submit" form="move-form" variant={type === 'withdraw' ? 'accent' : 'primary'} loading={saving} disabled={tooMany || quantity <= 0}>
            {isOrganizer ? `${verb} ${quantity}` : 'Invia richiesta'}
          </Button>
        </>
      }
    >
      <form id="move-form" onSubmit={submit} className="space-y-5">
        <Segmented
          className="w-full"
          value={type}
          onChange={t => {
            setType(t);
            if (t === 'withdraw') setQuantity(q => Math.min(q, Math.max(1, product.quantity)));
          }}
          options={[
            { value: 'withdraw', label: 'Preleva', icon: ArrowUpFromLine, tone: 'accent' },
            { value: 'return', label: 'Aggiungi', icon: ArrowDownToLine, tone: 'ok' },
          ]}
        />
        <div className="flex items-end justify-between gap-4">
          <Field label="Quantità">
            <Stepper value={quantity} min={1} max={max} onChange={setQuantity} />
          </Field>
          <div className="text-right pb-1">
            <p className="text-xs text-ink-3">Dopo il movimento</p>
            <p className="font-display text-2xl font-extrabold tabular">{Math.max(0, after)} <span className="text-sm font-semibold text-ink-3">pz</span></p>
          </div>
        </div>
        {product.quantity === 0 && type === 'withdraw' && <p className="text-sm text-danger">Il prodotto è esaurito.</p>}
        <Field label={type === 'withdraw' ? 'Per chi' : 'Chi lo porta'} htmlFor="m-who">
          <Select id="m-who" value={participantId} onChange={e => setParticipantId(e.target.value)} disabled={!isOrganizer && !!me}>
            <option value="GENERAL">🎉 Tutta la festa</option>
            {data.participants.map(p => <option key={p.id} value={p.id}>{fullName(p)}</option>)}
          </Select>
        </Field>
        <Field label="Nota" htmlFor="m-notes" optional>
          <Textarea id="m-notes" rows={2} maxLength={300} className="min-h-0" placeholder={type === 'withdraw' ? 'es. per il brindisi delle 23' : 'es. comprate al supermercato'} value={notes} onChange={e => setNotes(e.target.value)} />
        </Field>
        {!isOrganizer && (
          <p className="flex gap-2 text-sm text-ink-2 p-3 rounded-xl bg-info-soft">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-info-soft-ink" />
            Un organizzatore riceverà la richiesta: la quantità cambia quando la approva.
          </p>
        )}
      </form>
    </Modal>
  );
}
