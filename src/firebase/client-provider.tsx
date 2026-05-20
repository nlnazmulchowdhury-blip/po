
'use client';

import React, { useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [instances, setInstances] = useState<{
    app: FirebaseApp;
    db: Firestore;
    auth: Auth;
    storage: FirebaseStorage;
  } | null>(null);

  useEffect(() => {
    setInstances(initializeFirebase());
  }, []);

  if (!instances) return null;

  return (
    <FirebaseProvider
      app={instances.app}
      db={instances.db}
      auth={instances.auth}
      storage={instances.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
