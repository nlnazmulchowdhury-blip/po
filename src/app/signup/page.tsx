
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Mail, Lock, User, Loader2, ArrowLeft, AlertCircle, MailCheck, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { sendVerificationLink } from '@/ai/flows/send-verification-link-flow';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { auth } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (error) setError(null);
  }, [name, email, password]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const vLink = `${baseUrl}/verify-email?uid=${user.uid}&token=${verificationToken}`;

      // 2. Update Profile & Save to Firestore
      await updateProfile(user, { displayName: name });
      
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        name: name,
        email: email,
        role: 'user',
        emailVerified: false,
        verificationToken: verificationToken,
        createdAt: serverTimestamp(),
      });

      // 3. Send Verification Email
      const emailResult = await sendVerificationLink({
        email: email,
        name: name,
        verificationLink: vLink
      });

      if (!emailResult.success) {
        throw new Error(emailResult.message);
      }

      // 4. Sign out immediately so they can't browse unverified
      await signOut(auth);

      setSuccess(true);
      toast({ title: 'রেজিস্ট্রেশন সফল', description: 'আপনার ইমেইল চেক করুন।' });
    } catch (err: any) {
      let errorMessage = err.message || 'একটি ত্রুটি ঘটেছে, আবার চেষ্টা করুন।';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে।';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-[100] p-4">
        <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-300">
           <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl text-center py-8">
              <CardContent className="space-y-6">
                 <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <MailCheck className="h-10 w-10 text-primary animate-pulse" />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white uppercase italic">ইমেইল <span className="text-primary">চেক করুন</span></h2>
                    <p className="text-muted-foreground text-sm">আমরা আপনার <span className="text-white font-bold">{email}</span> ঠিকানায় একটি ভেরিফিকেশন লিঙ্ক পাঠিয়েছি। লিঙ্কে ক্লিক করে আপনার অ্যাকাউন্ট অ্যাক্টিভেট করুন।</p>
                 </div>
                 <div className="pt-4">
                    <Button asChild className="w-full font-bold h-11 rounded-xl">
                       <Link href="/login">লগইন পেজে যান</Link>
                    </Button>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      {loading && <LoadingScreen message="অ্যাকাউন্ট তৈরি করা হচ্ছে..." fullScreen={true} />}
      <div className="fixed inset-0 flex items-center justify-center bg-background z-[100] overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background p-4">
        <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-300">
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
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase italic">নতুন <span className="text-primary">অ্যাকাউন্ট</span></h1>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest">রেজিস্ট্রেশনের জন্য ইমেইল ভেরিফিকেশন আবশ্যক</p>
          </div>
        </div>

        <Card className={cn(
          "border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300",
          error && "border-destructive/50"
        )}>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">রেজিস্ট্রেশন</CardTitle>
            <CardDescription>আপনার প্রয়োজনীয় তথ্যগুলো দিয়ে মেম্বারশিপ নিন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[11px] p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">আপনার নাম</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="পুরো নাম লিখুন"
                      className="pl-10 h-11 bg-background/30 border-border/50 focus:border-primary/50 transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ইমেইল ঠিকানা</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@mail.com"
                      className="pl-10 h-11 bg-background/30 border-border/50 focus:border-primary/50 transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">পাসওয়ার্ড</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="কমপক্ষে ৬টি ক্যারেক্টার"
                      className="pl-10 h-11 bg-background/30 border-border/50 focus:border-primary/50 transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full font-bold h-11 rounded-xl shadow-lg shadow-primary/20 text-white uppercase tracking-widest" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'সাইন-আপ করুন'}
                </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center space-y-4 border-t border-border/20 pt-6">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
              ইতিমধ্যেই অ্যাকাউন্ট আছে?{' '}
              <Link href="/login" className="text-primary font-bold hover:underline transition-all">
                লগইন করুন
              </Link>
            </p>
            <Link href="/" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors group">
              <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> হোমে ফিরে যান
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
    </>
  );
}
