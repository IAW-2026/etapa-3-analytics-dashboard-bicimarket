"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChartContainerProps {
  title: string
  isLoading?: boolean
  error?: string | null
  isEmpty?: boolean
  emptyMessage?: string
  onRetry?: () => void
  children: React.ReactNode
  action?: React.ReactNode
}

export function ChartContainer({
  title,
  isLoading,
  error,
  isEmpty,
  emptyMessage = "No data available for this period.",
  onRetry,
  children,
  action,
}: ChartContainerProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
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
              Retry
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
