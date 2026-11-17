import React, { useId } from 'react';
import { ChevronDown, Minus, Plus, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

const control =
  'w-full h-11 rounded-xl bg-surface border border-line text-ink placeholder:text-ink-3 px-3.5 text-[15px] outline-none transition-all hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:opacity-60 disabled:bg-surface-2';

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
  optional,
}: {
  label?: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
  optional?: boolean;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[13px] font-semibold text-ink-2 flex items-center gap-1.5">
          {label}
          {optional && <span className="font-normal text-ink-3">· facoltativo</span>}
        </label>
      )}
      {children}
      {error ? <p className="text-xs text-danger font-medium">{error}</p> : hint ? <p className="text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon; suffix?: React.ReactNode };

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ icon: Icon, suffix, className, ...rest }, ref) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />}
      <input ref={ref} className={cn(control, Icon && 'pl-10', suffix && 'pr-12', className)} {...rest} />
      {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-3 pointer-events-none">{suffix}</span>}
    </div>
  );
});

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'h-auto min-h-24 py-3 resize-y', className)} {...rest} />;
}

export function Select({ icon: Icon, className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { icon?: LucideIcon }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />}
      <select className={cn(control, 'appearance-none pr-10 cursor-pointer', Icon && 'pl-10', className)} {...rest}>
        {children}
      </select>
      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
    </div>
  );
}

export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-4 cursor-pointer select-none">
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="block text-xs text-ink-3 mt-0.5">{description}</span>}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative w-11 h-6 rounded-full transition-colors shrink-0', checked ? 'bg-brand' : 'bg-surface-3')}
      >
        <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
      </button>
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T;
  onChange: (v: NoInfer<T>) => void;
  options: { value: NoInfer<T>; label: React.ReactNode; icon?: LucideIcon; tone?: 'brand' | 'ok' | 'accent' }[];
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div role="radiogroup" className={cn('inline-flex p-1 rounded-xl bg-surface-2 border border-line gap-1', className)}>
      {options.map(o => {
        const active = o.value === value;
        const tone = o.tone === 'ok' ? 'text-ok' : o.tone === 'accent' ? 'text-accent' : 'text-brand';
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-all whitespace-nowrap',
              size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3.5 text-sm',
              active ? cn('bg-surface shadow-[var(--shadow-card)]', tone) : 'text-ink-3 hover:text-ink'
            )}
          >
            {o.icon && <o.icon className="w-4 h-4" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max, className }: { value: number; onChange: (v: number) => void; min?: number; max?: number; className?: string }) {
  const clamp = (v: number) => Math.max(min, max !== undefined ? Math.min(max, v) : v);
  return (
    <div className={cn('inline-flex items-center rounded-xl border border-line bg-surface overflow-hidden', className)}>
      <button type="button" aria-label="Diminuisci" onClick={() => onChange(clamp(value - 1))} disabled={value <= min} className="w-11 h-11 grid place-items-center text-ink-2 hover:bg-surface-2 disabled:opacity-30">
        <Minus className="w-4 h-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        onChange={e => onChange(clamp(parseInt(e.target.value, 10) || 0))}
        className="w-16 h-11 text-center font-bold tabular bg-transparent outline-none text-ink [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" aria-label="Aumenta" onClick={() => onChange(clamp(value + 1))} disabled={max !== undefined && value >= max} className="w-11 h-11 grid place-items-center text-ink-2 hover:bg-surface-2 disabled:opacity-30">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

export function Chip({ active, onClick, children, icon: Icon }: { active?: boolean; onClick?: () => void; children: React.ReactNode; icon?: LucideIcon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-semibold border transition-all whitespace-nowrap',
        active ? 'bg-ink text-bg border-ink' : 'bg-surface text-ink-2 border-line hover:border-line-strong hover:text-ink'
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}
