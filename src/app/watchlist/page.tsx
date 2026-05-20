
'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Clock, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function WatchlistPage() {
  return (
    <>
      <AppSidebar />
      <div className="flex flex-col min-h-screen w-full min-w-0">
        <Navbar />
        <div className="flex-1 bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-headline font-bold text-white uppercase italic">Watch <span className="text-primary">Later</span></h1>
              <p className="text-muted-foreground text-sm font-medium">
                Save movies to watch them later. Your watchlist is currently empty.
              </p>
            </div>
            <Button asChild className="bg-primary hover:bg-primary/90 font-bold px-8 rounded-full h-11 uppercase shadow-lg shadow-primary/20">
              <Link href="/">Explore Library</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
