import React, { useState } from 'react';
import { Check, Copy, Crown, LogOut, Plus, RefreshCw, Trash2, UserMinus, X } from 'lucide-react';
import { useParty } from '../../lib/party-context';
import { Button, IconButton } from '../ui/Button';
import { Field, Input, Select } from '../ui/Field';
import { Avatar, Badge, Card, PageHeader } from '../ui/misc';
import { ConfirmDialog } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { fullName } from '../../lib/utils';
import { inviteLink } from '../../lib/router';
import { memberDocId } from '../../hooks/useParties';

export function PartySettings() {
  const { party, isOwner, data, actions, partyActions, user, confirmDelete } = useParty();
  const toast = useToast();
  const [name, setName] = useState(party.name);
  const [savingName, setSavingName] = useState(false);
  const [confirm, setConfirm] = useState<null | 'regen' | 'leave' | 'delete' | { remove: string; name: string }>(null);
  const [copied, setCopied] = useState(false);

  const members = party.members.map(uid => {
    const p = data.participants.find(x => x.id === memberDocId(party.id!, uid) || x.uid === uid);
    return {
      uid,
      name: fullName(p) || (uid === user.uid ? 'Tu' : 'Membro'),
      email: p?.email,
      imageUrl: p?.imageUrl,
      role: uid === party.ownerUid ? 'owner' : party.memberRoles?.[uid] === 'organizer' ? 'organizer' : 'participant',
      status: uid === party.ownerUid ? 'active' : party.memberStatus?.[uid] ?? 'active',
    };
  });

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === party.name) return;
    setSavingName(true);
    await toast.run(() => partyActions.renameParty(party.id!, name), 'Nome aggiornato');
    setSavingName(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink(party.inviteCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Copia non riuscita.');
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Impostazioni festa" description="Nome, inviti, membri e liste usate nei moduli." />

      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-bold mb-4">Generale</h2>
          <form onSubmit={saveName} className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <Field label="Nome della festa" htmlFor="s-name" className="flex-1" hint={!isOwner ? 'Solo chi ha creato la festa può rinominarla.' : undefined}>
              <Input id="s-name" maxLength={80} value={name} disabled={!isOwner} onChange={e => setName(e.target.value)} />
            </Field>
            {isOwner && <Button type="submit" loading={savingName} disabled={!name.trim() || name.trim() === party.name}>Salva</Button>}
          </form>

          <div className="mt-6 p-4 rounded-2xl bg-surface-2 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-ink-2">Codice invito</p>
              <p className="font-display text-3xl font-extrabold tracking-[0.2em] tabular">{party.inviteCode}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" icon={copied ? Check : Copy} onClick={copyLink}>{copied ? 'Copiato' : 'Copia link'}</Button>
              {isOwner && <Button variant="ghost" icon={RefreshCw} onClick={() => setConfirm('regen')}>Nuovo codice</Button>}
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-bold">Membri con account</h2>
          <p className="text-sm text-ink-2 mb-4">{isOwner ? 'Scegli chi può organizzare e rimuovi chi non partecipa più.' : 'Solo chi ha creato la festa può cambiare i permessi.'}</p>
          <ul className="divide-y divide-line -mx-1">
            {members.map(m => (
              <li key={m.uid} className="flex items-center gap-3 py-3 px-1">
                <Avatar name={m.name} src={m.imageUrl} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{m.name}{m.uid === user.uid && <span className="text-ink-3 font-normal"> (tu)</span>}</p>
                  <p className="text-xs text-ink-3 truncate">{m.email}</p>
                </div>
                {m.status === 'pending' && <Badge tone="warn">In attesa</Badge>}
                {m.role === 'owner' ? (
                  <Badge tone="brand" icon={Crown}>Creatore</Badge>
                ) : isOwner ? (
                  <>
                    <Select
                      aria-label={`Permessi di ${m.name}`}
                      className="h-9 text-sm w-40"
                      value={m.role}
                      onChange={e => toast.run(() => partyActions.setMemberRole(party.id!, m.uid, e.target.value as 'organizer' | 'participant'), 'Permessi aggiornati')}
                    >
                      <option value="participant">Partecipante</option>
                      <option value="organizer">Organizzatore</option>
                    </Select>
                    <IconButton icon={UserMinus} label={`Rimuovi ${m.name}`} variant="danger-ghost" size="sm" onClick={() => setConfirm({ remove: m.uid, name: m.name })} />
                  </>
                ) : (
                  <Badge tone={m.role === 'organizer' ? 'brand' : 'neutral'}>{m.role === 'organizer' ? 'Organizzatore' : 'Partecipante'}</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Dictionary title="Categorie" hint="Usate per i prodotti" items={data.categories} onAdd={n => actions.addDictionaryItem('category', n)} onDelete={i => confirmDelete({ type: 'category', id: i.id!, name: i.name })} />
          <Dictionary title="Gruppi" hint="es. Famiglia, Colleghi" items={data.groups} onAdd={n => actions.addDictionaryItem('group', n)} onDelete={i => confirmDelete({ type: 'group', id: i.id!, name: i.name })} />
          <Dictionary title="Compiti" hint="es. DJ, Barbecue" items={data.roles} onAdd={n => actions.addDictionaryItem('role', n)} onDelete={i => confirmDelete({ type: 'role', id: i.id!, name: i.name })} />
        </div>

        <Card className="p-5 sm:p-6 border-danger/30">
          <h2 className="text-lg font-bold text-danger">Zona pericolosa</h2>
          {isOwner ? (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="flex-1 text-sm text-ink-2">Elimina la festa per tutti i membri. Non si può annullare.</p>
              <Button variant="danger" icon={Trash2} onClick={() => setConfirm('delete')}>Elimina festa</Button>
            </div>
          ) : (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="flex-1 text-sm text-ink-2">Esci dalla festa. Potrai rientrare con il codice invito.</p>
              <Button variant="secondary" icon={LogOut} onClick={() => setConfirm('leave')}>Lascia la festa</Button>
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirm === 'regen'}
        onClose={() => setConfirm(null)}
        tone="primary"
        title="Generare un nuovo codice?"
        message="Il codice e il link attuali smetteranno di funzionare. Chi è già nella festa non viene toccato."
        confirmLabel="Genera"
        onConfirm={async () => { await toast.run(() => partyActions.regenerateInviteCode(party.id!), 'Nuovo codice pronto'); }}
      />
      <ConfirmDialog
        open={confirm === 'leave'}
        onClose={() => setConfirm(null)}
        title="Lasciare la festa?"
        message={<>Non vedrai più la dispensa di <strong>{party.name}</strong>.</>}
        confirmLabel="Lascia"
        onConfirm={async () => { await toast.run(() => partyActions.leaveParty(party.id!, user.uid), 'Hai lasciato la festa'); }}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        title="Eliminare la festa?"
        message={<>Tutti i membri perderanno l'accesso a <strong>{party.name}</strong>.</>}
        typeToConfirm={party.name}
        confirmLabel="Elimina per sempre"
        onConfirm={async () => { await toast.run(() => partyActions.deleteParty(party.id!, user.uid), 'Festa eliminata'); }}
      />
      <ConfirmDialog
        open={typeof confirm === 'object' && !!confirm}
        onClose={() => setConfirm(null)}
        title="Rimuovere il membro?"
        message={<><strong>{typeof confirm === 'object' && confirm?.name}</strong> non vedrà più la festa. I prodotti che ha portato restano in dispensa.</>}
        confirmLabel="Rimuovi"
        onConfirm={async () => {
          if (typeof confirm === 'object' && confirm) await toast.run(() => partyActions.removeMember(party.id!, confirm.remove), 'Membro rimosso');
        }}
      />
    </div>
  );
}

function Dictionary({ title, hint, items, onAdd, onDelete }: { title: string; hint: string; items: { id?: string; name: string }[]; onAdd: (name: string) => Promise<void>; onDelete: (item: { id?: string; name: string }) => void }) {
  const toast = useToast();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    if (items.some(i => i.name.toLowerCase() === v.toLowerCase())) {
      toast.info(`"${v}" esiste già`);
      return;
    }
    setBusy(true);
    const ok = await toast.run(() => onAdd(v));
    setBusy(false);
    if (ok) setValue('');
  };

  return (
    <Card className="p-5 flex flex-col">
      <h2 className="text-base font-bold">{title}</h2>
      <p className="text-xs text-ink-3 mb-3">{hint}</p>
      <form onSubmit={add} className="flex gap-2 mb-3">
        <Input aria-label={`Nuova voce in ${title}`} placeholder="Aggiungi…" maxLength={40} value={value} onChange={e => setValue(e.target.value)} className="h-10" />
        <IconButton icon={Plus} label="Aggiungi" variant="soft" type="submit" disabled={busy || !value.trim()} />
      </form>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && <p className="text-sm text-ink-3">Nessuna voce.</p>}
        {items.map(i => (
          <span key={i.id} className="inline-flex items-center gap-1 h-8 pl-3 pr-1 rounded-lg bg-surface-2 text-sm font-medium">
            {i.name}
            <button aria-label={`Elimina ${i.name}`} onClick={() => onDelete(i)} className="w-6 h-6 grid place-items-center rounded-md text-ink-3 hover:text-danger hover:bg-danger-soft">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </div>
    </Card>
  );
}
