'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { LayoutDashboard, User, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function AdminUserMenu() {
  const { auth } = useAuth();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await auth.signOut();
      toast({
        title: "লগআউট সফল",
        description: "আপনি সফলভাবে অ্যাডমিন প্যানেল থেকে লগআউট করেছেন।",
      });
      router.push('/admin/login');
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "লগআউট ব্যর্থ",
        description: err.message || "লগআউট করা সম্ভব হয়নি।",
      });
    }
  };

  if (loading) {
    return (
      <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    );
  }

  // Fallbacks if user is not logged in (bypassed mode)
  const photoURL = currentUser?.photoURL || '';
  const displayName = currentUser?.displayName || 'Super Admin';
  const email = currentUser?.email || 'admin@platform.com';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AD';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-9 w-9 rounded-full border border-white/10 p-0 overflow-hidden hover:opacity-90 transition-all focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <Avatar className="h-full w-full">
            <AvatarImage src={photoURL} alt={displayName} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs uppercase">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-[#141414] border-white/10 text-white rounded-2xl shadow-2xl p-1 mt-1 z-50"
      >
        <div className="flex items-center gap-2 p-3 border-b border-white/5">
          <div className="flex flex-col space-y-0.5 animate-fade-in">
            <p className="text-xs font-bold text-white leading-none">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate max-w-[180px] mt-1">{email}</p>
          </div>
        </div>
        <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/5 focus:text-white rounded-xl gap-2 mt-1 py-2 text-xs">
          <Link href="/admin/dashboard" className="flex items-center w-full">
            <LayoutDashboard className="w-4 h-4 text-primary" />
            <span>ড্যাশবোর্ড</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/5 focus:text-white rounded-xl gap-2 py-2 text-xs">
          <Link href="/profile" className="flex items-center w-full">
            <User className="w-4 h-4 text-primary" />
            <span>প্রোফাইল</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer focus:bg-destructive/10 focus:text-destructive text-destructive rounded-xl gap-2 py-2 text-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>লগআউট</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
