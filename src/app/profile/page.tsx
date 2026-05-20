'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore, useDoc } from '@/firebase'
import { updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { 
  User as UserIcon, 
  Settings, 
  Heart, 
  Clock, 
  ShieldCheck, 
  Bell, 
  CreditCard,
  History,
  Edit2,
  Camera,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const db = useFirestore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const userDocRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);
  
  const { data: userData } = useDoc<any>(userDocRef);

  const [activeTab, setActiveTab] = useState("overview")
  const [isUploading, setIsUploading] = useState(false)
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "সিনেমা প্রেমী এবং প্রযুক্তি উৎসাহী।"
  })

  // Cloudinary Credentials (Updated with API Key)
  const CLOUD_NAME = 'dnbskyrk';
  const UPLOAD_PRESET = 'nazmulml_default';
  const API_KEY = '778468931453495';

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
    if (user || userData) {
      setProfile(prev => ({
        ...prev,
        name: userData?.name || user?.displayName || "সিনেমা লাভার",
        email: user?.email || "",
        bio: userData?.bio || prev.bio
      }))
    }
  }, [user, userLoading, userData, router])

  const handleEditClick = () => setActiveTab("settings");

  const handleImageClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  }

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('api_key', API_KEY);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Cloudinary upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "ফাইলটি অনেক বড়", description: "৫ মেগাবাইটের কম সাইজের ছবি সিলেক্ট করুন।" });
      return;
    }

    if (!user || !db) {
      toast({ variant: "destructive", title: "ত্রুটি", description: "সার্ভিস লোড হচ্ছে, আবার চেষ্টা করুন।" });
      return;
    }

    setIsUploading(true)
    try {
      // 1. Upload to Cloudinary
      const downloadURL = await uploadToCloudinary(file);
      
      // 2. Update Auth Profile
      await updateProfile(user, { photoURL: downloadURL });
      
      // 3. Update Firestore Document
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { 
        photoURL: downloadURL, 
        updatedAt: new Date().toISOString() 
      }, { merge: true });
      
      toast({
        title: "সফলভাবে আপডেট হয়েছে",
        description: "আপনার প্রোফাইল ছবি ক্লাউডিনারিতে সেভ করা হয়েছে।",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "আপলোড ব্যর্থ",
        description: error.message || "ছবি আপলোড করা সম্ভব হয়নি।",
      })
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !user) return;
    
    const userRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userRef, { 
        name: profile.name, 
        bio: profile.bio,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      if (user.displayName !== profile.name) {
        await updateProfile(user, { displayName: profile.name });
      }

      toast({ title: "পরিবর্তন সেভ হয়েছে", description: "আপনার তথ্য সফলভাবে আপডেট করা হয়েছে।" });
      setActiveTab("overview");
    } catch (err: any) {
      toast({ variant: "destructive", title: "এরর", description: err.message || "তথ্য সেভ করা সম্ভব হয়নি।" });
    }
  }

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null;

  const displayPhoto = userData?.photoURL || user.photoURL || `https://picsum.photos/seed/${user.uid}/400/400`;

  return (
    <>
      <AppSidebar />
      <div className="flex flex-col min-h-screen w-full min-w-0">
        <Navbar />
        <div className="flex-1 bg-[#0a0a0a]">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload}
          />
          
          <div className="h-32 md:h-48 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border-b border-white/5" />
          
          <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-16 md:-mt-24 pb-20">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end mb-8">
              <div className="relative group cursor-pointer" onClick={handleImageClick}>
                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-[#0a0a0a] shadow-2xl overflow-hidden bg-black/40">
                  <AvatarImage src={displayPhoto} className="object-cover" />
                  <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary uppercase">{profile.name[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className={`absolute inset-0 bg-black/60 rounded-full transition-opacity flex flex-col items-center justify-center ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  ) : (
                    <>
                      <Camera className="text-white h-8 w-8 mb-1" />
                      <span className="text-[10px] text-white font-bold uppercase tracking-widest">Update</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl md:text-4xl font-headline font-bold text-white uppercase italic tracking-tight">{profile.name}</h1>
                  <Badge className="bg-primary/20 text-primary border-primary/20 font-bold px-3 py-0.5 rounded-full text-[10px]">PREMIUM MEMBER</Badge>
                </div>
                <p className="text-muted-foreground text-xs md:text-sm font-medium">সদস্য হয়েছেন ২০২৪ থেকে • {profile.email}</p>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={handleEditClick} className="flex-1 md:flex-none gap-2 rounded-2xl font-bold h-12 px-8 shadow-xl shadow-primary/20 uppercase text-xs tracking-widest bg-primary hover:bg-primary/90">
                  <Edit2 className="h-4 w-4" /> Edit Profile
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="bg-white/5 p-1 rounded-2xl border border-white/5">
                <TabsTrigger value="overview" className="gap-2 px-8 font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">ওভারভিউ</TabsTrigger>
                <TabsTrigger value="settings" className="gap-2 px-8 font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">সেটিংস</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-[#141414] border-white/5 shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-white/[0.02] border-b border-white/5"><CardTitle className="font-headline font-bold text-xl text-white uppercase italic tracking-tight">আমার <span className="text-primary">সম্পর্কে</span></CardTitle></CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-gray-400 text-sm md:text-base leading-relaxed italic">{profile.bio}</p>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">ইমেইল ঠিকানা</Label>
                        <p className="text-sm font-semibold text-white">{profile.email}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">অ্যাকাউন্ট স্ট্যাটাস</Label>
                        <div className="flex items-center gap-2">
                           <CheckCircle2 className="h-4 w-4 text-green-500" />
                           <p className="text-sm font-semibold text-green-500">ভেরিফাইড ইউজার</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-[#141414] border-white/5 shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-white/[0.02] border-b border-white/5"><CardTitle className="font-headline font-bold text-xl text-white uppercase italic tracking-tight">অ্যাকাউন্ট <span className="text-primary">সেটিংস</span></CardTitle></CardHeader>
                  <CardContent className="pt-8">
                    <form onSubmit={handleSaveChanges} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullname" className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">পুরো নাম</Label>
                        <Input id="fullname" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="bg-black/40 h-12 border-white/10 text-white rounded-xl focus:border-primary/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio" className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">বায়োগ্রাফি</Label>
                        <textarea 
                          id="bio" 
                          value={profile.bio} 
                          onChange={(e) => setProfile({...profile, bio: e.target.value})} 
                          className="flex min-h-[120px] w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 resize-none" 
                        />
                      </div>
                      <Button type="submit" className="w-full font-bold h-14 uppercase rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 tracking-widest text-sm">সেভ করুন</Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  )
}