'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '@/lib/firebase';
import { UserProfile, AccountType } from '@/types';

export interface AuthContextType {
  user: User | { uid: string; email: string | null; displayName: string | null; emailVerified?: boolean; photoURL?: string | null } | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  isOffline: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    accountType?: AccountType
  ) => Promise<void>;
  loginAsDemo: (role: 'admin' | 'proprietario' | 'imobiliaria', customEmail?: string, customName?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'igorwebdesign86@gmail.com';
const STORAGE_KEY = 'alugafacil_auth_session';

function getInitialSession(): {
  user: AuthContextType['user'];
  profile: UserProfile | null;
  isAdmin: boolean;
} {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.user && parsed.profile) {
          const isAdm =
            parsed.profile.accountType === 'admin' ||
            parsed.user.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
          return {
            user: parsed.user,
            profile: parsed.profile,
            isAdmin: isAdm,
          };
        }
      }
    } catch {
      // ignore
    }
  }
  return { user: null, profile: null, isAdmin: false };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initialSession] = useState(() => getInitialSession());
  const [user, setUser] = useState<AuthContextType['user']>(() => initialSession.user);
  const [profile, setProfile] = useState<UserProfile | null>(() => initialSession.profile);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => initialSession.isAdmin);
  const [loading, setLoading] = useState<boolean>(() => !initialSession.user);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);

          const isBootstrappedAdmin =
            currentUser.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();

          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            setProfile(data);
            setIsAdmin(isBootstrappedAdmin || data.accountType === 'admin');
          } else {
            // First time user registration
            const now = new Date().toISOString();
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuário',
              email: currentUser.email || '',
              accountType: isBootstrappedAdmin ? 'admin' : 'proprietario',
              accountStatus: 'active',
              emailVerified: currentUser.emailVerified,
              createdAt: now,
              updatedAt: now,
              acceptedTermsVersion: '1.0',
              acceptedPrivacyVersion: '1.0',
              photoURL: currentUser.photoURL || undefined,
            };

            await setDoc(userDocRef, newProfile).catch((err) => {
              console.warn('Notice: Firestore user write non-fatal:', err);
            });
            setProfile(newProfile);
            setIsAdmin(isBootstrappedAdmin || newProfile.accountType === 'admin');

            if (isBootstrappedAdmin) {
              const adminRef = doc(db, 'admins', currentUser.uid);
              await setDoc(adminRef, {
                uid: currentUser.uid,
                email: currentUser.email,
                grantedAt: now,
              }).catch(() => {});
            }
          }
        } catch (error) {
          console.warn('Notice: Using local session fallback for user profile:', error);
          const isBootstrappedAdmin =
            currentUser.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
          const fallbackProfile: UserProfile = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuário',
            email: currentUser.email || '',
            accountType: isBootstrappedAdmin ? 'admin' : 'proprietario',
            accountStatus: 'active',
            emailVerified: currentUser.emailVerified,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            acceptedTermsVersion: '1.0',
            acceptedPrivacyVersion: '1.0',
            photoURL: currentUser.photoURL || undefined,
          };
          setProfile(fallbackProfile);
          setIsAdmin(isBootstrappedAdmin);
        }
      }
      setLoading(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error('Google Sign-in failed:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error('Email Sign-in failed:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    accountType: AccountType = 'proprietario'
  ) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const now = new Date().toISOString();
      const isBootstrappedAdmin =
        email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      const newProfile: UserProfile = {
        uid: cred.user.uid,
        displayName: displayName.trim(),
        email: email.trim(),
        accountType: isBootstrappedAdmin ? 'admin' : accountType,
        accountStatus: 'active',
        emailVerified: cred.user.emailVerified,
        createdAt: now,
        updatedAt: now,
        acceptedTermsVersion: '1.0',
        acceptedPrivacyVersion: '1.0',
      };

      const userDocRef = doc(db, 'users', cred.user.uid);
      await setDoc(userDocRef, newProfile);
      setProfile(newProfile);
      if (isBootstrappedAdmin) {
        await setDoc(doc(db, 'admins', cred.user.uid), {
          uid: cred.user.uid,
          email,
          grantedAt: now,
        });
        setIsAdmin(true);
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error('Signup failed:', err);
      throw err;
    }
  };

  const loginAsDemo = async (
    role: 'admin' | 'proprietario' | 'imobiliaria',
    customEmail?: string,
    customName?: string
  ) => {
    const isAdminRole = role === 'admin' || customEmail?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const demoEmail = isAdminRole 
      ? ADMIN_EMAIL 
      : (customEmail?.trim() || (role === 'imobiliaria' ? 'central.imoveis@alugafacil.com.br' : 'carlos.proprietario@gmail.com'));
    const demoDisplayName = isAdminRole
      ? 'Igor (Administrador)'
      : (customName?.trim() || (role === 'imobiliaria' ? 'Central Imóveis Dutra' : 'Carlos Proprietário Dutra'));
    const demoUid = isAdminRole 
      ? 'admin-igor-master' 
      : (demoEmail.toLowerCase().includes('carlos') ? 'owner-demo-1' : `user-${demoEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
    const now = new Date().toISOString();

    const sessionUser = {
      uid: demoUid,
      email: demoEmail,
      displayName: demoDisplayName,
      emailVerified: true,
      photoURL: null,
    };

    const sessionProfile: UserProfile = {
      uid: demoUid,
      displayName: demoDisplayName,
      email: demoEmail,
      accountType: isAdminRole ? 'admin' : (role === 'imobiliaria' ? 'imobiliaria' : 'proprietario'),
      accountStatus: 'active',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      acceptedTermsVersion: '1.0',
      acceptedPrivacyVersion: '1.0',
    };

    setUser(sessionUser);
    setProfile(sessionProfile);
    setIsAdmin(isAdminRole);

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user: sessionUser, profile: sessionProfile })
      );
    }

    // Try background sync with Firestore if possible
    try {
      const userDocRef = doc(db, 'users', demoUid);
      setDoc(userDocRef, sessionProfile, { merge: true }).catch(() => {});
      if (isAdminRole) {
        setDoc(doc(db, 'admins', demoUid), {
          uid: demoUid,
          email: demoEmail,
          grantedAt: now,
        }).catch(() => {});
      }
    } catch {
      // non-blocking
    }
  };

  const signOutUser = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      await signOut(auth).catch(() => {});
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    } catch (err) {
      console.error('Signout failed:', err);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.error('Password reset failed:', err);
      throw err;
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('Usuário não autenticado');
    try {
      const userRef = doc(db, 'users', user.uid);
      const updated = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(userRef, updated).catch(() => {});
      setProfile((prev) => (prev ? { ...prev, ...updated } : null));

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.profile = { ...parsed.profile, ...updated };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        isOffline,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        loginAsDemo,
        signOutUser,
        sendPasswordReset,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
