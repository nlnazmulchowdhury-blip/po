'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from '@/components/ui/badge'
import { useFirestore, useDoc, useCollection } from '@/firebase'
import { doc, collection, query, where } from 'firebase/firestore'
import { 
  CheckCircle2,
  Loader2,
  Calendar,
  MessageSquare,
  Activity
} from 'lucide-react'
import { useParams } from 'next/navigation'
import Link from 'next/link';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function UserProfilePage() {
  const { id } = useParams();
  const db = useFirestore();

  const userDocRef = React.useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'users', id as string);
  }, [db, id]);
  
  const { data: userData, loading: userLoading } = useDoc<any>(userDocRef);

  // Fetch user's recent comments as activity
  const commentsQuery = React.useMemo(() => {
    if (!db || !id) return null;
    return query(collection(db, 'comments'), where('userId', '==', id));
  }, [db, id]);
  
  const { data: userComments, loading: commentsLoading } = useCollection<any>(commentsQuery);

  if (userLoading) {
    return <LoadingScreen message="ইউজারের তথ্য লোড হচ্ছে..." fullScreen={true} />
  }

  if (!userData) {
    return (
      <>
        <AppSidebar />
        <div className="flex flex-col min-h-screen w-full min-w-0">
          <Navbar />
          <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
            <p className="text-muted-foreground font-bold text-lg">ইউজার খুঁজে পাওয়া যায়নি।</p>
          </div>
        </div>
      </>
    );
  }

  const displayPhoto = userData?.photoURL || `https://picsum.photos/seed/${id}/400/400`;
  const joinDate = userData?.createdAt?.toDate ? userData.createdAt.toDate().getFullYear() : '২০২৪';
  const name = userData?.name || 'Cinema Lover';
  const isPremium = userData?.isSubscribed || userData?.role === 'admin';

  return (
    <>
      <AppSidebar />
      <div className="flex flex-col min-h-screen w-full min-w-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
          
          {/* Cover Banner */}
          <div className="h-40 md:h-64 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent border-b border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/cinema1/1920/400')] opacity-20 mix-blend-overlay object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
          </div>
          
          <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-20 md:-mt-32 pb-20 relative z-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-end mb-12">
              <Avatar className="h-32 w-32 md:h-44 md:w-44 border-4 border-[#0a0a0a] shadow-2xl overflow-hidden bg-black/40">
                <AvatarImage src={displayPhoto} className="object-cover" />
                <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary uppercase">{name[0] || 'U'}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left space-y-3 pb-2">
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <h1 className="text-3xl md:text-5xl font-headline font-bold text-white uppercase tracking-tight leading-none">{name}</h1>
                  {isPremium && (
                    <Badge className="bg-primary/20 text-primary border-primary/20 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest mt-2 md:mt-0 shadow-lg shadow-primary/10">
                      Premium Member
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs md:text-sm font-medium flex items-center justify-center md:justify-start gap-2">
                  <Calendar className="h-4 w-4" /> সদস্য হয়েছেন {joinDate} সাল থেকে
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - About */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-[#141414] border-white/5 shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-white/[0.02] border-b border-white/5 p-5">
                    <CardTitle className="font-headline font-bold text-lg text-white uppercase tracking-tight flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" /> সম্পর্কে
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <p className="text-gray-400 text-sm leading-relaxed italic">
                      {userData.bio || "সিনেমা প্রেমী এবং প্রযুক্তি উৎসাহী। এই ইউজার এখনও কোনো বায়ো যুক্ত করেননি।"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#141414] border-white/5 shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-white/[0.02] border-b border-white/5 p-5">
                    <CardTitle className="font-headline font-bold text-lg text-white uppercase tracking-tight flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" /> পরিসংখ্যান
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">মোট মন্তব্য</span>
                      <span className="text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-full">
                        {commentsLoading ? '...' : (userComments?.length || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Activity/Comments */}
              <div className="lg:col-span-2">
                <Card className="bg-[#141414] border-white/5 shadow-2xl rounded-3xl overflow-hidden min-h-[400px]">
                  <CardHeader className="bg-white/[0.02] border-b border-white/5 p-6">
                    <CardTitle className="font-headline font-bold text-xl text-white uppercase tracking-tight flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" /> সাম্প্রতিক কার্যকলাপ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {commentsLoading ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                      </div>
                    ) : userComments && userComments.length > 0 ? (
                      <div className="space-y-6">
                        {userComments.slice(0, 5).map((comment: any) => (
                          <div key={comment.id} className="group relative pl-4 border-l-2 border-white/10 hover:border-primary transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-muted-foreground font-bold">
                                {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : 'Just now'}
                              </span>
                              {comment.movieId && (
                                <Link href={`/watch/${comment.movieId}`} className="text-[10px] text-primary hover:underline font-bold">
                                  ভিডিও দেখুন
                                </Link>
                              )}
                            </div>
                            <p className="text-sm text-white/90 line-clamp-2">"{comment.text}"</p>
                          </div>
                        ))}
                        {userComments.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center pt-4 font-bold">আরও {userComments.length - 5} টি মন্তব্য করেছেন</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageSquare className="h-12 w-12 text-white/5 mb-3" />
                        <p className="text-muted-foreground text-sm font-medium">এই ইউজার এখনও কোনো মন্তব্য করেননি।</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
