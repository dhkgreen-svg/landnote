import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKoreanCurrency(amountInMan: number | null | undefined): string {
  if (!amountInMan) return '';
  if (amountInMan < 10000) {
    return `${amountInMan.toLocaleString()}만`;
  }
  const uk = Math.floor(amountInMan / 10000);
  const man = amountInMan % 10000;
  if (man === 0) {
    return `${uk.toLocaleString()}억`;
  }
  return `${uk.toLocaleString()}억 ${man.toLocaleString()}만`;
}
