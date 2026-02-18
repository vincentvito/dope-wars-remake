import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString();
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}
