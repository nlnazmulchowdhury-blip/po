
'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { CategoryFilter } from '@/components/movies/CategoryFilter'
import { MovieCard } from '@/components/movies/MovieCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Film, SearchX } from 'lucide-react'
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { movieFeedGridClass, movieFeedSkeletonThumbClass } from '@/lib/utils';
import {
  buildPersonalizedHomeFeed,
  filterMoviesByCategory,
  filterMoviesBySearch,
  getGuestViewedMovieIds,
  type MovieItem,
} from '@/lib/recommendations';

export default function Home() {
  const db = useFirestore();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q')?.toLowerCase() || '';
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [guestViewedIds, setGuestViewedIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    const refreshGuestHistory = () => setGuestViewedIds(getGuestViewedMovieIds());
    refreshGuestHistory();
    window.addEventListener('focus', refreshGuestHistory);
    return () => window.removeEventListener('focus', refreshGuestHistory);
  }, []);

  const moviesQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'movies'), orderBy('createdAt', 'desc'));
  }, [db]);

  const userViewsQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, 'views'), where('userId', '==', user.uid));
  }, [db, user?.uid]);

  const userLikesQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, 'likes'), where('userId', '==', user.uid));
  }, [db, user?.uid]);

  const { data: movies, loading } = useCollection<MovieItem>(moviesQuery);
  const { data: userViews } = useCollection<{ movieId: string }>(userViewsQuery);
  const { data: userLikes } = useCollection<{ movieId: string }>(userLikesQuery);

  const tasteSignals = React.useMemo(() => {
    const viewedMovieIds = user
      ? (userViews?.map((v) => v.movieId).filter(Boolean) as string[]) || []
      : guestViewedIds;
    const likedMovieIds =
      (userLikes?.map((l) => l.movieId).filter(Boolean) as string[]) || [];
    return { viewedMovieIds, likedMovieIds };
  }, [user, userViews, userLikes, guestViewedIds]);

  const feedMovies = React.useMemo(() => {
    if (!movies?.length) return [] as MovieItem[];

    if (searchQuery) {
      return filterMoviesBySearch(movies, searchQuery);
    }

    const { movies: personalized } = buildPersonalizedHomeFeed(movies, tasteSignals);
    return filterMoviesByCategory(personalized, activeCategory);
  }, [movies, tasteSignals, searchQuery, activeCategory]);

  return (
    <>
      <AppSidebar />
      <div className="flex flex-col min-h-screen w-full min-w-0">
        <Navbar />
        <div className="flex-1 bg-background pb-20 lg:pb-0">
          <CategoryFilter active={activeCategory} onChange={setActiveCategory} />

          <div className="pt-2 pb-20 md:pt-6 md:pb-8 max-w-[2400px] mx-auto w-full">
            {searchQuery ? (
              <div className="mb-6 px-3 md:px-0">
                <h2 className="text-lg font-bold text-white">
                  Search results for: <span className="text-primary">"{searchQuery}"</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Found {feedMovies.length} results</p>
              </div>
            ) : null}

            <div className={movieFeedGridClass}>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className={movieFeedSkeletonThumbClass} />
                    <div className="flex gap-3 px-1">
                      <Skeleton className="h-9 w-9 rounded-full bg-white/5 shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[90%] bg-white/5" />
                        <Skeleton className="h-3 w-[40%] bg-white/5" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {feedMovies.map((movie) => (
                    <MovieCard 
                      key={movie.id} 
                      id={movie.id}
                      title={movie.title || ''}
                      thumbnail={movie.thumbnail as string}
                      duration={movie.duration as string}
                      views={movie.views as number}
                      releaseDate={movie.releaseDate as string}
                      category={movie.category as string}
                    />
                  ))}
                  
                  {feedMovies.length === 0 && !loading && (
                    <div className="col-span-full flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                      {searchQuery || activeCategory !== 'All' ? (
                        <>
                          <SearchX className="h-12 w-12 text-white/10 mb-4" />
                          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                            এই ক্যাটাগরিতে কোনো ভিডিও নেই।
                          </p>
                        </>
                      ) : (
                        <>
                          <Film className="h-12 w-12 text-white/10 mb-4" />
                          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">এখনও কোনো কন্টেন্ট আপলোড করা হয়নি।</p>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
