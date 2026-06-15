"use client"

import { Button } from "@/components/ui/button"
import { useDashboardStore } from "@/lib/dashboard-store"
import type { DatePreset } from "@/lib/mock/types"

const presets: { value: DatePreset; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "1y", label: "1y" },
]

export function DateRangeFilter() {
  const { preset, setPreset } = useDashboardStore()

  return (
    <div className="flex items-center gap-1 rounded-lg border p-1">
      {presets.map((p) => (
        <Button
          key={p.value}
          variant={preset === p.value ? "default" : "ghost"}
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => setPreset(p.value)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  )
}
