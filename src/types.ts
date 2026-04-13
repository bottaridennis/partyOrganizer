export interface SerializedItem {
  id: string;
  code: string; // Unique barcode for this specific unit
  status: 'active' | 'consumed' | 'assigned';
  assignedTo?: string; // Participant ID
  notes?: string;
  fillLevel: number; // 0-100%
}

export interface Product {
  id?: string;
  partyId: string; // Renamed from warehouseId
  name: string;
  brand: string;
  code: string; 
  quantity: number;
  initialQuantity?: number;
  minQuantity: number;
  type: 'food' | 'drink'; 
  category: string;
  price: number;
  alcoholContent: number; // %
  fillLevel: number; // 0-100%
  expiryDate: string;
  labels: string[]; // Alcolico, Analcolico, Senza Glutine, etc.
  allergens: string;
  imageUrl?: string;
  broughtBy: string; // Participant ID or "common"
  lastUpdated: string;
  updatedBy: string;
  customFields?: { key: string; value: string }[];
}

export interface PantryLog {
  id?: string;
  partyId: string;
  date: string;
  description: string;
  productsUsed: {
    productId: string;
    productName: string;
    quantity: number;
    type?: 'withdraw' | 'return';
  }[];
  organizer: string;
  participantId: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'organizer' | 'participant';
  partyId?: string;
  partyIds?: string[];
}

export interface Party {
  id?: string;
  name: string;
  inviteCode: string;
  ownerUid: string;
  members: string[]; // array of uids
  memberRoles?: { [uid: string]: 'organizer' | 'participant' };
  memberStatus?: { [uid: string]: 'active' | 'pending' };
}

export interface ProductRequest {
  id?: string;
  partyId: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  quantity: number;
  type: 'withdraw' | 'return';
  participantId: string; 
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  handledAt?: string;
  handledBy?: string;
  notes?: string;
}

export interface Participant {
  id?: string;
  partyId: string;
  uid?: string; // Link to authenticated user
  name: string;
  surname: string;
  group: string; // e.g. "Amici di scuola", "Famiglia"
  role?: string;
  code: string; // identifier
  email?: string;
  imageUrl?: string;
  createdAt: string;
  customFields?: { key: string; value: string }[];
}

export interface Category {
  id?: string;
  partyId: string;
  name: string;
}

export interface Group {
  id?: string;
  partyId: string;
  name: string;
}

export interface ParticipantRole {
  id?: string;
  partyId: string;
  name: string;
}

export interface AuditLog {
  id?: string;
  partyId: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete' | 'move' | 'auth';
  entityType: 'product' | 'participant' | 'party' | 'category' | 'group' | 'role' | 'log';
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  details: string;
  metadata?: any;
}
