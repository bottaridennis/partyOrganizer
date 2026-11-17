import { useMemo } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ArrowRight, Bell, CalendarClock, History, Package, Plus, ShoppingCart, Users, Wallet } from 'lucide-react';
import { useParty } from '../../lib/party-context';
import { Button } from '../ui/Button';
import { Card, EmptyState, ProductThumb, SectionTitle } from '../ui/misc';
import { cn, expiryState, findParticipant, formatEuro, fullName, isAlcoholic, isCommonOwner, isDrink, isLowStock, productSpend, timeAgo } from '../../lib/utils';

const PALETTE = ['var(--brand)', 'var(--accent)', 'var(--ok)', 'var(--warn)', '#3b82f6', '#ec4899', '#14b8a6', '#a855f7'];

const tooltipStyle = {
  contentStyle: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, boxShadow: 'var(--shadow-pop)', color: 'var(--ink)', fontSize: 13 },
  itemStyle: { color: 'var(--ink)' },
  labelStyle: { color: 'var(--ink-2)' },
};

export function Dashboard() {
  const { data, party, profile, isOrganizer, navigate, openProductForm, openMovement } = useParty();
  const { products, participants, logs, requests } = data;

  const s = useMemo(() => {
    const spend = products.reduce((a, p) => a + productSpend(p), 0);
    const pieces = products.reduce((a, p) => a + p.quantity, 0);
    const low = products.filter(isLowStock);
    const expiring = products.filter(p => ['expired', 'soon'].includes(expiryState(p)));
    const drinks = products.filter(isDrink);
    const alcoholic = drinks.filter(isAlcoholic).reduce((a, p) => a + p.quantity, 0);
    const soft = drinks.reduce((a, p) => a + p.quantity, 0) - alcoholic;
    const food = products.filter(p => !isDrink(p)).reduce((a, p) => a + p.quantity, 0);

    const byCat = new Map<string, number>();
    products.forEach(p => byCat.set(p.category || 'Altro', (byCat.get(p.category || 'Altro') || 0) + productSpend(p)));
    const categories = [...byCat.entries()].map(([name, value]) => ({ name, value })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

    const byOwner = new Map<string, number>();
    products.forEach(p => {
      const key = isCommonOwner(p.broughtBy) ? 'In comune' : fullName(findParticipant(participants, p.broughtBy)).split(' ')[0] || 'Altro';
      byOwner.set(key, (byOwner.get(key) || 0) + productSpend(p));
    });
    const owners = [...byOwner.entries()].map(([name, spesa]) => ({ name, spesa })).filter(o => o.spesa > 0).sort((a, b) => b.spesa - a.spesa).slice(0, 8);

    return { spend, pieces, low, expiring, alcoholic, soft, food, categories, owners };
  }, [products, participants]);

  const pendingReq = requests.filter(r => r.status === 'pending' && (isOrganizer || r.userId === profile.uid)).length;
  const pendingMembers = isOrganizer ? party.members.filter(u => party.memberStatus?.[u] === 'pending').length : 0;
  const first = profile.displayName?.split(' ')[0] || '';
  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'Che nottata' : hour < 13 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera';

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[28px] p-6 sm:p-8 bg-[#1b1430] text-white">
        <div className="absolute inset-0 confetti-bg opacity-80" />
        <div className="absolute -right-20 -top-24 w-80 h-80 rounded-full bg-[#6d3df5] blur-[90px] opacity-70" />
        <div className="absolute right-24 -bottom-28 w-64 h-64 rounded-full bg-[#ff6a3d] blur-[90px] opacity-50" />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-white/70 font-medium">{greeting}{first && `, ${first}`} 👋</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold mt-1 text-white">{party.name}</h1>
            <p className="text-white/70 mt-2">
              {products.length} prodotti · {participants.length} partecipanti · {formatEuro(s.spend)} spesi
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="accent" icon={Plus} onClick={() => openProductForm()}>Aggiungi prodotto</Button>
            <Button className="bg-white/12 text-white border border-white/20 hover:bg-white/20 shadow-none" icon={Package} onClick={() => navigate('dispensa')}>Dispensa</Button>
          </div>
        </div>
      </section>

      {/* Alerts */}
      {(s.low.length > 0 || s.expiring.length > 0 || pendingReq > 0 || pendingMembers > 0) && (
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(pendingReq > 0 || pendingMembers > 0) && (
            <Alert tone="brand" icon={Bell} onClick={() => navigate('richieste')}
              title={isOrganizer ? plural(pendingReq + pendingMembers, 'richiesta da gestire', 'richieste da gestire') : plural(pendingReq, 'richiesta in attesa', 'richieste in attesa')}
              text={pendingMembers > 0 ? (pendingMembers === 1 ? '1 persona vuole entrare' : `${pendingMembers} persone vogliono entrare`) : 'Prelievi e rifornimenti'} />
          )}
          {s.low.length > 0 && (
            <Alert tone="warn" icon={ShoppingCart} onClick={() => navigate('spesa')} title={s.low.length === 1 ? '1 prodotto sta finendo' : `${s.low.length} prodotti stanno finendo`} text={s.low.slice(0, 3).map(p => p.name).join(', ')} />
          )}
          {s.expiring.length > 0 && (
            <Alert tone="danger" icon={CalendarClock} onClick={() => navigate('dispensa')} title={s.expiring.length === 1 ? '1 in scadenza o scaduto' : `${s.expiring.length} in scadenza o scaduti`} text={s.expiring.slice(0, 3).map(p => p.name).join(', ')} />
          )}
        </section>
      )}

      {/* KPI */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Package} label="Pezzi in dispensa" value={s.pieces.toString()} />
        <Kpi icon={Wallet} label="Spesa totale" value={formatEuro(s.spend)} />
        <Kpi icon={Users} label="A testa" value={formatEuro(participants.length ? s.spend / participants.length : 0)} />
        <Kpi icon={AlertTriangle} label="Da ricomprare" value={s.low.length.toString()} tone={s.low.length ? 'warn' : undefined} />
      </section>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Iniziamo a riempire la dispensa"
          description="Aggiungi i prodotti: vedrai qui spese, scorte e chi porta cosa."
          action={<Button icon={Plus} onClick={() => openProductForm()}>Primo prodotto</Button>}
        />
      ) : (
        <>
          <section className="grid lg:grid-cols-5 gap-4">
            <Card className="p-5 lg:col-span-2">
              <SectionTitle>Cosa c'è in dispensa</SectionTitle>
              <Mix food={s.food} soft={s.soft} alcoholic={s.alcoholic} />
              {s.categories.length > 0 && (
                <>
                  <p className="text-sm font-semibold text-ink-2 mt-6 mb-2">Spesa per categoria</p>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32 shrink-0">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={s.categories} dataKey="value" nameKey="name" innerRadius={38} outerRadius={60} paddingAngle={3} stroke="none">
                            {s.categories.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                          </Pie>
                          <Tooltip {...tooltipStyle} formatter={(v: number) => formatEuro(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="flex-1 min-w-0 space-y-1.5 text-sm">
                      {s.categories.slice(0, 5).map((c, i) => (
                        <li key={c.name} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                          <span className="flex-1 truncate text-ink-2">{c.name}</span>
                          <span className="font-semibold tabular">{formatEuro(c.value)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </Card>

            <Card className="p-5 lg:col-span-3">
              <SectionTitle action={<Button size="sm" variant="ghost" onClick={() => navigate('contributi')}>Dettagli <ArrowRight className="w-4 h-4" /></Button>}>Chi ha speso di più</SectionTitle>
              {s.owners.length === 0 ? (
                <p className="text-sm text-ink-3 py-10 text-center">Inserisci i prezzi dei prodotti per vedere le spese.</p>
              ) : (
                <div className="h-64 -ml-2">
                  <ResponsiveContainer>
                    <BarChart data={s.owners} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={90} axisLine={false} tickLine={false} tick={{ fill: 'var(--ink-2)', fontSize: 13 }} />
                      <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} formatter={(v: number) => [formatEuro(v), 'Spesa']} />
                      <Bar dataKey="spesa" radius={[0, 8, 8, 0]} barSize={22}>
                        {s.owners.map((_, i) => <Cell key={i} fill={i === 0 ? 'var(--brand)' : 'color-mix(in srgb, var(--brand) 45%, var(--surface-3))'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </section>

          <section className="grid lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <SectionTitle action={<Button size="sm" variant="ghost" onClick={() => navigate('spesa')}>Lista <ArrowRight className="w-4 h-4" /></Button>}>Sta finendo</SectionTitle>
              {s.low.length === 0 ? (
                <p className="text-sm text-ink-3 py-6 text-center">Scorte a posto 🎉</p>
              ) : (
                <ul className="space-y-1">
                  {s.low.slice(0, 5).map(p => (
                    <li key={p.id} className="flex items-center gap-3 py-1.5">
                      <ProductThumb src={p.imageUrl} drink={isDrink(p)} size={38} className="rounded-xl" />
                      <span className="flex-1 min-w-0 font-semibold truncate">{p.name}</span>
                      <span className={cn('text-sm font-bold tabular', p.quantity === 0 ? 'text-danger' : 'text-warn')}>{p.quantity} pz</span>
                      <Button size="sm" variant="secondary" onClick={() => openMovement(p, 'return')}>Rifornisci</Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="p-5">
              <SectionTitle icon={History} action={<Button size="sm" variant="ghost" onClick={() => navigate('movimenti')}>Tutti <ArrowRight className="w-4 h-4" /></Button>}>Ultimi movimenti</SectionTitle>
              {logs.length === 0 ? (
                <p className="text-sm text-ink-3 py-6 text-center">Nessun movimento ancora.</p>
              ) : (
                <ul className="space-y-3">
                  {logs.slice(0, 5).map(l => (
                    <li key={l.id} className="flex items-start gap-3">
                      <span className={cn('mt-1.5 w-2 h-2 rounded-full shrink-0', l.productsUsed.every(i => i.type === 'return') ? 'bg-ok' : 'bg-accent')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{l.description}</p>
                        <p className="text-xs text-ink-3">{l.organizer} · {timeAgo(l.date)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: typeof Package; label: string; value: string; tone?: 'warn' }) {
  return (
    <Card className="p-4 sm:p-5">
      <span className={cn('w-9 h-9 rounded-xl grid place-items-center mb-3', tone === 'warn' ? 'bg-warn-soft text-warn-soft-ink' : 'bg-brand-soft text-brand-soft-ink')}>
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <p className="font-display text-2xl sm:text-[28px] font-extrabold tabular leading-none">{value}</p>
      <p className="text-sm text-ink-2 mt-1.5">{label}</p>
    </Card>
  );
}

function Alert({ tone, icon: Icon, title, text, onClick }: { tone: 'brand' | 'warn' | 'danger'; icon: typeof Bell; title: string; text: string; onClick: () => void }) {
  const tones = { brand: 'bg-brand-soft text-brand-soft-ink', warn: 'bg-warn-soft text-warn-soft-ink', danger: 'bg-danger-soft text-danger-soft-ink' };
  return (
    <button onClick={onClick} className={cn('group min-w-0 w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all hover:brightness-[0.97]', tones[tone])}>
      <Icon className="w-5 h-5 shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-sm">{title}</span>
        <span className="block text-sm opacity-80 truncate">{text}</span>
      </span>
      <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

function Mix({ food, soft, alcoholic }: { food: number; soft: number; alcoholic: number }) {
  const total = food + soft + alcoholic || 1;
  const parts = [
    { label: 'Cibo', value: food, color: 'var(--accent)' },
    { label: 'Analcolici', value: soft, color: '#3b82f6' },
    { label: 'Alcolici', value: alcoholic, color: 'var(--brand)' },
  ];
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden bg-surface-3 gap-0.5">
        {parts.filter(p => p.value > 0).map(p => <div key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />)}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {parts.map(p => (
          <div key={p.label}>
            <p className="flex items-center gap-1.5 text-xs text-ink-2"><span className="w-2 h-2 rounded-full" style={{ background: p.color }} />{p.label}</p>
            <p className="font-display text-xl font-extrabold tabular">{p.value}<span className="text-xs text-ink-3 font-semibold ml-0.5">pz</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
