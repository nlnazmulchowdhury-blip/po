
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Users, 
  Film, 
  PlayCircle, 
  TrendingUp, 
  DollarSign, 
  MessageSquare, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  Menu,
  Loader2,
  Download,
  BarChart3,
  ArrowUpRight
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts'
import { Button } from '@/components/ui/button'
import { AdminGuard } from '@/components/auth/AdminGuard'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useCollection, useDoc } from '@/firebase'
import { collection, query, doc } from 'firebase/firestore'
import { AdminUserMenu } from '@/components/admin/AdminUserMenu'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

const adminLinks = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/admin/dashboard" },
  { title: "Movies",    icon: Film,            url: "/admin/movies" },
  { title: "Users",     icon: Users,           url: "/admin/users" },
  { title: "Comments",  icon: MessageSquare,   url: "/admin/comments" },
  { title: "Revenue",   icon: DollarSign,      url: "/admin/revenue" },
]

export default function AdminDashboard() {
  const pathname = usePathname();
  const { toast } = useToast();
  const db = useFirestore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Dynamic Queries
  const usersQuery = useMemo(() => (db ? query(collection(db, 'users')) : null), [db]);
  const moviesQuery = useMemo(() => (db ? query(collection(db, 'movies')) : null), [db]);

  const { data: users, loading: usersLoading } = useCollection(usersQuery);
  const { data: movies, loading: moviesLoading } = useCollection(moviesQuery);

  const adSettingsRef = useMemo(() => db ? doc(db, 'settings', 'ad_settings') : null, [db]);
  const { data: adSettings } = useDoc<any>(adSettingsRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate Stats Dynamically
  const stats = useMemo(() => {
    const totalUsers = users?.length || 0;
    const totalMovies = movies?.length || 0;
    const AD_RPM = adSettings?.cpmRate !== undefined ? adSettings.cpmRate : 0.00;
    const AD_CPC = adSettings?.cpcRate !== undefined ? adSettings.cpcRate : 0.00;
    const AD_CTR = adSettings?.ctr !== undefined ? adSettings.ctr : 0.035;

    const totalViews = movies?.reduce((acc, movie: any) => acc + parseInt(movie.views || 0), 0) || 0;
    const totalClicks = Math.floor(totalViews * AD_CTR);
    const cpmRevenue = (totalViews / 1000) * AD_RPM;
    const cpcRevenue = totalClicks * AD_CPC;
    const rawRevenue = cpmRevenue + cpcRevenue;
    const revenue = rawRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    // Calculate Growth percentages based on the last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const newUsers = users?.filter((u: any) => {
      if (!u.createdAt) return false;
      const date = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      return date >= sevenDaysAgo;
    }).length || 0;

    const newMovies = movies?.filter((m: any) => {
      if (!m.createdAt) return false;
      const date = m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
      return date >= sevenDaysAgo;
    }).length || 0;

    const newViews = movies?.filter((m: any) => {
      if (!m.createdAt) return false;
      const date = m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
      return date >= sevenDaysAgo;
    }).reduce((acc, m: any) => acc + parseInt(m.views || 0), 0) || 0;

    const userGrowth = totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : "0.0";
    const movieGrowth = totalMovies > 0 ? ((newMovies / totalMovies) * 100).toFixed(1) : "0.0";
    const viewsGrowth = totalViews > 0 ? ((newViews / totalViews) * 100).toFixed(1) : "0.0";

    return [
      { title: "Total Users", value: totalUsers.toLocaleString(), change: `+${userGrowth}%`, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", href: "/admin/users" },
      { title: "Movie Library", value: totalMovies.toLocaleString(), change: `+${movieGrowth}%`, icon: Film, color: "text-purple-500", bg: "bg-purple-500/10", href: "/admin/movies" },
      { title: "Total Views", value: totalViews > 1000000 ? `${(totalViews / 1000000).toFixed(1)}M` : totalViews.toLocaleString(), change: `+${viewsGrowth}%`, icon: PlayCircle, color: "text-green-500", bg: "bg-green-500/10", href: "/admin/movies" },
      { title: "Revenue", value: revenue, change: `+${viewsGrowth}%`, icon: DollarSign, color: "text-orange-500", bg: "bg-orange-500/10", href: "/admin/revenue" },
    ];
  }, [users, movies, adSettings]);

  // Derived Chart Data
  const genreData = useMemo(() => {
    if (!movies) return [];
    const counts: Record<string, number> = {};
    movies.forEach((movie: any) => {
      const cat = movie.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, val]) => ({ name, val })).slice(0, 5);
  }, [movies]);

  const viewsData = useMemo(() => {
    if (!movies) return [];
    return movies
      .sort((a: any, b: any) => parseInt(b.views || 0) - parseInt(a.views || 0))
      .slice(0, 7)
      .map((movie: any) => ({
        name: movie.title.length > 10 ? movie.title.substring(0, 10) + '...' : movie.title,
        views: parseInt(movie.views || 0)
      }));
  }, [movies]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "ড্যাশবোর্ড রিফ্রেশ হয়েছে",
        description: "সব তথ্য সফলভাবে আপডেট করা হয়েছে।",
      });
    }, 1000);
  };

  const handleExport = () => {
    if (!users || !movies) {
      toast({
        variant: "destructive",
        title: "এক্সপোর্ট ব্যর্থ",
        description: "ডাটা এখনও লোড হয়নি।",
      });
      return;
    }

    try {
      // Generate CSV Content
      let csvContent = "\uFEFF"; // Add UTF-8 BOM for Excel Bengali compatibility
      csvContent += "--- PLATFORM OVERVIEW REPORT ---\n";
      csvContent += `Report Date,${new Date().toLocaleString()}\n`;
      csvContent += `Total Users,${users.length}\n`;
      csvContent += `Total Movies,${movies.length}\n`;
      const totalViews = movies.reduce((acc, m: any) => acc + parseInt(m.views || 0), 0);
      csvContent += `Total Views,${totalViews}\n`;
      csvContent += `Total Revenue,$${(totalViews * 0.01).toFixed(2)}\n\n`;

      csvContent += "--- MOVIES DATA ---\n";
      csvContent += "ID,Title,Category,Views,Duration,Release Date\n";
      movies.forEach((m: any) => {
        csvContent += `"${m.id}","${m.title?.replace(/"/g, '""')}","${m.category}","${m.views || 0}","${m.duration}","${m.releaseDate}"\n`;
      });

      csvContent += "\n--- USERS DATA ---\n";
      csvContent += "ID,Name,Email,Role\n";
      users.forEach((u: any) => {
        csvContent += `"${u.id}","${u.name?.replace(/"/g, '""')}","${u.email}","${u.role || 'user'}"\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `cinema_studio_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "এক্সপোর্ট সফল",
        description: "সফলভাবে CSV রিপোর্ট ফাইলটি ডাউনলোড করা হয়েছে।",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "এক্সপোর্ট ব্যর্থ",
        description: "রিপোর্ট ফাইল তৈরি করতে সমস্যা হয়েছে।",
      });
    }
  };

  

  return (
    <AdminGuard>
      <div className="flex h-screen w-full bg-[#0a0a0a] overflow-hidden" suppressHydrationWarning>
        <aside className="w-64 shrink-0 border-r border-white/5 bg-[#0f0f0f] hidden lg:flex flex-col h-full">
          <AdminSidebar />
        </aside>

        <div className="flex-1 flex flex-col w-full min-h-screen">
          <header className="sticky top-0 z-40 w-full bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
            <div className="flex h-16 items-center px-4 md:px-8 justify-between w-full">
              <div className="flex items-center gap-4">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden text-white">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64 border-r border-white/5 bg-[#0f0f0f]">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Admin Navigation</SheetTitle>
                      <SheetDescription>Access admin dashboard, movies, users and comments.</SheetDescription>
                    </SheetHeader>
                    <AdminSidebar />
                  </SheetContent>
                </Sheet>
                <div className="lg:hidden flex items-center gap-2">
                  <div className="bg-primary p-1 rounded-lg">
                    <Film className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-headline font-bold text-lg text-white">Studio</span>
                </div>
                <div className="hidden lg:block">
                   <h1 className="text-xl font-bold text-white uppercase italic tracking-widest">Admin<span className="text-primary">Dashboard</span></h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <AdminUserMenu />
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 w-full">
            <div className="w-full max-w-none space-y-6 md:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div className="space-y-1">
                  <h1 className="text-2xl md:text-3xl font-headline font-bold tracking-tight text-white uppercase italic">Dashboard <span className="text-primary">Overview</span></h1>
                  <p className="text-muted-foreground text-xs md:text-sm font-medium">আপনার প্ল্যাটফর্মের রিয়েল-টাইম তথ্য এখানে দেখুন।</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-white/10 hover:bg-white/5 text-xs rounded-xl px-4 gap-2 text-white h-10"
                    onClick={handleExport}
                  >
                    <Download className="h-3.5 w-3.5" /> Export Data
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-primary hover:bg-primary/90 text-xs shadow-lg shadow-primary/20 rounded-xl px-4 gap-2 text-white h-10 font-bold"
                    onClick={handleRefresh}
                    disabled={isRefreshing || usersLoading || moviesLoading}
                  >
                    {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 w-full">
                {stats.map((stat) => (
                  <Link key={stat.title} href={stat.href} className="block group">
                    <Card className="bg-[#141414] border-white/5 shadow-2xl rounded-2xl transition-all duration-300 group-hover:border-white/20 group-hover:bg-[#1a1a1a] group-hover:scale-[1.02] group-hover:shadow-primary/10 cursor-pointer">
                      <CardContent className="p-5 md:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                            <stat.icon className="h-6 w-6" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] md:text-xs font-bold text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full">
                              <TrendingUp className="h-3 w-3" /> {stat.change}
                            </span>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em]">{stat.title}</p>
                          <h3 className="text-2xl md:text-3xl font-bold mt-1 tracking-tight text-white group-hover:text-primary transition-colors duration-300">
                            {usersLoading || moviesLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stat.value}
                          </h3>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Charts Grid */}
              {mounted && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full pb-10">
                  <Card className="xl:col-span-2 bg-[#141414] border-white/5 rounded-3xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-white/[0.02] border-b border-white/5">
                      <div className="space-y-1">
                        <CardTitle className="font-headline font-bold text-xl text-white flex items-center gap-2">
                          <PlayCircle className="h-5 w-5 text-primary" /> Movie Performance
                        </CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Top viewed movies in library</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="h-[300px] md:h-[450px] pt-8">
                      {moviesLoading ? (
                        <LoadingScreen message="ডাটা লোড হচ্ছে..." fullScreen={false} />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={viewsData}>
                            <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} />
                            <Tooltip 
                              contentStyle={{backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}} 
                              itemStyle={{color: 'white', fontSize: '12px'}}
                            />
                            <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorViews)" strokeWidth={4} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-[#141414] border-white/5 rounded-3xl overflow-hidden">
                    <CardHeader className="pb-2 bg-white/[0.02] border-b border-white/5">
                      <CardTitle className="font-headline font-bold text-xl text-white flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" /> Content Distribution
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Movies by genre</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] md:h-[450px] pt-8">
                      {moviesLoading ? (
                        <LoadingScreen message="ডাটা লোড হচ্ছে..." fullScreen={false} />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={genreData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} hide />
                            <Tooltip 
                              cursor={{fill: 'rgba(255,255,255,0.05)'}}
                              contentStyle={{backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}} 
                            />
                            <Bar dataKey="val" radius={[8, 8, 0, 0]} barSize={40}>
                              {genreData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.1)'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  )
}
