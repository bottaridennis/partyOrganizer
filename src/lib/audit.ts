import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { AuditLog, UserProfile } from '../types';
import { cleanObject } from './utils';

export const logAudit = async (
  userProfile: UserProfile | null,
  action: AuditLog['action'],
  entityType: AuditLog['entityType'],
  entityId: string,
  entityName: string,
  details: string,
  metadata?: any
) => {
  const partyId = userProfile?.partyId;
  if (!partyId || !auth.currentUser) return;
  try {
    await addDoc(collection(db, 'audit_logs'), cleanObject({
      partyId,
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      entityName,
      userId: auth.currentUser.uid,
      userName: userProfile?.displayName || auth.currentUser.email || 'Unknown',
      details,
      metadata: metadata || {}
    }));
  } catch (error) {
    console.error("Error logging audit:", error);
  }
};
