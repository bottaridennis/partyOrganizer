import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Participant, Product } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Removes `undefined` values (Firestore rejects them) and replaces NaN with 0. */
export function cleanObject(obj: any): any {
  if (Array.isArray(obj)) return obj.map(cleanObject);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => {
          if (typeof v === 'number' && isNaN(v)) return [k, 0];
          return [k, cleanObject(v)];
        })
    );
  }
  return obj;
}

// ------------------------------------------------------------------
// Formatting
// ------------------------------------------------------------------

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
export const formatEuro = (value: number) => euro.format(value || 0);

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('it-IT', opts);
};

export const formatDateTime = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  if (isNaN(d)) return '';
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return 'adesso';
  if (diff < 3600) return `${Math.floor(diff / 60)} min fa`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h fa`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} g fa`;
  return formatDate(iso);
}

export const normalize = (s: string) => (s || '').toLocaleLowerCase('it-IT').normalize('NFD').replace(/[̀-ͯ]/g, '');

// ------------------------------------------------------------------
// Participants
// ------------------------------------------------------------------

export const COMMON = 'common';

/**
 * The value stored in `product.broughtBy` for a participant: the user's uid
 * for people with an account (so Firestore rules can check ownership),
 * otherwise the participant document id.
 */
export const participantKey = (p: Participant) => p.uid || p.id || '';

/** Older versions stored "Comune" or an empty string for shared products. */
export const isCommonOwner = (broughtBy?: string) => !broughtBy || broughtBy === COMMON || broughtBy === 'Comune';

export const fullName = (p?: Pick<Participant, 'name' | 'surname'> | null) =>
  p ? `${p.name || ''} ${p.surname || ''}`.trim() : '';

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '?';

export function findParticipant(participants: Participant[], key?: string) {
  if (!key || isCommonOwner(key)) return undefined;
  return participants.find(p => p.uid === key || p.id === key);
}

// ------------------------------------------------------------------
// Products
// ------------------------------------------------------------------

export const isDrink = (p: Pick<Product, 'type' | 'category'>) => p.type === 'drink' || p.category === 'Bevanda';
export const isAlcoholic = (p: Pick<Product, 'labels'>) => !!p.labels?.includes('Alcolico');

export function isLowStock(p: Product) {
  const min = Number.isFinite(p.minQuantity) ? p.minQuantity : 0;
  if (p.quantity <= 0) return true;
  // A single, partly drunk bottle counts as running low.
  if (p.quantity === 1 && isDrink(p) && (p.fillLevel ?? 100) < 30) return true;
  return p.quantity <= min;
}

export type ExpiryState = 'expired' | 'soon' | 'ok' | 'none';
export function expiryState(p: Pick<Product, 'expiryDate'>): ExpiryState {
  if (!p.expiryDate) return 'none';
  const expiry = new Date(`${p.expiryDate}T23:59:59`);
  if (isNaN(expiry.getTime())) return 'none';
  const days = (expiry.getTime() - Date.now()) / 86400000;
  if (days < 0) return 'expired';
  if (days <= 3) return 'soon';
  return 'ok';
}

/** What a product cost in total, based on the quantity it was bought in. */
export const productSpend = (p: Product) => (p.price || 0) * (p.initialQuantity ?? p.quantity ?? 0);

// ------------------------------------------------------------------
// Files
// ------------------------------------------------------------------

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Semicolon + BOM so Excel (Italian locale) opens it correctly.
  const csv = '﻿' + rows.map(r => r.map(escape).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function errorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/permission|insufficient/i.test(msg)) return 'Non hai i permessi per questa operazione.';
  if (/network|offline|unavailable/i.test(msg)) return 'Connessione assente. Riprova tra poco.';
  if (msg.startsWith('{')) return 'Operazione non riuscita.';
  return msg || 'Operazione non riuscita.';
}
