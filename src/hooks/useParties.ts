import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs, 
  arrayUnion, 
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Party, UserProfile } from '../types';

export function useParties(userProfile: UserProfile | null) {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) {
      setParties([]);
      setLoading(false);
      return;
    }

    // Query parties where user is a member
    const q = query(collection(db, 'parties'), where('members', 'array-contains', userProfile.uid));
    const unsub = onSnapshot(q, 
      (snapshot) => {
        setParties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Party)));
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'parties')
    );

    return () => unsub();
  }, [userProfile?.uid]);

  const createParty = async (name: string, ownerUid: string) => {
    const id = `party-${Date.now()}`;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newParty: Party = {
      name,
      inviteCode,
      ownerUid,
      members: [ownerUid],
      memberRoles: { [ownerUid]: 'organizer' },
      memberStatus: { [ownerUid]: 'active' }
    };
    
    const batch = writeBatch(db);
    batch.set(doc(db, 'parties', id), newParty);
    batch.update(doc(db, 'users', ownerUid), {
      partyId: id,
      partyIds: arrayUnion(id)
    });
    
    // Create participant record for owner
    const userSnap = await getDoc(doc(db, 'users', ownerUid));
    const userData = userSnap.data();
    
    batch.set(doc(db, 'participants', `member-${ownerUid}`), {
      partyId: id,
      uid: ownerUid,
      name: userData?.displayName?.split(' ')[0] || 'Organizzatore',
      surname: userData?.displayName?.split(' ').slice(1).join(' ') || '',
      email: userData?.email || '',
      group: 'Organizzatori',
      role: 'Capo Festa',
      code: `ORG-${ownerUid.substring(0, 5)}`,
      createdAt: new Date().toISOString(),
      imageUrl: userData?.photoURL || ''
    });
    
    await batch.commit();
    return id;
  };

  const joinParty = async (inviteCode: string, uid: string) => {
    const q = query(collection(db, 'parties'), where('inviteCode', '==', inviteCode.trim().toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Codice invito non valido');
    
    const partyDoc = snap.docs[0];
    const partyId = partyDoc.id;
    
    const batch = writeBatch(db);
    batch.update(doc(db, 'parties', partyId), {
      members: arrayUnion(uid),
      [`memberRoles.${uid}`]: 'participant',
      [`memberStatus.${uid}`]: 'pending'
    });
    
    batch.update(doc(db, 'users', uid), {
      partyId: partyId,
      partyIds: arrayUnion(partyId)
    });

    // Create participant record for joining member
    const userSnap = await getDoc(doc(db, 'users', uid));
    const userData = userSnap.data();

    batch.set(doc(db, 'participants', `member-${uid}`), {
      partyId: partyId,
      uid: uid,
      name: userData?.displayName?.split(' ')[0] || 'Nuovo',
      surname: userData?.displayName?.split(' ').slice(1).join(' ') || 'Amico',
      email: userData?.email || '',
      group: 'Da Assegnare',
      role: 'Partecipante',
      code: `MEM-${uid.substring(0, 5)}`,
      createdAt: new Date().toISOString(),
      imageUrl: userData?.photoURL || ''
    });

    await batch.commit();
  };

  const leaveParty = async (partyId: string, uid: string) => {
    await updateDoc(doc(db, 'parties', partyId), {
      members: arrayRemove(uid)
    });
    await updateDoc(doc(db, 'users', uid), {
      partyIds: arrayRemove(partyId)
    });
  };

  const deleteParty = async (partyId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'parties', partyId));
    await batch.commit();
  };

  return {
    parties,
    loading,
    createParty,
    joinParty,
    leaveParty,
    deleteParty
  };
}
