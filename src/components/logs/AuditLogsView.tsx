import { useMemo, useState } from 'react';
import { ArrowLeftRight, Pencil, Plus, ShieldCheck, Trash2, KeyRound, Search } from 'lucide-react';
import { useParty } from '../../lib/party-context';
import { Chip, Input } from '../ui/Field';
import { Card, EmptyState, PageHeader } from '../ui/misc';
import { cn, formatDateTime, normalize } from '../../lib/utils';
import type { AuditLog } from '../../types';

const ACTIONS: Record<AuditLog['action'], { label: string; icon: typeof Plus; tone: string }> = {
  create: { label: 'Creato', icon: Plus, tone: 'bg-ok-soft text-ok-soft-ink' },
  update: { label: 'Modificato', icon: Pencil, tone: 'bg-info-soft text-info-soft-ink' },
  delete: { label: 'Eliminato', icon: Trash2, tone: 'bg-danger-soft text-danger-soft-ink' },
  move: { label: 'Movimento', icon: ArrowLeftRight, tone: 'bg-accent-soft text-accent-soft-ink' },
  auth: { label: 'Accesso', icon: KeyRound, tone: 'bg-brand-soft text-brand-soft-ink' },
};

const ENTITY: Record<AuditLog['entityType'], string> = {
  product: 'Prodotto',
  participant: 'Partecipante',
  party: 'Festa',
  category: 'Categoria',
  group: 'Gruppo',
  role: 'Ruolo',
  log: 'Movimento',
};

export function AuditLogsView() {
  const { data } = useParty();
  const [action, setAction] = useState<'all' | AuditLog['action']>('all');
  const [search, setSearch] = useState('');

  const list = useMemo(() => {
    const q = normalize(search.trim());
    return data.auditLogs.filter(l => (action === 'all' || l.action === action) && (!q || normalize(`${l.userName} ${l.entityName} ${l.details}`).includes(q)));
  }, [data.auditLogs, action, search]);

  return (
    <div>
      <PageHeader title="Registro attività" description="Chi ha fatto cosa, e quando. Visibile solo agli organizzatori." />
      <div className="mb-3">
        <Input icon={Search} type="search" placeholder="Cerca per persona o elemento…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Cerca nel registro" />
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-5">
        <Chip active={action === 'all'} onClick={() => setAction('all')}>Tutto</Chip>
        {(Object.keys(ACTIONS) as AuditLog['action'][]).filter(a => a !== 'auth').map(a => (
          <Chip key={a} active={action === a} onClick={() => setAction(a)}>{ACTIONS[a].label}</Chip>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Nessuna attività" description="Le modifiche alla festa vengono registrate qui." />
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {list.map(l => {
            const a = ACTIONS[l.action] || ACTIONS.update;
            return (
              <div key={l.id} className="flex items-start gap-3 p-4">
                <span className={cn('w-9 h-9 rounded-xl grid place-items-center shrink-0', a.tone)}>
                  <a.icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <strong className="font-semibold">{l.userName}</strong> <span className="text-ink-2">{l.details}</span>
                  </p>
                  <p className="text-xs text-ink-3 mt-0.5">{ENTITY[l.entityType] || l.entityType} · {formatDateTime(l.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
