
'use client';

import React, { useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { MovieCard } from '@/components/movies/MovieCard'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchX, SlidersHorizontal } from 'lucide-react'
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const resultCategories = ["All", "Shorts", "Unwatched", "Watched", "Videos", "Recently uploaded", "Live"];

export default function SearchResultsPage() {
  const db = useFirestore();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search_query')?.toLowerCase() || '';

  const moviesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'movies'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: movies, loading } = useCollection<any>(moviesQuery);

  const filteredMovies = useMemo(() => {
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
          <div className="max-w-[1100px] mx-auto p-4 md:p-6 space-y-4">
            
            {/* Chips and Filter */}
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-2 py-1">
                  {resultCategories.map((cat) => (
                    <Button 
                      key={cat} 
                      variant="secondary" 
                      className="h-8 px-3 text-xs font-bold rounded-lg bg-white/5 hover:bg-white/10"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="hidden" />
              </ScrollArea>
              <Button variant="ghost" size="sm" className="h-8 gap-2 font-bold text-xs uppercase text-white/60 hover:text-white">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-6 pt-2">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-row gap-3 sm:gap-4">
                    <Skeleton className="aspect-video w-[168px] min-w-[168px] sm:w-[246px] sm:min-w-[246px] md:w-[360px] rounded-xl bg-white/5 shrink-0" />
                    <div className="flex-1 space-y-3 py-1">
                      <Skeleton className="h-6 w-[80%] bg-white/5" />
                      <Skeleton className="h-4 w-[40%] bg-white/5" />
                      <div className="flex gap-2 items-center">
                        <Skeleton className="h-6 w-6 rounded-full bg-white/5" />
                        <Skeleton className="h-4 w-[20%] bg-white/5" />
                      </div>
                      <Skeleton className="h-10 w-full bg-white/5" />
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
                      description={movie.description}
                      variant="horizontal"
                    />
                  ))}
                  
                  {filteredMovies.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                      <SearchX className="h-12 w-12 text-white/10 mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">No results found</h3>
                      <p className="text-muted-foreground text-sm text-center max-w-xs">
                        Try different keywords or check your spelling for "{searchQuery}"
                      </p>
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
