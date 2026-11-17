// Firestore rules tests. Run with: npm run test:rules (needs Java for the emulator).
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, deleteDoc, getDoc, writeBatch, arrayUnion, arrayRemove, deleteField, addDoc, collection } from 'firebase/firestore';

let env;
const PARTY = 'party-1';
const now = new Date().toISOString();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-partypantry',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
after(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'parties', PARTY), {
      name: 'Festa', inviteCode: 'ABC234', ownerUid: 'owner',
      members: ['owner', 'org', 'guest', 'pend'],
      memberRoles: { owner: 'organizer', org: 'organizer', guest: 'participant', pend: 'participant' },
      memberStatus: { owner: 'active', org: 'active', guest: 'active', pend: 'pending' },
    });
    await setDoc(doc(db, 'products', 'p1'), { partyId: PARTY, name: 'Birra', quantity: 5, type: 'drink', broughtBy: 'guest' });
    await setDoc(doc(db, 'products', 'p2'), { partyId: PARTY, name: 'Pizza', quantity: 2, type: 'food', broughtBy: 'common' });
    await setDoc(doc(db, 'participants', `member-${PARTY}-pend`), { partyId: PARTY, uid: 'pend', name: 'Pen', createdAt: now });
    await setDoc(doc(db, 'users', 'outsider'), { uid: 'outsider', email: 'o@x.it', role: 'participant' });
  });
});

const as = uid => env.authenticatedContext(uid).firestore();

test('a member cannot promote themselves to organizer', async () => {
  await assertFails(updateDoc(doc(as('guest'), 'parties', PARTY), { 'memberRoles.guest': 'organizer' }));
});

test('a pending member cannot approve themselves', async () => {
  await assertFails(updateDoc(doc(as('pend'), 'parties', PARTY), { 'memberStatus.pend': 'active' }));
});

test('an organizer approves a pending member but cannot change roles', async () => {
  await assertSucceeds(updateDoc(doc(as('org'), 'parties', PARTY), { 'memberStatus.pend': 'active' }));
  await assertFails(updateDoc(doc(as('org'), 'parties', PARTY), { 'memberRoles.guest': 'organizer' }));
});

test('the owner changes roles', async () => {
  await assertSucceeds(updateDoc(doc(as('owner'), 'parties', PARTY), { 'memberRoles.guest': 'organizer' }));
});

test('an outsider joins as pending participant together with their record', async () => {
  const db = as('outsider');
  const b = writeBatch(db);
  b.update(doc(db, 'parties', PARTY), { members: arrayUnion('outsider'), 'memberRoles.outsider': 'participant', 'memberStatus.outsider': 'pending' });
  b.update(doc(db, 'users', 'outsider'), { partyId: PARTY, partyIds: arrayUnion(PARTY) });
  b.set(doc(db, 'participants', `member-${PARTY}-outsider`), { partyId: PARTY, uid: 'outsider', name: 'Out', createdAt: now });
  await assertSucceeds(b.commit());
});

test('an outsider cannot join as active organizer', async () => {
  await assertFails(updateDoc(doc(as('outsider'), 'parties', PARTY), { members: arrayUnion('outsider'), 'memberRoles.outsider': 'organizer', 'memberStatus.outsider': 'active' }));
});

test('a member leaves and removes their own record', async () => {
  const db = as('pend');
  const b = writeBatch(db);
  b.delete(doc(db, 'participants', `member-${PARTY}-pend`));
  b.update(doc(db, 'parties', PARTY), { members: arrayRemove('pend'), 'memberRoles.pend': deleteField(), 'memberStatus.pend': deleteField() });
  await assertSucceeds(b.commit());
});

test('a member cannot remove someone else', async () => {
  await assertFails(updateDoc(doc(as('guest'), 'parties', PARTY), { members: arrayRemove('pend'), 'memberRoles.pend': deleteField(), 'memberStatus.pend': deleteField() }));
});

test('an organizer turns away a pending member but not the owner', async () => {
  await assertSucceeds(updateDoc(doc(as('org'), 'parties', PARTY), { members: arrayRemove('pend'), 'memberRoles.pend': deleteField(), 'memberStatus.pend': deleteField() }));
  await assertFails(updateDoc(doc(as('org'), 'parties', PARTY), { members: arrayRemove('owner') }));
});

test('pending members can read but not write products', async () => {
  await assertSucceeds(getDoc(doc(as('pend'), 'products', 'p1')));
  await assertFails(setDoc(doc(as('pend'), 'products', 'x'), { partyId: PARTY, name: 'X', quantity: 1, type: 'food', broughtBy: 'pend' }));
});

test('participants add products for themselves or in common, not for others', async () => {
  await assertSucceeds(setDoc(doc(as('guest'), 'products', 'g1'), { partyId: PARTY, name: 'Chips', quantity: 1, type: 'food', broughtBy: 'guest' }));
  await assertSucceeds(setDoc(doc(as('guest'), 'products', 'g2'), { partyId: PARTY, name: 'Acqua', quantity: 1, type: 'drink', broughtBy: 'common' }));
  await assertFails(setDoc(doc(as('guest'), 'products', 'g3'), { partyId: PARTY, name: 'Vino', quantity: 1, type: 'drink', broughtBy: 'org' }));
});

test('the old "consumable" product type is rejected', async () => {
  await assertFails(updateDoc(doc(as('owner'), 'products', 'p1'), { type: 'consumable' }));
});

test('participants edit only what they brought; negative stock is rejected', async () => {
  await assertSucceeds(updateDoc(doc(as('guest'), 'products', 'p1'), { quantity: 4 }));
  await assertFails(updateDoc(doc(as('guest'), 'products', 'p2'), { quantity: 0 }));
  await assertFails(updateDoc(doc(as('owner'), 'products', 'p1'), { quantity: -1 }));
});

test('only organizers write pantry logs', async () => {
  const log = { partyId: PARTY, date: now, description: 'Prelievo', organizer: 'X' };
  await assertSucceeds(addDoc(collection(as('org'), 'pantry_logs'), log));
  await assertFails(addDoc(collection(as('guest'), 'pantry_logs'), log));
});

test('requests: created pending by the author, withdrawn by them, handled by organizers', async () => {
  const req = { partyId: PARTY, userId: 'guest', userName: 'G', productId: 'p2', productName: 'Pizza', quantity: 1, type: 'withdraw', status: 'pending', createdAt: now };
  await assertFails(setDoc(doc(as('guest'), 'product_requests', 'r0'), { ...req, status: 'approved' }));
  await assertFails(setDoc(doc(as('guest'), 'product_requests', 'r0'), { ...req, userId: 'org' }));
  await assertSucceeds(setDoc(doc(as('guest'), 'product_requests', 'r1'), req));
  await assertFails(updateDoc(doc(as('guest'), 'product_requests', 'r1'), { status: 'approved' }));
  await assertSucceeds(updateDoc(doc(as('org'), 'product_requests', 'r1'), { status: 'approved' }));
  await assertFails(deleteDoc(doc(as('guest'), 'product_requests', 'r1')));
  await assertSucceeds(setDoc(doc(as('guest'), 'product_requests', 'r2'), req));
  await assertSucceeds(deleteDoc(doc(as('guest'), 'product_requests', 'r2')));
});

test('members edit their own participant record but cannot hijack another', async () => {
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'participants', `member-${PARTY}-guest`), { partyId: PARTY, uid: 'guest', name: 'Gue', createdAt: now }));
  await assertSucceeds(updateDoc(doc(as('guest'), 'participants', `member-${PARTY}-guest`), { group: 'Amici' }));
  await assertFails(updateDoc(doc(as('guest'), 'participants', `member-${PARTY}-pend`), { name: 'Hacked' }));
  await assertFails(updateDoc(doc(as('guest'), 'participants', `member-${PARTY}-guest`), { uid: 'org' }));
});

test('audit logs must be signed by the author', async () => {
  const entry = { partyId: PARTY, timestamp: now, action: 'update', entityType: 'product', entityId: 'p1', entityName: 'Birra', userName: 'G', details: 'x' };
  await assertSucceeds(addDoc(collection(as('guest'), 'audit_logs'), { ...entry, userId: 'guest' }));
  await assertFails(addDoc(collection(as('guest'), 'audit_logs'), { ...entry, userId: 'owner' }));
});

test('creating a party: owner must be the only member', async () => {
  const party = { name: 'Nuova', inviteCode: 'QWE234', ownerUid: 'outsider', members: ['outsider'], memberRoles: { outsider: 'organizer' }, memberStatus: { outsider: 'active' } };
  await assertSucceeds(setDoc(doc(as('outsider'), 'parties', 'p-new'), party));
  await assertFails(setDoc(doc(as('outsider'), 'parties', 'p-new2'), { ...party, members: ['outsider', 'guest'] }));
});
