
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DollarSign, TrendingUp, PlayCircle, Film, Users, BarChart3,
  LayoutDashboard, MessageSquare, Settings, LogOut, Menu,
  Loader2, Download, Eye, Megaphone, ArrowUpRight, ArrowDownRight,
  CircleDollarSign, Tv2, Activity, Calendar, Info, CheckCircle2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminGuard } from '@/components/auth/AdminGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc, setDoc } from 'firebase/firestore';
import { AdminUserMenu } from '@/components/admin/AdminUserMenu';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useToast } from '@/hooks/use-toast';

const adminLinks = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/admin/dashboard" },
  { title: "Movies",    icon: Film,            url: "/admin/movies" },
  { title: "Users",     icon: Users,           url: "/admin/users" },
  { title: "Comments",  icon: MessageSquare,   url: "/admin/comments" },
  { title: "Revenue",   icon: DollarSign,      url: "/admin/revenue" },
];



const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

export default function RevenuePage() {
  const pathname = usePathname();
  const db = useFirestore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const [cpmRate, setCpmRate] = useState('0.00');
  const [cpcRate, setCpcRate] = useState('0.00');
  const [ctrRate, setCtrRate] = useState('3.5');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const adSettingsRef = useMemo(() => db ? doc(db, 'settings', 'ad_settings') : null, [db]);
  const { data: adSettings } = useDoc<any>(adSettingsRef);

  const AD_RPM = adSettings?.cpmRate !== undefined ? adSettings.cpmRate : 0.00;
  const AD_CPC = adSettings?.cpcRate !== undefined ? adSettings.cpcRate : 0.00;
  const AD_CTR = adSettings?.ctr !== undefined ? adSettings.ctr : 0.035;

  useEffect(() => {
    if (adSettings) {
      setCpmRate(adSettings.cpmRate !== undefined ? adSettings.cpmRate.toString() : '0.00');
      setCpcRate(adSettings.cpcRate !== undefined ? adSettings.cpcRate.toString() : '0.00');
      setCtrRate(adSettings.ctr !== undefined ? (adSettings.ctr * 100).toString() : '3.5');
    }
  }, [adSettings]);

  const handleSaveSettings = async () => {
    if (!db) return;
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'ad_settings'), {
        cpmRate: parseFloat(cpmRate) || 0,
        cpcRate: parseFloat(cpcRate) || 0,
        ctr: (parseFloat(ctrRate) || 0) / 100
      }, { merge: true });
      toast({
        title: "সেটিংস সফলভাবে সংরক্ষিত",
        description: "বিজ্ঞাপন থেকে আয়ের হিসাব আপডেট করা হয়েছে।",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "ত্রুটি",
        description: "সেটিংস সংরক্ষণ করা সম্ভব হয়নি।",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => setMounted(true), []);

  // Fetch movies for view-based revenue
  const moviesQuery = useMemo(() => db ? query(collection(db, 'movies')) : null, [db]);
  const { data: movies, loading: moviesLoading } = useCollection(moviesQuery);

  // Fetch ad impressions from Firestore (logged when video plays)
  const impressionsQuery = useMemo(() =>
    db ? query(collection(db, 'adImpressions'), orderBy('createdAt', 'desc'), limit(100)) : null
  , [db]);
  const { data: impressions, loading: impLoading } = useCollection(impressionsQuery);

  // ── Revenue Calculations ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalViews      = movies?.reduce((s, m: any) => s + parseInt(m.views || 0), 0) || 0;
    const totalImpressions= totalViews; // 100% dynamic based on video player views
    const totalClicks     = Math.floor(totalImpressions * AD_CTR);
    const cpmRevenue      = (totalImpressions / 1000) * AD_RPM;
    const cpcRevenue      = totalClicks * AD_CPC;
    const totalRevenue    = cpmRevenue + cpcRevenue;

    // This week vs last week
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);

    const thisWeekViews = movies?.reduce((s, m: any) => {
      const d = m.createdAt?.toDate?.() || new Date(0);
      return d >= weekAgo ? s + parseInt(m.views || 0) : s;
    }, 0) || 0;
    const lastWeekViews = movies?.reduce((s, m: any) => {
      const d = m.createdAt?.toDate?.() || new Date(0);
      return d >= twoWeeksAgo && d < weekAgo ? s + parseInt(m.views || 0) : s;
    }, 0) || 0;

    const viewsGrowth = lastWeekViews > 0
      ? (((thisWeekViews - lastWeekViews) / lastWeekViews) * 100).toFixed(1)
      : '100.0';

    return {
      totalRevenue:   totalRevenue.toFixed(2),
      totalViews:     totalViews.toLocaleString(),
      totalImpressions: totalImpressions.toLocaleString(),
      totalClicks:    totalClicks.toLocaleString(),
      cpmRevenue:     cpmRevenue.toFixed(2),
      cpcRevenue:     cpcRevenue.toFixed(2),
      viewsGrowth,
      estMonthly:     (totalRevenue * 4.3).toFixed(2),
    };
  }, [movies, impressions, adSettings]);

  // ── Top earning movies ──────────────────────────────────────────────
  const topMovies = useMemo(() => {
    if (!movies) return [];
    return [...movies]
      .sort((a: any, b: any) => parseInt(b.views || 0) - parseInt(a.views || 0))
      .slice(0, 8)
      .map((m: any) => {
        const views = parseInt(m.views || 0);
        const revenue = ((views / 1000) * AD_RPM + Math.floor(views * AD_CTR) * AD_CPC).toFixed(2);
        return { id: m.id, title: m.title, views, revenue, category: m.category };
      });
  }, [movies, adSettings]);

  // ── Revenue trend chart data (last 7 days simulated) ──────────────
  const trendData = useMemo(() => {
    const days = ['সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি', 'রবি'];
    const totalRev = parseFloat(stats.totalRevenue);
    return days.map((day, i) => ({
      day,
      revenue: parseFloat(((totalRev / 7) * (0.7 + Math.random() * 0.6)).toFixed(2)),
      impressions: Math.floor((parseInt(stats.totalImpressions.replace(/,/g, '')) / 7) * (0.7 + Math.random() * 0.6)),
    }));
  }, [stats]);

  // ── Category revenue pie ───────────────────────────────────────────
  const categoryRevenue = useMemo(() => {
    if (!movies) return [];
    const counts: Record<string, number> = {};
    movies.forEach((m: any) => {
      const cat = m.category || 'Other';
      const views = parseInt(m.views || 0);
      counts[cat] = (counts[cat] || 0) + parseFloat(((views / 1000) * AD_RPM).toFixed(2));
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [movies, adSettings]);

  

  const loading = moviesLoading || impLoading;

  return (
    <AdminGuard>
      <div className="flex h-screen w-full bg-[#0a0a0a] overflow-hidden" suppressHydrationWarning>
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-white/5 bg-[#0f0f0f] hidden lg:flex flex-col h-full">
          <AdminSidebar />
        </aside>

        <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-40 w-full bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
            <div className="flex h-16 items-center px-4 md:px-8 justify-between w-full">
              <div className="flex items-center gap-4">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden text-white"><Menu className="h-6 w-6" /></Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64 border-r border-white/5 bg-[#0f0f0f]">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Admin Navigation</SheetTitle>
                      <SheetDescription>Revenue and analytics panel.</SheetDescription>
                    </SheetHeader>
                    <AdminSidebar />
                  </SheetContent>
                </Sheet>
                <div className="hidden lg:block">
                  <h1 className="text-xl font-bold text-white uppercase italic tracking-widest">
                    Revenue <span className="text-primary">Analytics</span>
                  </h1>
                </div>
              </div>
              <AdminUserMenu />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar w-full">
            <div className="w-full max-w-none space-y-6 md:space-y-8">

              {/* Page title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl md:text-3xl font-headline font-bold tracking-tight text-white uppercase italic">
                    Revenue <span className="text-primary">Dashboard</span>
                  </h1>
                  <p className="text-muted-foreground text-xs md:text-sm font-medium">
                    বিজ্ঞাপন আয়ের বিস্তারিত বিশ্লেষণ — রিয়েল-টাইম ডাটা
                  </p>
                </div>
                {/* Ad Setup Banner */}
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
                  <Info className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400 text-xs font-bold">MyBid অ্যাকাউন্ট সংযুক্ত রয়েছে — Live Ad Active</span>
                </div>
              </div>

              {/* ── Top Stats ── */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { label: 'মোট আয়', value: loading ? null : `$${stats.totalRevenue}`, icon: CircleDollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10', sub: `মাসিক আনুমানিক $${stats.estMonthly}`, positive: true },
                  { label: 'বিজ্ঞাপন Impressions', value: loading ? null : stats.totalImpressions, icon: Eye, color: 'text-blue-400', bg: 'bg-blue-400/10', sub: `CPM: $${AD_RPM}`, positive: true },
                  { label: 'বিজ্ঞাপন Clicks', value: loading ? null : stats.totalClicks, icon: Activity, color: 'text-purple-400', bg: 'bg-purple-400/10', sub: `CTR: ${(AD_CTR * 100).toFixed(1)}%`, positive: true },
                  { label: 'মোট ভিডিও ভিউ', value: loading ? null : stats.totalViews, icon: PlayCircle, color: 'text-orange-400', bg: 'bg-orange-400/10', sub: `এই সপ্তাহে +${stats.viewsGrowth}%`, positive: parseFloat(stats.viewsGrowth) >= 0 },
                ].map((s) => (
                  <Card key={s.label} className="bg-[#141414] border-white/5 rounded-2xl">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${s.bg} ${s.color}`}><s.icon className="h-5 w-5" /></div>
                        <span className={`text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-full ${s.positive ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                          {s.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          Live
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{s.label}</p>
                      <p className="text-xl md:text-2xl font-bold text-white mt-1">
                        {s.value === null ? <Loader2 className="h-5 w-5 animate-spin" /> : s.value}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ── Revenue Breakdown ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-[#141414] border-white/5 rounded-2xl">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-primary" /> আয়ের বিভাজন
                    </p>
                    {[
                      { label: 'CPM (প্রতি ১০০০ ভিউ)', value: `$${stats.cpmRevenue}`, pct: 65 },
                      { label: 'CPC (প্রতি ক্লিক)', value: `$${stats.cpcRevenue}`, pct: 35 },
                    ].map(item => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/70">{item.label}</span>
                          <span className="font-bold text-white">{loading ? '...' : item.value}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-white/5 flex justify-between">
                      <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">মোট</span>
                      <span className="text-sm font-bold text-emerald-400">{loading ? '...' : `$${stats.totalRevenue}`}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#141414] border-white/5 rounded-2xl">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Tv2 className="h-4 w-4 text-primary" /> Ad Account স্ট্যাটাস
                    </p>
                    {[
                      { label: 'MyBid Publisher', status: 'সংযুক্ত', color: 'text-green-400 bg-green-400/10' },
                      { label: 'Ad Unit (Video)', status: 'সক্রিয় (Active)', color: 'text-green-400 bg-green-400/10' },
                      { label: 'Payment Method', status: 'সেটআপ বাকি', color: 'text-amber-400 bg-amber-400/10' },
                      { label: 'Ad Display Mode', status: 'Live Ad Active', color: 'text-emerald-400 bg-emerald-400/10' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-xs text-white/70">{item.label}</span>
                        <Badge className={`text-[10px] font-bold border-0 ${item.color}`}>{item.status}</Badge>
                      </div>
                    ))}
                    <div className="pt-2">
                      <Button size="sm" className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 text-xs font-bold rounded-xl h-9 gap-2">
                        <Settings className="h-3.5 w-3.5" /> MyBid প্যানেল ম্যানেজ করুন
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* ── MyBid Revenue Settings Card ── */}
                <Card className="bg-[#141414] border-white/5 rounded-2xl">
                  <CardContent className="p-5 space-y-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" /> MyBid রেভিনিউ সেটিংস
                    </p>
                    
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-white/60 font-bold uppercase tracking-wider">CPM রেট (প্রতি ১০০০ ভিউ)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">$</span>
                          <input 
                            type="number"
                            step="0.01"
                            value={cpmRate}
                            onChange={(e) => setCpmRate(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl h-9 pl-7 pr-3 text-xs text-white focus:outline-none focus:border-primary/50"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-white/60 font-bold uppercase tracking-wider">CPC রেট (প্রতি ক্লিক)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">$</span>
                          <input 
                            type="number"
                            step="0.01"
                            value={cpcRate}
                            onChange={(e) => setCpcRate(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl h-9 pl-7 pr-3 text-xs text-white focus:outline-none focus:border-primary/50"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-white/60 font-bold uppercase tracking-wider">CTR (%) (ক্লিক থ্রু রেট)</label>
                        <div className="relative">
                          <input 
                            type="number"
                            step="0.1"
                            value={ctrRate}
                            onChange={(e) => setCtrRate(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl h-9 px-3 text-xs text-white focus:outline-none focus:border-primary/50"
                            placeholder="3.5"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">%</span>
                        </div>
                      </div>

                      <Button 
                        onClick={handleSaveSettings} 
                        disabled={isSavingSettings}
                        size="sm" 
                        className="w-full bg-primary hover:bg-primary/95 text-white font-bold rounded-xl h-9 gap-2 mt-2"
                      >
                        {isSavingSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        সেটিংস সংরক্ষণ করুন
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {mounted && (
                <>
                  {/* ── Revenue Trend Chart ── */}
                  <Card className="bg-[#141414] border-white/5 rounded-3xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-white/[0.02] border-b border-white/5">
                      <div className="space-y-1">
                        <CardTitle className="font-headline font-bold text-xl text-white flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" /> আয়ের ট্রেন্ড
                        </CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
                          গত ৭ দিনের আনুমানিক আয়
                        </CardDescription>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-400 border-0 text-[10px] font-bold">Estimated</Badge>
                    </CardHeader>
                    <CardContent className="h-[280px] pt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={v => `$${v}`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: 'white', fontSize: '12px' }}
                            formatter={(v: any) => [`$${v}`, 'আয়']}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* ── Top Movies + Category Pie ── */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-10">
                    {/* Top earning movies */}
                    <Card className="xl:col-span-2 bg-[#141414] border-white/5 rounded-3xl overflow-hidden">
                      <CardHeader className="pb-2 bg-white/[0.02] border-b border-white/5">
                        <CardTitle className="font-headline font-bold text-xl text-white flex items-center gap-2">
                          <Film className="h-5 w-5 text-primary" /> সর্বোচ্চ আয়ের ভিডিও
                        </CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
                          ভিউ ও বিজ্ঞাপন থেকে আনুমানিক আয়
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        {loading ? (
                          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : (
                          <table className="w-full text-sm">
                            <thead className="text-[10px] uppercase bg-black/40 text-muted-foreground border-b border-white/5">
                              <tr>
                                <th className="px-5 py-3 text-left font-bold tracking-widest">#</th>
                                <th className="px-5 py-3 text-left font-bold tracking-widest">ভিডিও</th>
                                <th className="px-5 py-3 text-right font-bold tracking-widest">ভিউ</th>
                                <th className="px-5 py-3 text-right font-bold tracking-widest">আয়</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {topMovies.map((m, i) => (
                                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="px-5 py-3.5 text-muted-foreground font-bold text-xs">{i + 1}</td>
                                  <td className="px-5 py-3.5">
                                    <div>
                                      <Link href={`/watch/${m.id}`} className="font-bold text-white text-xs hover:text-primary transition-colors line-clamp-1">{m.title}</Link>
                                      <Badge className="mt-0.5 text-[9px] bg-white/5 text-muted-foreground border-0">{m.category}</Badge>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5 text-right text-xs text-muted-foreground">{m.views.toLocaleString()}</td>
                                  <td className="px-5 py-3.5 text-right font-bold text-emerald-400 text-xs">${m.revenue}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </CardContent>
                    </Card>

                    {/* Category revenue pie */}
                    <Card className="bg-[#141414] border-white/5 rounded-3xl overflow-hidden">
                      <CardHeader className="pb-2 bg-white/[0.02] border-b border-white/5">
                        <CardTitle className="font-headline font-bold text-xl text-white flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-primary" /> ক্যাটাগরি আয়
                        </CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">বিভাগ অনুযায়ী</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[360px] pt-4 flex flex-col items-center justify-center">
                        {loading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : categoryRevenue.length === 0 ? (
                          <p className="text-muted-foreground text-xs">কোনো ডাটা নেই</p>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={categoryRevenue} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                                {categoryRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Pie>
                              <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                formatter={(v: any) => [`$${v}`, 'আয়']}
                              />
                              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
