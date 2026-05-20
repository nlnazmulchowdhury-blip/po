'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Loader2 } from 'lucide-react';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    const checkAdmin = async () => {
      if (!db) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.role === 'admin' || user.email === 'nlnazmulchowdhury@gmail.com' || user.email === 'nazmul41630@gmail.com') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
      } finally {
        setCheckingRole(false);
      }
    };

    checkAdmin();
  }, [user, authLoading, db, router]);

  if (authLoading || checkingRole) {
    return <LoadingScreen message="ভেরিফাই করা হচ্ছে..." fullScreen={true} />;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4 p-8 text-center max-w-md">
          <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <h1 className="text-2xl font-bold text-white">অ্যাক্সেস ডিনাইড</h1>
          <p className="text-muted-foreground text-sm">এই পেজটি দেখার জন্য আপনার অ্যাডমিন অনুমতি নেই। দয়া করে সঠিক অ্যাকাউন্ট দিয়ে লগইন করুন।</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            হোমে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
