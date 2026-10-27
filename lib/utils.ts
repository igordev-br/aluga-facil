import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

export function calculateExpiryIso(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

export function isFutureDate(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  try {
    return new Date(dateStr).getTime() > Date.now();
  } catch {
    return false;
  }
}
