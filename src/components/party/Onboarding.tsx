import type React from 'react';
import { Clock, LogOut, Plus, RefreshCw, Ticket } from 'lucide-react';
import { Button } from '../ui/Button';
import { Logo } from '../layout/Logo';
import type { UserProfile } from '../../types';

function Shell({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <header className="flex items-center justify-between px-5 sm:px-8 py-5">
        <Logo compact />
        <Button variant="ghost" size="sm" icon={LogOut} onClick={onLogout}>Esci</Button>
      </header>
      <main className="flex-1 grid place-items-center px-5 pb-16">
        <div className="w-full max-w-xl animate-rise">{children}</div>
      </main>
    </div>
  );
}

export function NoPartyScreen({ profile, onCreate, onJoin, onLogout }: { profile: UserProfile; onCreate: () => void; onJoin: () => void; onLogout: () => void }) {
  const first = profile.displayName?.split(' ')[0] || 'amico';
  return (
    <Shell onLogout={onLogout}>
      <div className="text-center mb-10">
        <div className="text-6xl mb-5" aria-hidden>🎈</div>
        <h1 className="text-4xl font-extrabold">Ciao {first}!</h1>
        <p className="text-lg text-ink-2 mt-3">Per iniziare crea una festa oppure entra in quella di un amico con il codice invito.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <button onClick={onCreate} className="group text-left p-6 rounded-3xl bg-brand text-white shadow-[var(--shadow-brand)] hover:brightness-110 transition-all">
          <span className="w-12 h-12 rounded-2xl bg-white/20 grid place-items-center mb-8 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </span>
          <span className="block text-xl font-bold font-display">Organizzo io</span>
          <span className="block text-sm text-white/80 mt-1">Crea una festa e invita gli amici.</span>
        </button>
        <button onClick={onJoin} className="group text-left p-6 rounded-3xl bg-surface border border-line shadow-[var(--shadow-card)] hover:border-line-strong transition-all">
          <span className="w-12 h-12 rounded-2xl bg-accent-soft text-accent grid place-items-center mb-8 group-hover:scale-110 transition-transform">
            <Ticket className="w-6 h-6" />
          </span>
          <span className="block text-xl font-bold font-display">Ho un invito</span>
          <span className="block text-sm text-ink-2 mt-1">Entra con il codice di 6 caratteri.</span>
        </button>
      </div>
    </Shell>
  );
}

export function PendingScreen({ partyName, onSwitch, onLeave, onLogout }: { partyName: string; onSwitch: () => void; onLeave: () => void; onLogout: () => void }) {
  return (
    <Shell onLogout={onLogout}>
      <div className="bg-surface border border-line rounded-3xl p-8 sm:p-10 text-center shadow-[var(--shadow-card)]">
        <div className="w-16 h-16 rounded-2xl bg-warn-soft text-warn grid place-items-center mx-auto mb-6">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold">Quasi dentro!</h1>
        <p className="text-ink-2 mt-3 text-[15px] leading-relaxed">
          Hai chiesto di partecipare a <strong className="text-ink">{partyName}</strong>. Appena un organizzatore approva la richiesta potrai vedere la dispensa. Questa pagina si aggiorna da sola.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="secondary" icon={RefreshCw} onClick={onSwitch}>Cambia festa</Button>
          <Button variant="ghost" onClick={onLeave} className="text-danger hover:text-danger">Annulla richiesta</Button>
        </div>
      </div>
    </Shell>
  );
}

export function FullScreenLoader({ label = 'Caricamento…' }: { label?: string }) {
  return (
    <div className="min-h-dvh grid place-items-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-[3px] border-brand border-t-transparent animate-spin" />
        <p className="text-sm text-ink-2 font-medium">{label}</p>
      </div>
    </div>
  );
}
