import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Gộp class: clsx xử lý điều kiện, twMerge xử lý xung đột (px-2 vs px-4 → giữ cái sau) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
