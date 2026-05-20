import React from 'react';
import { Film } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ message = 'লোডিং হচ্ছে...', fullScreen = true }: LoadingScreenProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'min-h-screen fixed inset-0 z-[999] bg-[#050505]/90 backdrop-blur-xl' : 'h-full min-h-[300px] w-full bg-transparent'}`}>
      <div className="relative flex flex-col items-center justify-center space-y-6">
        {/* Animated Rings */}
        <div className="relative h-20 w-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-t-[3px] border-primary animate-spin opacity-80" style={{ animationDuration: '1.5s' }}></div>
          <div className="absolute inset-2 rounded-full border-b-[3px] border-primary/60 animate-spin opacity-50" style={{ animationDuration: '1s', animationDirection: 'reverse' }}></div>
          <div className="absolute inset-4 rounded-full border-r-[3px] border-white/20 animate-pulse opacity-30"></div>
          
          {/* Core Icon */}
          <div className="relative bg-primary/20 p-2.5 rounded-full shadow-[0_0_20px_rgba(234,67,53,0.3)] animate-pulse">
            <Film className="w-5 h-5 text-primary" />
          </div>
        </div>
        
        {/* Glowing Text */}
        <div className="flex flex-col items-center space-y-2">
          <span className="font-headline font-bold text-lg tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary animate-pulse" style={{ backgroundSize: '200% auto', animation: 'shine 3s linear infinite' }}>
            Cinema Stream
          </span>
          {message && (
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-muted-foreground animate-pulse">
              {message}
            </p>
          )}
        </div>
      </div>
      
      {/* Add custom keyframes for the shine effect */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shine {
          to {
            background-position: 200% center;
          }
        }
      `}} />
    </div>
  );
}
