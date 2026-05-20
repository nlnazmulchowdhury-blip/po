
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Film, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  Loader2,
  Video,
  ImageIcon,
  Clock,
  Sparkles,
  Link as LinkIcon,
  Check,
  DollarSign
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { AdminGuard } from '@/components/auth/AdminGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminUserMenu } from '@/components/admin/AdminUserMenu'
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

const categories = ["Action", "Comedy", "Horror", "Sci-Fi", "Drama", "Animation", "Documentary", "Romance", "Thriller"];

const adminLinks = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/admin/dashboard" },
  { title: "Movies", icon: Film, url: "/admin/movies" },
  { title: "Users", icon: Users, url: "/admin/users" },
  { title: "Comments", icon: MessageSquare, url: "/admin/comments" },
  { title: "Revenue", icon: DollarSign, url: "/admin/revenue" },
];

export default function ManageMoviesPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  
  const [localCategories, setLocalCategories] = useState(categories);
  const [customCategory, setCustomCategory] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration: '2:15:00',
    videoUrl: '',
    tags: ''
  });

  const [files, setFiles] = useState<{ thumbnail: File | null; video: File | null }>({
    thumbnail: null,
    video: null
  });

  const moviesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'movies'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: movies, loading: moviesLoading } = useCollection(moviesQuery);

  // Cloudinary Credentials (Hardcoded as requested)
  const CLOUD_NAME = 'dnbskyrk';
  const UPLOAD_PRESET = 'nazmulml_default';
  const API_KEY = '778468931453495';

  const uploadToCloudinary = async (file: File, resourceType: 'image' | 'video'): Promise<string> => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
    
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', UPLOAD_PRESET);
    cloudinaryFormData.append('api_key', API_KEY);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: cloudinaryFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.secure_url;
    } catch (err: any) {
      throw new Error(err.message || "Network Error: আপনার ইন্টারনেট কানেকশন চেক করুন।");
    }
  };

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    let finalCategory = formData.category;
    if (formData.category === 'custom') {
      if (!customCategory.trim()) {
        toast({ variant: "destructive", title: "তথ্য অসম্পূর্ণ", description: "কাস্টম ক্যাটাগরির নাম অবশ্যই দিতে হবে।" });
        return;
      }
      finalCategory = customCategory.trim();
    }

    if (!formData.title || !finalCategory) {
      toast({ variant: "destructive", title: "তথ্য অসম্পূর্ণ", description: "টাইটেল এবং ক্যাটাগরি অবশ্যই দিতে হবে।" });
      return;
    }

    if (!files.thumbnail && !files.video && !formData.videoUrl) {
      toast({ variant: "destructive", title: "ফাইল অনুপস্থিত", description: "থাম্বনেইল এবং ভিডিও ফাইল অথবা লিঙ্ক অবশ্যই দিতে হবে।" });
      return;
    }

    setIsSaving(true);
    setUploadStatus('আপলোড শুরু হচ্ছে...');

    try {
      let thumbUrl = 'https://picsum.photos/seed/cinema1/600/400';
      if (files.thumbnail) {
        setUploadStatus('থাম্বনেইল আপলোড হচ্ছে...');
        thumbUrl = await uploadToCloudinary(files.thumbnail, 'image');
      }

      let videoUrl = formData.videoUrl;
      if (files.video) {
        setUploadStatus('ভিডিও ফাইল আপলোড হচ্ছে...');
        videoUrl = await uploadToCloudinary(files.video, 'video');
      }

      if (!videoUrl) {
        throw new Error("ভিডিও ফাইল অথবা ইউআরএল এর যেকোনো একটি অবশ্যই দিতে হবে।");
      }

      setUploadStatus('লাইব্রেরিতে সেভ হচ্ছে...');
      let formattedTags = '';
      if (formData.tags) {
        formattedTags = formData.tags
          .split(/[\s,]+/)
          .filter(t => t.trim() !== '')
          .map(t => t.startsWith('#') ? t.toLowerCase() : `#${t.toLowerCase()}`)
          .join(' ');
      }

      const movieData = {
        title: formData.title,
        description: formData.description || "মুভি সম্পর্কে কোনো তথ্য নেই।",
        category: finalCategory,
        thumbnail: thumbUrl,
        videoUrl: videoUrl,
        duration: formData.duration || "2:15:00",
        views: 0,
        likesCount: 0,
        releaseDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: serverTimestamp(),
        tags: formattedTags
      };

      await addDoc(collection(db, 'movies'), movieData);
      
      toast({ title: "মুভি যুক্ত হয়েছে", description: `${formData.title} সফলভাবে ডাটাবেজে সেভ হয়েছে।` });
      
      if (formData.category === 'custom') {
        const formattedCat = customCategory.trim();
        if (!localCategories.includes(formattedCat)) {
          setLocalCategories(prev => [...prev, formattedCat]);
        }
      }

      setIsAddDialogOpen(false);
      setFormData({ title: '', description: '', category: '', duration: '2:15:00', videoUrl: '', tags: '' });
      setCustomCategory('');
      setFiles({ thumbnail: null, video: null });

    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "আপলোড ব্যর্থ", 
        description: err.message || "মুভি আপলোড করার সময় কোনো সমস্যা হয়েছে।" 
      });
    } finally {
      setIsSaving(false);
      setUploadStatus('');
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (!db) return;
    if (confirm(`আপনি কি নিশ্চিত যে '${title}' ডিলিট করতে চান?`)) {
      const docRef = doc(db, 'movies', id);
      deleteDoc(docRef).then(() => {
        toast({ title: "মুভি ডিলিট হয়েছে", description: `${title} রিমুভ করা হয়েছে।`, variant: "destructive" });
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
                   <h1 className="text-xl font-bold text-white uppercase italic tracking-widest">Cinema<span className="text-primary">Studio</span> / <span className="text-muted-foreground">Movies</span></h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <AdminUserMenu />
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 w-full">
            <div className="w-full max-w-none space-y-6 md:space-y-8 pb-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div className="space-y-1">
                  <h1 className="text-2xl md:text-3xl font-headline font-bold tracking-tight text-white uppercase italic">Movie <span className="text-primary">Registry</span></h1>
                  <p className="text-muted-foreground text-xs md:text-sm font-medium">Cloudinary সরাসরি আপলোড এবং ডাটাবেজ ম্যানেজমেন্ট।</p>
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 font-bold gap-2 h-12 px-8 rounded-2xl shadow-xl shadow-primary/20 text-white uppercase tracking-wider">
                      <Plus className="h-5 w-5" /> Add New Movie
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px] bg-[#141414] border-white/10 text-white max-h-[90vh] flex flex-col p-0 rounded-3xl overflow-hidden shadow-2xl">
                    <DialogHeader className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-b border-white/5 shrink-0">
                      <DialogTitle className="text-2xl font-headline font-bold uppercase italic tracking-tight">Cloudinary <span className="text-primary">আপলোড</span></DialogTitle>
                      <DialogDescription className="text-muted-foreground text-sm">মুভি ফাইল সরাসরি ক্লাউডিনারিতে আপলোড করুন অথবা লিঙ্ক ব্যবহার করুন।</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddMovie} className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">মুভির টাইটেল</label>
                        <Input 
                          placeholder="মুভির নাম" 
                          className="bg-black/40 border-white/10 text-white h-12 focus:border-primary/50 rounded-xl" 
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          required
                          disabled={isSaving}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">ক্যাটাগরি</label>
                          <Select
                            disabled={isSaving}
                            value={formData.category}
                            onValueChange={(val) => setFormData({...formData, category: val})}
                          >
                            <SelectTrigger className="w-full bg-black/40 border-white/10 text-white h-12 focus:ring-primary/50 focus:border-primary/50 rounded-xl px-3 outline-none transition-all">
                              <SelectValue placeholder="সিলেক্ট করুন" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141414] border-white/10 text-white rounded-2xl shadow-2xl z-[100]">
                              {localCategories.map(cat => (
                                <SelectItem 
                                  key={cat} 
                                  value={cat}
                                  className="focus:bg-white/5 focus:text-white text-xs py-2.5 cursor-pointer rounded-xl"
                                >
                                  {cat}
                                </SelectItem>
                              ))}
                              <SelectItem 
                                value="custom" 
                                className="focus:bg-primary/20 focus:text-primary text-xs py-2.5 cursor-pointer rounded-xl font-bold text-primary flex items-center gap-1 border-t border-white/5 mt-1"
                              >
                                + নতুন ক্যাটাগরি তৈরি করুন
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">সময়কাল</label>
                          <Input 
                            placeholder="2:15:00" 
                            className="bg-black/40 border-white/10 text-white h-12 focus:border-primary/50 rounded-xl" 
                            value={formData.duration}
                            onChange={(e) => setFormData({...formData, duration: e.target.value})}
                            disabled={isSaving}
                          />
                        </div>
                        
                        {formData.category === 'custom' && (
                          <div className="col-span-2 space-y-2 mt-2 animate-fade-in">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                              <Plus className="h-3 w-3 animate-pulse" /> কাস্টম ক্যাটাগরির নাম
                            </label>
                            <Input 
                              placeholder="যেমন: Bollywood, Short Film, Natok..." 
                              className="bg-black/40 border-primary/30 text-white h-12 focus:border-primary/60 rounded-xl" 
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                              disabled={isSaving}
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <LinkIcon className="h-3 w-3 text-primary" /> ভিডিও লিঙ্ক (ঐচ্ছিক)
                        </label>
                        <Input 
                          placeholder="অথবা সরাসরি লিঙ্ক দিন..." 
                          className="bg-black/40 border-white/10 text-white h-12 focus:border-primary/50 rounded-xl" 
                          value={formData.videoUrl}
                          onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                          disabled={isSaving || !!files.video}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <ImageIcon className="h-3 w-3 text-primary" /> থাম্বনেইল ফাইল
                          </label>
                          <Input 
                            type="file" 
                            accept="image/*"
                            className="bg-black/40 border-white/10 text-white h-12 pt-2 file:bg-primary/20 file:text-primary cursor-pointer rounded-xl text-[10px]" 
                            onChange={(e) => setFiles(prev => ({ ...prev, thumbnail: e.target.files?.[0] || null }))}
                            disabled={isSaving}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Video className="h-3 w-3 text-primary" /> ভিডিও ফাইল (MP4)
                          </label>
                          <Input 
                            type="file" 
                            accept="video/mp4,video/x-m4v,video/*"
                            className="bg-black/40 border-white/10 text-white h-12 pt-2 cursor-pointer rounded-xl text-[10px]" 
                            onChange={(e) => setFiles(prev => ({ ...prev, video: e.target.files?.[0] || null }))}
                            disabled={isSaving || !!formData.videoUrl}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <span className="text-primary font-headline font-extrabold text-sm">#</span> হ্যাশট্যাগসমূহ (স্পেস অথবা কমা দিয়ে আলাদা করুন)
                        </label>
                        <Input 
                          placeholder="যেমন: #romance, #action, #trending..." 
                          className="bg-black/40 border-white/10 text-white h-12 focus:border-primary/50 rounded-xl" 
                          value={formData.tags}
                          onChange={(e) => setFormData({...formData, tags: e.target.value})}
                          disabled={isSaving}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">ডেসক্রিপশন</label>
                        <Textarea 
                          placeholder="মুভি সম্পর্কে সংক্ষেপে লিখুন..." 
                          className="bg-black/40 border-white/10 min-h-[80px] text-white rounded-xl resize-none" 
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          disabled={isSaving}
                        />
                      </div>
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          className="w-full bg-primary text-white font-bold h-14 uppercase rounded-2xl text-sm tracking-widest"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                              {uploadStatus || 'প্রসেসিং হচ্ছে...'}
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-5 w-5 mr-3" />
                              Confirm & Save
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="bg-[#141414] border-white/5 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="p-4 md:p-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full sm:max-w-sm">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="মুভির নাম বা হ্যাশট্যাগ দিয়ে খুঁজুন..." 
                        className="pl-12 bg-black/40 border-white/10 text-white h-12 rounded-xl" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[10px] uppercase bg-black/60 text-muted-foreground border-b border-white/5">
                        <tr>
                          <th className="px-8 py-5 font-bold tracking-widest">মুভি কন্টেন্ট</th>
                          <th className="px-6 py-5 font-bold tracking-widest">ক্যাটাগরি</th>
                          <th className="px-6 py-5 font-bold tracking-widest text-center">স্ট্যাটাস</th>
                          <th className="px-8 py-5 font-bold text-right tracking-widest">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {moviesLoading ? (
                          <tr><td colSpan={4} className="px-6 py-24 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></td></tr>
                        ) : movies?.filter((movie: any) => 
                          movie.title.toLowerCase().includes(search.toLowerCase()) ||
                          movie.category?.toLowerCase().includes(search.toLowerCase()) ||
                          (movie.tags && movie.tags.toLowerCase().includes(search.toLowerCase()))
                        ).map((movie: any) => (
                          <tr key={movie.id} className="hover:bg-white/[0.03] transition-all group">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-6">
                                <div className="relative w-32 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/5">
                                  <Image src={movie.thumbnail || 'https://picsum.photos/seed/cinema1/600/400'} alt={movie.title} fill className="object-cover" unoptimized={true} />
                                </div>
                                <div>
                                  <span className="font-bold text-white text-base block break-all max-w-[220px] sm:max-w-[320px] md:max-w-[480px] whitespace-normal line-clamp-2" title={movie.title}>
                                    {movie.title}
                                  </span>
                                  {movie.tags && (
                                    <span className="text-[10px] text-primary/80 font-bold block mt-1 tracking-wider whitespace-normal break-words max-w-[220px] sm:max-w-[320px] md:max-w-[480px]">
                                      {movie.tags}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase font-bold mt-1.5">
                                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {movie.views || 0}</span>
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {movie.duration}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase">
                                {movie.category}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                            </td>
                            <td className="px-8 py-5 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5 text-white/40" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-white rounded-2xl p-2">
                                  <DropdownMenuItem asChild className="cursor-pointer py-3 font-bold text-xs uppercase"><Link href={`/watch/${movie.id}`}><Eye className="h-4 w-4 mr-2" /> মুভি দেখুন</Link></DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive font-bold text-xs uppercase cursor-pointer py-3" onClick={() => handleDelete(movie.id, movie.title)}><Trash2 className="h-4 w-4 mr-2" /> রিমুভ করুন</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>

                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
