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
  if (!dateStr) return ""
  const d = parseDashboardDate(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
}

export function parseDashboardDate(dateStr: string): Date {
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) return d
  const trimmed = dateStr.replace(/\s+(GM|GMT)[\s\S]*$/, "")
  if (trimmed !== dateStr) {
    const d2 = new Date(trimmed)
    if (!isNaN(d2.getTime())) return d2
  }
  return d
}

export function formatDisplayDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—"
  const d = parseDashboardDate(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}

export function formatISODate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—"
  const d = parseDashboardDate(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}
