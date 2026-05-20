
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Mail, Lock, Chrome, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { auth } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check verification status in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (!userData.emailVerified) {
          await signOut(auth);
          throw new Error('আপনার ইমেইল ভেরিফাই করা হয়নি। দয়া করে আপনার ইনবক্স চেক করুন।');
        }
      }

      toast({ title: 'Welcome Back!', description: 'লগইন সফল হয়েছে।' });
      router.push('/');
      router.refresh();
    } catch (err: any) {
      let errorMessage = err.message || 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।';
      if (err.code === 'auth/invalid-credential') {
        errorMessage = 'ভুল ইমেইল বা পাসওয়ার্ড।';
      }
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'লগইন ব্যর্থ',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !db) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Google users are automatically verified in our logic
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        name: user.displayName || 'Cinema Lover',
        email: user.email,
        role: 'user',
        emailVerified: true,
        createdAt: serverTimestamp(),
      }, { merge: true });

      toast({ title: 'Welcome!', description: 'গুগল দিয়ে লগইন সফল হয়েছে।' });
      router.push('/');
      router.refresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Google Login Failed',
        description: 'গুগল লগইন ব্যর্থ হয়েছে।',
      });
    }
  };

  return (
    <>
      {loading && <LoadingScreen message="লগইন হচ্ছে..." fullScreen={true} />}
      <div className="fixed inset-0 flex items-center justify-center bg-background z-[100] overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background p-4">
        <div className="w-full max-w-[400px] animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary p-2.5 rounded-2xl group-hover:scale-110 transition-all shadow-lg shadow-primary/20">
              <Video className="w-8 h-8 text-white" />
            </div>
            <span className="font-headline font-bold text-3xl tracking-tight text-white">
              Cinema<span className="text-primary">Stream</span>
            </span>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">স্বাগতম</h1>
            <p className="text-muted-foreground text-sm">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
          </div>
        </div>

        <Card className={cn(
          "border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300",
          error && "border-destructive/50"
        )}>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">লগইন</CardTitle>
            <CardDescription>সিনেমা দেখা শুরু করতে লগইন করুন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ইমেইল</Label>
                <div className="relative">
                  <Mail className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors", error ? "text-destructive" : "text-muted-foreground")} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className={cn(
                      "pl-10 h-11 bg-background/30 border-border/50 transition-colors",
                      error && "border-destructive focus-visible:ring-destructive"
                    )}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">পাসওয়ার্ড</Label>
                  <Link href="/forgot-password" title="রিসেট পাসওয়ার্ড" className="text-xs text-primary font-bold hover:underline">পাসওয়ার্ড ভুলে গেছেন?</Link>
                </div>
                <div className="relative">
                  <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors", error ? "text-destructive" : "text-muted-foreground")} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={cn(
                      "pl-10 h-11 bg-background/30 border-border/50 transition-colors",
                      error && "border-destructive focus-visible:ring-destructive"
                    )}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full font-bold h-11 rounded-xl shadow-lg shadow-primary/20 text-white" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'লগইন করুন'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-card/40 px-3 text-muted-foreground backdrop-blur-sm">বা</span>
              </div>
            </div>

            <Button variant="outline" className="w-full h-11 rounded-xl border-border/50 hover:bg-secondary/50 font-bold transition-all" onClick={handleGoogleLogin}>
              <Chrome className="mr-2 h-4 w-4 text-primary" /> Google
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center space-y-4 border-t border-border/20 pt-6">
            <p className="text-xs text-muted-foreground">
              অ্যাকাউন্ট নেই?{' '}
              <Link href="/signup" className="text-primary font-bold hover:underline">
                নতুন অ্যাকাউন্ট তৈরি করুন
              </Link>
            </p>
            <Link href="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors">
              <ArrowLeft className="w-3 h-3" /> হোমে ফিরে যান
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
    </>
  );
}
