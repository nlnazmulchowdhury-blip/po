import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** YouTube-style responsive movie feed grid */
export const movieFeedGridClass =
  'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-3 gap-y-3 sm:gap-x-4 sm:gap-y-3.5 md:gap-x-5 md:gap-y-4 lg:gap-x-4 lg:gap-y-4 xl:gap-x-5 xl:gap-y-4 2xl:gap-x-4 2xl:gap-y-4 px-3 sm:px-4 md:px-6 lg:px-8'

export const movieFeedSkeletonThumbClass =
  'aspect-video w-full rounded-xl bg-white/5'
