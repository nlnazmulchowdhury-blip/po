
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useFirestore();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('আপনার অ্যাকাউন্ট ভেরিফাই করা হচ্ছে...');

  useEffect(() => {
    const verify = async () => {
      const uid = searchParams.get('uid');
      const token = searchParams.get('token');

      if (!db || !uid || !token) {
        setStatus('error');
        setMessage('ভুল লিঙ্ক অথবা লিঙ্কটির মেয়াদ শেষ হয়ে গেছে।');
        return;
      }

      try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.emailVerified) {
            setStatus('success');
            setMessage('আপনার অ্যাকাউন্ট ইতিমধ্যে ভেরিফাইড করা আছে।');
          } else if (userData.verificationToken === token) {
            await updateDoc(userRef, {
              emailVerified: true,
              verificationToken: null // Clear token after success
            });
            setStatus('success');
            setMessage('অভিনন্দন! আপনার অ্যাকাউন্ট সফলভাবে ভেরিফাই করা হয়েছে।');
          } else {
            setStatus('error');
            setMessage('ভেরিফিকেশন টোকেন ম্যাচ করেনি।');
          }
        } else {
          setStatus('error');
          setMessage('ইউজার পাওয়া যায়নি।');
        }
      } catch (err: any) {
        console.error(err);
        setStatus('error');
        setMessage('ভেরিফিকেশন প্রসেসে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    };

    verify();
  }, [db, searchParams]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-[200] p-4">
      <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-300">
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-headline font-bold uppercase italic tracking-tight">
              ইমেইল <span className="text-primary">ভেরিফিকেশন</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="bg-green-500/10 p-4 rounded-full">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">ভেরিফিকেশন সফল!</h3>
                  <p className="text-muted-foreground text-sm">{message}</p>
                </div>
                <Button asChild className="w-full font-bold h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  <Link href="/login" className="flex items-center gap-2">
                    এখন লগইন করুন <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="bg-destructive/10 p-4 rounded-full">
                  <XCircle className="h-16 w-16 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">ব্যর্থ হয়েছে</h3>
                  <p className="text-muted-foreground text-sm">{message}</p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <Button asChild variant="outline" className="w-full font-bold h-11 rounded-xl">
                    <Link href="/signup">আবার রেজিস্ট্রেশন করুন</Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full text-xs text-muted-foreground">
                    <Link href="/">হোমে ফিরে যান</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
