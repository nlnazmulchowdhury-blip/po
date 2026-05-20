
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  User, 
  Users,
  Mail, 
  ShieldCheck, 
  MoreHorizontal, 
  UserPlus,
  Trash2,
  Ban,
  CheckCircle2,
  LayoutDashboard,
  Film,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  Loader2,
  Unlock,
  DollarSign
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { AdminGuard } from '@/components/auth/AdminGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { makeUserAdmin, removeAdminRole, banUser, deleteUserAccount } from '@/app/actions/user-actions';
import { AdminUserMenu } from '@/components/admin/AdminUserMenu';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { LoadingScreen } from '@/components/ui/LoadingScreen';


export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const pathname = usePathname();
  const db = useFirestore();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch real users from Firestore
  const usersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: users, loading } = useCollection(usersQuery);

  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleMakeAdmin = async (userId: string, currentName: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে '${currentName}' কে অ্যাডমিন করতে চান?`)) return;
    setIsProcessing(userId);
    try {
      const res = await makeUserAdmin(userId);
      if (res.success) {
        toast({
          title: "অ্যাডমিন করা হয়েছে",
          description: `${currentName} এখন একজন অ্যাডমিনিস্ট্রেটর।`,
        });
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "অপারেশন ব্যর্থ",
        description: err.message || "অ্যাডমিন রোল সেট করা সম্ভব হয়নি।",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRemoveAdmin = async (userId: string, currentName: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে '${currentName}' এর অ্যাডমিন রোল বাতিল করতে চান?`)) return;
    setIsProcessing(userId);
    try {
      const res = await removeAdminRole(userId);
      if (res.success) {
        toast({
          title: "রোল পরিবর্তন করা হয়েছে",
          description: `${currentName} এখন একজন সাধারণ ইউজার।`,
        });
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "অপারেশন ব্যর্থ",
        description: err.message || "রোল পরিবর্তন করা সম্ভব হয়নি।",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteUser = async (userId: string, currentName: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে '${currentName}' কে সম্পূর্ণ ডিলিট করতে চান?\nএর ফলে তার ফায়ারবেস লগইন অ্যাকাউন্ট ও ডাটা মুছে যাবে!`)) return;
    setIsProcessing(userId);
    try {
      const res = await deleteUserAccount(userId);
      if (res.success) {
        toast({
          variant: "destructive",
          title: "ইউজার ডিলিট হয়েছে",
          description: `${currentName} কে প্ল্যাটফর্ম থেকে সম্পূর্ণ রিমুভ করা হয়েছে।`,
        });
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "অপারেশন ব্যর্থ",
        description: err.message || "ইউজার ডিলিট করা সম্ভব হয়নি।",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleToggleBanUser = async (userId: string, currentName: string, isCurrentlyBanned: boolean) => {
    const actionText = isCurrentlyBanned ? 'আনব্যান' : 'ব্যান';
    if (!confirm(`আপনি কি নিশ্চিত যে '${currentName}' কে ${actionText} করতে চান?`)) return;
    setIsProcessing(userId);
    try {
      const res = await banUser(userId, !isCurrentlyBanned);
      if (res.success) {
        toast({
          title: isCurrentlyBanned ? "আনব্যান করা হয়েছে" : "ব্যান করা হয়েছে",
          description: `${currentName} কে সফলভাবে ${actionText} করা হয়েছে।`,
        });
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "অপারেশন ব্যর্থ",
        description: err.message || `${actionText} করা সম্ভব হয়নি।`,
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredUsers = users?.filter(u => 
    u.role === 'admin' &&
    (((u.name || '').toLowerCase().includes(search.toLowerCase())) || 
    ((u.email || '').toLowerCase().includes(search.toLowerCase())))
  );


  return (
    <AdminGuard>
      <div className="flex h-screen w-full bg-[#0a0a0a] overflow-hidden" suppressHydrationWarning>
        {/* Desktop Sidebar */}
        <aside className="w-64 shrink-0 border-r border-white/5 bg-[#0f0f0f] hidden lg:flex flex-col h-full">
          <AdminSidebar />
        </aside>

        <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-40 w-full bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
            <div className="flex h-16 items-center px-4 md:px-8 justify-between w-full">
              <div className="flex items-center gap-4">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden text-white">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64 border-r border-white/5 bg-[#0f0f0f]">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Admin Navigation</SheetTitle>
                      <SheetDescription>Access admin dashboard, movies, users and comments.</SheetDescription>
                    </SheetHeader>
                    <AdminSidebar />
                  </SheetContent>
                </Sheet>
                <div className="lg:hidden flex items-center gap-2">
                  <div className="bg-primary p-1 rounded-lg">
                    <Film className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-headline font-bold text-lg text-white">Studio</span>
                </div>
                <div className="hidden lg:block">
                   <h1 className="text-xl font-bold text-white uppercase italic">Studio / <span className="text-primary">Registry</span></h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <AdminUserMenu />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar w-full">
            <div className="w-full max-w-none space-y-6 md:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div className="space-y-1">
                  <h1 className="text-2xl md:text-3xl font-headline font-bold tracking-tight text-white uppercase italic">Admin <span className="text-primary">Registry</span></h1>
                  <p className="text-muted-foreground text-xs md:text-sm font-medium">Monitor your admin team and manage permissions.</p>
                </div>
              </div>

              <Card className="bg-[#141414] border-white/5 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="p-4 md:p-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="ইউজারের নাম বা ইমেইল দিয়ে খুঁজুন..." 
                      className="pl-10 bg-black/40 border-white/10 text-white h-11" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-left whitespace-nowrap lg:whitespace-normal">
                      <thead className="text-[10px] uppercase bg-black/60 text-muted-foreground border-b border-white/5">
                        <tr>
                          <th className="px-6 py-4 font-bold tracking-widest">User</th>
                          <th className="px-6 py-4 font-bold tracking-widest">Role</th>
                          <th className="px-6 py-4 font-bold tracking-widest">Subscription</th>
                          <th className="px-6 py-4 font-bold tracking-widest">Status</th>
                          <th className="px-6 py-4 font-bold text-right tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="p-0">
                              <LoadingScreen message="অ্যাডমিন ডাটা লোড হচ্ছে..." fullScreen={false} />
                            </td>
                          </tr>
                        ) : filteredUsers?.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest">
                              কোনো ইউজার পাওয়া যায়নি।
                            </td>
                          </tr>
                        ) : filteredUsers?.map((user: any) => (
                          <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-white/10">
                                  <AvatarImage src={(user.photoURL && user.photoURL.trim() !== '') ? user.photoURL : `https://picsum.photos/seed/${user.id}/100/100`} />
                                  <AvatarFallback className="bg-white/5 text-white/50">{user.name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-bold text-white text-sm">{user.name || 'Unknown User'}</span>
                                  <span className="text-[10px] text-muted-foreground">{user.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="secondary" className={`font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 ${user.role === 'admin' ? 'bg-primary/20 text-primary border-primary/20' : 'bg-white/5 text-white/60'}`}>
                                {user.role || 'user'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              {user.isSubscribed ? (
                                <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                  Subscribed
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 bg-white/5 text-white/40 border-0">
                                  Not Subscribed
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {user.status === 'banned' ? (
                                <div className="flex items-center gap-1.5 animate-pulse">
                                  <Ban className="h-3.5 w-3.5 text-red-500" />
                                  <span className="text-[11px] font-bold text-red-500 uppercase">Banned</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                  <span className="text-[11px] font-bold text-green-500 uppercase">Active</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                {isProcessing === user.id ? (
                                  <div className="flex items-center justify-center h-8 px-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                  </div>
                                ) : (
                                  <>
                                    {user.role !== 'admin' ? (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-primary hover:bg-primary/10"
                                        onClick={() => handleMakeAdmin(user.id, user.name)}
                                        title="Make Admin"
                                      >
                                        <ShieldCheck className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      // Prevent removing main admin email, but allow toggling back for others
                                      user.email !== 'nlnazmulchowdhury@gmail.com' && user.email !== 'nazmul41630@gmail.com' && (
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 text-amber-500 hover:bg-amber-500/10"
                                          onClick={() => handleRemoveAdmin(user.id, user.name)}
                                          title="Remove Admin"
                                        >
                                          <ShieldCheck className="h-4 w-4 fill-amber-500/20" />
                                        </Button>
                                      )
                                    )}
                                    
                                    {/* Prevent deleting or banning yourself */}
                                    {user.email !== 'nlnazmulchowdhury@gmail.com' && user.email !== 'nazmul41630@gmail.com' && (
                                      <>
                                        {user.status === 'banned' ? (
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-green-500 hover:bg-green-500/10"
                                            onClick={() => handleToggleBanUser(user.id, user.name, true)}
                                            title="Unban User"
                                          >
                                            <Unlock className="h-4 w-4" />
                                          </Button>
                                        ) : (
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                                            onClick={() => handleToggleBanUser(user.id, user.name, false)}
                                            title="Ban User"
                                          >
                                            <Ban className="h-4 w-4" />
                                          </Button>
                                        )}
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                          onClick={() => handleDeleteUser(user.id, user.name)}
                                          title="Delete User"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
