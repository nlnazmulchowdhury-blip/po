
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Mail, Loader2, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, ShieldCheck, MailCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { sendOtp } from '@/ai/flows/send-otp-flow';
import { resetPassword } from '@/ai/flows/reset-password-flow';

type ResetStep = 'request' | 'verify' | 'new-password' | 'success';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<ResetStep>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const db = useFirestore();
  const { toast } = useToast();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setLoading(true);
    setError(null);

    try {
      const result = await sendOtp({ email });
      if (result.success) {
        toast({ title: 'ওটিপি পাঠানো হয়েছে', description: result.message });
        setStep('verify');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError('ইমেইল পাঠানো সম্ভব হয়নি। আপনার ইন্টারনেট কানেকশন চেক করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'passwordResets'),
        where('email', '==', email),
        where('otp', '==', otp.trim()),
        where('used', '==', false)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const now = new Date().toISOString();
        const validDoc = snapshot.docs.find(d => d.data().expiresAt > now);

        if (validDoc) {
          // Do not delete here, let the server action handle it during password update
          setStep('new-password');
          toast({ title: 'ভেরিফিকেশন সফল', description: 'নতুন পাসওয়ার্ড সেট করুন।' });
        } else {
          setError('ওটিপি কোডটির মেয়াদ শেষ হয়ে গেছে। আবার ওটিপি পাঠান।');
        }
      } else {
        setError('ভুল ওটিপি কোড। দয়া করে আপনার ইমেইল চেক করুন।');
      }
    } catch (err: any) {
      setError('ভেরিফিকেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await resetPassword({ email, otp: otp.trim(), newPassword });
      if (result.success) {
        setStep('success');
        toast({ title: 'সফল হয়েছে', description: result.message });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-[100] p-4 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
          <div className="bg-primary p-2.5 rounded-2xl shadow-lg shadow-primary/20">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase italic">পাসওয়ার্ড <span className="text-primary">রিসেট</span></h1>
        </div>

        <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl">
          {step === 'request' && (
            <CardContent className="pt-6 space-y-4">
              <CardDescription className="text-center mb-4">আপনার ইমেইল দিন, আমরা একটি ওটিপি পাঠাবো।</CardDescription>
              {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ইমেইল ঠিকানা</Label>
                  <Input type="email" placeholder="mail@example.com" className="h-11 bg-background/30" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full font-bold h-11 rounded-xl" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'ওটিপি পাঠান'}
                </Button>
              </form>
            </CardContent>
          )}

          {step === 'verify' && (
            <CardContent className="pt-6 space-y-4">
              <CardDescription className="text-center mb-4"><span className="text-white font-bold">{email}</span> ঠিকানায় কোড পাঠানো হয়েছে।</CardDescription>
              {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ভেরিফিকেশন কোড</Label>
                  <Input 
                    placeholder="••••••" 
                    className="h-11 bg-background/30 text-center tracking-[0.5em] font-bold text-lg" 
                    maxLength={6} 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full font-bold h-11 rounded-xl" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'ভেরিফাই করুন'}
                </Button>
              </form>
            </CardContent>
          )}

          {step === 'new-password' && (
            <CardContent className="pt-6 space-y-4">
              <CardDescription className="text-center mb-4">নতুন পাসওয়ার্ড সেট করুন।</CardDescription>
              {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">নতুন পাসওয়ার্ড</Label>
                  <Input type="password" placeholder="••••••••" className="h-11 bg-background/30" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="w-full font-bold h-11 rounded-xl" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'পাসওয়ার্ড সেভ করুন'}
                </Button>
              </form>
            </CardContent>
          )}

          {step === 'success' && (
            <CardContent className="pt-8 pb-6 space-y-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">অভিনন্দন!</h3>
                <p className="text-sm text-muted-foreground">পাসওয়ার্ড সফলভাবে রিসেট করা হয়েছে।</p>
              </div>
              <Button asChild className="w-full font-bold h-11 rounded-xl">
                <Link href="/login">লগইন করুন</Link>
              </Button>
            </CardContent>
          )}

          <CardFooter className="flex justify-center border-t border-border/20 pt-6">
            <Link href="/login" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors">
              <ArrowLeft className="w-3 h-3" /> লগইন পেজে ফিরে যান
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
