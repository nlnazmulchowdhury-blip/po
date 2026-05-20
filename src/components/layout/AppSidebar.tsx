"use client"

import * as React from "react"
import { 
  Home, 
  TrendingUp, 
  History, 
  Heart, 
  Clock, 
  Film, 
  Tv, 
  ShieldAlert,
  Star,
  Music2,
  Clapperboard,
  User,
  Flame,
  X
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"

const mainNav = [
  { title: "Home", icon: Home, url: "/" },
  { title: "Trending", icon: TrendingUp, url: "/trending" },
  { title: "Top Rated", icon: Star, url: "/top-rated" },
]

const libraryNav = [
  { title: "History", icon: History, url: "/history" },
  { title: "Watch Later", icon: Clock, url: "/watchlist" },
  { title: "Favorites", icon: Heart, url: "/favorites" },
]

const categoryNav = [
  { title: "Action", icon: Flame, url: "/results?search_query=action" },
  { title: "Comedy", icon: Tv, url: "/results?search_query=comedy" },
  { title: "Horror", icon: ShieldAlert, url: "/results?search_query=horror" },
  { title: "Drama", icon: Film, url: "/results?search_query=drama" },
  { title: "Music", icon: Music2, url: "/results?search_query=music" },
  { title: "Sci-Fi", icon: Clapperboard, url: "/results?search_query=sci-fi" },
]

interface NavItemProps {
  title: string
  icon: React.ElementType
  url: string
  isActive: boolean
  onClick?: () => void
}

function NavItem({ title, icon: Icon, url, isActive, onClick }: NavItemProps) {
  return (
    <Link
      href={url}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3.5 px-4 py-3 h-12 w-full rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden",
        isActive
          ? "bg-primary/15 text-primary border-l-[3px] border-primary font-semibold shadow-[0_4px_12px_rgba(99,102,241,0.08)]"
          : "text-muted-foreground hover:bg-white/[0.04] hover:text-white hover:translate-x-1"
      )}
    >
      <Icon
        className={cn(
          "shrink-0 h-5 w-5 transition-all duration-300",
          isActive ? "text-primary scale-110" : "group-hover:text-white"
        )}
        strokeWidth={isActive ? 2.5 : 2}
      />
      <span className="leading-tight text-[14px]">
        {title}
      </span>
      
      {/* Subtle background glow on hover */}
      <span className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Link>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const isAdminPath = pathname.startsWith('/admin')
  const { open, setOpen, openMobile, setOpenMobile, isMobile } = useSidebar()
  
  const isOpen = isMobile ? openMobile : open
  const handleClose = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false)
    } else {
      setOpen(false)
    }
  }, [isMobile, setOpen, setOpenMobile])

  // Close sidebar on page change
  React.useEffect(() => {
    handleClose()
  }, [pathname, handleClose])

  if (isAdminPath && pathname !== '/admin/login') {
    return null;
  }

  return (
    <>
      {/* Backdrop with premium blur */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-md transition-opacity duration-300 cursor-pointer animate-in fade-in"
          onClick={handleClose}
        />
      )}

      {/* Sliding Glassmorphism Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[100] w-72 flex flex-col bg-[#0a0a0c]/85 backdrop-blur-2xl border-r border-white/[0.06] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header - Close Button */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] shrink-0">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">Navigation</span>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all duration-300"
            title="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Navigation items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-4 px-3 space-y-6">
          {/* Main Nav Group */}
          <div className="space-y-1">
            {mainNav.map(item => (
              <NavItem
                key={item.url}
                {...item}
                isActive={pathname === item.url}
                onClick={handleClose}
              />
            ))}
          </div>

          <div className="border-t border-white/[0.06] my-2" />

          {/* Library Group */}
          <div className="space-y-1">
            <p className="px-4 text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold mb-2">Your Library</p>
            {libraryNav.map(item => (
              <NavItem
                key={item.url}
                {...item}
                isActive={pathname === item.url}
                onClick={handleClose}
              />
            ))}
          </div>

          <div className="border-t border-white/[0.06] my-2" />

          {/* Categories Group */}
          <div className="space-y-1">
            <p className="px-4 text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold mb-2">Categories</p>
            {categoryNav.map(item => (
              <NavItem
                key={item.url}
                {...item}
                isActive={pathname === item.url}
                onClick={handleClose}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav - preserved as-is but with clean styles */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#070709]/95 backdrop-blur-xl border-t border-white/[0.06] flex items-center justify-around h-16 px-2 pb-safe">
        {[
          { title: "Home", icon: Home, url: "/" },
          { title: "Trending", icon: TrendingUp, url: "/trending" },
          { title: "Watchlist", icon: Clock, url: "/watchlist" },
          { title: "Favorites", icon: Heart, url: "/favorites" },
          { title: "Profile", icon: User, url: "/profile" },
        ].map(item => {
          const isActive = pathname === item.url
          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 min-w-[52px]",
                isActive ? "text-primary" : "text-white/35 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn("text-[9px] font-bold tracking-wide", isActive ? "text-primary" : "")}>{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
