
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Lock, Mail, Loader2, ArrowLeft, AlertCircle, UserPlus, LogIn, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  const { auth } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // Master Admin Credentials
  const ADMIN_EMAILS = ["nlnazmulchowdhury@gmail.com", "nazmul41630@gmail.com"];
  const ADMIN_PASSWORD = "Nazmul41630";

  useEffect(() => {
    if (error) setError(false);
  }, [email, password]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    setLoading(true);
    setError(false);
    
    // 1. Strict Hardcoded Email Check for Sign Up
    if (activeTab === 'signup' && !ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
      setError(true);
      toast({
        variant: 'destructive',
        title: 'অ্যাক্সেস ডিনাইড',
        description: 'শুধুমাত্র নির্ধারিত ইমেইল দিয়ে নতুন অ্যাডমিন সাইন-আপ করা যাবে।',
      });
      setLoading(false);
      return;
    }
    
    try {
      let user;
      
      if (activeTab === 'login') {
        // Attempt to sign in with standard Firebase auth (no hardcoded password lock)
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        user = userCredential.user;
      } else {
        // Sign Up Mode: Create admin user
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        user = userCredential.user;
        await updateProfile(user, { displayName: name || 'Super Admin' });
      }

      if (!user) throw new Error("অথেন্টিকেশন ব্যর্থ হয়েছে।");

      if (activeTab === 'login') {
        // Verify admin role in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const { getDoc } = await import('firebase/firestore');
        const userSnap = await getDoc(userDocRef);
        
        let hasAdminAccess = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '');
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.role === 'admin') {
            hasAdminAccess = true;
          }
        }

        if (!hasAdminAccess) {
          await auth.signOut();
          throw new Error("আপনার এই প্যানেলে প্রবেশ করার অনুমতি নেই।");
        }

        // Update last login
        await setDoc(userDocRef, {
          lastAdminLogin: serverTimestamp()
        }, { merge: true });
        
      } else {
        // Ensure admin role and metadata in Firestore for new signups
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name: name || user.displayName || 'Super Admin',
          role: 'admin',
          isAdminAccount: true,
          accountType: 'administrator',
          emailVerified: true,
          lastAdminLogin: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      toast({
        title: activeTab === 'login' ? 'লগইন সফল' : 'অ্যাডমিন অ্যাকাউন্ট তৈরি সফল',
        description: 'স্বাগতম অ্যাডমিনিস্ট্রেটর। আপনাকে ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...',
      });
      
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(true);
      let msg = err.message;
      
      if (err.code === 'auth/email-already-in-use') {
        msg = "এই অ্যাডমিন ইমেইলটি ইতিমধ্যে রেজিস্টার করা আছে। দয়া করে লগইন করুন।";
        // Auto-switch to login tab for better UX
        setActiveTab('login');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = "ভুল পাসওয়ার্ড বা ইমেইল। দয়া করে সঠিক পাসওয়ার্ড দিন।";
      } else if (err.code === 'auth/user-not-found') {
        msg = "এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। প্রথমে সাইন-আপ করুন।";
      } else if (err.code === 'auth/weak-password') {
        msg = "পাসওয়ার্ডটি খুব দুর্বল। অন্তত ৬ অক্ষরের পাসওয়ার্ড ব্যবহার করুন।";
      }
      
      toast({
        variant: 'destructive',
        title: 'অথেন্টিকেশন ব্যর্থ',
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !db) return;
    
    setLoading(true);
    setError(false);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      if (!user || !user.email) {
        throw new Error("গুগল অ্যাকাউন্ট থেকে কোনো ইমেইল পাওয়া যায়নি।");
      }
      
      // Verify admin role in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const { getDoc } = await import('firebase/firestore');
      const userSnap = await getDoc(userDocRef);
      
      let hasAdminAccess = ADMIN_EMAILS.includes(user.email.toLowerCase());
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.role === 'admin') {
          hasAdminAccess = true;
        }
      }

      // Check if user has access
      if (!hasAdminAccess) {
        await auth.signOut();
        setError(true);
        toast({
          variant: 'destructive',
          title: 'অ্যাক্সেস ডিনাইড',
          description: 'আপনার এই প্যানেলে প্রবেশ করার অনুমতি নেই।',
        });
        setLoading(false);
        return;
      }
      
      // Update last login
      await setDoc(userDocRef, {
        lastAdminLogin: serverTimestamp()
      }, { merge: true });

      toast({
        title: 'গুগল লগইন সফল',
        description: `স্বাগতম ${user.displayName || 'অ্যাডমিনিস্ট্রেটর'}। ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...`,
      });
      
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(true);
      
      let msg = err.message;
      if (err.code === 'auth/popup-closed-by-user') {
        msg = "গুগল সাইন-ইন উইন্ডোটি বন্ধ করা হয়েছে।";
      } else if (err.code === 'auth/cancelled-popup-request') {
        msg = "আগের গুগল পপআপ রিকোয়েস্টটি বাতিল করা হয়েছে।";
      }
      
      toast({
        variant: 'destructive',
        title: 'লগইন ব্যর্থ',
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!auth) return;
    const targetEmail = ADMIN_EMAILS.includes(email) ? email : ADMIN_EMAILS[0];
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      toast({
        title: "ইমেইল পাঠানো হয়েছে",
        description: "পাসওয়ার্ড রিসেট করার জন্য আপনার ইনবক্স চেক করুন।",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "ত্রুটি",
        description: "পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো সম্ভব হয়নি।",
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#050505] z-[200] overflow-y-auto custom-scrollbar">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_transparent,_#000)]" />
      
      <div className="w-full max-w-[440px] relative z-10 px-4 py-10">
        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
          <div className="bg-primary/20 p-4 rounded-3xl border border-primary/30 shadow-2xl shadow-primary/20">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-bold tracking-tight text-white uppercase italic">Studio <span className="text-primary">Admin</span></h1>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">Authorized Access Only</p>
          </div>
        </div>

        <Card className={cn(
          "border-border/20 bg-card/60 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-300",
          error ? "border-destructive/50 shadow-destructive/10" : "border-t-primary/20"
        )}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2 bg-black/40 rounded-xl p-1 mb-4">
                <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase gap-2">
                  <LogIn className="w-3.5 h-3.5" /> লগইন
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase gap-2">
                  <UserPlus className="w-3.5 h-3.5" /> সাইন-আপ
                </TabsTrigger>
              </TabsList>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                {activeTab === 'login' ? 'অ্যাডমিন সেশন' : 'অ্যাডমিন প্রোফাইল তৈরি'}
                {error && <AlertCircle className="h-4 w-4 text-destructive animate-pulse" />}
              </CardTitle>
              <CardDescription>
                {activeTab === 'login' 
                  ? 'আপনার নির্ধারিত অ্যাডমিন আইডি দিয়ে লগইন করুন' 
                  : 'সিস্টেমে অ্যাডমিন প্রোফাইল সুরক্ষিতভাবে সেভ করুন'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                {activeTab === 'signup' && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">অ্যাডমিন নাম</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="আপনার নাম"
                        className="pl-10 h-12 bg-black/40 border-border/50 focus:border-primary/50"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={activeTab === 'signup'}
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label 
                    htmlFor="email" 
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-widest transition-colors",
                      error ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    নির্ধারিত ইমেইল
                  </Label>
                  <div className="relative">
                    <Mail className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                      error ? "text-destructive" : "text-muted-foreground"
                    )} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      className={cn(
                        "pl-10 h-12 bg-black/40 border-border/50 transition-all",
                        error 
                          ? "border-destructive focus-visible:ring-destructive text-destructive placeholder:text-destructive/40" 
                          : "focus:border-primary/50"
                      )}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label 
                    htmlFor="password" 
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-widest transition-colors",
                      error ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    মাস্টার পাসওয়ার্ড
                  </Label>
                  <div className="relative">
                    <Lock className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                      error ? "text-destructive" : "text-muted-foreground"
                    )} />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className={cn(
                        "pl-10 h-12 bg-black/40 border-border/50 transition-all",
                        error 
                          ? "border-destructive focus-visible:ring-destructive text-destructive placeholder:text-destructive/40" 
                          : "focus:border-primary/50"
                      )}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {activeTab === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" onClick={handleResetPassword} className="text-[10px] font-bold text-primary hover:underline">
                      পাসওয়ার্ড রিসেট লিঙ্ক পাঠান
                    </button>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className={cn(
                    "w-full font-bold h-12 rounded-xl shadow-xl transition-all duration-300 uppercase tracking-widest",
                    error ? "bg-destructive hover:bg-destructive/90 shadow-destructive/20" : "bg-primary hover:bg-primary/90 shadow-primary/20"
                  )} 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                    activeTab === 'login' ? 'অ্যাডমিন লগইন' : 'অ্যাডমিন সাইন-আপ'
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/5" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0f0f0f] px-3 text-muted-foreground font-bold tracking-widest text-[9px]">অথবা</span>
                  </div>
                </div>

                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-12 bg-black/20 border-white/5 text-white hover:bg-white/5 rounded-xl flex items-center justify-center gap-3 font-semibold transition-all shadow-md"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.33 0 3.33 2.7 1.455 6.636l3.81 3.13z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.455 12.273c0-.818-.082-1.609-.218-2.364H12v4.545h6.436a5.5 5.5 0 0 1-2.39 3.618l3.708 2.873c2.164-1.99 3.41-4.918 3.41-8.673z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.266 14.235L1.455 17.364C3.33 21.3 7.33 24 12 24c3.082 0 5.673-1.02 7.564-2.764l-3.708-2.873a4.23 4.23 0 0 1-2.618.727 7.07 7.07 0 0 1-7.973-4.855z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 4.909c1.973 0 3.745.682 5.145 2.018l3.491-3.49C18.527 1.436 15.545 0 12 0 7.33 0 3.33 2.7 1.455 6.636l3.81 3.13C6.31 7.155 8.91 4.909 12 4.909z"
                    />
                  </svg>
                  গুগল দিয়ে প্রবেশ করুন
                </Button>
              </form>
            </CardContent>
          </Tabs>
          <CardFooter className="flex flex-col items-center justify-center space-y-4 border-t border-border/10 pt-6">
            <Link href="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors group">
              <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> 
              ওয়েবসাইটে ফিরে যান
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
