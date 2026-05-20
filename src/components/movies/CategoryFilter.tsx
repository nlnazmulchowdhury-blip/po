
"use client"

import React from 'react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const categories = [
  "All", "Music", "Mixes", "Natok", "Music of Bengal", "News", 
  "Indian pop music", "Niloy Alamgir", "Google", "Web Development", 
  "Computer Science", "Television comedy", "Produce", "Asian music", 
  "Tourism", "Animation", "Documentary", "Action"
]

interface CategoryFilterProps {
  active: string
  onChange: (category: string) => void
}

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="sticky top-16 z-30 w-full bg-background/95 backdrop-blur-sm py-3 border-b border-border/10">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-3 px-4 md:px-6">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                active === category 
                ? "bg-white text-black" 
                : "bg-white/10 hover:bg-white/20 text-white"
              )}
            >
              {category}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </div>
  )
}
