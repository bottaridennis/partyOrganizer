import { useMemo, useState } from 'react';
import { Crown, Package, Pencil, Search, Trash2, UserPlus, Users } from 'lucide-react';
import { useParty } from '../../lib/party-context';
import { Button, IconButton } from '../ui/Button';
import { Chip, Input } from '../ui/Field';
import { Avatar, Badge, Card, EmptyState, PageHeader } from '../ui/misc';
import { ParticipantForm } from './ParticipantForm';
import { formatEuro, fullName, normalize, participantKey, productSpend } from '../../lib/utils';
import type { Participant } from '../../types';

export function ParticipantsView() {
  const { data, isOrganizer, party, user, navigate, confirmDelete } = useParty();
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('all');
  const [editing, setEditing] = useState<Participant | null | 'new'>(null);

  const stats = useMemo(() => {
    const map = new Map<string, { count: number; spend: number }>();
    for (const p of data.products) {
      const s = map.get(p.broughtBy) || { count: 0, spend: 0 };
      s.count += 1;
      s.spend += productSpend(p);
      map.set(p.broughtBy, s);
    }
    return map;
  }, [data.products]);

  const groups = useMemo(() => [...new Set(data.participants.map(p => p.group).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'it')), [data.participants]);

  // Records of people who left the party stay for history but are not listed.
  const current = data.participants.filter(p => !p.uid || party.members.includes(p.uid));
  const list = current.filter(p => {
    if (group !== 'all' && p.group !== group) return false;
    const q = normalize(search.trim());
    return !q || normalize(`${fullName(p)} ${p.email} ${p.group} ${p.role}`).includes(q);
  });

  const statusOf = (p: Participant) => (p.uid ? party.memberStatus?.[p.uid] ?? 'active' : null);
  const organizerOf = (p: Participant) => !!p.uid && (party.ownerUid === p.uid || party.memberRoles?.[p.uid] === 'organizer');

  return (
    <div>
      <PageHeader
        title="Partecipanti"
        description={`${current.length} persone alla festa`}
        actions={isOrganizer && <Button icon={UserPlus} onClick={() => setEditing('new')}>Aggiungi ospite</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <Input icon={Search} type="search" placeholder="Cerca per nome, gruppo, email…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Cerca partecipanti" />
        </div>
      </div>
      {groups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-5">
          <Chip active={group === 'all'} onClick={() => setGroup('all')}>Tutti</Chip>
          {groups.map(g => <Chip key={g} active={group === g} onClick={() => setGroup(g)}>{g}</Chip>)}
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState icon={Users} title={current.length ? 'Nessun risultato' : 'Ancora nessuno'} description={current.length ? 'Prova un\'altra ricerca.' : 'Invita gli amici con il codice della festa o aggiungi un ospite a mano.'} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map(p => {
            const s = stats.get(participantKey(p));
            const status = statusOf(p);
            const isSelf = p.uid === user.uid;
            const canEdit = isOrganizer || isSelf;
            return (
              <Card key={p.id} className="p-5 flex flex-col">
                <div className="flex items-start gap-3">
                  <Avatar name={fullName(p) || '?'} src={p.imageUrl} size={52} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[16px] truncate flex items-center gap-1.5">
                      {fullName(p)}
                      {isSelf && <span className="text-ink-3 font-medium text-sm">(tu)</span>}
                    </p>
                    <p className="text-sm text-ink-3 truncate">{[p.group, p.role].filter(Boolean).join(' · ') || 'Nessun gruppo'}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {organizerOf(p) && <Badge tone="brand" icon={Crown}>{party.ownerUid === p.uid ? 'Creatore' : 'Organizzatore'}</Badge>}
                      {status === 'pending' && <Badge tone="warn">In attesa</Badge>}
                      {!p.uid && <Badge>Ospite</Badge>}
                    </div>
                  </div>
                  <div className="flex -mr-2 -mt-1">
                    {canEdit && <IconButton icon={Pencil} label={`Modifica ${fullName(p)}`} size="sm" onClick={() => setEditing(p)} />}
                    {isOrganizer && !p.uid && <IconButton icon={Trash2} label={`Elimina ${fullName(p)}`} size="sm" variant="danger-ghost" onClick={() => confirmDelete({ type: 'participant', id: p.id!, name: fullName(p) })} />}
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-3">
                  <p className="text-sm text-ink-2">
                    <strong className="text-ink tabular">{s?.count || 0}</strong> prodotti
                    {s && s.spend > 0 && <> · <strong className="text-ink tabular">{formatEuro(s.spend)}</strong></>}
                  </p>
                  <Button size="sm" variant="ghost" icon={Package} disabled={!s} onClick={() => navigate('dispensa', participantKey(p))}>Vedi</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editing && <ParticipantForm participant={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
