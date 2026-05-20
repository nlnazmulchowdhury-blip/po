
'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { MovieCard } from '@/components/movies/MovieCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, Film, SearchX } from 'lucide-react'
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { movieFeedGridClass, movieFeedSkeletonThumbClass } from '@/lib/utils';

export default function TopRatedPage() {
  const db = useFirestore();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q')?.toLowerCase() || '';

  const topRatedQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'movies'), orderBy('createdAt', 'desc'), limit(20));
  }, [db]);

  const { data: movies, loading } = useCollection(topRatedQuery);

  const filteredMovies = React.useMemo(() => {
    if (!movies) return [];
    if (!searchQuery) return movies;
    return movies.filter((movie: any) => 
      movie.title?.toLowerCase().includes(searchQuery) ||
      movie.category?.toLowerCase().includes(searchQuery) ||
      movie.description?.toLowerCase().includes(searchQuery) ||
      (movie.tags && movie.tags.toLowerCase().includes(searchQuery))
    );
  }, [movies, searchQuery]);

  return (
    <>
      <AppSidebar />
      <div className="flex flex-col min-h-screen w-full min-w-0">
        <Navbar />
        <div className="flex-1 bg-background">
          <div className="max-w-[2400px] mx-auto">
            <div className="px-4 md:px-8 lg:px-12 pt-4 md:pt-8 space-y-6 md:space-y-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-primary">
                <Star className="h-5 w-5 fill-current" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Premium Collection</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-headline font-bold text-white uppercase italic tracking-tight">
                Top <span className="text-primary">Rated</span> Movies
              </h1>
              <p className="text-muted-foreground max-w-2xl text-sm md:text-base font-medium">
                Our community's highest-rated cinematic experiences. Curated for the ultimate streaming quality.
              </p>
            </div>

            {searchQuery && (
              <div className="mb-2">
                <h2 className="text-sm font-bold text-white">
                  Showing results for: <span className="text-primary">"{searchQuery}"</span>
                </h2>
              </div>
            )}
            </div>

            <div className={`${movieFeedGridClass} pb-20 md:pb-8`}>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className={movieFeedSkeletonThumbClass} />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[80%] bg-white/5" />
                      <Skeleton className="h-3 w-[40%] bg-white/5" />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {filteredMovies.map((movie: any) => (
                    <MovieCard 
                      key={movie.id} 
                      id={movie.id}
                      title={movie.title}
                      thumbnail={movie.thumbnail}
                      duration={movie.duration}
                      views={movie.views}
                      releaseDate={movie.releaseDate}
                      category={movie.category}
                    />
                  ))}
                  
                  {filteredMovies.length === 0 && !loading && (
                    <div className="col-span-full text-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                      {searchQuery ? (
                        <>
                          <SearchX className="h-12 w-12 text-white/10 mx-auto mb-4" />
                          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No matching rated movies found.</p>
                        </>
                      ) : (
                        <>
                          <Film className="h-12 w-12 text-white/10 mx-auto mb-4" />
                          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No rated movies found yet.</p>
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
