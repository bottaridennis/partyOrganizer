import React, { useMemo, useState } from 'react';
import {
  Bell,
  ChevronsUpDown,
  ClipboardList,
  History,
  Home,
  LogOut,
  Menu,
  Moon,
  Package,
  Plus,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sun,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useParty } from '../../lib/party-context';
import type { Route } from '../../lib/router';
import { cn, isLowStock } from '../../lib/utils';
import { useTheme } from '../../lib/theme';
import { Avatar } from '../ui/misc';
import { Modal } from '../ui/Modal';
import { IconButton } from '../ui/Button';
import { LogoMark } from './Logo';
import { InviteDialog } from '../party/InviteDialog';

interface NavEntry {
  route: Route;
  label: string;
  icon: LucideIcon;
  badge?: number;
  section: 'main' | 'manage';
}

export function AppShell({ route, children, onLogout, onQuickAdd }: { route: Route; children: React.ReactNode; onLogout: () => void; onQuickAdd: () => void }) {
  const { party, profile, isOrganizer, data, navigate, openPartySwitcher, me } = useParty();
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const lowCount = useMemo(() => data.products.filter(isLowStock).length, [data.products]);
  const pendingMembers = Object.entries(party.memberStatus || {}).filter(([uid, s]) => s === 'pending' && party.members.includes(uid)).length;
  const pendingRequests = data.requests.filter(r => r.status === 'pending' && (isOrganizer || r.userId === profile.uid)).length;
  const requestsBadge = pendingRequests + (isOrganizer ? pendingMembers : 0);

  const nav: NavEntry[] = [
    { route: 'home', label: 'Panoramica', icon: Home, section: 'main' },
    { route: 'dispensa', label: 'Dispensa', icon: Package, section: 'main' },
    { route: 'spesa', label: 'Lista della spesa', icon: ShoppingCart, badge: lowCount, section: 'main' },
    { route: 'amici', label: 'Partecipanti', icon: Users, section: 'main' },
    { route: 'richieste', label: isOrganizer ? 'Richieste' : 'Le mie richieste', icon: Bell, badge: requestsBadge, section: 'main' },
    { route: 'movimenti', label: 'Movimenti', icon: History, section: 'manage' },
    { route: 'contributi', label: 'Contributi e spese', icon: ReceiptText, section: 'manage' },
    ...(isOrganizer
      ? ([
          { route: 'registro', label: 'Registro attività', icon: ShieldCheck, section: 'manage' },
          { route: 'impostazioni', label: 'Impostazioni festa', icon: Settings, section: 'manage' },
        ] as NavEntry[])
      : []),
  ];

  const go = (r: Route) => {
    navigate(r);
    setMenuOpen(false);
  };

  const displayName = profile.displayName || profile.email;

  return (
    <div className="min-h-dvh lg:h-dvh flex bg-bg">
      {/* ------------------------------------------------ Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-line bg-surface/60 backdrop-blur">
        <div className="px-5 pt-6 pb-4">
          <button
            onClick={() => openPartySwitcher('select')}
            className="w-full flex items-center gap-3 p-2 -m-2 rounded-2xl hover:bg-surface-2 transition-colors text-left"
            title="Cambia festa"
          >
            <LogoMark size={40} />
            <span className="flex-1 min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-3">Festa attiva</span>
              <span className="block font-display font-bold text-[17px] truncate">{party.name}</span>
            </span>
            <ChevronsUpDown className="w-4 h-4 text-ink-3" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6" aria-label="Sezioni">
          {(['main', 'manage'] as const).map(section => (
            <div key={section}>
              <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">{section === 'main' ? 'Festa' : 'Gestione'}</p>
              <ul className="space-y-0.5">
                {nav.filter(n => n.section === section).map(n => (
                  <li key={n.route}>
                    <SideLink entry={n} active={route === n.route} onClick={() => go(n.route)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-3 space-y-2">
          {isOrganizer && (
            <button onClick={() => setInviteOpen(true)} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-brand-soft text-brand-soft-ink hover:brightness-[0.97] transition-all">
              <UserPlus className="w-5 h-5" />
              <span className="text-sm font-bold flex-1 text-left">Invita amici</span>
              <span className="text-xs font-bold tracking-widest tabular">{party.inviteCode}</span>
            </button>
          )}
          <div className="flex items-center gap-3 p-2 rounded-2xl">
            <Avatar name={displayName} src={me?.imageUrl || profile.photoURL} size={38} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{displayName}</p>
              <p className="text-xs text-ink-3">{isOrganizer ? 'Organizzatore' : 'Partecipante'}</p>
            </div>
            <IconButton icon={theme === 'dark' ? Sun : Moon} label={theme === 'dark' ? 'Tema chiaro' : 'Tema scuro'} size="sm" onClick={toggle} />
            <IconButton icon={LogOut} label="Esci" size="sm" variant="danger-ghost" onClick={onLogout} />
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------ Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-2 px-4 h-16 bg-bg/85 backdrop-blur-md border-b border-line">
          <button onClick={() => openPartySwitcher('select')} className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
            <LogoMark size={34} />
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-3 leading-none">Festa</span>
              <span className="flex items-center gap-1 font-display font-bold truncate">
                {party.name}
                <ChevronsUpDown className="w-3.5 h-3.5 text-ink-3 shrink-0" />
              </span>
            </span>
          </button>
          {isOrganizer && <IconButton icon={UserPlus} label="Invita amici" onClick={() => setInviteOpen(true)} />}
          <IconButton icon={theme === 'dark' ? Sun : Moon} label="Cambia tema" onClick={toggle} />
        </header>

        <main id="main-scroll" className="flex-1 min-w-0 overflow-x-clip lg:overflow-y-auto">
          <div key={route} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 lg:pt-10 pb-32 lg:pb-12 animate-rise">{children}</div>
        </main>
      </div>

      {/* ------------------------------------------------ Bottom bar (mobile) */}
      <nav aria-label="Navigazione" className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line pb-safe">
        <div className="grid grid-cols-5 items-end px-2 pt-2">
          <TabLink icon={Home} label="Home" active={route === 'home'} onClick={() => go('home')} />
          <TabLink icon={Package} label="Dispensa" active={route === 'dispensa'} onClick={() => go('dispensa')} />
          <div className="flex justify-center">
            <button
              onClick={onQuickAdd}
              aria-label="Aggiungi prodotto"
              className="-mt-7 w-14 h-14 rounded-2xl bg-brand text-white grid place-items-center shadow-[var(--shadow-brand)] active:scale-95 transition-transform ring-4 ring-bg"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>
          <TabLink icon={ShoppingCart} label="Spesa" badge={lowCount} active={route === 'spesa'} onClick={() => go('spesa')} />
          <TabLink
            icon={Menu}
            label="Altro"
            badge={requestsBadge}
            active={!['home', 'dispensa', 'spesa'].includes(route)}
            onClick={() => setMenuOpen(true)}
          />
        </div>
      </nav>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title={party.name} description={`${isOrganizer ? 'Organizzatore' : 'Partecipante'} · ${displayName}`}>
        <div className="grid grid-cols-2 gap-2">
          {nav.filter(n => !['home', 'dispensa', 'spesa'].includes(n.route)).map(n => (
            <button
              key={n.route}
              onClick={() => go(n.route)}
              className={cn(
                'relative flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all',
                route === n.route ? 'border-brand bg-brand-soft text-brand-soft-ink' : 'border-line hover:bg-surface-2'
              )}
            >
              <n.icon className="w-5 h-5" />
              <span className="text-sm font-bold leading-tight">{n.label}</span>
              {!!n.badge && <span className="absolute top-3 right-3 min-w-5 h-5 px-1.5 rounded-full bg-accent text-white text-[11px] font-bold grid place-items-center">{n.badge}</span>}
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-line space-y-1">
          <MenuRow icon={ClipboardList} label="Cambia o crea festa" onClick={() => { setMenuOpen(false); openPartySwitcher('select'); }} />
          {isOrganizer && <MenuRow icon={UserPlus} label="Invita amici" onClick={() => { setMenuOpen(false); setInviteOpen(true); }} />}
          <MenuRow icon={LogOut} label="Esci dall'account" danger onClick={onLogout} />
        </div>
      </Modal>

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}

function SideLink({ entry, active, onClick }: { entry: NavEntry; active: boolean; onClick: () => void }) {
  const Icon = entry.icon;
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'w-full flex items-center gap-3 h-11 px-3 rounded-xl text-[14px] font-semibold transition-all',
        active ? 'bg-ink text-bg shadow-[var(--shadow-card)]' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
      )}
    >
      <Icon className="w-[18px] h-[18px]" />
      <span className="flex-1 text-left">{entry.label}</span>
      {!!entry.badge && (
        <span className={cn('min-w-6 h-6 px-1.5 rounded-lg text-xs font-bold grid place-items-center tabular', active ? 'bg-bg/20 text-bg' : 'bg-accent-soft text-accent-soft-ink')}>{entry.badge}</span>
      )}
    </button>
  );
}

function TabLink({ icon: Icon, label, active, onClick, badge }: { icon: LucideIcon; label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} aria-current={active ? 'page' : undefined} className={cn('relative flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors', active ? 'text-brand' : 'text-ink-3')}>
      <Icon className="w-6 h-6" strokeWidth={active ? 2.4 : 2} />
      <span className="text-[11px] font-semibold">{label}</span>
      {!!badge && <span className="absolute top-0 right-[22%] min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold grid place-items-center ring-2 ring-surface">{badge}</span>}
    </button>
  );
}

function MenuRow({ icon: Icon, label, onClick, danger }: { icon: LucideIcon; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cn('w-full flex items-center gap-3 h-12 px-3 rounded-xl font-semibold text-sm transition-colors', danger ? 'text-danger hover:bg-danger-soft' : 'hover:bg-surface-2')}>
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}
