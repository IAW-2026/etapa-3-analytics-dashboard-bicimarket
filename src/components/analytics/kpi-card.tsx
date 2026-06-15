"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KpiCardProps {
  label: string
  value: string
  trend?: {
    value: string
    direction: "up" | "down" | "flat"
    positive?: boolean
  }
  icon?: React.ReactNode
  isLoading?: boolean
}

export function KpiCard({ label, value, trend, icon, isLoading }: KpiCardProps) {
  if (isLoading) {
    return (
      <Card className="shadow-xs transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-2 h-8 w-28" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-xs transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {trend && (
          <div className="mt-1 flex items-center gap-1 text-sm">
            {trend.direction === "up" && (
              <TrendingUp className={`size-4 ${trend.positive !== false ? "text-emerald-500" : "text-red-500"}`} />
            )}
            {trend.direction === "down" && (
              <TrendingDown className={`size-4 ${trend.positive !== true ? "text-red-500" : "text-emerald-500"}`} />
            )}
            {trend.direction === "flat" && <Minus className="size-4 text-muted-foreground" />}
            <span className={trend.direction === "flat" ? "text-muted-foreground" : ""}>{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
