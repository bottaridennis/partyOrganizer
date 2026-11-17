import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn, errorMessage } from '../../lib/utils';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem { id: number; kind: ToastKind; message: string }

interface ToastApi {
  success: (message: string) => void;
  error: (messageOrError: unknown) => void;
  info: (message: string) => void;
  /** Runs an async action, shows a success toast or a readable error. Returns true on success. */
  run: (action: () => Promise<unknown>, successMessage?: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems(list => list.filter(t => t.id !== id)), []);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    setItems(list => [...list.slice(-2), { id, kind, message }]);
    setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3200);
  }, [dismiss]);

  const api = useMemo<ToastApi>(() => ({
    success: m => push('success', m),
    info: m => push('info', m),
    error: e => {
      console.error(e);
      push('error', typeof e === 'string' ? e : errorMessage(e));
    },
    run: async (action, successMessage) => {
      try {
        await action();
        if (successMessage) push('success', successMessage);
        return true;
      } catch (e) {
        console.error(e);
        push('error', errorMessage(e));
        return false;
      }
    },
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="fixed z-[200] inset-x-0 bottom-24 lg:bottom-6 flex flex-col items-center gap-2 px-4 pointer-events-none">
        {items.map(t => {
          const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertCircle : Info;
          return (
            <div
              key={t.id}
              role={t.kind === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto animate-rise flex items-center gap-3 max-w-md w-full sm:w-auto pl-3.5 pr-2 py-2.5 rounded-2xl bg-ink text-bg shadow-[var(--shadow-pop)]"
            >
              <Icon className={cn('w-5 h-5 shrink-0', t.kind === 'success' ? 'text-ok' : t.kind === 'error' ? 'text-danger' : 'text-brand')} />
              <p className="text-sm font-medium flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} aria-label="Chiudi" className="w-7 h-7 grid place-items-center rounded-lg opacity-60 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
