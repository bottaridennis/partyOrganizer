import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Participant, PantryLog, Category, Group, ParticipantRole, ProductRequest, AuditLog } from '../types';

const byDesc = <T,>(key: keyof T) => (a: T, b: T) => String(b[key] ?? '').localeCompare(String(a[key] ?? ''));
const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'it');

/**
 * Live data of the active party. Sorting happens on the client so the app
 * does not depend on composite Firestore indexes.
 */
export function useFirebaseData(partyId: string | undefined, isOrganizer = false, enabled = true) {
  const [products, setProducts] = useState<Product[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [logs, setLogs] = useState<PantryLog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles] = useState<ParticipantRole[]>([]);
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProducts([]); setParticipants([]); setLogs([]); setCategories([]);
    setGroups([]); setRoles([]); setRequests([]); setAuditLogs([]);
    setError(null);

    if (!partyId || !enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const pending = new Set(['products', 'participants']);
    const markLoaded = (name: string) => {
      pending.delete(name);
      if (pending.size === 0) setLoading(false);
    };

    const listen = <T,>(name: string, apply: (rows: T[]) => void) => {
      const q = query(collection(db, name), where('partyId', '==', partyId));
      return onSnapshot(
        q,
        (snap: QuerySnapshot<DocumentData>) => {
          apply(snap.docs.map(d => ({ id: d.id, ...d.data() }) as T));
          markLoaded(name);
        },
        err => {
          console.warn(`Lettura ${name} non riuscita`, err);
          if (name === 'products' || name === 'participants') setError('Non riesco a leggere i dati della festa. Controlla la connessione o i permessi.');
          markLoaded(name);
        }
      );
    };

    const unsubs = [
      listen<Product>('products', rows => setProducts(rows.sort(byName))),
      listen<Participant>('participants', rows => setParticipants(rows.sort((a, b) => `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`, 'it')))),
      listen<PantryLog>('pantry_logs', rows => setLogs(rows.sort(byDesc<PantryLog>('date')).slice(0, 300))),
      listen<Category>('categories', rows => setCategories(rows.sort(byName))),
      listen<Group>('groups', rows => setGroups(rows.sort(byName))),
      listen<ParticipantRole>('participant_roles', rows => setRoles(rows.sort(byName))),
      listen<ProductRequest>('product_requests', rows => setRequests(rows.sort(byDesc<ProductRequest>('createdAt')))),
    ];
    if (isOrganizer) unsubs.push(listen<AuditLog>('audit_logs', rows => setAuditLogs(rows.sort(byDesc<AuditLog>('timestamp')).slice(0, 300))));

    return () => unsubs.forEach(u => u());
  }, [partyId, isOrganizer, enabled]);

  return { products, participants, logs, categories, groups, roles, requests, auditLogs, loading, error };
}
