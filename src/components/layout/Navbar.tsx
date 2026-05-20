
"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Search, Bell, User, Video, Settings, LogOut, X, ShieldCheck, Mail, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from 'next/link'
import { useUser, useAuth, useFirestore, useCollection } from '@/firebase'
import { signOut } from 'firebase/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { collection, query, where, orderBy, limit, updateDoc, doc } from 'firebase/firestore'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/sidebar'

export function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search_query') || '');
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { user, loading: userLoading } = useUser();
  const { auth } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const { toggleSidebar } = useSidebar();

  const notificationsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [db, user]);

  const { data: notifications } = useCollection<any>(notificationsQuery);
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  useEffect(() => {
    setSearch(searchParams.get('search_query') || '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/results?search_query=${encodeURIComponent(search.trim())}`);
    } else {
      router.push('/');
    }
    setIsSearchOpen(false);
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'See you again soon!' });
      router.push('/login');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Logout Failed', description: error.message });
    }
  };

  const markAsRead = async (notifId: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="flex h-16 items-center px-4 md:px-6 justify-between gap-4">
        {!isSearchOpen && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hover:bg-white/10 text-white rounded-full transition-all duration-300 mr-1 shrink-0 h-10 w-10 flex items-center justify-center"
              title="Toggle Sidebar"
            >
              <Menu className="h-5 w-5 text-muted-foreground hover:text-white transition-colors" />
            </Button>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary p-1 rounded-lg group-hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="font-headline font-bold text-xl tracking-tight hidden sm:block">
                Cinema<span className="text-primary">Stream</span>
              </span>
            </Link>
          </div>
        )}

        <div className="flex-1 max-w-2xl hidden md:flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative w-full">
            <div className="flex items-center w-full">
              <div className="relative flex-1">
                <Input 
                  placeholder="Search" 
                  className="w-full pl-4 pr-10 h-10 bg-black/20 border-border focus-visible:ring-primary transition-all rounded-l-full rounded-r-none border-r-0"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" className="h-10 px-5 rounded-l-none rounded-r-full border border-l-0 border-border bg-white/5 hover:bg-white/10">
                <Search className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </form>
        </div>

        {isSearchOpen && (
          <div className="flex-1 flex items-center gap-2 animate-in slide-in-from-right-4 duration-200">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
            <form onSubmit={handleSearch} className="relative w-full">
              <Input 
                autoFocus
                placeholder="Search..." 
                className="w-full h-10 bg-secondary/50 border-border focus-visible:ring-primary rounded-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
          </div>
        )}

        {!isSearchOpen && (
          <div className="flex items-center gap-1 sm:gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5 text-muted-foreground" />
            </Button>
            
            {/* Notification Bell */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hover:bg-secondary rounded-full">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-primary text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-card border-white/10 p-0 overflow-hidden rounded-xl">
                  <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" /> নোটিফিকেশন
                    </h3>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications?.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-xs uppercase font-bold tracking-widest">
                        কোনো নোটিফিকেশন নেই
                      </div>
                    ) : notifications?.map((notif: any) => (
                      <div 
                        key={notif.id} 
                        className={cn(
                          "p-4 flex gap-3 hover:bg-white/[0.05] transition-colors cursor-pointer border-b border-white/5",
                          !notif.read && "bg-primary/[0.03]"
                        )}
                        onClick={() => {
                          markAsRead(notif.id);
                          router.push(notif.link);
                        }}
                      >
                        <Avatar className="h-10 w-10 shrink-0 border border-white/5">
                          <AvatarImage src={(notif.senderPhoto && notif.senderPhoto.trim() !== '') ? notif.senderPhoto : undefined} />
                          <AvatarFallback>{notif.senderName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <p className="text-xs text-white leading-relaxed">
                            <span className="font-bold">{notif.senderName}</span> {notif.message}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-medium block">
                            {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'এখনই'}
                          </span>
                        </div>
                        {!notif.read && <div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" />}
                      </div>
                    ))}
                  </div>
                  <div className="p-2 bg-white/[0.02] text-center border-t border-white/5">
                    <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary">
                      সবগুলো দেখুন
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {userLoading ? (
              <div className="h-10 w-10 rounded-full bg-secondary animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-9 w-9 md:h-10 md:w-10 border border-border shadow-sm hover:scale-105 transition-transform">
                      <AvatarImage src={(user.photoURL && user.photoURL.trim() !== '') ? user.photoURL : `https://picsum.photos/seed/${user.uid}/100/100`} />
                      <AvatarFallback>{user.displayName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none">{user.displayName || 'Cinema Lover'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer font-medium">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer font-medium">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer font-bold" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild className="h-10 px-6 font-bold rounded-full shadow-lg shadow-primary/20">
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
