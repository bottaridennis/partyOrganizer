import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Use Vite's glob import to optionally load the local config file.
// This prevents build errors on GitHub Actions where the file is missing.
const localConfigs = import.meta.glob('../firebase-applet-config.json', { eager: true, import: 'default' });
const localFirebaseConfig = (Object.values(localConfigs)[0] as any) || {};

// Use environment variables if available (for GitHub Actions/Deploy), 
// otherwise fallback to local config file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localFirebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localFirebaseConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || localFirebaseConfig.firestoreDatabaseId
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use the provided database ID, but fallback to '(default)' if it's missing or empty
const databaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId.trim() !== "" 
  ? firebaseConfig.firestoreDatabaseId 
  : "(default)";
export const db = getFirestore(app, databaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  // If user is not authenticated, this is likely a race condition during logout
  // or initial load. We log it but don't throw to avoid crashing the app.
  if (!auth.currentUser) {
    console.warn(`Firestore ${operationType} on ${path} denied (unauthenticated). This may be a logout race condition.`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
