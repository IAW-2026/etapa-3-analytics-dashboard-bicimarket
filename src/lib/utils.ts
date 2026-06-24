import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCompactARS(cents: number | undefined | null): string {
  if (cents == null || Number.isNaN(cents)) return "—"
  const ars = cents / 100
  if (ars >= 1_000_000) {
    return `ARS ${(ars / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}M`
  }
  if (ars >= 1_000) {
    return `ARS ${(ars / 1_000).toLocaleString("es-AR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}K`
  }
  return `ARS ${Math.round(ars).toLocaleString("es-AR")}`
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
}
