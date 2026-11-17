import React, { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';
import type { Party, Product, UserProfile } from '../types';
import type { useFirebaseData } from '../hooks/useFirebaseData';
import type { usePantryActions } from '../hooks/usePantryActions';
import type { useParties } from '../hooks/useParties';
import type { Route } from './router';

export interface PartyContextValue {
  user: User;
  profile: UserProfile;
  party: Party;
  isOrganizer: boolean;
  isOwner: boolean;
  /** Participant document of the signed-in user in this party, if any. */
  me?: ReturnType<typeof useFirebaseData>['participants'][number];
  data: ReturnType<typeof useFirebaseData>;
  actions: ReturnType<typeof usePantryActions>;
  partyActions: ReturnType<typeof useParties>;
  navigate: (route: Route, param?: string) => void;
  openPartySwitcher: (mode?: 'select' | 'create' | 'join') => void;
  openProductForm: (product?: Product) => void;
  openMovement: (product: Product, type?: 'withdraw' | 'return') => void;
  confirmDelete: (target: DeleteTarget) => void;
}

export interface DeleteTarget {
  type: 'product' | 'participant' | 'log' | 'category' | 'group' | 'role';
  id: string;
  name: string;
}

const PartyContext = createContext<PartyContextValue | null>(null);

export const PartyProvider = ({ value, children }: { value: PartyContextValue; children: React.ReactNode }) => (
  <PartyContext.Provider value={value}>{children}</PartyContext.Provider>
);

export function useParty() {
  const ctx = useContext(PartyContext);
  if (!ctx) throw new Error('useParty must be used inside PartyProvider');
  return ctx;
}
