import { useMemo, useState } from 'react';
import { ChevronDown, Download, ReceiptText, Scale } from 'lucide-react';
import { useParty } from '../../lib/party-context';
import { Button } from '../ui/Button';
import { Avatar, Badge, Card, EmptyState, PageHeader, ProductThumb } from '../ui/misc';
import { cn, downloadCsv, formatEuro, fullName, isCommonOwner, isDrink, participantKey, productSpend } from '../../lib/utils';

export function ContributionsView() {
  const { data, party } = useParty();
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => {
    // People who left the party are not part of the split.
    const people = data.participants.filter(p => !p.uid || party.members.includes(p.uid)).map(p => {
      const key = participantKey(p);
      const products = data.products.filter(x => x.broughtBy === key);
      return { id: p.id!, name: fullName(p), imageUrl: p.imageUrl, products, spend: products.reduce((s, x) => s + productSpend(x), 0) };
    });
    const common = data.products.filter(p => isCommonOwner(p.broughtBy));
    return { people: people.sort((a, b) => b.spend - a.spend), common, commonSpend: common.reduce((s, x) => s + productSpend(x), 0) };
  }, [data.participants, data.products, party.members]);

  const totalPersonal = rows.people.reduce((s, r) => s + r.spend, 0);
  const total = totalPersonal + rows.commonSpend;
  const share = rows.people.length ? total / rows.people.length : 0;

  /** Greedy settle-up: who should give money to whom so everyone spends the same. */
  const transfers = useMemo(() => {
    // Shared products have no payer: they are split evenly but nobody gets reimbursed for them.
    const fair = rows.people.length ? totalPersonal / rows.people.length : 0;
    const debtors = rows.people.map(r => ({ name: r.name, amt: fair - r.spend })).filter(r => r.amt > 0.009).sort((a, b) => b.amt - a.amt);
    const creditors = rows.people.map(r => ({ name: r.name, amt: r.spend - fair })).filter(r => r.amt > 0.009).sort((a, b) => b.amt - a.amt);
    const out: { from: string; to: string; amount: number }[] = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].amt, creditors[j].amt);
      out.push({ from: debtors[i].name, to: creditors[j].name, amount });
      debtors[i].amt -= amount;
      creditors[j].amt -= amount;
      if (debtors[i].amt < 0.01) i++;
      if (creditors[j].amt < 0.01) j++;
    }
    return out;
  }, [rows.people, totalPersonal]);

  const exportCsv = () => {
    const lines: (string | number)[][] = [['Partecipante', 'Prodotto', 'Categoria', 'Pezzi acquistati', 'Prezzo unitario', 'Totale', 'Disponibili']];
    const fmt = (n: number) => n.toFixed(2).replace('.', ',');
    for (const r of rows.people) {
      for (const p of r.products) lines.push([r.name, p.name, p.category, p.initialQuantity ?? p.quantity, fmt(p.price || 0), fmt(productSpend(p)), p.quantity]);
    }
    for (const p of rows.common) lines.push(['In comune', p.name, p.category, p.initialQuantity ?? p.quantity, fmt(p.price || 0), fmt(productSpend(p)), p.quantity]);
    lines.push([], ['Totale', '', '', '', '', fmt(total), '']);
    downloadCsv(`contributi-${party.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`, lines);
  };

  if (data.products.length === 0) {
    return (
      <div>
        <PageHeader title="Contributi e spese" />
        <EmptyState icon={ReceiptText} title="Ancora niente da conteggiare" description="Quando aggiungete prodotti con un prezzo, qui vedrete chi ha speso quanto e come pareggiare i conti." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Contributi e spese"
        description="Chi ha portato cosa e come dividere le spese in modo equo."
        actions={<Button variant="secondary" icon={Download} onClick={exportCsv}>Esporta per Excel</Button>}
      />

      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        <Stat label="Spesa totale" value={formatEuro(total)} />
        <Stat label="Quota a testa" value={formatEuro(share)} hint={`${rows.people.length} partecipanti, prodotti in comune inclusi`} />
        <Stat label="Prodotti in comune" value={formatEuro(rows.commonSpend)} hint={`${rows.common.length} prodotti`} />
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <Card className="divide-y divide-line overflow-hidden">
          {rows.people.map(r => {
            const pct = total > 0 ? (r.spend / total) * 100 : 0;
            const expanded = open === r.id;
            return (
              <div key={r.id}>
                <button onClick={() => setOpen(expanded ? null : r.id)} aria-expanded={expanded} className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-2/60 transition-colors">
                  <Avatar name={r.name || '?'} src={r.imageUrl} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{r.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden max-w-48">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-ink-3">{r.products.length} prodotti</span>
                    </div>
                  </div>
                  <p className="font-display text-lg font-extrabold tabular">{formatEuro(r.spend)}</p>
                  <ChevronDown className={cn('w-4 h-4 text-ink-3 transition-transform', expanded && 'rotate-180')} />
                </button>
                {expanded && (
                  <div className="px-4 pb-4 animate-fade-in">
                    {r.products.length === 0 ? (
                      <p className="text-sm text-ink-3 pl-[52px]">Non ha ancora portato nulla.</p>
                    ) : (
                      <ul className="space-y-1.5 pl-[52px]">
                        {r.products.map(p => (
                          <li key={p.id} className="flex items-center gap-3 text-sm">
                            <ProductThumb src={p.imageUrl} drink={isDrink(p)} size={28} className="rounded-lg" />
                            <span className="flex-1 truncate">{p.name}</span>
                            <span className="text-ink-3 tabular">{p.initialQuantity ?? p.quantity} × {formatEuro(p.price || 0)}</span>
                            <span className="font-semibold tabular w-20 text-right">{formatEuro(productSpend(p))}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-bold">Pareggiare i conti</h2>
          </div>
          <p className="text-sm text-ink-2 mb-4">Così ognuno spende la stessa cifra per i prodotti portati da qualcuno. I prodotti in comune restano fuori dal calcolo.</p>
          {transfers.length === 0 ? (
            <Badge tone="ok">Conti già pari 👌</Badge>
          ) : (
            <ul className="space-y-2">
              {transfers.map((t, i) => (
                <li key={i} className="flex items-center gap-2 p-3 rounded-xl bg-surface-2 text-sm">
                  <span className="flex-1 min-w-0">
                    <strong className="font-semibold">{t.from}</strong> <span className="text-ink-3">dà a</span> <strong className="font-semibold">{t.to}</strong>
                  </span>
                  <span className="font-display font-extrabold tabular">{formatEuro(t.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="font-display text-3xl font-extrabold tabular mt-1">{value}</p>
      {hint && <p className="text-xs text-ink-3 mt-1">{hint}</p>}
    </Card>
  );
}
