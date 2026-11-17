import React, { useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, History, Plus, Trash2 } from 'lucide-react';
import { useParty } from '../../lib/party-context';
import { Button, IconButton } from '../ui/Button';
import { Field, Segmented, Select, Stepper, Textarea } from '../ui/Field';
import { Card, EmptyState, PageHeader } from '../ui/misc';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { cn, formatDate, fullName, timeAgo } from '../../lib/utils';
import type { LogLine, MovementType } from '../../hooks/usePantryActions';
import type { PantryLog } from '../../types';

export function LogsView() {
  const { data, isOrganizer, confirmDelete } = useParty();
  const [adding, setAdding] = useState(false);

  const byDay = useMemo(() => {
    const map = new Map<string, PantryLog[]>();
    for (const l of data.logs) {
      const day = l.date.slice(0, 10);
      map.set(day, [...(map.get(day) || []), l]);
    }
    return [...map.entries()];
  }, [data.logs]);

  const who = (id: string) => (id === 'GENERAL' ? 'Tutta la festa' : fullName(data.participants.find(p => p.id === id)) || 'Partecipante rimosso');
  const dayLabel = (d: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    return d === today ? 'Oggi' : d === yesterday ? 'Ieri' : formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div>
      <PageHeader
        title="Movimenti"
        description="Tutto ciò che è entrato e uscito dalla dispensa."
        actions={isOrganizer && <Button icon={Plus} onClick={() => setAdding(true)}>Registra movimento</Button>}
      />

      {byDay.length === 0 ? (
        <EmptyState icon={History} title="Nessun movimento" description="Prelievi e rifornimenti appariranno qui, in ordine di tempo." />
      ) : (
        <div className="space-y-8">
          {byDay.map(([day, logs]) => (
            <section key={day}>
              <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-ink-3 mb-3 first-letter:uppercase">{dayLabel(day)}</h2>
              <ol className="relative space-y-3 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-line">
                {logs.map(log => {
                  const allIn = log.productsUsed.every(i => i.type === 'return');
                  return (
                    <li key={log.id} className="relative flex gap-4">
                      <span className={cn('relative z-10 w-10 h-10 rounded-xl grid place-items-center shrink-0 ring-4 ring-bg', allIn ? 'bg-ok-soft text-ok-soft-ink' : 'bg-accent-soft text-accent-soft-ink')}>
                        {allIn ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
                      </span>
                      <Card className="flex-1 min-w-0 p-4">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold">{log.description}</p>
                            <p className="text-sm text-ink-3 mt-0.5">
                              {who(log.participantId)} · registrato da {log.organizer} · {timeAgo(log.date)}
                            </p>
                          </div>
                          {isOrganizer && <IconButton icon={Trash2} size="sm" variant="danger-ghost" label="Elimina dal registro" onClick={() => confirmDelete({ type: 'log', id: log.id!, name: log.description })} />}
                        </div>
                        <ul className="flex flex-wrap gap-1.5 mt-3">
                          {log.productsUsed.map((it, i) => (
                            <li key={i} className={cn('inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold', it.type === 'return' ? 'bg-ok-soft text-ok-soft-ink' : 'bg-surface-2 text-ink-2')}>
                              {it.type === 'return' ? '+' : '−'}{it.quantity} {it.productName}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

      {adding && <AddLogModal onClose={() => setAdding(false)} />}
    </div>
  );
}

function AddLogModal({ onClose }: { onClose: () => void }) {
  const { data, actions, me } = useParty();
  const toast = useToast();
  const [participantId, setParticipantId] = useState(me?.id || 'GENERAL');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<LogLine[]>([]);
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [type, setType] = useState<MovementType>('withdraw');
  const [saving, setSaving] = useState(false);

  const add = () => {
    const p = data.products.find(x => x.id === productId);
    if (!p || qty <= 0) return;
    setLines(l => [...l, { productId: p.id!, productName: p.name, quantity: qty, type }]);
    setProductId('');
    setQty(1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await toast.run(() => actions.addPantryLog({ description, participantId, lines }, data.products), 'Movimento registrato, quantità aggiornate');
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Registra movimento"
      description="Più prodotti in un colpo solo: le quantità in dispensa si aggiornano automaticamente."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annulla</Button>
          <Button type="submit" form="log-form" loading={saving} disabled={lines.length === 0}>Registra {lines.length > 0 && `(${lines.length})`}</Button>
        </>
      }
    >
      <form id="log-form" onSubmit={submit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Per chi" htmlFor="l-who">
            <Select id="l-who" value={participantId} onChange={e => setParticipantId(e.target.value)}>
              <option value="GENERAL">🎉 Tutta la festa</option>
              {data.participants.map(p => <option key={p.id} value={p.id}>{fullName(p)}</option>)}
            </Select>
          </Field>
          <Field label="Descrizione" htmlFor="l-desc" optional>
            <Textarea id="l-desc" rows={1} className="min-h-11 py-2.5" maxLength={300} placeholder="es. Aperitivo delle 19" value={description} onChange={e => setDescription(e.target.value)} />
          </Field>
        </div>

        <div className="p-4 rounded-2xl bg-surface-2 space-y-3">
          <p className="text-sm font-bold">Aggiungi prodotto</p>
          <Segmented size="sm" value={type} onChange={setType} options={[{ value: 'withdraw', label: 'Prelievo', tone: 'accent' }, { value: 'return', label: 'Rifornimento', tone: 'ok' }]} />
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Select aria-label="Prodotto" value={productId} onChange={e => setProductId(e.target.value)}>
                <option value="">Scegli un prodotto…</option>
                {data.products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.quantity} pz</option>)}
              </Select>
            </div>
            <Stepper value={qty} min={1} onChange={setQty} />
            <Button variant="soft" icon={Plus} onClick={add} disabled={!productId}>Aggiungi</Button>
          </div>
        </div>

        {lines.length > 0 && (
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {lines.map((l, i) => (
              <li key={i} className="flex items-center gap-3 p-3">
                <span className={cn('w-8 h-8 rounded-lg grid place-items-center text-sm font-bold', l.type === 'return' ? 'bg-ok-soft text-ok-soft-ink' : 'bg-accent-soft text-accent-soft-ink')}>{l.type === 'return' ? '+' : '−'}</span>
                <span className="flex-1 font-semibold truncate">{l.productName}</span>
                <span className="tabular font-bold">{l.quantity} pz</span>
                <IconButton icon={Trash2} size="sm" variant="danger-ghost" label="Rimuovi riga" onClick={() => setLines(ls => ls.filter((_, j) => j !== i))} />
              </li>
            ))}
          </ul>
        )}
      </form>
    </Modal>
  );
}
