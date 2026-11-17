import { cn } from '../../lib/utils';

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('relative inline-grid place-items-center rounded-[30%] shrink-0 bg-gradient-to-br from-[#7b4dff] via-[#6d3df5] to-[#ff6a3d] shadow-[var(--shadow-brand)]', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" style={{ width: size * 0.6, height: size * 0.6 }}>
        <path d="M7 26 L13.5 8 L24 18.5 Z" fill="#fff" />
        <path d="M13.5 8 L24 18.5" stroke="#ffd27a" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="23.5" cy="7.5" r="2" fill="#ffd27a" />
        <circle cx="27" cy="13" r="1.4" fill="#fff" opacity=".85" />
        <path d="M18 4.5 q1.5 2 0 4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".85" />
      </svg>
    </span>
  );
}

export function Logo({ inverted, compact }: { inverted?: boolean; compact?: boolean }) {
  return (
    <div className="relative flex items-center gap-3">
      <LogoMark size={compact ? 36 : 42} />
      <div className="leading-none">
        <p className={cn('font-display font-extrabold tracking-tight', compact ? 'text-lg' : 'text-xl', inverted ? 'text-white' : 'text-ink')}>Party Pantry</p>
        {!compact && <p className={cn('text-xs font-medium mt-1', inverted ? 'text-white/60' : 'text-ink-3')}>La dispensa della festa</p>}
      </div>
    </div>
  );
}
