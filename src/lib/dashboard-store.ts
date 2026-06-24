"use client"

import { create } from "zustand"
import { subDays, startOfDay, endOfDay } from "date-fns"
import type { DatePreset } from "@/lib/types"

function getDateRange(preset: DatePreset) {
  const from = startOfDay(new Date())
  const to = endOfDay(new Date())
  switch (preset) {
    case "7d":
      return { from: subDays(from, 7), to }
    case "30d":
      return { from: subDays(from, 30), to }
    case "90d":
      return { from: subDays(from, 90), to }
    case "1y":
      return { from: subDays(from, 365), to }
    case "custom":
      return { from: subDays(from, 30), to }
  }
}

interface DashboardState {
  preset: DatePreset
  from: Date
  to: Date
  comparePeriod: boolean
  setPreset: (preset: DatePreset) => void
  setCustomRange: (from: Date, to: Date) => void
  toggleCompare: () => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  preset: "30d",
  from: subDays(startOfDay(new Date()), 30),
  to: endOfDay(new Date()),
  comparePeriod: false,
  setPreset: (preset) => set({ preset, ...getDateRange(preset) }),
  setCustomRange: (from, to) => set({ preset: "custom", from, to }),
  toggleCompare: () => set((state) => ({ comparePeriod: !state.comparePeriod })),
}))
