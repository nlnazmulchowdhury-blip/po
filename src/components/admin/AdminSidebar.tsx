'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Film, 
  Users, 
  MessageSquare, 
  DollarSign, 
  Settings, 
  LogOut,
  ShieldCheck,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const defaultLinks = [
  { id: 'dashboard', title: "Dashboard", icon: LayoutDashboard, url: "/admin/dashboard" },
  { id: 'movies', title: "Movies", icon: Film, url: "/admin/movies" },
  { id: 'users', title: "Users", icon: Users, url: "/admin/users" },
  { id: 'admins', title: "Admins", icon: ShieldCheck, url: "/admin/admins" },
  { id: 'comments', title: "Comments", icon: MessageSquare, url: "/admin/comments" },
  { id: 'revenue', title: "Revenue", icon: DollarSign, url: "/admin/revenue" },
];

function SortableNavItem({ link, isActive }: { link: any, isActive: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const Icon = link.icon;

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 p-1 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:-translate-x-2 cursor-grab active:cursor-grabbing z-20 text-muted-foreground hover:text-white transition-all duration-300 ease-out"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <Link 
        href={link.url}
        className={`flex items-center gap-3 px-4 py-3 ml-2 rounded-xl transition-all duration-300 ease-out group-hover:translate-x-2 font-medium ${
          isActive 
            ? "bg-primary text-white shadow-lg shadow-primary/20" 
            : "text-muted-foreground hover:bg-white/5 hover:text-white"
        }`}
      >
        <Icon className="h-5 w-5" />
        {link.title}
      </Link>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [links, setLinks] = useState(defaultLinks);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedOrder = localStorage.getItem('adminSidebarOrder');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        // Reconstruct the array with actual icons based on saved IDs
        const reordered = parsedOrder.map((id: string) => defaultLinks.find(l => l.id === id)).filter(Boolean);
        // Check if we added new links since last save
        const missingLinks = defaultLinks.filter(l => !reordered.find((rl: any) => rl.id === l.id));
        
        if (reordered.length > 0) {
          setLinks([...reordered, ...missingLinks]);
        }
      } catch (e) {
        console.error("Failed to parse saved sidebar order");
      }
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLinks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newArray = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('adminSidebarOrder', JSON.stringify(newArray.map(l => l.id)));
        return newArray;
      });
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-[#0f0f0f]">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="font-headline font-bold text-xl text-white">Studio</span>
          </Link>
        </div>
        <div className="flex-1 p-4 space-y-2">
           {defaultLinks.map((link) => (
             <div key={link.id} className="h-12 bg-white/5 rounded-xl animate-pulse" />
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f]">
      <div className="p-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Film className="w-5 h-5 text-white" />
          </div>
          <span className="font-headline font-bold text-xl text-white">Studio</span>
        </Link>
      </div>
      
      <div className="flex-1 p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-2">
            <SortableContext
              items={links.map(l => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {links.map((link) => (
                <SortableNavItem 
                  key={link.id} 
                  link={link} 
                  isActive={pathname === link.url} 
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      </div>

      <div className="p-4 border-t border-white/5 space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-white rounded-xl">
          <Settings className="h-5 w-5" /> Settings
        </Button>
        <Button asChild variant="ghost" className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 rounded-xl">
           <Link href="/"><LogOut className="h-5 w-5" /> Exit Studio</Link>
        </Button>
      </div>
    </div>
  );
}
