import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Segmented, Select } from '../ui/Field';
import { ImageSelector } from '../common/ImageSelector';
import { DEFAULT_EMPLOYEE_IMAGES } from '../../constants';
import { useParty } from '../../lib/party-context';
import { useToast } from '../ui/Toast';
import type { Participant } from '../../types';

type AppRole = 'organizer' | 'participant';
type Status = 'active' | 'pending';

export function ParticipantForm({ participant, onClose }: { participant?: Participant | null; onClose: () => void }) {
  const { data, actions, partyActions, party, isOrganizer, isOwner, user } = useParty();
  const toast = useToast();
  const editing = !!participant;
  const member = !!participant?.uid;
  const isSelf = participant?.uid === user.uid;
  const isPartyOwner = participant?.uid === party.ownerUid;

  const [form, setForm] = useState({
    name: participant?.name || '',
    surname: participant?.surname || '',
    group: participant?.group || '',
    role: participant?.role || '',
    email: participant?.email || '',
    imageUrl: participant?.imageUrl || '',
  });
  const initialAppRole: AppRole = member && (party.memberRoles?.[participant!.uid!] === 'organizer' || isPartyOwner) ? 'organizer' : 'participant';
  const initialStatus: Status = member ? party.memberStatus?.[participant!.uid!] ?? 'active' : 'active';
  const [appRole, setAppRole] = useState<AppRole>(initialAppRole);
  const [status, setStatus] = useState<Status>(initialStatus);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));
  // Only the owner can promote/demote, organizers can approve. Nobody edits the owner's access.
  const canEditAccess = member && !isSelf && !isPartyOwner && isOrganizer;

  const groups = [...new Set([...data.groups.map(g => g.name), form.group].filter(Boolean))];
  const roles = [...new Set([...data.roles.map(r => r.name), form.role].filter(Boolean))];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const clean = {
      name: form.name.trim(),
      surname: form.surname.trim(),
      group: form.group,
      role: form.role,
      email: form.email.trim(),
      imageUrl: form.imageUrl,
    };
    const ok = await toast.run(async () => {
      if (!editing) {
        await actions.addParticipant({ ...clean, code: `GST-${Date.now().toString(36).toUpperCase()}` });
        return;
      }
      await actions.updateParticipant(participant!, member ? { ...clean, email: participant!.email } : clean);
      if (canEditAccess) {
        if (status !== initialStatus) await partyActions.setMemberStatus(party.id!, participant!.uid!, status);
        if (appRole !== initialAppRole && isOwner) await partyActions.setMemberRole(party.id!, participant!.uid!, appRole);
      }
    }, editing ? 'Dati salvati' : `${clean.name} aggiunto alla festa`);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? (isSelf ? 'Il tuo profilo nella festa' : 'Modifica partecipante') : 'Aggiungi un ospite'}
      description={editing ? undefined : 'Per chi non usa l\'app: potrai segnare cosa porta e cosa preleva.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annulla</Button>
          <Button type="submit" form="participant-form" loading={saving} disabled={!form.name.trim()}>{editing ? 'Salva' : 'Aggiungi'}</Button>
        </>
      }
    >
      <form id="participant-form" onSubmit={submit} className="space-y-5">
        <Field label="Foto" optional>
          <ImageSelector round images={DEFAULT_EMPLOYEE_IMAGES} selected={form.imageUrl} onSelect={url => set('imageUrl', url)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome" htmlFor="pf-name">
            <Input id="pf-name" required autoFocus maxLength={60} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Mario" />
          </Field>
          <Field label="Cognome" htmlFor="pf-surname" optional>
            <Input id="pf-surname" maxLength={60} value={form.surname} onChange={e => set('surname', e.target.value)} placeholder="Rossi" />
          </Field>
          <Field label="Gruppo" htmlFor="pf-group" optional hint={groups.length === 0 && isOrganizer ? 'Crea i gruppi dalle impostazioni.' : undefined}>
            <Select id="pf-group" value={form.group} onChange={e => set('group', e.target.value)}>
              <option value="">Nessun gruppo</option>
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label="Compito alla festa" htmlFor="pf-role" optional>
            <Select id="pf-role" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="">Nessuno</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Email" htmlFor="pf-email" optional hint={member ? 'È l\'email dell\'account: non si può cambiare da qui.' : undefined}>
          <Input id="pf-email" icon={Mail} type="email" maxLength={90} disabled={member} value={form.email} onChange={e => set('email', e.target.value)} placeholder="mario@esempio.it" />
        </Field>

        {canEditAccess && (
          <div className="p-4 rounded-2xl bg-surface-2 space-y-4">
            <p className="text-sm font-bold">Accesso all'app</p>
            <Field label="Stato">
              <Segmented value={status} onChange={setStatus} options={[{ value: 'active', label: 'Attivo', tone: 'ok' }, { value: 'pending', label: 'In attesa', tone: 'accent' }]} />
            </Field>
            {isOwner && (
              <Field label="Permessi" hint="Gli organizzatori approvano richieste, gestiscono prodotti e partecipanti.">
                <Segmented value={appRole} onChange={setAppRole} options={[{ value: 'participant', label: 'Partecipante' }, { value: 'organizer', label: 'Organizzatore' }]} />
              </Field>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
