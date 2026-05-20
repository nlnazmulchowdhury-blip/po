'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { VideoPlayer } from '@/components/movies/VideoPlayer'
import { MovieCard } from '@/components/movies/MovieCard'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from '@/components/ui/badge'
import { 
  ThumbsUp, 
  ThumbsDown,
  Share2, 
  Download, 
  Loader2, 
  CheckCircle2, 
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Play,
  MessageSquare,
  Bookmark,
  Flag,
  Scissors,
  CornerDownRight,
  Monitor,
  Mail,
  Lock,
  Chrome,
  AlertCircle,
  Video,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useFirestore, useDoc, useCollection, useUser, useAuth } from '@/firebase'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { 
  doc, 
  collection, 
  query, 
  updateDoc, 
  increment, 
  addDoc, 
  serverTimestamp, 
  where,
  setDoc,
  getDoc,
  limit,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import Image from 'next/image';
import Link from 'next/link';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const sidebarFilters = ["All", "Action", "Nature", "Related", "Drama", "Sci-Fi", "Comedy", "Thriller", "Horror", "Animation", "Documentary", "Recently Uploaded"];

export default function WatchPage() {
  const { id } = useParams()
  const db = useFirestore()
  const { user } = useUser()
  const { auth } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  // Login Modal States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  
  const [newComment, setNewComment] = useState('')
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false)
  const [expandedRepliesId, setExpandedRepliesId] = useState<string | null>(null)
  const [optimisticCommentLikes, setOptimisticCommentLikes] = useState<Record<string, { isLiked: boolean, count: number }>>({})
  const [activeFilter, setActiveFilter] = useState("All");
  const [subscribersCount, setSubscribersCount] = useState(0);

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    setLoginLoading(true);
    setLoginError(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const loggedUser = userCredential.user;

      // Check verification status in Firestore
      const userDocRef = doc(db, 'users', loggedUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (!userData.emailVerified) {
          await signOut(auth);
          throw new Error('আপনার ইমেইল ভেরিফাই করা হয়নি। দয়া করে আপনার ইনবক্স চেক করুন।');
        }
      }

      toast({ title: 'Welcome Back!', description: 'লগইন সফল হয়েছে।' });
      setIsLoginModalOpen(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      let errorMessage = err.message || 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।';
      if (err.code === 'auth/invalid-credential') {
        errorMessage = 'ভুল ইমেইল বা পাসওয়ার্ড।';
      }
      setLoginError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'লগইন ব্যর্থ',
        description: errorMessage,
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleInlineGoogleLogin = async () => {
    if (!auth || !db) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;

      const userDocRef = doc(db, 'users', loggedUser.uid);
      await setDoc(userDocRef, {
        uid: loggedUser.uid,
        name: loggedUser.displayName || 'Cinema Lover',
        email: loggedUser.email,
        role: 'user',
        emailVerified: true,
        createdAt: serverTimestamp(),
      }, { merge: true });

      toast({ title: 'Welcome!', description: 'গুগল দিয়ে লগইন সফল হয়েছে।' });
      setIsLoginModalOpen(false);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Google Login Failed',
        description: 'গুগল লগইন ব্যর্থ হয়েছে।',
      });
    }
  };
  
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'users'), where('isSubscribed', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubscribersCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [db]);

  const displaySubscribersCount = 124560 + subscribersCount;
  const displaySubscribers = displaySubscribersCount.toLocaleString() + " subscribers";

  const scrollRef = useRef<HTMLDivElement>(null);
  const viewProcessed = useRef<string | null>(null);

  const movieRef = useMemo(() => {
    if (!db || !id) return null
    return doc(db, 'movies', id as string)
  }, [db, id])

  const { data: movie, loading } = useDoc<any>(movieRef)

  // User Movie Like State
  const movieLikeRef = useMemo(() => {
    if (!db || !id || !user) return null;
    return doc(db, 'likes', `${user.uid}_${id}`);
  }, [db, id, user]);
  const { data: movieLikeData } = useDoc<any>(movieLikeRef);

  useEffect(() => {
    setIsLiked(!!movieLikeData);
  }, [movieLikeData]);

  // Comments Query
  const commentsQuery = useMemo(() => {
    if (!db || !id) return null
    return query(
      collection(db, 'comments'),
      where('movieId', '==', id as string)
    )
  }, [db, id])
  const { data: rawComments, loading: commentsLoading } = useCollection<any>(commentsQuery)

  // Fetch all comment likes for the current user
  const userCommentLikesQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'commentLikes'),
      where('userId', '==', user.uid)
    );
  }, [db, user]);
  const { data: userCommentLikes } = useCollection<any>(userCommentLikesQuery);

  const userLikedCommentIds = useMemo(() => {
    if (!userCommentLikes) return new Set<string>();
    return new Set(userCommentLikes.map(l => l.commentId));
  }, [userCommentLikes]);

  // Recursive Comment Tree Builder
  const comments = useMemo(() => {
    if (!rawComments) return [];
    
    const sorted = [...rawComments].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    const buildTree = (parentId: string | null): any[] => {
      return sorted
        .filter(c => c.parentId === parentId)
        .map(c => ({
          ...c,
          replies: buildTree(c.id).reverse() // Reverse to show oldest first in threads
        }));
    };

    return buildTree(null);
  }, [rawComments]);

  const recommendedMoviesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'movies'), limit(20));
  }, [db]);
  const { data: recommendedMovies, loading: recommendedLoading } = useCollection<any>(recommendedMoviesQuery);

  useEffect(() => {
    if (!db || !id || !movie) return;

    // If we already processed this movie ID in this component instance, skip
    if (viewProcessed.current === id) return;

    const recordView = async () => {
      viewProcessed.current = id as string;
      const storageKey = `viewed_movie_${id}`;

      // Check browser storage to prevent multiple views in the same session/cache
      if (typeof window !== 'undefined') {
        if (localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey)) {
          return;
        }
      }

      try {
        // If user is logged in, check database to verify if they have already viewed it
        if (user) {
          const viewId = `${user.uid}_${id}`;
          const viewDocRef = doc(db, 'views', viewId);
          const viewDocSnap = await getDoc(viewDocRef);

          if (viewDocSnap.exists()) {
            if (typeof window !== 'undefined') {
              localStorage.setItem(storageKey, 'true');
            }
            return;
          }

          // Save view record for this user and video
          await setDoc(viewDocRef, {
            userId: user.uid,
            movieId: id as string,
            createdAt: serverTimestamp()
          });
        }

        // Increment the view counter
        await updateDoc(doc(db, 'movies', id as string), {
          views: increment(1)
        });

        // Store view confirmation in browser storage
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, 'true');
          sessionStorage.setItem(storageKey, 'true');
        }
      } catch (err) {
        console.error("Error recording view:", err);
        // Reset local flag on error to allow retry
        if (viewProcessed.current === id) {
          viewProcessed.current = null;
        }
      }
    };

    recordView();
  }, [db, id, movie, user]);

  // Separate effect to handle checking subscriber state
  useEffect(() => {
    if (!db || !user) return;

    const checkStates = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsSubscribed(userData.isSubscribed || false);
        }
      } catch (err) {
        console.error("Error checking subscription state:", err);
      }
    };
    checkStates();
  }, [db, user]);

  const handleMovieLike = async () => {
    if (!user) {
      toast({ title: "লগইন প্রয়োজন", description: "লাইক দিতে দয়া করে লগইন করুন।", variant: "destructive" });
      setIsLoginModalOpen(true);
      return;
    }

    if (!db || !id) return;

    const likeId = `${user.uid}_${id}`;
    const specificLikeRef = doc(db, 'likes', likeId);
    const movieDocRef = doc(db, 'movies', id as string);

    try {
      if (isLiked) {
        await deleteDoc(specificLikeRef);
        await updateDoc(movieDocRef, { likesCount: increment(-1) });
        setIsLiked(false);
      } else {
        await setDoc(specificLikeRef, {
          userId: user.uid,
          movieId: id as string,
          createdAt: serverTimestamp()
        });
        await updateDoc(movieDocRef, { likesCount: increment(1) });
        setIsLiked(true);
      }
    } catch (err: any) {
      console.error("Movie like error:", err);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!user) {
      toast({ title: "লগইন প্রয়োজন", description: "লাইক দিতে দয়া করে লগইন করুন।", variant: "destructive" });
      setIsLoginModalOpen(true);
      return;
    }
    if (!db) return;

    const localState = optimisticCommentLikes[commentId];
    const isCurrentlyLiked = localState !== undefined ? localState.isLiked : userLikedCommentIds.has(commentId);
    const baseCount = rawComments?.find(c => c.id === commentId)?.likesCount || 0;
    const currentCount = localState !== undefined ? localState.count : baseCount;

    // Optimistic Update
    setOptimisticCommentLikes(prev => ({
      ...prev,
      [commentId]: {
        isLiked: !isCurrentlyLiked,
        count: isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1
      }
    }));

    const likeId = `${user.uid}_${commentId}`;
    const likeRef = doc(db, 'commentLikes', likeId);
    const commentRef = doc(db, 'comments', commentId);

    try {
      if (isCurrentlyLiked) {
        await deleteDoc(likeRef);
        await updateDoc(commentRef, { likesCount: increment(-1) });
      } else {
        await setDoc(likeRef, {
          userId: user.uid,
          commentId: commentId,
          createdAt: serverTimestamp()
        });
        await updateDoc(commentRef, { likesCount: increment(1) });
      }
    } catch (err) {
      console.error("Comment like error:", err);
      // Revert optimistic update on failure
      setOptimisticCommentLikes(prev => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
    }
  };

  const handleComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "লগইন প্রয়োজন", description: "কমেন্ট করতে দয়া করে লগইন করুন।", variant: "destructive" });
      setIsLoginModalOpen(true);
      return;
    }

    const text = parentId ? replyText[parentId] : newComment;
    if (!text?.trim() || !db) return;

    setIsSubmittingComment(true);
    try {
      const commentRef = await addDoc(collection(db, 'comments'), {
        movieId: id as string,
        userId: user.uid,
        userName: user.displayName || 'Cinema Lover',
        userPhoto: user.photoURL || '',
        text: text,
        parentId: parentId || null,
        likesCount: 0,
        createdAt: serverTimestamp(),
      });

      if (parentId) {
        const parentComment = rawComments?.find(c => c.id === parentId);
        if (parentComment && parentComment.userId !== user.uid) {
          await addDoc(collection(db, 'notifications'), {
            recipientId: parentComment.userId,
            senderName: user.displayName || 'একজন ইউজার',
            senderPhoto: user.photoURL || '',
            message: `আপনার কমেন্টে রিপ্লাই দিয়েছেন: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
            link: `/watch/${id}`,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }

      if (parentId) {
        setReplyText(prev => ({ ...prev, [parentId]: '' }));
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
      
      toast({ title: "সফল", description: parentId ? "আপনার রিপ্লাই যোগ করা হয়েছে।" : "আপনার কমেন্টটি যোগ করা হয়েছে।" });
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: "কমেন্ট পোস্ট করা সম্ভব হয়নি।", variant: "destructive" });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDownload = async (resolution: string) => {
    if (!movie?.videoUrl) return;

    const isYouTube = movie.videoUrl.includes('youtube.com') || movie.videoUrl.includes('youtu.be');
    if (isYouTube) {
      toast({
        variant: "destructive",
        title: "ডাউনলোড সীমাবদ্ধতা",
        description: "ইউটিউব ভিডিও সরাসরি ডাউনলোড করা সম্ভব নয়।",
      });
      return;
    }

    toast({
      title: "ডাউনলোড শুরু হচ্ছে",
      description: `${resolution} রেজুলেশনে ভিডিওটি প্রসেস করা হচ্ছে...`,
    });

    try {
      let downloadUrl = movie.videoUrl;
      if (downloadUrl.includes('cloudinary.com')) {
        const resolutionMap: Record<string, string> = {
          '360p': 'w_640,h_360,c_limit',
          '720p': 'w_1280,h_720,c_limit',
          '1080p': 'w_1920,h_1080,c_limit'
        };
        const transformation = resolutionMap[resolution] || '';
        const finalTransform = transformation ? `fl_attachment,${transformation}` : 'fl_attachment';
        if (downloadUrl.includes('/upload/')) {
          downloadUrl = downloadUrl.replace('/upload/', `/upload/${finalTransform}/`);
        }
      }
      window.open(downloadUrl, '_blank');
      toast({ title: "সফল", description: `ভিডিওটি ${resolution}-এ ডাউনলোড হচ্ছে।` });
    } catch (error) {
      toast({ variant: "destructive", title: "ত্রুটি", description: "ভিডিওটি ডাউনলোড করা সম্ভব হয়নি।" });
    }
  };

  const formattedLikes = movie?.likesCount?.toLocaleString() || '0';
  const formattedViews = movie?.views?.toLocaleString() || '0';

  // Component to render individual comment and its nested replies
  const CommentItem = ({ comment, isReply = false }: { comment: any, isReply?: boolean }) => {
    const localState = optimisticCommentLikes[comment.id];
    const isLiked = localState !== undefined ? localState.isLiked : userLikedCommentIds.has(comment.id);
    const likesCount = localState !== undefined ? localState.count : (comment.likesCount || 0);

    return (
    <div className={cn("space-y-4", isReply && "pl-4 md:pl-10 border-l border-white/10")}>
      <div className="flex gap-4 group">
        <Link href={`/user/${comment.userId}`} className="shrink-0">
          <Avatar className={cn("border border-white/10 shrink-0 hover:border-primary transition-colors", isReply ? "h-8 w-8" : "h-10 w-10")}>
            <AvatarImage src={comment.userPhoto || undefined} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/user/${comment.userId}`} className="hover:underline decoration-primary">
              <span className={cn("font-bold text-white transition-colors hover:text-primary", isReply ? "text-[11px]" : "text-xs")}>
                @{comment.userName?.replace(/\s+/g, '').toLowerCase() || 'user'}
              </span>
            </Link>
            <span className="text-[10px] text-muted-foreground">
              {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : 'Just now'}
            </span>
          </div>
          <p className={cn("text-white/90 break-words", isReply ? "text-xs" : "text-sm")}>
            {comment.text}
          </p>
          <div className="flex items-center gap-4 pt-1">
            <button 
              onClick={() => handleCommentLike(comment.id)}
              className={cn(
                "flex items-center gap-1 transition-colors",
                isLiked ? "text-primary" : "text-white/60 hover:text-white"
              )}
            >
              <ThumbsUp className={cn("h-3 w-3", isLiked && "fill-current")} /> 
              <span className="text-[10px] font-bold">{likesCount}</span>
            </button>
            <button className="text-white/60 hover:text-white transition-colors"><ThumbsDown className="h-3 w-3" /></button>
            {user?.uid !== comment.userId && (
              <button 
                onClick={() => {
                  if (!user) {
                    setIsLoginModalOpen(true);
                    return;
                  }
                  setReplyingTo(replyingTo === comment.id ? null : comment.id);
                }}
                className="text-[10px] font-bold text-white/80 hover:bg-white/10 px-3 py-1 rounded-full transition-colors"
              >
                Reply
              </button>
            )}
          </div>

          {replyingTo === comment.id && (
            <form onSubmit={(e) => handleComment(e, comment.id)} className="mt-4 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <Avatar className="h-8 w-8 border border-white/5 shrink-0">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <input
                  placeholder="রিপ্লাই লিখুন..."
                  className="w-full bg-transparent border-b border-white/20 pb-1 focus:outline-none focus:border-primary text-xs text-white"
                  value={replyText[comment.id] || ''}
                  onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" className="h-7 text-[10px] font-bold text-white" onClick={() => setReplyingTo(null)}>Cancel</Button>
                  <Button type="submit" disabled={!replyText[comment.id]?.trim() || isSubmittingComment} className="bg-primary hover:bg-primary/90 h-7 px-4 rounded-full text-white font-bold text-[10px]">Reply</Button>
                </div>
              </div>
            </form>
          )}

          {comment.replies?.length > 0 && (
            <div className="pt-2">
              <button 
                onClick={() => setExpandedRepliesId(expandedRepliesId === comment.id ? null : comment.id)}
                className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-primary/10"
              >
                {expandedRepliesId === comment.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expandedRepliesId === comment.id ? 'রিপ্লাইগুলো লুকান' : `${comment.replies.length}টি রিপ্লাই দেখুন`}
              </button>
            </div>
          )}

          {comment.replies?.length > 0 && expandedRepliesId === comment.id && (
            <div className="mt-4 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              {comment.replies.map((reply: any) => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  };

  return (
    <>
      {loading && <LoadingScreen message="ভিডিও লোড হচ্ছে..." fullScreen={true} />}
      <AppSidebar />
      <div className="flex flex-col min-h-screen w-full min-w-0 bg-[#050505]">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-[1700px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 p-4 md:p-6 pb-20">
            
            <div className="md:col-span-8 space-y-4 min-w-0">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xl border border-white/5">
                {!loading && <VideoPlayer src={movie?.videoUrl} title={movie?.title} />}
              </div>

              <div className="space-y-4 min-w-0">
                {movie?.tags && (
                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs font-bold text-primary tracking-wide">
                    {movie.tags.split(' ').map((tag: string, idx: number) => (
                      <span 
                        key={idx} 
                        onClick={() => router.push(`/results?search_query=${encodeURIComponent(tag)}`)}
                        className="cursor-pointer hover:underline hover:text-primary/80 transition-all"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight break-words line-clamp-3 mt-1">
                  {movie?.title}
                </h1>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 shrink-0">
                    <Avatar className="h-10 w-10 border border-white/5 shrink-0">
                      <AvatarImage src={`https://picsum.photos/seed/cinema1/100/100`} />
                      <AvatarFallback>CS</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-bold text-white text-sm flex items-center gap-1 truncate">
                        CinemaStream Official
                        <CheckCircle2 className="h-3 w-3 text-muted-foreground fill-muted-foreground/20 shrink-0" />
                      </h3>
                      <p className="text-[11px] text-muted-foreground">{displaySubscribers}</p>
                    </div>
                    <Button 
                      onClick={() => {
                        if (!user) {
                          setIsLoginModalOpen(true);
                          return;
                        }
                        const newSub = !isSubscribed;
                        setIsSubscribed(newSub);
                        setDoc(doc(db!, 'users', user.uid), { isSubscribed: newSub }, { merge: true });
                      }}
                      className={cn(
                        "ml-2 md:ml-4 h-9 px-5 font-bold text-xs rounded-full transition-all duration-300",
                        isSubscribed 
                          ? "bg-white/10 text-white hover:bg-white/20" 
                          : "bg-white text-black hover:bg-white/90"
                      )}
                    >
                      {isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                    <div className="flex items-center bg-white/10 rounded-full h-9 p-0.5 shrink-0">
                      <Button 
                        onClick={handleMovieLike} 
                        variant="ghost" 
                        className={cn(
                          "h-8 px-4 gap-2 rounded-l-full hover:bg-white/10 transition-all border-r border-white/10",
                          isLiked ? "text-primary" : "text-white/80"
                        )}
                      >
                        <ThumbsUp className={cn("h-4 w-4", isLiked && "fill-current")} />
                        <span className="text-[11px] font-bold">{formattedLikes}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="h-8 px-3 rounded-r-full hover:bg-white/10 text-white/80"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button variant="secondary" className="h-9 px-4 gap-2 rounded-full bg-white/10 text-white hover:bg-white/20 font-bold text-xs shrink-0">
                      <Share2 className="h-4 w-4" /> Share
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="h-9 px-4 gap-2 rounded-full bg-white/10 text-white hover:bg-white/20 font-bold text-xs shrink-0 md:flex hidden">
                          <Download className="h-4 w-4" /> Download
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-[#1a1a1a] border-white/10 text-white rounded-xl p-2 shadow-2xl">
                        <div className="px-2 py-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest border-b border-white/5 mb-1">Select Resolution</div>
                        <DropdownMenuItem onClick={() => handleDownload('1080p')} className="gap-2 cursor-pointer hover:bg-white/10 rounded-lg py-2.5">
                          <Monitor className="h-4 w-4 text-primary" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">1080p (Full HD)</span>
                            <span className="text-[9px] text-muted-foreground">Highest Quality</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload('720p')} className="gap-2 cursor-pointer hover:bg-white/10 rounded-lg py-2.5">
                          <Monitor className="h-4 w-4 text-green-500" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">720p (HD)</span>
                            <span className="text-[9px] text-muted-foreground">Standard HD</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload('360p')} className="gap-2 cursor-pointer hover:bg-white/10 rounded-lg py-2.5">
                          <Monitor className="h-4 w-4 text-blue-500" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">360p (SD)</span>
                            <span className="text-[9px] text-muted-foreground">Data Saver</span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="secondary" className="h-9 px-4 gap-2 rounded-full bg-white/10 text-white hover:bg-white/20 font-bold text-xs shrink-0 lg:flex hidden">
                      <Bookmark className="h-4 w-4" /> Save
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-[#1a1a1a] border-white/10 text-white rounded-xl">
                        <DropdownMenuItem className="gap-2 md:hidden">
                          <Download className="h-4 w-4" /> Download Options
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 lg:hidden">
                          <Bookmark className="h-4 w-4" /> Save
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Scissors className="h-4 w-4" /> Clip
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                          <Flag className="h-4 w-4" /> Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              <div 
                className="bg-white/10 rounded-xl p-3 cursor-pointer hover:bg-white/[0.15] transition-colors mt-4"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                  <span>{formattedViews} views</span>
                  <span>•</span>
                  <span>{movie?.releaseDate}</span>
                </div>
                <div className={cn(
                  "text-sm text-white/90 leading-relaxed overflow-hidden break-all",
                  !isDescriptionExpanded && "line-clamp-2"
                )}>
                  {movie?.description}
                </div>
                <button className="text-xs font-bold text-white mt-1">
                  {isDescriptionExpanded ? 'Show less' : '...more'}
                </button>
              </div>

              <div className="bg-white/10 rounded-xl p-4 mt-4 transition-colors">
                <div 
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                >
                  <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Reviews <span className="text-muted-foreground ml-1">{commentsLoading ? '...' : (rawComments?.length || 0)}</span>
                  </h3>
                  <ChevronRight className={cn("h-4 w-4 text-white/50 group-hover:text-white transition-all duration-300", isCommentsExpanded && "rotate-90")} />
                </div>

                {isCommentsExpanded && (
                  <div className="space-y-6 pt-5 mt-5 border-t border-white/5 animate-in fade-in zoom-in-95 duration-300">
                    <form onSubmit={(e) => handleComment(e)} className="flex gap-3 md:gap-4">
                      <Avatar className="h-8 w-8 md:h-10 md:w-10 border border-white/5 shrink-0">
                        <AvatarImage src={user?.photoURL || undefined} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2 group">
                        <input
                          placeholder="মুভিটি কেমন লাগলো? আপনার মতামত জানান..."
                          className="w-full bg-transparent border-b border-white/20 pb-2 focus:outline-none focus:border-primary text-xs md:text-sm text-white transition-colors"
                          value={newComment}
                          onChange={(e) => {
                            if (!user) {
                              setIsLoginModalOpen(true);
                              return;
                            }
                            setNewComment(e.target.value);
                          }}
                          onFocus={() => {
                            if (!user) {
                              setIsLoginModalOpen(true);
                            }
                          }}
                        />
                        <div className={cn("flex justify-end gap-2", !newComment.trim() && "hidden")}>
                          <Button type="button" variant="ghost" className="h-8 text-[10px] md:text-xs font-bold text-white hover:bg-white/5 rounded-full" onClick={() => setNewComment('')}>বাতিল</Button>
                          <Button type="submit" disabled={isSubmittingComment} className="bg-primary hover:bg-primary/90 h-8 px-5 rounded-full text-white font-bold text-[10px] md:text-xs shadow-lg shadow-primary/20">কমেন্ট করুন</Button>
                        </div>
                      </div>
                    </form>

                    <div className="space-y-8 pb-4">
                      {commentsLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary/40" /></div>
                      ) : comments.map((comment: any) => (
                        <CommentItem key={comment.id} comment={comment} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-4 space-y-4 min-w-0">
              <div className="relative flex items-center group">
                <div 
                  ref={scrollRef}
                  className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 pr-12 scroll-smooth"
                >
                  {sidebarFilters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0",
                        activeFilter === filter 
                          ? "bg-white text-black" 
                          : "bg-white/10 text-white hover:bg-white/20"
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <div className="absolute right-0 top-0 bottom-1 w-14 bg-gradient-to-l from-[#050505] via-[#050505]/80 to-transparent flex items-center justify-end pointer-events-none pr-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 pointer-events-auto border border-white/5 shadow-lg"
                    onClick={() => {
                      if (scrollRef.current) scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                    }}
                  >
                    <ChevronRight className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-x-3 gap-y-3 sm:gap-x-4 md:gap-x-0 pt-4">
                {recommendedLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <div className="aspect-video w-full bg-white/5 rounded-xl animate-pulse" />
                      <div className="flex gap-3 px-1">
                        <div className="h-9 w-9 rounded-full bg-white/5 shrink-0 animate-pulse" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-white/5 rounded-full w-[90%] animate-pulse" />
                          <div className="h-3 bg-white/5 rounded-full w-[40%] animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : recommendedMovies?.filter(m => m.id !== id).map((m: any) => (
                  <MovieCard 
                    key={m.id} 
                    id={m.id}
                    title={m.title}
                    thumbnail={m.thumbnail}
                    duration={m.duration}
                    views={m.views}
                    releaseDate={m.releaseDate}
                    category={m.category}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="max-w-[400px] border-white/10 bg-[#050505]/95 backdrop-blur-2xl text-white shadow-2xl rounded-2xl p-6">
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-3 pb-2">
            <div className="bg-primary p-2.5 rounded-2xl shadow-lg shadow-primary/20">
              <Video className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="font-headline font-bold text-2xl tracking-tight text-white">
              Cinema<span className="text-primary">Stream</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              লাইক, কমেন্ট ও সাবস্ক্রাইব করতে দয়া করে লগইন করুন
            </DialogDescription>
          </DialogHeader>

          {loginError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleInlineLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="modal-email" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ইমেইল</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="modal-email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-10 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/60 transition-colors focus-visible:ring-primary"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setLoginError(null); }}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="modal-password" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">পাসওয়ার্ড</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="modal-password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-10 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/60 transition-colors focus-visible:ring-primary"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setLoginError(null); }}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full font-bold h-10 rounded-xl shadow-lg shadow-primary/20 text-white mt-2" disabled={loginLoading}>
              {loginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'লগইন করুন'}
            </Button>
          </form>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-[#050505]/95 px-3 text-muted-foreground">বা</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold transition-all" 
            onClick={handleInlineGoogleLogin}
            disabled={loginLoading}
          >
            <Chrome className="mr-2 h-4 w-4 text-primary" /> Google দিয়ে প্রবেশ
          </Button>

          <div className="flex flex-col items-center justify-center space-y-2 border-t border-white/10 pt-4 mt-2 text-xs text-muted-foreground">
            <p>
              অ্যাকাউন্ট নেই?{' '}
              <Link href="/signup" className="text-primary font-bold hover:underline" onClick={() => setIsLoginModalOpen(false)}>
                নতুন অ্যাকাউন্ট তৈরি করুন
              </Link>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
