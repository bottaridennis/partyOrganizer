import React, { useState } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn, initials } from '../../lib/utils';

export function Card({ className, children, as: As = 'div', ...rest }: React.HTMLAttributes<HTMLElement> & { as?: any }) {
  return (
    <As className={cn('bg-surface border border-line rounded-3xl shadow-[var(--shadow-card)]', className)} {...rest}>
      {children}
    </As>
  );
}

type Tone = 'neutral' | 'brand' | 'ok' | 'warn' | 'danger' | 'info' | 'accent';
const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-2',
  brand: 'bg-brand-soft text-brand-soft-ink',
  ok: 'bg-ok-soft text-ok-soft-ink',
  warn: 'bg-warn-soft text-warn-soft-ink',
  danger: 'bg-danger-soft text-danger-soft-ink',
  info: 'bg-info-soft text-info-soft-ink',
  accent: 'bg-accent-soft text-accent-soft-ink',
};

export function Badge({ tone = 'neutral', icon: Icon, children, className }: { tone?: Tone; icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 h-6 px-2 rounded-lg text-xs font-semibold whitespace-nowrap', tones[tone], className)}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
}

const avatarColors = ['bg-[#ffe1d6] text-[#a33a14]', 'bg-[#e6ddff] text-[#4b23b8]', 'bg-[#d8f3e7] text-[#0a6a48]', 'bg-[#fff0c7] text-[#8a5200]', 'bg-[#dcebff] text-[#1d5bb8]', 'bg-[#ffdbe7] text-[#a3184f]'];

export function Avatar({ name, src, size = 40, className }: { name: string; src?: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const color = avatarColors[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length];
  return (
    <span
      className={cn('relative inline-grid place-items-center shrink-0 rounded-full overflow-hidden font-bold', color, className)}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.38) }}
      aria-hidden
    >
      {src && !failed ? (
        <img src={src} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }: { icon: LucideIcon; title: string; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center text-center py-14 px-6 rounded-3xl border border-dashed border-line-strong bg-surface/60', className)}>
      <div className="w-14 h-14 rounded-2xl bg-surface-2 text-ink-3 grid place-items-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="text-sm text-ink-2 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand mb-1.5">{eyebrow}</p>}
        <h1 className="text-[28px] sm:text-[32px] font-extrabold leading-[1.1]">{title}</h1>
        {description && <p className="text-[15px] text-ink-2 mt-1.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, action, icon: Icon }: { children: React.ReactNode; action?: React.ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="text-lg font-bold flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-ink-3" />}
        {children}
      </h2>
      {action}
    </div>
  );
}

export function ProductThumb({ src, drink, size = 56, className }: { src?: string; drink: boolean; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={cn('relative inline-grid place-items-center shrink-0 overflow-hidden rounded-2xl', drink ? 'bg-info-soft' : 'bg-accent-soft', className)}
      style={{ width: size, height: size, fontSize: size * 0.48 }}
      aria-hidden
    >
      {src && !failed ? <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : drink ? '🥤' : '🍕'}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-surface-2', className)} />;
}

export function Meter({ value, tone = 'brand', className }: { value: number; tone?: 'brand' | 'ok' | 'warn' | 'danger'; className?: string }) {
  const color = { brand: 'bg-brand', ok: 'bg-ok', warn: 'bg-warn', danger: 'bg-danger' }[tone];
  return (
    <div className={cn('h-2 rounded-full bg-surface-3 overflow-hidden', className)}>
      <div className={cn('h-full rounded-full transition-[width] duration-700', color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
