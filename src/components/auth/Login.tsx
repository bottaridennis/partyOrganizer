import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Field, Input } from '../ui/Field';
import { authErrorMessage } from '../../hooks/useAuth';
import { Logo } from '../layout/Logo';

type Mode = 'login' | 'register' | 'reset';

export function Login({
  onGoogleLogin,
  onEmailLogin,
  onRegister,
  onResetPassword,
  inviteCode,
}: {
  onGoogleLogin: () => Promise<void>;
  onEmailLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (email: string, pass: string, name: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  inviteCode?: string | null;
}) {
  const [mode, setMode] = useState<Mode>(inviteCode ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<'email' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setNotice(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy('email');
    try {
      if (mode === 'register') await onRegister(email, password, name);
      else if (mode === 'login') await onEmailLogin(email, password);
      else {
        await onResetPassword(email);
        setNotice('Ti abbiamo inviato un\'email con il link per scegliere una nuova password.');
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const google = async () => {
    setError(null);
    setBusy('google');
    try {
      await onGoogleLogin();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const titles: Record<Mode, [string, string]> = {
    login: ['Bentornato!', 'Accedi per vedere la dispensa della tua festa.'],
    register: ['Crea il tuo account', 'Ci vuole meno di un minuto.'],
    reset: ['Password dimenticata', 'Inserisci la tua email e ti mandiamo un link.'],
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-[1.1fr_1fr] bg-bg">
      {/* Hero */}
      <aside className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 bg-[#1b1430] text-white">
        <div className="absolute inset-0 confetti-bg opacity-90" />
        <div className="absolute -right-32 -top-32 w-[28rem] h-[28rem] rounded-full bg-[#6d3df5] blur-[120px] opacity-60" />
        <div className="absolute -left-24 bottom-0 w-[22rem] h-[22rem] rounded-full bg-[#ff6a3d] blur-[120px] opacity-40" />
        <Logo inverted />
        <div className="relative max-w-md">
          <h1 className="text-5xl font-extrabold leading-[1.02]">La festa perfetta inizia dalla dispensa.</h1>
          <p className="mt-5 text-lg text-white/75">Chi porta cosa, cosa sta finendo, quanto avete speso. Tutti allineati, in tempo reale.</p>
          <ul className="mt-8 space-y-3 text-white/85">
            {['Lista della spesa automatica con le scorte basse', 'Richieste di prelievo approvate dagli organizzatori', 'Report dei contributi esportabile in Excel'].map(t => (
              <li key={t} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#ffb79f] shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/50">🎉 Fatto per compleanni, grigliate, cene e tutto ciò che si festeggia.</p>
      </aside>

      {/* Form */}
      <main className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm mx-auto animate-rise">
          <div className="lg:hidden mb-10">
            <Logo />
          </div>

          {inviteCode && (
            <div className="mb-6 p-4 rounded-2xl bg-brand-soft text-brand-soft-ink text-sm">
              Sei stato invitato a una festa 🎈 Accedi o registrati: entrerai subito con il codice <strong className="font-bold tracking-wider">{inviteCode}</strong>.
            </div>
          )}

          <h2 className="text-3xl font-extrabold">{titles[mode][0]}</h2>
          <p className="text-ink-2 mt-1.5 mb-7">{titles[mode][1]}</p>

          {error && (
            <div role="alert" className="mb-5 p-3.5 rounded-xl bg-danger-soft text-danger-soft-ink text-sm flex gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="mb-5 p-3.5 rounded-xl bg-ok-soft text-ok-soft-ink text-sm flex gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              {notice}
            </div>
          )}

          {mode !== 'reset' && (
            <>
              <Button variant="secondary" size="lg" block onClick={google} loading={busy === 'google'} disabled={!!busy}>
                {busy !== 'google' && (
                  <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden>
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
                  </svg>
                )}
                Continua con Google
              </Button>
              <div className="flex items-center gap-3 my-6 text-xs font-semibold uppercase tracking-wider text-ink-3">
                <span className="h-px flex-1 bg-line" /> oppure con email <span className="h-px flex-1 bg-line" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <Field label="Nome e cognome" htmlFor="name">
                <Input id="name" icon={UserIcon} required autoComplete="name" placeholder="Mario Rossi" value={name} onChange={e => setName(e.target.value)} />
              </Field>
            )}
            <Field label="Email" htmlFor="email">
              <Input id="email" icon={Mail} type="email" required autoComplete="email" placeholder="tu@esempio.it" value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
            {mode !== 'reset' && (
              <Field
                label="Password"
                htmlFor="password"
                hint={mode === 'register' ? 'Almeno 6 caratteri.' : undefined}
              >
                <div className="relative">
                  <Input
                    id="password"
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-lg text-ink-3 hover:text-ink"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
            )}
            {mode === 'login' && (
              <div className="flex justify-end -mt-1">
                <button type="button" onClick={() => switchMode('reset')} className="text-sm font-semibold text-brand hover:underline">
                  Password dimenticata?
                </button>
              </div>
            )}
            <Button type="submit" size="lg" block loading={busy === 'email'} disabled={!!busy}>
              {mode === 'register' ? 'Crea account' : mode === 'login' ? 'Accedi' : 'Invia link'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-2">
            {mode === 'login' ? 'Non hai un account?' : 'Hai già un account?'}{' '}
            <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')} className="font-bold text-brand hover:underline">
              {mode === 'login' ? 'Registrati' : 'Accedi'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
