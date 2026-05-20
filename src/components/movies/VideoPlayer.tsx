
"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings, 
  X,
  ExternalLink
} from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Script from 'next/script'

// ─── Ad Configuration ────────────────────────────────────────────────────────
// Replace these with your actual ad details once you have the ad account.
const AD_CONFIG = {
  enabled: true,
  skipAfterSeconds: 5,       // User can skip after 5 seconds
  adDurationSeconds: 15,     // Full ad duration
  // Placeholder ad — replace with real ad content when account is ready
  adImageUrl: 'https://picsum.photos/seed/cinemad/1280/720',
  adTitle: 'CinemaStream Premium',
  adDescription: 'সীমাহীন বিনোদন উপভোগ করুন — বিজ্ঞাপন ছাড়া!',
  adCtaText: 'আরো জানুন',
  adCtaUrl: 'https://cinemastreambd.com/premium',
  adClientId: '',   // e.g. "ca-pub-XXXXXXXXXXXXXXXX"  — set when AdSense is ready
  adSlotId: '',     // e.g. "1234567890"               — set when AdSense is ready
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface VideoPlayerProps {
  src?: string;
  title?: string;
  movieId?: string;
  onAdImpression?: (movieId: string) => void;
}

export function VideoPlayer({ src, title, movieId, onAdImpression }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [volume, setVolume]         = useState(80)
  const [isMuted, setIsMuted]       = useState(false)
  const [currentTime, setCurrentTime] = useState("0:00")
  const [duration, setDuration]     = useState("0:00")

  // Ad state
  const [showAd, setShowAd]               = useState(false)
  const [adCountdown, setAdCountdown]     = useState(AD_CONFIG.adDurationSeconds)
  const [canSkip, setCanSkip]             = useState(false)
  const [adShownThisSession, setAdShownThisSession] = useState(false)
  const adTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ── YouTube helper ──────────────────────────────────────────────────────
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const youtubeId = src ? getYouTubeId(src) : null;

  // ── Video event listeners ───────────────────────────────────────────────
  useEffect(() => {
    if (youtubeId || !videoRef.current) return
    const video = videoRef.current

    const updateProgress = () => {
      const p = (video.currentTime / video.duration) * 100
      setProgress(p)
      setCurrentTime(formatTime(video.currentTime))
    }
    const setVideoDuration = () => setDuration(formatTime(video.duration))

    video.addEventListener('timeupdate', updateProgress)
    video.addEventListener('loadedmetadata', setVideoDuration)
    return () => {
      video.removeEventListener('timeupdate', updateProgress)
      video.removeEventListener('loadedmetadata', setVideoDuration)
    }
  }, [youtubeId])

  // ── Ad countdown timer ──────────────────────────────────────────────────
  const startAdTimer = useCallback(() => {
    setAdCountdown(AD_CONFIG.adDurationSeconds)
    setCanSkip(false)

    let elapsed = 0
    adTimerRef.current = setInterval(() => {
      elapsed++
      setAdCountdown(prev => Math.max(0, prev - 1))

      if (elapsed >= AD_CONFIG.skipAfterSeconds) {
        setCanSkip(true)
      }
      if (elapsed >= AD_CONFIG.adDurationSeconds) {
        dismissAd()
      }
    }, 1000)
  }, [])

  const dismissAd = useCallback(() => {
    if (adTimerRef.current) clearInterval(adTimerRef.current)
    setShowAd(false)
    // Resume video after ad
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (adTimerRef.current) clearInterval(adTimerRef.current) }
  }, [])

  // ── Controls ────────────────────────────────────────────────────────────
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!videoRef.current) return

    if (!isPlaying) {
      // Show ad before first play
      if (AD_CONFIG.enabled && !adShownThisSession && !youtubeId) {
        setShowAd(true)
        setAdShownThisSession(true)
        if (movieId && onAdImpression) onAdImpression(movieId)
        startAdTimer()
        return
      }
      videoRef.current.play()
    } else {
      videoRef.current.pause()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSliderChange = (val: number[]) => {
    if (videoRef.current) {
      const time = (val[0] / 100) * videoRef.current.duration
      videoRef.current.currentTime = time
      setProgress(val[0])
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // ── YouTube embed (no custom ad needed) ────────────────────────────────
  if (youtubeId) {
    return (
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xl border border-white/5">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  // ── Main Player ─────────────────────────────────────────────────────────
  return (
    <>
      <div 
        id="cinemastream-player"
        className="relative group aspect-video bg-black rounded-lg md:rounded-xl overflow-hidden shadow-2xl border border-white/5 cursor-pointer"
        onClick={() => !showAd && togglePlay()}
      >
        {/* ── Video element ── */}
        {src ? (
          <video 
            ref={videoRef}
            src={src} 
            className="w-full h-full object-contain"
            onClick={(e) => e.preventDefault()}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/20">
            No video source provided
          </div>
        )}

        {/* ── Ad Overlay (YouTube-like) ── */}
        {showAd && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Ad Image / Banner */}
            <div className="relative flex-1 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={AD_CONFIG.adImageUrl}
                alt="Advertisement"
                className="w-full h-full object-cover"
              />
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              {/* Ad label */}
              <div className="absolute top-3 left-3 bg-black/60 text-white/80 text-[10px] font-bold px-2 py-1 rounded">
                বিজ্ঞাপন
              </div>

              {/* Ad countdown top-right */}
              <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                {adCountdown}s
              </div>

              {/* Ad content bottom-left */}
              <div className="absolute bottom-16 left-4 space-y-1">
                <p className="text-white font-bold text-base md:text-xl drop-shadow">{AD_CONFIG.adTitle}</p>
                <p className="text-white/80 text-xs md:text-sm drop-shadow">{AD_CONFIG.adDescription}</p>
              </div>

              {/* CTA button bottom-left */}
              <a
                href={AD_CONFIG.adCtaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white text-black font-bold text-xs px-4 py-2 rounded-lg hover:bg-white/90 transition-colors shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {AD_CONFIG.adCtaText} <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Skip bar */}
            <div className="h-14 bg-black/90 flex items-center justify-end px-4 gap-3 border-t border-white/5">
              <span className="text-white/50 text-xs hidden sm:block">বিজ্ঞাপনের পর ভিডিও চলবে</span>
              {canSkip ? (
                <button
                  onClick={dismissAd}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all animate-in fade-in zoom-in duration-300"
                >
                  <X className="h-3.5 w-3.5" /> বিজ্ঞাপন এড়িয়ে যান
                </button>
              ) : (
                <div className="bg-black/60 border border-white/10 text-white/70 text-xs px-4 py-2.5 rounded-lg">
                  {AD_CONFIG.skipAfterSeconds - (AD_CONFIG.adDurationSeconds - adCountdown)} সেকেন্ড পর এড়ানো যাবে
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/10 w-full">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${((AD_CONFIG.adDurationSeconds - adCountdown) / AD_CONFIG.adDurationSeconds) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Play button overlay ── */}
        {!isPlaying && src && !showAd && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Button 
              onClick={togglePlay}
              className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-primary/90 hover:bg-primary text-white p-0 shadow-lg"
            >
              <Play className="w-7 h-7 md:w-10 md:h-10 fill-current" />
            </Button>
          </div>
        )}

        {/* ── Top gradient + title ── */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <h2 className="text-white font-headline font-bold text-sm md:text-lg line-clamp-1">{title || 'Untitled Movie'}</h2>
        </div>

        {/* ── Bottom controls ── */}
        {!showAd && (
          <div 
            className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 md:gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full">
              <Slider 
                value={[progress]} 
                max={100} 
                step={0.1} 
                onValueChange={handleSliderChange}
                className="cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 md:gap-2">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 md:h-9 md:w-9" onClick={() => togglePlay()}>
                  {isPlaying ? <Pause className="h-4 w-4 md:h-5 md:w-5" /> : <Play className="h-4 w-4 md:h-5 md:w-5 fill-current" />}
                </Button>
                
                <div className="flex items-center gap-1 md:gap-2 group/volume">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 md:h-9 md:w-9" onClick={toggleMute}>
                    {isMuted || volume === 0 ? <VolumeX className="h-4 w-4 md:h-5 md:w-5" /> : <Volume2 className="h-4 w-4 md:h-5 md:w-5" />}
                  </Button>
                  <div className="w-0 md:group-hover/volume:w-20 overflow-hidden transition-all duration-300 hidden md:block">
                    <Slider 
                      value={[isMuted ? 0 : volume]} 
                      max={100} 
                      onValueChange={(val) => {
                        setVolume(val[0])
                        if (videoRef.current) videoRef.current.volume = val[0] / 100
                      }}
                      className="w-20"
                    />
                  </div>
                </div>

                <div className="text-white text-[10px] md:text-sm ml-1 md:ml-4 font-mono font-medium">
                  {currentTime} <span className="hidden xs:inline">/ {duration}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 md:gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 md:h-9 md:w-9">
                      <Settings className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 md:w-48 bg-black/90 border-white/10 text-white">
                    <DropdownMenuItem className="hover:bg-white/10 text-xs md:text-sm">Quality: Auto</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 text-xs md:text-sm">Speed: 1x</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 md:h-9 md:w-9" onClick={() => videoRef.current?.requestFullscreen()}>
                  <Maximize className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MyBid Publisher Ad Overlay Integration ── */}
      <Script 
        async 
        src="https://js.mbidadm.com/static/scripts.js" 
        data-admpid="441378"
        strategy="afterInteractive"
      />
    </>
  )
}
