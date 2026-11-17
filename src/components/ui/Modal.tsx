import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Input } from './Field';

/**
 * Dialog that becomes a bottom sheet on phones. Closes on Escape and on
 * backdrop click, locks body scroll and restores focus on close.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      const target = panel.current?.querySelector<HTMLElement>('[autofocus], input, select, textarea') ?? panel.current;
      target?.focus({ preventScroll: true });
    });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-[#0b0814]/55 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          'relative w-full bg-surface text-ink shadow-[var(--shadow-pop)] flex flex-col outline-none',
          'max-h-[92dvh] rounded-t-3xl animate-sheet sm:rounded-3xl sm:animate-pop',
          widths[size]
        )}
      >
        <div className="sm:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line-strong" />
        <header className="flex items-start gap-3 px-5 sm:px-6 pt-4 sm:pt-6 pb-4">
          {icon}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold leading-tight">{title}</h2>
            {description && <p className="text-sm text-ink-2 mt-1">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Chiudi" className="-mr-1.5 -mt-1 w-9 h-9 grid place-items-center rounded-xl text-ink-3 hover:bg-surface-2 hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-5">{children}</div>
        {footer && <footer className="px-5 sm:px-6 py-4 border-t border-line flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-safe">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

/** Generic confirmation. Pass `typeToConfirm` for irreversible, high-impact actions. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Elimina',
  typeToConfirm,
  tone = 'danger',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  typeToConfirm?: string;
  tone?: 'danger' | 'primary';
}) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setTyped('');
  }, [open]);

  const blocked = !!typeToConfirm && typed.trim() !== typeToConfirm.trim();

  const run = async () => {
    if (blocked) return;
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      icon={
        <div className={cn('w-11 h-11 rounded-2xl grid place-items-center shrink-0', tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand')}>
          <AlertTriangle className="w-5 h-5" />
        </div>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annulla</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={busy} disabled={blocked} onClick={run}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="text-sm text-ink-2 leading-relaxed">{message}</div>
      {typeToConfirm && (
        <form
          className="mt-4 space-y-2"
          onSubmit={e => {
            e.preventDefault();
            run();
          }}
        >
          <p className="text-xs text-ink-3">
            Per confermare scrivi <strong className="text-ink font-semibold">{typeToConfirm}</strong>
          </p>
          <Input autoFocus value={typed} onChange={e => setTyped(e.target.value)} placeholder={typeToConfirm} />
        </form>
      )}
    </Modal>
  );
}
