import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Email o password non corrette.',
  'auth/wrong-password': 'Email o password non corrette.',
  'auth/user-not-found': 'Nessun account con questa email.',
  'auth/invalid-email': 'L\'indirizzo email non è valido.',
  'auth/email-already-in-use': 'Esiste già un account con questa email. Prova ad accedere.',
  'auth/weak-password': 'La password deve avere almeno 6 caratteri.',
  'auth/too-many-requests': 'Troppi tentativi. Riprova tra qualche minuto.',
  'auth/network-request-failed': 'Connessione assente. Controlla la rete e riprova.',
  'auth/popup-blocked': 'Il browser ha bloccato la finestra di Google. Consenti i popup e riprova.',
};

export function authErrorMessage(err: unknown): string | null {
  const code = (err as { code?: string })?.code || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return null;
  return AUTH_ERRORS[code] || 'Accesso non riuscito. Riprova.';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, firebaseUser => {
      unsubProfile?.();
      unsubProfile = undefined;
      setUser(firebaseUser);

      if (!firebaseUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      unsubProfile = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        snap => {
          if (snap.exists()) {
            setUserProfile({ uid: firebaseUser.uid, ...snap.data() } as UserProfile);
          } else {
            const initialProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Amico',
              photoURL: firebaseUser.photoURL || '',
              role: 'participant',
              partyIds: [],
            };
            setDoc(doc(db, 'users', firebaseUser.uid), initialProfile).catch(err => console.error('Creazione profilo non riuscita', err));
            setUserProfile(initialProfile);
          }
          setLoading(false);
        },
        err => {
          console.error('Profilo non leggibile', err);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubProfile?.();
      unsubAuth();
    };
  }, []);

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    await updateProfile(res.user, { displayName: name.trim() });
    const initialProfile: UserProfile = {
      uid: res.user.uid,
      email: email.trim(),
      displayName: name.trim(),
      photoURL: '',
      role: 'participant',
      partyIds: [],
    };
    await setDoc(doc(db, 'users', res.user.uid), initialProfile);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = () => signOut(auth);

  return { user, userProfile, loading, loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, logout };
}
