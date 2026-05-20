
'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from "@/hooks/use-toast"
import { 
  Settings as SettingsIcon, 
  Lock, 
  Bell, 
  Shield, 
  Eye, 
  Mail, 
  Smartphone,
  CreditCard,
  User,
  Loader2,
  ChevronRight
} from 'lucide-react'
import { useUser } from '@/firebase'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user, loading } = useUser()
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: "সেটিংস আপডেট হয়েছে",
        description: "আপনার পরিবর্তনগুলো সফলভাবে সেভ করা হয়েছে।",
      })
    }, 1000)
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <AppSidebar />
      <div className="flex flex-col min-h-screen w-full min-w-0">
        <Navbar />
        <div className="flex-1 bg-background">
          <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 space-y-8 pb-20">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <SettingsIcon className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Preferences</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-headline font-bold text-white uppercase italic">App <span className="text-primary">Settings</span></h1>
              <p className="text-muted-foreground text-sm font-medium">Manage your account security and notification preferences.</p>
            </div>

            <div className="grid gap-6">
              {/* Security Section */}
              <Card className="bg-[#141414] border-white/5 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-white/[0.02] border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-white">অ্যাকাউন্ট সিকিউরিটি</CardTitle>
                      <CardDescription className="text-xs">আপনার পাসওয়ার্ড এবং সুরক্ষা নিশ্চিত করুন।</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">বর্তমান পাসওয়ার্ড</Label>
                      <Input type="password" placeholder="••••••••" className="bg-black/40 border-white/10 text-white h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">নতুন পাসওয়ার্ড</Label>
                      <Input type="password" placeholder="••••••••" className="bg-black/40 border-white/10 text-white h-11" />
                    </div>
                  </div>
                  <Button onClick={handleSave} className="font-bold rounded-full h-10 px-6 uppercase shadow-lg shadow-primary/20">পাসওয়ার্ড আপডেট করুন</Button>
                </CardContent>
              </Card>

              {/* Notifications Section */}
              <Card className="bg-[#141414] border-white/5 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-white/[0.02] border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-white">নোটিফিকেশন প্রিফারেন্স</CardTitle>
                      <CardDescription className="text-xs">কিভাবে আপনি আপডেট পেতে চান তা ঠিক করুন।</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-white">ইমেইল নোটিফিকেশন</Label>
                        <p className="text-xs text-muted-foreground">নতুন মুভি রিলিজ হলে ইমেইল পাবেন।</p>
                      </div>
                      <Switch defaultChecked onCheckedChange={handleSave} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-white">পুশ নোটিফিকেশন</Label>
                        <p className="text-xs text-muted-foreground">ব্রাউজারে সরাসরি অ্যালার্ট পাবেন।</p>
                      </div>
                      <Switch onCheckedChange={handleSave} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Privacy & Support */}
              <Card className="bg-[#141414] border-white/5 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-white/[0.02] border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-white">প্রাইভেসি ও সাপোর্ট</CardTitle>
                      <CardDescription className="text-xs">আপনার তথ্য এবং সহায়তার জন্য।</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-white/5">
                    <button className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group">
                      <div className="flex items-center gap-3">
                        <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        <span className="text-sm font-medium text-white">প্রাইভেসি পলিসি</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/20" />
                    </button>
                    <button className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        <span className="text-sm font-medium text-white">হেল্প ও সাপোর্ট</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/20" />
                    </button>
                    <button className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group text-destructive">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4" />
                        <span className="text-sm font-bold uppercase tracking-tight">অ্যাকাউন্ট ডিলিট করুন</span>
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-20" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end pt-6">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 font-bold px-10 h-12 rounded-full uppercase shadow-xl shadow-primary/20"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "সব পরিবর্তন সেভ করুন"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
