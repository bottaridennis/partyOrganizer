// Fills the local emulators with a demo party. Usage: npm run emulators, then npm run seed:emulator
// Demo accounts (password "festa123"): giulia@demo.it (organizer), marco@demo.it, sara@demo.it, luca@demo.it (pending)
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const PROJECT = 'demo-partypantry';
const AUTH = 'http://127.0.0.1:9099';

async function createUser(email, displayName) {
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'festa123', displayName, returnSecureToken: true }),
  });
  const json = await res.json();
  if (json.localId) return json.localId;
  const login = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'festa123', returnSecureToken: true }),
  });
  return (await login.json()).localId;
}

const people = [
  ['giulia@demo.it', 'Giulia Bianchi'],
  ['marco@demo.it', 'Marco Rossi'],
  ['sara@demo.it', 'Sara Verdi'],
  ['luca@demo.it', 'Luca Neri'],
];
const uids = {};
for (const [email, name] of people) uids[email] = await createUser(email, name);
const [giulia, marco, sara, luca] = Object.values(uids);

const env = await initializeTestEnvironment({ projectId: PROJECT, firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
const PARTY = 'party-demo';
const day = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const ago = h => new Date(Date.now() - h * 3600000).toISOString();

await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'parties', PARTY), {
    name: '30 anni di Giulia', inviteCode: 'FESTA3', ownerUid: giulia,
    members: [giulia, marco, sara, luca],
    memberRoles: { [giulia]: 'organizer', [marco]: 'organizer', [sara]: 'participant', [luca]: 'participant' },
    memberStatus: { [giulia]: 'active', [marco]: 'active', [sara]: 'active', [luca]: 'pending' },
  });
  for (const [email, name] of people) {
    const uid = uids[email];
    const [first, last] = name.split(' ');
    await setDoc(doc(db, 'users', uid), { uid, email, displayName: name, role: 'participant', partyId: PARTY, partyIds: [PARTY], photoURL: '' });
    await setDoc(doc(db, 'participants', `member-${PARTY}-${uid}`), { partyId: PARTY, uid, name: first, surname: last, email, group: uid === giulia ? 'Famiglia' : 'Amici', role: uid === marco ? 'Barbecue' : uid === sara ? 'DJ' : '', code: 'M', createdAt: ago(100), imageUrl: '' });
  }
  await setDoc(doc(db, 'participants', 'guest-nonna'), { partyId: PARTY, uid: '', name: 'Nonna', surname: 'Pina', email: '', group: 'Famiglia', role: 'Dolci', code: 'G', createdAt: ago(90), imageUrl: '' });
  for (const c of ['Cibo', 'Bevanda', 'Snack', 'Dolci', 'Attrezzatura']) await setDoc(doc(db, 'categories', `cat-${c}`), { partyId: PARTY, name: c });
  for (const g of ['Famiglia', 'Amici', 'Colleghi']) await setDoc(doc(db, 'groups', `grp-${g}`), { partyId: PARTY, name: g });
  for (const r of ['DJ', 'Barbecue', 'Dolci']) await setDoc(doc(db, 'participant_roles', `role-${r}`), { partyId: PARTY, name: r });

  const P = (id, d) => setDoc(doc(db, 'products', id), { partyId: PARTY, brand: '', code: id, labels: [], allergens: '', alcoholContent: 0, fillLevel: 100, expiryDate: '', imageUrl: '', minQuantity: 2, lastUpdated: ago(5), updatedBy: 'Giulia Bianchi', ...d });
  await P('birra', { name: 'Birra Ichnusa 33cl', brand: 'Ichnusa', type: 'drink', category: 'Bevanda', quantity: 18, initialQuantity: 24, price: 1.2, broughtBy: marco, labels: ['Alcolico'], alcoholContent: 4.7, minQuantity: 6 });
  await P('prosecco', { name: 'Prosecco DOC', brand: 'Valdo', type: 'drink', category: 'Bevanda', quantity: 1, initialQuantity: 6, price: 7.5, broughtBy: giulia, labels: ['Alcolico'], alcoholContent: 11, fillLevel: 40, minQuantity: 2 });
  await P('coca', { name: 'Coca-Cola 1,5 L', type: 'drink', category: 'Bevanda', quantity: 4, initialQuantity: 6, price: 1.9, broughtBy: 'common', labels: ['Analcolico'] });
  await P('acqua', { name: 'Acqua frizzante', type: 'drink', category: 'Bevanda', quantity: 0, initialQuantity: 6, price: 0.4, broughtBy: 'common', labels: ['Analcolico'] });
  await P('pizza', { name: 'Pizza margherita', type: 'food', category: 'Cibo', quantity: 6, initialQuantity: 8, price: 6, broughtBy: sara, allergens: 'glutine, lattosio' });
  await P('patatine', { name: 'Patatine classiche', brand: 'San Carlo', type: 'food', category: 'Snack', quantity: 3, initialQuantity: 5, price: 2.3, broughtBy: sara, labels: ['Vegano'] });
  await P('torta', { name: 'Torta della nonna', type: 'food', category: 'Dolci', quantity: 1, initialQuantity: 1, price: 18, broughtBy: 'guest-nonna', expiryDate: day(1), minQuantity: 0, labels: ['Fresco'] });
  await P('salsicce', { name: 'Salsicce per grigliata', type: 'food', category: 'Cibo', quantity: 12, initialQuantity: 20, price: 1.1, broughtBy: marco, expiryDate: day(2), labels: ['Da tenere in frigo'] });
  await P('piatti', { name: 'Piatti compostabili', type: 'food', category: 'Attrezzatura', quantity: 40, initialQuantity: 50, price: 0.1, broughtBy: 'common', minQuantity: 10 });
  await P('hummus', { name: 'Hummus', type: 'food', category: 'Snack', quantity: 2, initialQuantity: 2, price: 2.9, broughtBy: giulia, expiryDate: day(-1), labels: ['Vegano'] });

  await setDoc(doc(db, 'pantry_logs', 'l1'), { partyId: PARTY, date: ago(1), description: 'Brindisi di benvenuto', organizer: 'Giulia Bianchi', participantId: 'GENERAL', productsUsed: [{ productId: 'prosecco', productName: 'Prosecco DOC', quantity: 5, type: 'withdraw' }] });
  await setDoc(doc(db, 'pantry_logs', 'l2'), { partyId: PARTY, date: ago(3), description: 'Spesa al supermercato', organizer: 'Marco Rossi', participantId: `member-${PARTY}-${marco}`, productsUsed: [{ productId: 'birra', productName: 'Birra Ichnusa 33cl', quantity: 24, type: 'return' }, { productId: 'salsicce', productName: 'Salsicce per grigliata', quantity: 20, type: 'return' }] });
  await setDoc(doc(db, 'pantry_logs', 'l3'), { partyId: PARTY, date: ago(30), description: 'Aperitivo in giardino', organizer: 'Giulia Bianchi', participantId: 'GENERAL', productsUsed: [{ productId: 'birra', productName: 'Birra Ichnusa 33cl', quantity: 6, type: 'withdraw' }, { productId: 'patatine', productName: 'Patatine classiche', quantity: 2, type: 'withdraw' }] });
  await setDoc(doc(db, 'product_requests', 'r1'), { partyId: PARTY, userId: sara, userName: 'Sara Verdi', productId: 'coca', productName: 'Coca-Cola 1,5 L', quantity: 2, type: 'withdraw', participantId: `member-${PARTY}-${sara}`, notes: 'Per il tavolo dei ragazzi', status: 'pending', createdAt: ago(0.3) });
  await setDoc(doc(db, 'audit_logs', 'a1'), { partyId: PARTY, timestamp: ago(1), action: 'move', entityType: 'product', entityId: 'prosecco', entityName: 'Prosecco DOC', userId: giulia, userName: 'Giulia Bianchi', details: 'Prelevati 5 pz per la festa' });
  await setDoc(doc(db, 'audit_logs', 'a2'), { partyId: PARTY, timestamp: ago(2), action: 'create', entityType: 'product', entityId: 'hummus', entityName: 'Hummus', userId: giulia, userName: 'Giulia Bianchi', details: 'Aggiunto 2 pz di Hummus' });
});
await env.cleanup();
console.log('Seed completato. Accedi con giulia@demo.it / festa123');
