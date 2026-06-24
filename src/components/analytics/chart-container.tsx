"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataSourceInfo, type DataSource } from "@/components/analytics/data-source-info"

interface ChartContainerProps {
  title: string
  isLoading?: boolean
  error?: string | null
  isEmpty?: boolean
  emptyMessage?: string
  onRetry?: () => void
  children: React.ReactNode
  action?: React.ReactNode
  dataSources?: DataSource[]
}

export function ChartContainer({
  title,
  isLoading,
  error,
  isEmpty,
  emptyMessage = "No hay datos disponibles para este período.",
  onRetry,
  children,
  action,
  dataSources,
}: ChartContainerProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium">{title}</h3>
          {dataSources?.length ? <DataSourceInfo sources={dataSources} /> : null}
        </div>
        {action}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-[200px] w-full rounded-md" />
        </div>
      ) : error ? (
        <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="size-8 text-destructive" />
          <p>{error}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          )}
        </div>
      ) : isEmpty ? (
        <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <Inbox className="size-8" />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
