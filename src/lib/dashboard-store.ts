"use client"

import { create } from "zustand"
import { subDays, startOfDay } from "date-fns"
import type { DatePreset } from "./mock/types"

function getDateRange(preset: DatePreset) {
  const now = startOfDay(new Date())
  switch (preset) {
    case "7d":
      return { from: subDays(now, 7), to: now }
    case "30d":
      return { from: subDays(now, 30), to: now }
    case "90d":
      return { from: subDays(now, 90), to: now }
    case "1y":
      return { from: subDays(now, 365), to: now }
    case "custom":
      return { from: subDays(now, 30), to: now }
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
  to: startOfDay(new Date()),
  comparePeriod: false,
  setPreset: (preset) => set({ preset, ...getDateRange(preset) }),
  setCustomRange: (from, to) => set({ preset: "custom", from, to }),
  toggleCompare: () => set((state) => ({ comparePeriod: !state.comparePeriod })),
}))
