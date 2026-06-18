import type { FilterState } from "@/lib/mock/types"

export type TrendDirection = "up" | "down" | "flat"

export interface TrendInfo {
  direction: TrendDirection
  pct: number
  label: string
}

export function getPrevFilters(filters: FilterState): FilterState {
  const diff = filters.to.getTime() - filters.from.getTime()
  return {
    preset: "custom",
    from: new Date(filters.from.getTime() - diff),
    to: new Date(filters.from.getTime()),
  }
}

export function computeTrend(prev: number | undefined | null, current: number | undefined | null): TrendInfo | null {
  const p = prev ?? 0
  const c = current ?? 0
  if (p === c) return null
  if (p === 0 || c === 0) return null
  const pct = ((c - p) / Math.abs(p)) * 100
  if (pct === 0) return null
  const direction: TrendDirection = pct > 0 ? "up" : "down"
  const sign = pct > 0 ? "+" : ""
  return { direction, pct, label: `${sign}${pct.toFixed(1)}%` }
}
