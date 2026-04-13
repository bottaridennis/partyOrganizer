import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Product, 
  Participant, 
  PantryLog, 
  Category, 
  Group, 
  ParticipantRole, 
  Party, 
  ProductRequest, 
  AuditLog 
} from '../types';

export function useFirebaseData(partyId: string | undefined, isOrganizer: boolean = false) {
  const [products, setProducts] = useState<Product[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [logs, setLogs] = useState<PantryLog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles] = useState<ParticipantRole[]>([]);
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partyId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const qProducts = query(collection(db, 'products'), where('partyId', '==', partyId));
    const unsubProducts = onSnapshot(qProducts, 
      (snapshot) => setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'products')
    );

    const qParticipants = query(collection(db, 'participants'), where('partyId', '==', partyId));
    const unsubParticipants = onSnapshot(qParticipants, 
      (snapshot) => {
        const manualParticipants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Participant));
        setParticipants(manualParticipants);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'participants')
    );

    const qLogs = query(collection(db, 'pantry_logs'), where('partyId', '==', partyId), orderBy('date', 'desc'), limit(100));
    const unsubLogs = onSnapshot(qLogs, 
      (snapshot) => setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PantryLog))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'pantry_logs')
    );

    const qCategories = query(collection(db, 'categories'), where('partyId', '==', partyId));
    const unsubCategories = onSnapshot(qCategories, 
      (snapshot) => setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'categories')
    );

    const qGroups = query(collection(db, 'groups'), where('partyId', '==', partyId));
    const unsubGroups = onSnapshot(qGroups, 
      (snapshot) => setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'groups')
    );

    const qRoles = query(collection(db, 'participant_roles'), where('partyId', '==', partyId));
    const unsubRoles = onSnapshot(qRoles, 
      (snapshot) => setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParticipantRole))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'participant_roles')
    );

    const qRequests = query(collection(db, 'product_requests'), where('partyId', '==', partyId), orderBy('createdAt', 'desc'));
    const unsubRequests = onSnapshot(qRequests, 
      (snapshot) => setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductRequest))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'product_requests')
    );

    let unsubAudit = () => {};
    if (isOrganizer) {
      const qAudit = query(collection(db, 'audit_logs'), where('partyId', '==', partyId), orderBy('timestamp', 'desc'), limit(100));
      unsubAudit = onSnapshot(qAudit, 
        (snapshot) => setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'audit_logs')
      );
    } else {
      setAuditLogs([]);
    }

    setLoading(false);

    return () => {
      unsubProducts();
      unsubParticipants();
      unsubLogs();
      unsubCategories();
      unsubGroups();
      unsubRoles();
      unsubRequests();
      unsubAudit();
    };
  }, [partyId, isOrganizer]);

  return {
    products,
    participants,
    logs,
    categories,
    groups,
    roles,
    requests,
    auditLogs,
    loading
  };
}
