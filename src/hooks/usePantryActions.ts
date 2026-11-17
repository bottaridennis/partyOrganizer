import { doc, updateDoc, addDoc, collection, increment, deleteDoc, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, PantryLog, UserProfile, ProductRequest, AuditLog, Participant } from '../types';
import { logAudit } from '../lib/audit';
import { cleanObject, fullName } from '../lib/utils';

export type MovementType = 'withdraw' | 'return';
export interface MovementInput {
  type: MovementType;
  quantity: number;
  participantId: string;
  notes: string;
}
export interface LogLine {
  productId: string;
  productName: string;
  quantity: number;
  type: MovementType;
}

export type EntityType = 'product' | 'participant' | 'log' | 'category' | 'group' | 'role';

const COLLECTIONS: Record<EntityType, string> = {
  product: 'products',
  participant: 'participants',
  log: 'pantry_logs',
  category: 'categories',
  group: 'groups',
  role: 'participant_roles',
};

const LABELS: Record<EntityType, string> = {
  product: 'prodotto',
  participant: 'partecipante',
  log: 'movimento',
  category: 'categoria',
  group: 'gruppo',
  role: 'ruolo',
};

/**
 * Every write the app makes on the active party. `isOrganizer` must come from
 * the party's memberRoles: the global `userProfile.role` is always
 * "participant" because the rules forbid self-promotion.
 */
export function usePantryActions(userProfile: UserProfile | null, isOrganizer: boolean, participants: Participant[]) {
  const partyId = userProfile?.partyId;
  const now = () => new Date().toISOString();
  const participantName = (id: string) => (id === 'GENERAL' ? 'la festa' : fullName(participants.find(p => p.id === id)) || 'un partecipante');

  const requireParty = () => {
    if (!partyId || !userProfile) throw new Error('Nessuna festa selezionata.');
    return { partyId, profile: userProfile };
  };

  const assertStock = (product: Product, type: MovementType, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Indica una quantità maggiore di zero.');
    if (type === 'withdraw' && quantity > product.quantity) {
      throw new Error(`Disponibili solo ${product.quantity} pz di ${product.name}.`);
    }
  };

  // ---------------------------------------------------------------- products

  const addProduct = async (data: Omit<Product, 'id' | 'partyId' | 'lastUpdated' | 'updatedBy'>) => {
    const { partyId, profile } = requireParty();
    const ref = await addDoc(
      collection(db, 'products'),
      cleanObject({ ...data, partyId, initialQuantity: data.quantity, lastUpdated: now(), updatedBy: profile.displayName })
    );
    await logAudit(profile, 'create', 'product', ref.id, data.name, `Aggiunto ${data.quantity} pz di ${data.name}`);
  };

  const updateProduct = async (product: Product) => {
    const { profile } = requireParty();
    const { id, ...rest } = product;
    await updateDoc(doc(db, 'products', id!), cleanObject({ ...rest, lastUpdated: now(), updatedBy: profile.displayName }));
    await logAudit(profile, 'update', 'product', id!, product.name, `Aggiornato ${product.name}`);
  };

  /** Organizers move stock directly; everyone else files a request. */
  const handleProductMovement = async (product: Product, data: MovementInput): Promise<'done' | 'requested'> => {
    const { partyId, profile } = requireParty();
    assertStock(product, data.type, data.quantity);

    if (!isOrganizer) {
      await addDoc(collection(db, 'product_requests'), cleanObject({
        partyId,
        userId: profile.uid,
        userName: profile.displayName,
        productId: product.id,
        productName: product.name,
        quantity: data.quantity,
        type: data.type,
        participantId: data.participantId,
        notes: data.notes.trim(),
        status: 'pending',
        createdAt: now(),
      }));
      return 'requested';
    }

    const batch = writeBatch(db);
    batch.update(doc(db, 'products', product.id!), {
      quantity: increment(data.type === 'withdraw' ? -data.quantity : data.quantity),
      lastUpdated: now(),
      updatedBy: profile.displayName,
    });
    const log: Omit<PantryLog, 'id'> = {
      partyId,
      date: now(),
      description: data.notes.trim() || `${data.type === 'withdraw' ? 'Prelievo' : 'Rifornimento'} di ${product.name}`,
      organizer: profile.displayName,
      participantId: data.participantId,
      productsUsed: [{ productId: product.id!, productName: product.name, quantity: data.quantity, type: data.type }],
    };
    batch.set(doc(collection(db, 'pantry_logs')), cleanObject(log));
    await batch.commit();

    await logAudit(profile, 'move', 'product', product.id!, product.name,
      `${data.type === 'withdraw' ? 'Prelevati' : 'Aggiunti'} ${data.quantity} pz per ${participantName(data.participantId)}`);
    return 'done';
  };

  /** Multi-product movement registered by an organizer. Updates stock atomically. */
  const addPantryLog = async (input: { description: string; participantId: string; lines: LogLine[] }, products: Product[]) => {
    const { partyId, profile } = requireParty();
    if (input.lines.length === 0) throw new Error('Aggiungi almeno un prodotto.');

    // Sum per product so two lines on the same product are checked together.
    const delta = new Map<string, number>();
    for (const l of input.lines) delta.set(l.productId, (delta.get(l.productId) || 0) + (l.type === 'withdraw' ? -l.quantity : l.quantity));
    for (const [productId, d] of delta) {
      const p = products.find(x => x.id === productId);
      if (!p) throw new Error('Un prodotto selezionato non esiste più.');
      if (p.quantity + d < 0) throw new Error(`Disponibili solo ${p.quantity} pz di ${p.name}.`);
    }

    const batch = writeBatch(db);
    for (const [productId, d] of delta) {
      if (d !== 0) batch.update(doc(db, 'products', productId), { quantity: increment(d), lastUpdated: now(), updatedBy: profile.displayName });
    }
    batch.set(doc(collection(db, 'pantry_logs')), cleanObject({
      partyId,
      date: now(),
      description: input.description.trim() || `Movimento di ${input.lines.length} prodott${input.lines.length === 1 ? 'o' : 'i'}`,
      organizer: profile.displayName,
      participantId: input.participantId,
      productsUsed: input.lines,
    }));
    await batch.commit();
    await logAudit(profile, 'move', 'log', 'batch', input.description || 'Movimento', `Registrato movimento di ${input.lines.length} prodotti per ${participantName(input.participantId)}`);
  };

  // ---------------------------------------------------------------- requests

  const approveRequest = async (request: ProductRequest, product?: Product) => {
    const { partyId, profile } = requireParty();
    if (!product) throw new Error('Il prodotto della richiesta non esiste più.');
    assertStock(product, request.type, request.quantity);

    const batch = writeBatch(db);
    batch.update(doc(db, 'products', request.productId), {
      quantity: increment(request.type === 'withdraw' ? -request.quantity : request.quantity),
      lastUpdated: now(),
      updatedBy: profile.displayName,
    });
    batch.update(doc(db, 'product_requests', request.id!), { status: 'approved', handledAt: now(), handledBy: profile.displayName });
    batch.set(doc(collection(db, 'pantry_logs')), cleanObject({
      partyId,
      date: now(),
      description: request.notes || `Richiesta approvata: ${request.type === 'withdraw' ? 'prelievo' : 'rifornimento'} di ${request.productName}`,
      organizer: request.userName,
      participantId: request.participantId,
      productsUsed: [{ productId: request.productId, productName: request.productName, quantity: request.quantity, type: request.type }],
    }));
    await batch.commit();
    await logAudit(profile, 'update', 'product', request.productId, request.productName, `Approvata richiesta di ${request.userName} (${request.quantity} pz)`);
  };

  const rejectRequest = async (request: ProductRequest, reason = '') => {
    const { profile } = requireParty();
    await updateDoc(doc(db, 'product_requests', request.id!), cleanObject({
      status: 'rejected',
      handledAt: now(),
      handledBy: profile.displayName,
      rejectionReason: reason.trim() || undefined,
    }));
    await logAudit(profile, 'update', 'log', request.id!, request.productName, `Rifiutata richiesta di ${request.userName}: ${request.quantity} × ${request.productName}`);
  };

  const cancelRequest = async (request: ProductRequest) => {
    await deleteDoc(doc(db, 'product_requests', request.id!));
  };

  // ---------------------------------------------------------------- participants

  const addParticipant = async (data: Omit<Participant, 'id' | 'createdAt' | 'partyId'>) => {
    const { partyId, profile } = requireParty();
    const ref = await addDoc(collection(db, 'participants'), cleanObject({ ...data, partyId, uid: '', createdAt: now() }));
    await logAudit(profile, 'create', 'participant', ref.id, fullName(data), `Aggiunto ${fullName(data)}`);
  };

  const updateParticipant = async (participant: Participant, data: Partial<Participant>) => {
    const { profile } = requireParty();
    const { id, partyId: _p, uid: _u, createdAt: _c, ...editable } = data as Participant;
    await updateDoc(doc(db, 'participants', participant.id!), cleanObject(editable));
    await logAudit(profile, 'update', 'participant', participant.id!, fullName({ ...participant, ...data }), 'Aggiornati i dati del partecipante');
  };

  /** Creates the participant record of a member that is missing one (old data). */
  const ensureMemberRecord = async (party: { id?: string; memberRoles?: Record<string, string> }) => {
    if (!party.id || !userProfile) return;
    const [name, ...rest] = (userProfile.displayName || 'Amico').split(' ');
    await setDoc(doc(db, 'participants', `member-${party.id}-${userProfile.uid}`), {
      partyId: party.id,
      uid: userProfile.uid,
      name: name || 'Amico',
      surname: rest.join(' '),
      email: userProfile.email || '',
      group: 'Da assegnare',
      role: party.memberRoles?.[userProfile.uid] === 'organizer' ? 'Organizzatore' : 'Partecipante',
      code: `MEM-${userProfile.uid.substring(0, 5)}`,
      createdAt: now(),
      imageUrl: userProfile.photoURL || '',
    });
  };

  // ---------------------------------------------------------------- dictionaries & delete

  const addDictionaryItem = async (type: 'category' | 'group' | 'role', name: string) => {
    const { partyId, profile } = requireParty();
    const ref = await addDoc(collection(db, COLLECTIONS[type]), { name: name.trim(), partyId });
    await logAudit(profile, 'create', type, ref.id, name.trim(), `Creato ${LABELS[type]} ${name.trim()}`);
  };

  const deleteEntity = async (type: EntityType, id: string, name: string) => {
    const { profile } = requireParty();
    await deleteDoc(doc(db, COLLECTIONS[type], id));
    await logAudit(profile, 'delete', type as AuditLog['entityType'], id, name, `Eliminato ${LABELS[type]}: ${name}`);
  };

  return {
    addProduct,
    updateProduct,
    handleProductMovement,
    addPantryLog,
    approveRequest,
    rejectRequest,
    cancelRequest,
    addParticipant,
    updateParticipant,
    ensureMemberRecord,
    addDictionaryItem,
    deleteEntity,
  };
}
