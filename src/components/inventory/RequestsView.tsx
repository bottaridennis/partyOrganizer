import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Check, Inbox, UserCheck, UserX, X } from 'lucide-react';
import { useParty } from '../../lib/party-context';
import { Button } from '../ui/Button';
import { Avatar, Badge, Card, EmptyState, PageHeader, SectionTitle } from '../ui/misc';
import { ConfirmDialog } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { cn, formatDateTime, fullName, timeAgo } from '../../lib/utils';
import { memberDocId } from '../../hooks/useParties';
import type { ProductRequest } from '../../types';

export function RequestsView() {
  const { data, isOrganizer, profile, party, actions, partyActions } = useParty();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [declining, setDeclining] = useState<{ uid: string; name: string } | null>(null);

  const visible = isOrganizer ? data.requests : data.requests.filter(r => r.userId === profile.uid);
  const pending = visible.filter(r => r.status === 'pending');
  const history = visible.filter(r => r.status !== 'pending').slice(0, 50);

  const pendingMembers = party.members
    .filter(uid => party.memberStatus?.[uid] === 'pending')
    .map(uid => {
      const p = data.participants.find(x => x.id === memberDocId(party.id!, uid) || x.uid === uid);
      return { uid, name: fullName(p) || 'Nuovo membro', email: p?.email, imageUrl: p?.imageUrl };
    });

  const participantLabel = (id: string) => (id === 'GENERAL' ? 'tutta la festa' : fullName(data.participants.find(p => p.id === id)) || '—');

  const act = async (key: string, fn: () => Promise<unknown>, msg: string) => {
    setBusy(key);
    await toast.run(fn, msg);
    setBusy(null);
  };

  return (
    <div>
      <PageHeader
        title={isOrganizer ? 'Richieste' : 'Le mie richieste'}
        description={isOrganizer ? 'Approva chi vuole entrare e i movimenti chiesti dai partecipanti.' : 'Le richieste di prelievo o rifornimento che hai inviato agli organizzatori.'}
      />

      <div className="space-y-10">
        {isOrganizer && pendingMembers.length > 0 && (
          <section>
            <SectionTitle icon={UserCheck}>Vogliono entrare nella festa</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-3">
              {pendingMembers.map(m => (
                <Card key={m.uid} className="p-4 flex items-center gap-3">
                  <Avatar name={m.name} src={m.imageUrl} size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{m.name}</p>
                    {m.email && <p className="text-sm text-ink-3 truncate">{m.email}</p>}
                  </div>
                  <Button size="sm" variant="ghost" aria-label={`Rifiuta ${m.name}`} icon={UserX} onClick={() => setDeclining(m)} />
                  <Button size="sm" icon={Check} loading={busy === m.uid} onClick={() => act(m.uid, () => partyActions.setMemberStatus(party.id!, m.uid, 'active'), `${m.name} è nella festa 🎉`)}>
                    Accetta
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionTitle icon={Inbox}>In attesa {pending.length > 0 && <Badge tone="accent">{pending.length}</Badge>}</SectionTitle>
          {pending.length === 0 ? (
            <EmptyState icon={Inbox} title="Nessuna richiesta in attesa" description={isOrganizer ? 'Quando un partecipante chiede un prodotto la trovi qui.' : 'Dalla dispensa premi «Richiedi» su un prodotto.'} />
          ) : (
            <div className="space-y-3">
              {pending.map(r => {
                const product = data.products.find(p => p.id === r.productId);
                const short = r.type === 'withdraw' && product && product.quantity < r.quantity;
                return (
                  <Card key={r.id} className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <RequestIcon type={r.type} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">
                          {isOrganizer && <span>{r.userName} </span>}
                          {isOrganizer ? (r.type === 'withdraw' ? 'vuole prelevare' : 'vuole aggiungere') : r.type === 'withdraw' ? 'Prelievo di' : 'Rifornimento di'}{' '}
                          <span className="text-brand">{r.quantity} × {r.productName}</span>
                        </p>
                        <p className="text-sm text-ink-3 mt-0.5">Per {participantLabel(r.participantId)} · {timeAgo(r.createdAt)}</p>
                        {r.notes && <p className="text-sm text-ink-2 mt-2 p-2.5 rounded-xl bg-surface-2">“{r.notes}”</p>}
                        {!product && <p className="text-sm text-danger mt-2">Il prodotto è stato eliminato.</p>}
                        {short && <p className="text-sm text-warn-soft-ink mt-2">In dispensa ne restano solo {product!.quantity}.</p>}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      {isOrganizer ? (
                        <>
                          <Button size="sm" variant="secondary" icon={X} loading={busy === `${r.id}-no`} onClick={() => act(`${r.id}-no`, () => actions.rejectRequest(r), 'Richiesta rifiutata')}>Rifiuta</Button>
                          <Button size="sm" icon={Check} disabled={!product || short} loading={busy === `${r.id}-ok`} onClick={() => act(`${r.id}-ok`, () => actions.approveRequest(r, product), 'Richiesta approvata')}>Approva</Button>
                        </>
                      ) : (
                        <Button size="sm" variant="secondary" loading={busy === r.id} onClick={() => act(r.id!, () => actions.cancelRequest(r), 'Richiesta annullata')}>Annulla richiesta</Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {history.length > 0 && (
          <section>
            <SectionTitle>Storico</SectionTitle>
            <Card className="divide-y divide-line overflow-hidden">
              {history.map(r => <HistoryRow key={r.id} r={r} showUser={isOrganizer} />)}
            </Card>
          </section>
        )}
      </div>

      <ConfirmDialog
        open={!!declining}
        onClose={() => setDeclining(null)}
        title="Rifiutare la richiesta?"
        message={<><strong>{declining?.name}</strong> non entrerà nella festa. Potrà comunque riprovare con il codice invito.</>}
        confirmLabel="Rifiuta"
        onConfirm={async () => {
          if (declining) await toast.run(() => partyActions.removeMember(party.id!, declining.uid), 'Richiesta rifiutata');
        }}
      />
    </div>
  );
}

function RequestIcon({ type }: { type: 'withdraw' | 'return' }) {
  const Icon = type === 'withdraw' ? ArrowUpFromLine : ArrowDownToLine;
  return (
    <span className={cn('w-10 h-10 rounded-xl grid place-items-center shrink-0', type === 'withdraw' ? 'bg-accent-soft text-accent-soft-ink' : 'bg-ok-soft text-ok-soft-ink')}>
      <Icon className="w-5 h-5" />
    </span>
  );
}

function HistoryRow({ r, showUser }: { r: ProductRequest; showUser: boolean }) {
  const approved = r.status === 'approved';
  return (
    <div className="flex items-center gap-3 p-4">
      <RequestIcon type={r.type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {showUser && `${r.userName} · `}
          {r.quantity} × {r.productName}
        </p>
        <p className="text-xs text-ink-3 truncate">
          {r.handledBy ? `${approved ? 'Approvata' : 'Rifiutata'} da ${r.handledBy}` : ''} {r.handledAt && `· ${formatDateTime(r.handledAt)}`}
          {r.rejectionReason && ` · ${r.rejectionReason}`}
        </p>
      </div>
      <Badge tone={approved ? 'ok' : 'danger'}>{approved ? 'Approvata' : 'Rifiutata'}</Badge>
    </div>
  );
}
