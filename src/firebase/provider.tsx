
'use client';

import React, { createContext, useContext } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';

interface FirebaseContextType {
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  db: null,
  auth: null,
  storage: null,
});

export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = () => useContext(FirebaseContext).app;
export const useFirestore = () => useContext(FirebaseContext).db;
export const useAuth = () => {
  const context = useContext(FirebaseContext);
  return { app: context.app, db: context.db, auth: context.auth };
};
export const useStorage = () => useContext(FirebaseContext).storage;

export function FirebaseProvider({
  children,
  app,
  db,
  auth,
  storage,
}: {
  children: React.ReactNode;
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}) {
  return (
    <FirebaseContext.Provider value={{ app, db, auth, storage }}>
      {children}
    </FirebaseContext.Provider>
  );
}
