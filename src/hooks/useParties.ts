import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  arrayUnion,
  arrayRemove,
  deleteField,
  writeBatch,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Party, UserProfile } from '../types';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid typos

export function generateInviteCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, b => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join('');
}

const splitName = (displayName?: string) => {
  const parts = (displayName || '').trim().split(/\s+/).filter(Boolean);
  return { name: parts[0] || 'Amico', surname: parts.slice(1).join(' ') };
};

export const memberDocId = (partyId: string, uid: string) => `member-${partyId}-${uid}`;

export function useParties(userProfile: UserProfile | null) {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) {
      setParties([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'parties'), where('members', 'array-contains', userProfile.uid));
    return onSnapshot(
      q,
      snap => {
        setParties(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Party).sort((a, b) => a.name.localeCompare(b.name, 'it')));
        setLoading(false);
      },
      err => {
        console.warn('Lettura feste non riuscita', err);
        setLoading(false);
      }
    );
  }, [userProfile?.uid]);

  const selectParty = async (uid: string, partyId: string) => {
    await updateDoc(doc(db, 'users', uid), { partyId, partyIds: arrayUnion(partyId) });
  };

  const createParty = async (name: string, owner: UserProfile) => {
    const id = `party-${Date.now()}`;
    const newParty: Party = {
      name: name.trim(),
      inviteCode: generateInviteCode(),
      ownerUid: owner.uid,
      members: [owner.uid],
      memberRoles: { [owner.uid]: 'organizer' },
      memberStatus: { [owner.uid]: 'active' },
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'parties', id), newParty);
    batch.update(doc(db, 'users', owner.uid), { partyId: id, partyIds: arrayUnion(id) });
    await batch.commit();

    // The participant record needs the party to exist (rules check membership).
    const { name: first, surname } = splitName(owner.displayName);
    const second = writeBatch(db);
    second.set(doc(db, 'participants', memberDocId(id, owner.uid)), {
      partyId: id,
      uid: owner.uid,
      name: first,
      surname,
      email: owner.email || '',
      group: 'Organizzatori',
      role: 'Organizzatore',
      code: `ORG-${owner.uid.substring(0, 5)}`,
      createdAt: new Date().toISOString(),
      imageUrl: owner.photoURL || '',
    });
    // Sensible defaults so the inventory is usable straight away.
    for (const cat of ['Cibo', 'Bevanda', 'Snack', 'Dolci', 'Attrezzatura']) {
      second.set(doc(collection(db, 'categories')), { name: cat, partyId: id });
    }
    await second.commit();
    return id;
  };

  /** Returns the party id and whether the user was already a member. */
  const joinParty = async (inviteCode: string, user: UserProfile) => {
    const code = inviteCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 4) throw new Error('Il codice invito non è valido.');
    const snap = await getDocs(query(collection(db, 'parties'), where('inviteCode', '==', code)));
    if (snap.empty) throw new Error('Nessuna festa trovata con questo codice.');

    const partyDoc = snap.docs[0];
    const partyId = partyDoc.id;
    const party = partyDoc.data() as Party;

    if (party.members?.includes(user.uid)) {
      await selectParty(user.uid, partyId);
      return { partyId, alreadyMember: true, name: party.name };
    }

    const batch = writeBatch(db);
    batch.update(doc(db, 'parties', partyId), {
      members: arrayUnion(user.uid),
      [`memberRoles.${user.uid}`]: 'participant',
      [`memberStatus.${user.uid}`]: 'pending',
    });
    batch.update(doc(db, 'users', user.uid), { partyId, partyIds: arrayUnion(partyId) });
    const { name, surname } = splitName(user.displayName);
    batch.set(doc(db, 'participants', memberDocId(partyId, user.uid)), {
      partyId,
      uid: user.uid,
      name,
      surname,
      email: user.email || '',
      group: 'Da assegnare',
      role: 'Partecipante',
      code: `MEM-${user.uid.substring(0, 5)}`,
      createdAt: new Date().toISOString(),
      imageUrl: user.photoURL || '',
    });
    await batch.commit();
    return { partyId, alreadyMember: false, name: party.name };
  };

  const clearActiveParty = async (uid: string, partyId: string, fallbackId?: string) => {
    const userRef = doc(db, 'users', uid);
    const current = (await getDoc(userRef)).data() as UserProfile | undefined;
    const update: Record<string, unknown> = { partyIds: arrayRemove(partyId) };
    if (current?.partyId === partyId) update.partyId = fallbackId || deleteField();
    await updateDoc(userRef, update);
  };

  const leaveParty = async (partyId: string, uid: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'participants', memberDocId(partyId, uid)));
    batch.update(doc(db, 'parties', partyId), {
      members: arrayRemove(uid),
      [`memberRoles.${uid}`]: deleteField(),
      [`memberStatus.${uid}`]: deleteField(),
    });
    await batch.commit();
    await clearActiveParty(uid, partyId, parties.find(p => p.id !== partyId)?.id);
  };

  const deleteParty = async (partyId: string, uid: string) => {
    await clearActiveParty(uid, partyId, parties.find(p => p.id !== partyId)?.id);
    const batch = writeBatch(db);
    batch.delete(doc(db, 'parties', partyId));
    await batch.commit();
  };

  const setMemberRole = async (partyId: string, uid: string, role: 'organizer' | 'participant') => {
    await updateDoc(doc(db, 'parties', partyId), { [`memberRoles.${uid}`]: role });
  };

  const setMemberStatus = async (partyId: string, uid: string, status: 'active' | 'pending') => {
    await updateDoc(doc(db, 'parties', partyId), { [`memberStatus.${uid}`]: status });
  };

  const removeMember = async (partyId: string, uid: string) => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'parties', partyId), {
      members: arrayRemove(uid),
      [`memberRoles.${uid}`]: deleteField(),
      [`memberStatus.${uid}`]: deleteField(),
    });
    batch.delete(doc(db, 'participants', memberDocId(partyId, uid)));
    await batch.commit();
  };

  const renameParty = async (partyId: string, name: string) => {
    await updateDoc(doc(db, 'parties', partyId), { name: name.trim() });
  };

  const regenerateInviteCode = async (partyId: string) => {
    await updateDoc(doc(db, 'parties', partyId), { inviteCode: generateInviteCode() });
  };

  return {
    parties,
    loading,
    selectParty,
    createParty,
    joinParty,
    leaveParty,
    deleteParty,
    setMemberRole,
    setMemberStatus,
    removeMember,
    renameParty,
    regenerateInviteCode,
  };
}
