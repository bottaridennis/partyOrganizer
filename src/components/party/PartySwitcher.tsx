import React, { useEffect, useState } from 'react';
import { Check, ChevronRight, KeyRound, PartyPopper, Plus, Sparkles, Ticket } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input } from '../ui/Field';
import { Badge } from '../ui/misc';
import { cn } from '../../lib/utils';
import type { Party, UserProfile } from '../../types';

export type SwitcherMode = 'select' | 'create' | 'join';

export function PartySwitcher({
  open,
  onClose,
  initialMode = 'select',
  initialCode = '',
  parties,
  profile,
  onSelect,
  onCreate,
  onJoin,
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: SwitcherMode;
  initialCode?: string;
  parties: Party[];
  profile: UserProfile;
  onSelect: (id: string) => Promise<void>;
  onCreate: (name: string) => Promise<void>;
  onJoin: (code: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<SwitcherMode>(initialMode);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setValue(initialMode === 'join' ? initialCode : '');
      setError(null);
    }
  }, [open, initialMode, initialCode]);

  const go = (m: SwitcherMode) => {
    setMode(m);
    setValue('');
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy('form');
    setError(null);
    try {
      if (mode === 'create') await onCreate(value);
      else await onJoin(value);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operazione non riuscita.');
    } finally {
      setBusy(null);
    }
  };

  const select = async (id: string) => {
    if (id === profile.partyId) return onClose();
    setBusy(id);
    try {
      await onSelect(id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operazione non riuscita.');
    } finally {
      setBusy(null);
    }
  };

  const roleOf = (p: Party) => (p.ownerUid === profile.uid || p.memberRoles?.[profile.uid] === 'organizer' ? 'Organizzatore' : 'Partecipante');
  const pending = (p: Party) => p.ownerUid !== profile.uid && p.memberStatus?.[profile.uid] === 'pending';

  const titles: Record<SwitcherMode, [string, string]> = {
    select: ['Le tue feste', 'Passa da una festa all\'altra, creane una nuova o unisciti con un codice.'],
    create: ['Nuova festa', 'Dai un nome alla festa: potrai invitare gli amici subito dopo.'],
    join: ['Unisciti a una festa', 'Inserisci il codice di 6 caratteri che ti ha mandato l\'organizzatore.'],
  };

  return (
    <Modal open={open} onClose={onClose} title={titles[mode][0]} description={titles[mode][1]} size="md">
      {error && <p role="alert" className="mb-4 p-3 rounded-xl bg-danger-soft text-danger-soft-ink text-sm">{error}</p>}

      {mode === 'select' && (
        <div className="space-y-5">
          {parties.length > 0 ? (
            <ul className="space-y-2">
              {parties.map(p => {
                const active = p.id === profile.partyId;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => select(p.id!)}
                      disabled={!!busy}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all',
                        active ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong hover:bg-surface-2'
                      )}
                    >
                      <span className={cn('w-11 h-11 rounded-xl grid place-items-center text-xl shrink-0', active ? 'bg-brand text-white' : 'bg-surface-2')}>🎉</span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-bold truncate">{p.name}</span>
                        <span className="flex items-center gap-1.5 mt-1">
                          <Badge tone={roleOf(p) === 'Organizzatore' ? 'brand' : 'neutral'}>{roleOf(p)}</Badge>
                          {pending(p) && <Badge tone="warn">In attesa</Badge>}
                          <span className="text-xs text-ink-3">{p.members.length} {p.members.length === 1 ? 'membro' : 'membri'}</span>
                        </span>
                      </span>
                      {active ? <Check className="w-5 h-5 text-brand" /> : busy === p.id ? <span className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" /> : <ChevronRight className="w-5 h-5 text-ink-3" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-6 text-ink-2">
              <PartyPopper className="w-10 h-10 mx-auto text-ink-3 mb-2" />
              Non fai ancora parte di nessuna festa.
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="soft" icon={Plus} onClick={() => go('create')}>Crea festa</Button>
            <Button variant="secondary" icon={Ticket} onClick={() => go('join')}>Ho un codice</Button>
          </div>
        </div>
      )}

      {(mode === 'create' || mode === 'join') && (
        <form onSubmit={submit} className="space-y-5">
          {mode === 'create' ? (
            <Field label="Nome della festa" htmlFor="party-name">
              <Input id="party-name" icon={Sparkles} autoFocus maxLength={80} placeholder="es. 30 anni di Giulia" value={value} onChange={e => setValue(e.target.value)} />
            </Field>
          ) : (
            <Field label="Codice invito" htmlFor="party-code" hint="Le lettere maiuscole e minuscole sono uguali.">
              <Input
                id="party-code"
                icon={KeyRound}
                autoFocus
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={8}
                placeholder="ABC123"
                className="tracking-[0.3em] font-bold uppercase"
                value={value}
                onChange={e => setValue(e.target.value.toUpperCase())}
              />
            </Field>
          )}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => go('select')}>Indietro</Button>
            <Button type="submit" loading={busy === 'form'} disabled={!value.trim()}>
              {mode === 'create' ? 'Crea festa' : 'Unisciti'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
