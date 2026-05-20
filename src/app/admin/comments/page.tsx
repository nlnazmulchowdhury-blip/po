
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MessageSquare, 
  Trash2, 
  Flag, 
  LayoutDashboard,
  Film,
  Users,
  Settings,
  LogOut,
  Menu,
  Loader2,
  Edit3,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  MessageCircle,
  X,
  AlertTriangle,
  ThumbsUp,
  DollarSign
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { AdminGuard } from '@/components/auth/AdminGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { AdminUserMenu } from '@/components/admin/AdminUserMenu';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const adminLinks = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/admin/dashboard" },
  { title: "Movies", icon: Film, url: "/admin/movies" },
  { title: "Users", icon: Users, url: "/admin/users" },
  { title: "Comments", icon: MessageSquare, url: "/admin/comments" },
  { title: "Revenue", icon: DollarSign, url: "/admin/revenue" },
];

export default function AdminCommentsPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Selection State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);

  // Edit/Delete State
  const [editingComment, setEditingComment] = useState<any>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all comments in real-time
  const commentsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'comments'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: allComments, loading } = useCollection(commentsQuery);

  // Group comments by user
  const uniqueCommenters = useMemo(() => {
    if (!allComments) return [];
    const commentersMap = new Map();

    allComments.forEach((comment: any) => {
      if (!commentersMap.has(comment.userId)) {
        commentersMap.set(comment.userId, {
          userId: comment.userId,
          userName: comment.userName || 'Unknown User',
          userPhoto: comment.userPhoto || '',
          commentCount: 1,
          lastCommentAt: comment.createdAt
        });
      } else {
        const existing = commentersMap.get(comment.userId);
        existing.commentCount += 1;
      }
    });

    return Array.from(commentersMap.values()).filter(c => 
      c.userName.toLowerCase().includes(search.toLowerCase())
    );
  }, [allComments, search]);

  // Filter comments for the selected user
  const userComments = useMemo(() => {
    if (!allComments || !selectedUserId) return [];
    return allComments.filter((c: any) => c.userId === selectedUserId);
  }, [allComments, selectedUserId]);

  const handleDeleteConfirm = async () => {
    if (!db || !commentToDelete) return;
    
    setIsDeleting(true);
    try {
      const commentRef = doc(db, 'comments', commentToDelete.id);
      await deleteDoc(commentRef);
      
      toast({ 
        title: "ডিলিট সফল", 
        description: "কমেন্টটি ডাটাবেজ থেকে চিরতরে মুছে ফেলা হয়েছে।" 
      });
      setCommentToDelete(null);
    } catch (err: any) {
      console.error("Deletion error:", err);
      toast({ 
        variant: "destructive", 
        title: "ত্রুটি", 
        description: "কমেন্ট ডিলিট করা সম্ভব হয়নি। আপনার ইন্টারনেট কানেকশন বা পারমিশন চেক করুন।" 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFlag = async (commentId: string, currentStatus: string) => {
    if (!db) return;
    try {
      const newStatus = currentStatus === 'flagged' ? 'approved' : 'flagged';
      await updateDoc(doc(db, 'comments', commentId), { status: newStatus });
      toast({ 
        title: newStatus === 'flagged' ? "ফ্ল্যাগ করা হয়েছে" : "অ্যাপ্রুভ করা হয়েছে", 
        description: `কমেন্টটি এখন ${newStatus === 'flagged' ? 'হিডেন' : 'পাবলিক'} থাকবে।` 
      });
    } catch (err) {
      toast({ variant: "destructive", title: "ত্রুটি", description: "স্ট্যাটাস আপডেট করা সম্ভব হয়নি।" });
    }
  };

  const openEditDialog = (comment: any) => {
    setEditingComment(comment);
    setEditText(comment.text);
  };

  const handleUpdateComment = async () => {
    if (!db || !editingComment || !editText.trim()) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'comments', editingComment.id), { text: editText });
      toast({ title: "আপডেট সফল", description: "কমেন্টটি সফলভাবে এডিট করা হয়েছে।" });
      setEditingComment(null);
    } catch (err) {
      toast({ variant: "destructive", title: "ত্রুটি", description: "আপডেট করা সম্ভব হয়নি।" });
    } finally {
      setIsSaving(false);
    }
  };

  

  return (
    <AdminGuard>
      <div className="flex h-screen w-full bg-[#0a0a0a] overflow-hidden" suppressHydrationWarning>
        <aside className="w-64 shrink-0 border-r border-white/5 bg-[#0f0f0f] hidden lg:flex flex-col h-full">
          <AdminSidebar />
        </aside>

        <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
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
                   <h1 className="text-xl font-bold text-white uppercase italic">Studio / <span className="text-primary">Commenters</span></h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <AdminUserMenu />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar w-full">
            <div className="w-full max-w-5xl mx-auto space-y-8">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    {selectedUserId && (
                      <Button variant="ghost" size="icon" onClick={() => setSelectedUserId(null)} className="text-primary h-10 w-10 bg-primary/10 rounded-full hover:bg-primary/20">
                        <ArrowLeft className="h-6 w-6" />
                      </Button>
                    )}
                    <h1 className="text-2xl md:text-3xl font-headline font-bold text-white uppercase italic">
                      {selectedUserId ? <><span className="text-primary">{selectedUserName}</span>-এর অ্যাক্টিভিটি</> : <>Comment <span className="text-primary">Moderation</span></>}
                    </h1>
                  </div>
                  <p className="text-muted-foreground text-xs md:text-sm font-medium">
                    {selectedUserId ? `এই ইউজারের মোট ${userComments.length}টি কমেন্ট পাওয়া গেছে।` : "কমেন্ট করা ইউজারদের প্রোফাইল দেখুন এবং অ্যাক্টিভিটি মনিটর করুন।"}
                  </p>
                </div>

                {!selectedUserId && (
                  <div className="relative w-full max-w-md group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input 
                      type="text" 
                      placeholder="ইউজারের নাম দিয়ে খুঁজুন..." 
                      className="bg-[#141414] border-white/5 text-white pl-12 h-12 rounded-2xl focus:border-primary/50 transition-all placeholder:text-muted-foreground/50 shadow-lg"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button 
                        onClick={() => setSearch('')}
                        className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-white transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
              ) : !selectedUserId ? (
                /* Commenters Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {uniqueCommenters.length === 0 ? (
                    <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                       <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                         <Search className="h-8 w-8 text-muted-foreground opacity-20" />
                       </div>
                       <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">
                         {search ? `"${search}" নামে কোনো ইউজার পাওয়া যায়নি।` : "এখনও কোনো কমেন্ট পাওয়া যায়নি।"}
                       </p>
                    </div>
                  ) : uniqueCommenters.map((commenter) => (
                    <Card 
                      key={commenter.userId} 
                      className="bg-[#141414] border-white/5 hover:border-primary/30 hover:bg-white/[0.02] transition-all cursor-pointer group rounded-[32px] overflow-hidden shadow-xl"
                      onClick={() => {
                        setSelectedUserId(commenter.userId);
                        setSelectedUserName(commenter.userName);
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-16 w-16 border-2 border-primary/20 group-hover:border-primary transition-colors shadow-2xl">
                              <AvatarImage src={commenter.userPhoto} />
                              <AvatarFallback className="bg-white/5 text-white/50 text-xl font-bold">{commenter.userName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] font-bold h-6 w-6 flex items-center justify-center rounded-full border-2 border-[#141414]">
                              {commenter.commentCount}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-lg truncate group-hover:text-primary transition-colors">{commenter.userName}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1.5 mt-1">
                              <MessageCircle className="h-3 w-3" /> {commenter.commentCount} Comments
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* User's Specific Comments Table View */
                <Card className="bg-[#141414] border-white/5 shadow-2xl rounded-3xl overflow-hidden">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[10px] uppercase bg-black/60 text-muted-foreground border-b border-white/5">
                        <tr>
                          <th className="px-8 py-5 font-bold tracking-widest">Comment Text</th>
                          <th className="px-6 py-5 font-bold tracking-widest">Video Context</th>
                          <th className="px-6 py-5 font-bold tracking-widest text-center">Stats</th>
                          <th className="px-6 py-5 font-bold tracking-widest text-center">Status</th>
                          <th className="px-8 py-5 font-bold text-right tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {userComments.map((comment: any) => (
                          <tr key={comment.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-8 py-5 max-w-md">
                               <p className="text-xs text-white/90 leading-relaxed break-words">
                                 {comment.text}
                               </p>
                               <span className="text-[9px] text-muted-foreground mt-2 block uppercase font-bold">
                                 {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString() : 'Just now'}
                               </span>
                            </td>
                            <td className="px-6 py-5">
                              <Link 
                                href={`/watch/${comment.movieId}`} 
                                target="_blank"
                                className="flex items-center gap-2 text-[10px] font-bold text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View Movie
                              </Link>
                              <span className="text-[9px] text-muted-foreground block mt-1 uppercase">ID: {comment.movieId?.substring(0, 8)}</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="flex items-center gap-1 text-[10px] font-bold text-white">
                                  <ThumbsUp className="h-3 w-3 text-primary" /> {comment.likesCount || 0}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                                comment.status === 'flagged' 
                                  ? 'bg-destructive/10 text-destructive border-destructive/20' 
                                  : 'bg-green-500/10 text-green-500 border-green-500/20'
                              }`}>
                                {comment.status === 'flagged' ? 'Hidden' : 'Live'}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl" 
                                  onClick={() => openEditDialog(comment)}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl" 
                                  onClick={() => setCommentToDelete(comment)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-xl ${comment.status === 'flagged' ? 'text-green-500 hover:bg-green-500/10' : 'text-white/20 hover:bg-white/10'}`} onClick={() => handleFlag(comment.id, comment.status)}>
                                  <Flag className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingComment} onOpenChange={() => setEditingComment(null)}>
        <DialogContent className="bg-[#141414] border-white/10 text-white rounded-3xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-b border-white/5">
            <DialogTitle className="text-xl font-headline font-bold uppercase italic tracking-tight">Edit <span className="text-primary">Comment</span></DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">ইউজারের কমেন্ট টেক্সট মডিফাই করুন।</DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <Textarea 
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="bg-black/40 border-white/10 text-sm h-32 rounded-2xl focus:border-primary/50 resize-none custom-scrollbar"
              placeholder="কমেন্ট লিখুন..."
            />
          </div>
          <DialogFooter className="p-6 bg-white/[0.02] border-t border-white/5">
            <Button variant="ghost" onClick={() => setEditingComment(null)} className="text-white font-bold h-11 rounded-xl">বাতিল</Button>
            <Button onClick={handleUpdateComment} disabled={isSaving} className="bg-primary text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-primary/20">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "আপডেট করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <AlertDialogContent className="bg-[#141414] border-white/10 text-white rounded-3xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive font-headline font-bold uppercase italic">
              <AlertTriangle className="h-5 w-5" /> কমেন্ট ডিলিট কনফার্মেশন
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              আপনি কি নিশ্চিত যে এই কমেন্টটি ডাটাবেজ থেকে চিরতরে ডিলিট করতে চান? এই অ্যাকশনটি আর ফিরিয়ে আনা সম্ভব হবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">বাতিল</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }} 
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-xl font-bold"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              চিরতরে ডিলিট করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminGuard>
  );
}
