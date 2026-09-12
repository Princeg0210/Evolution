import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats numbers deterministically with commas (e.g., 31,659,724)
 * avoiding client-server locale discrepancies (e.g. en-US vs en-IN) that cause React hydration failures.
 */
export function formatNumber(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === "") return "0";
  const numStr = String(val);
  const parts = numStr.split(".");
  parts[0] = parts[0]!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

