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

interface AuthContextType {
  user: User | null;
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
  signOutUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'igorwebdesign86@gmail.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);

          const isBootstrappedAdmin =
            (currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
              currentUser.emailVerified) ||
            currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

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

            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
            setIsAdmin(isBootstrappedAdmin || newProfile.accountType === 'admin');

            if (isBootstrappedAdmin) {
              const adminRef = doc(db, 'admins', currentUser.uid);
              await setDoc(adminRef, {
                uid: currentUser.uid,
                email: currentUser.email,
                grantedAt: now,
              });
            }
          }
        } catch (error) {
          console.error('Error fetching or creating user profile:', error);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
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
    } catch (err) {
      console.error('Google Sign-in failed:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
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
    } catch (err) {
      console.error('Signup failed:', err);
      throw err;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setProfile(null);
      setIsAdmin(false);
    } catch (err) {
      console.error('Signout failed:', err);
      throw err;
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
      await updateDoc(userRef, updated);
      setProfile((prev) => (prev ? { ...prev, ...updated } : null));
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
