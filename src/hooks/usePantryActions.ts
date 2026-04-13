import { 
  doc, 
  updateDoc, 
  addDoc, 
  collection, 
  increment, 
  deleteDoc,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Product, 
  Participant, 
  PantryLog, 
  UserProfile, 
  ProductRequest, 
  AuditLog 
} from '../types';
import { logAudit } from '../lib/audit';
import { cleanObject } from '../lib/utils';

export function usePantryActions(userProfile: UserProfile | null) {
  
  const handleProductMovement = async (
    product: Product,
    data: { 
      type: 'withdraw' | 'return', 
      quantity: number, 
      participantId: string, 
      notes: string
    }
  ) => {
    if (!userProfile?.partyId) return;

    const isOrganizer = userProfile.role === 'organizer';
    const partyId = userProfile.partyId;

    if (!isOrganizer) {
      // Create request for participant
      await addDoc(collection(db, 'product_requests'), {
        partyId,
        userId: userProfile.uid,
        userName: userProfile.displayName,
        productId: product.id,
        productName: product.name,
        quantity: data.quantity,
        type: data.type,
        participantId: data.participantId,
        notes: data.notes,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      return;
    }

    // Direct execution for organizer
    const batch = writeBatch(db);
    const productRef = doc(db, 'products', product.id!);
    
    // Update quantity
    const qtyChange = data.type === 'withdraw' ? -data.quantity : data.quantity;
    batch.update(productRef, { quantity: increment(qtyChange) });

    // Create log entry
    const logData: Omit<PantryLog, 'id'> = {
      partyId,
      date: new Date().toISOString(),
      description: data.notes || `${data.type === 'withdraw' ? 'Prelievo' : 'Aggiunta'} ${product.name}`,
      organizer: userProfile.displayName,
      participantId: data.participantId,
      productsUsed: [{
        productId: product.id!,
        productName: product.name,
        quantity: data.quantity,
        type: data.type
      }]
    };
    const logRef = doc(collection(db, 'pantry_logs'));
    batch.set(logRef, cleanObject(logData));

    await batch.commit();

    await logAudit(
      userProfile,
      'move',
      'product',
      product.id!,
      product.name,
      `${data.type === 'withdraw' ? 'Prelevato' : 'Aggiunto'} ${data.quantity} pz da ${data.participantId}`
    );
  };

  const approveRequest = async (request: ProductRequest) => {
    if (!userProfile?.partyId) return;

    const batch = writeBatch(db);
    const productRef = doc(db, 'products', request.productId);
    const requestRef = doc(db, 'product_requests', request.id!);

    // Update quantity
    const qtyChange = request.type === 'withdraw' ? -request.quantity : request.quantity;
    batch.update(productRef, { quantity: increment(qtyChange) });

    // Update request status
    batch.update(requestRef, { 
      status: 'approved',
      handledAt: new Date().toISOString(),
      handledBy: userProfile.displayName
    });

    // Create log entry
    const logData: Omit<PantryLog, 'id'> = {
      partyId: userProfile.partyId,
      date: new Date().toISOString(),
      description: request.notes || `Approvata richiesta: ${request.type === 'withdraw' ? 'Prelievo' : 'Aggiunta'} ${request.productName}`,
      organizer: request.userName,
      participantId: request.participantId,
      productsUsed: [{
        productId: request.productId,
        productName: request.productName,
        quantity: request.quantity,
        type: request.type
      }]
    };
    const logRef = doc(collection(db, 'pantry_logs'));
    batch.set(logRef, cleanObject(logData));

    await batch.commit();

    await logAudit(
      userProfile,
      'update',
      'product',
      request.productId,
      request.productName,
      `Approvata richiesta di ${request.userName} per ${request.quantity} pz`
    );
  };

  const rejectRequest = async (request: ProductRequest) => {
    if (!userProfile?.partyId) return;
    await updateDoc(doc(db, 'product_requests', request.id!), {
      status: 'rejected',
      handledAt: new Date().toISOString(),
      handledBy: userProfile.displayName
    });
    await logAudit(userProfile, 'update', 'log', request.id!, request.productName, `Richiesta rifiutata: ${request.quantity}x ${request.productName} per ${request.userName}`);
  };

  const deleteEntity = async (type: 'product' | 'participant' | 'log' | 'category' | 'group' | 'role', id: string, name: string) => {
    const collectionMap: Record<string, string> = {
      'product': 'products',
      'participant': 'participants',
      'log': 'pantry_logs',
      'category': 'categories',
      'group': 'groups',
      'role': 'participant_roles'
    };
    
    const entityTypeMap: Record<string, AuditLog['entityType']> = {
      'product': 'product',
      'participant': 'participant',
      'log': 'log',
      'category': 'category',
      'group': 'group',
      'role': 'role'
    };

    await deleteDoc(doc(db, collectionMap[type], id));
    await logAudit(userProfile, 'delete', entityTypeMap[type], id, name, `Eliminato ${type}: ${name}`);
  };

  return {
    handleProductMovement,
    approveRequest,
    rejectRequest,
    deleteEntity
  };
}
