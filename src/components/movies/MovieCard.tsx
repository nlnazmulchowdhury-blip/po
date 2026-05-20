
"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MoreVertical, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MovieCardProps {
  id: string
  title: string
  thumbnail: string
  duration: string
  views: string | number
  releaseDate: string
  category: string
  description?: string
  variant?: 'vertical' | 'horizontal'
}

export function MovieCard({ 
  id, 
  title, 
  thumbnail, 
  duration, 
  views, 
  releaseDate, 
  category,
  description,
  variant = 'vertical'
}: MovieCardProps) {
  const isValidUrl = (url: string) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  };

  const safeThumbnail = isValidUrl(thumbnail) ? thumbnail : 'https://picsum.photos/seed/cinema1/600/400';
  
  const formattedViews = typeof views === 'number' 
    ? views.toLocaleString() 
    : (parseInt(views as string) || 0).toLocaleString();

  if (variant === 'horizontal') {
    return (
      <div className="group flex flex-row gap-3 sm:gap-4 items-start w-full max-w-full relative animate-in fade-in duration-300">
        <Link href={`/watch/${id}`} className="relative aspect-video w-[168px] min-w-[168px] sm:w-[246px] sm:min-w-[246px] md:w-[360px] md:min-w-[360px] lg:w-[400px] lg:min-w-[400px] flex-shrink-0 rounded-xl overflow-hidden block border border-white/5">
          <Image 
            src={safeThumbnail} 
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized={true}
          />
          <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white tracking-widest">
            {duration}
          </div>
        </Link>
        <div className="flex-1 min-w-0 pr-0 md:pr-10">
          <Link href={`/watch/${id}`} className="block">
            <h3 className="font-bold text-sm sm:text-base md:text-xl line-clamp-2 leading-tight text-white group-hover:text-primary transition-colors break-words">
              {title}
            </h3>
          </Link>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1 mb-3">
            <span>{formattedViews} views</span>
            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50 shrink-0" />
            <span className="truncate">{releaseDate}</span>
          </div>
          
          <div className="flex items-center gap-2 mb-3 cursor-pointer group/channel">
            <Avatar className="h-6 w-6 border border-white/5">
              <AvatarImage src={`https://picsum.photos/seed/${id}/50/50`} />
              <AvatarFallback>CS</AvatarFallback>
            </Avatar>
            <span className="text-[12px] font-medium text-muted-foreground group-hover/channel:text-white transition-colors flex items-center gap-1">
              CinemaStream Official
              <CheckCircle2 className="h-3 w-3 fill-muted-foreground/20" />
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed max-w-2xl break-words">
            {description || "Explore this amazing cinematic experience on CinemaStream. Watch in high quality and enjoy the story."}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-white shrink-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group flex flex-col gap-2.5 w-full min-w-0 max-w-full relative animate-in fade-in duration-300">
      <Link href={`/watch/${id}`} className="relative aspect-video w-full rounded-xl overflow-hidden cursor-pointer block border border-white/5 bg-black/20">
        <Image 
          src={safeThumbnail} 
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized={true}
        />
        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white tracking-wider">
          {duration}
        </div>
      </Link>
      
      <div className="flex items-start gap-3 px-0.5">
        <Avatar className="h-10 w-10 md:h-9 md:w-9 border border-white/5 shrink-0">
          <AvatarImage src={`https://picsum.photos/seed/${id}/50/50`} />
          <AvatarFallback>CS</AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex justify-between items-start gap-1">
            <Link href={`/watch/${id}`} className="block flex-1 min-w-0">
              <h3 className="font-bold text-[15px] leading-snug md:text-base line-clamp-2 text-white group-hover:text-primary transition-colors break-words">
                {title}
              </h3>
            </Link>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-white">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center flex-wrap gap-x-1 gap-y-0.5 text-xs md:text-[11px] text-muted-foreground mt-0.5 md:mt-1">
            <span className="hover:text-white cursor-pointer truncate">CinemaStream Official</span>
            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50 shrink-0" />
            <span className="truncate">{formattedViews} views</span>
            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50 shrink-0" />
            <span className="truncate">{releaseDate}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
