"use client"

import { AlertTriangle, CheckCircle2, CircleGauge, Siren } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataSourceInfo, type DataSource } from "@/components/analytics/data-source-info"
import type { HealthResult, HealthStatus } from "@/lib/health-score"

const STATUS_CONFIG: Record<HealthStatus, { label: string; badge: string; icon: typeof CircleGauge }> = {
  urgent: { label: "Urgencia", badge: "border-red-400/30 bg-red-500/20 text-red-100", icon: Siren },
  alert: { label: "Alerta", badge: "border-orange-400/30 bg-orange-500/20 text-orange-100", icon: AlertTriangle },
  attention: { label: "Necesita atención", badge: "border-amber-400/30 bg-amber-500/20 text-amber-100", icon: AlertTriangle },
  stable: { label: "Estable", badge: "border-slate-300/25 bg-white/10 text-slate-100", icon: CircleGauge },
  healthy: { label: "Saludable", badge: "border-teal-400/30 bg-teal-500/20 text-teal-100", icon: CheckCircle2 },
  excellent: { label: "Excelente", badge: "border-emerald-400/30 bg-emerald-500/20 text-emerald-100", icon: CheckCircle2 },
}

export interface ExecutiveHealthMetric {
  label: string
  value: string
}

interface ExecutiveHealthCardProps {
  section: string
  result: HealthResult | null
  metrics: ExecutiveHealthMetric[]
  summary: string
  recommendation: string
  sources: DataSource[]
  isLoading?: boolean
  error?: string | null
}

export function ExecutiveHealthCard({
  section,
  result,
  metrics,
  summary,
  recommendation,
  sources,
  isLoading,
  error,
}: ExecutiveHealthCardProps) {
  if (isLoading) {
    return <Skeleton className="h-[190px] w-full rounded-xl" />
  }

  const config = result ? STATUS_CONFIG[result.status] : STATUS_CONFIG.stable
  const StatusIcon = config.icon

  return (
    <Card className="overflow-hidden border-0 bg-linear-to-r from-slate-950 via-slate-900 to-slate-800 text-white shadow-lg">
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.35fr_1fr] lg:items-center">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/10">Resumen ejecutivo · {section}</Badge>
            <DataSourceInfo sources={sources} />
            {result && (
              <Badge className={config.badge}>
                <StatusIcon className="mr-1 size-3" />
                {config.label}
              </Badge>
            )}
          </div>
          <div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-semibold tracking-tight">{result ? result.score.toFixed(0) : "—"}</p>
              <p className="pb-1 text-sm text-slate-400">/ 100</p>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              {error ? "No fue posible calcular el estado del apartado." : summary}
            </p>
            {!error && <p className="mt-2 text-xs font-medium text-slate-400">Recomendación: {recommendation}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {metrics.slice(0, 3).map((metric) => (
            <div key={metric.label} className="rounded-xl bg-white/8 p-3 backdrop-blur-sm">
              <p className="text-xl font-semibold">{metric.value}</p>
              <p className="mt-1 text-xs leading-tight text-slate-400">{metric.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
