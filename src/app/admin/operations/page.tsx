"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { StatusBadge } from "@/components/analytics/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useShipmentMetrics, useSalesOrderMetrics, usePrevShipmentMetrics, usePrevSalesOrderMetrics } from "@/hooks/use-dashboard-data"
import { computeTrend } from "@/lib/trends"

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export default function OperationsDashboardPage() {
  const shipmentMetrics = useShipmentMetrics()
  const salesOrderMetrics = useSalesOrderMetrics()
  const prevShipmentMetrics = usePrevShipmentMetrics()
  const prevSalesOrderMetrics = usePrevSalesOrderMetrics()

  const sm = shipmentMetrics.data
  const som = salesOrderMetrics.data
  const psm = prevShipmentMetrics.data
  const psom = prevSalesOrderMetrics.data

  const fulfillmentTrend = computeTrend(psm?.fulfillment_rate, sm?.fulfillment_rate)
  const deliveryTimeTrend = computeTrend(psm?.avg_delivery_time_days, sm?.avg_delivery_time_days)
  const pendingShipTrend = computeTrend(psm?.in_transit_count, sm?.in_transit_count)
  const acceptanceTrend = computeTrend(psom?.acceptance_rate, som?.acceptance_rate)

  const funnelData = [
    { stage: "Pagado", count: som?.total ?? 0 },
    { stage: "Aceptado", count: som?.accepted_count ?? 0 },
    { stage: "Enviado", count: sm?.delivered_count ?? 0 },
    { stage: "Entregado", count: sm?.delivered_count ?? 0 },
  ]

  const backlogData = sm?.backlog_by_status.map((b) => ({
    ...b,
    label: b.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  })) ?? []

  const pendingBySeller = som?.pending_by_seller ?? []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader title="Panel de Operaciones" description="Pipeline de cumplimiento, cuellos de botella y rendimiento de entregas" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Tasa de Cumplimiento" value={sm ? `${sm.fulfillment_rate.toFixed(1)}%` : "—"} trend={fulfillmentTrend ? { value: fulfillmentTrend.label, direction: fulfillmentTrend.direction } : undefined} isLoading={shipmentMetrics.isLoading} />
        <KpiCard label="Tiempo Prom. de Entrega" value={sm ? `${sm.avg_delivery_time_days} días` : "—"} trend={deliveryTimeTrend ? { value: deliveryTimeTrend.label, direction: deliveryTimeTrend.direction, positive: deliveryTimeTrend.direction === "down" } : undefined} isLoading={shipmentMetrics.isLoading} />
        <KpiCard label="Envíos Pendientes" value={sm ? String(sm.in_transit_count) : "—"} trend={pendingShipTrend ? { value: pendingShipTrend.label, direction: pendingShipTrend.direction, positive: false } : undefined} isLoading={shipmentMetrics.isLoading} />
        <KpiCard label="Tasa de Aceptación" value={som ? `${som.acceptance_rate.toFixed(1)}%` : "—"} trend={acceptanceTrend ? { value: acceptanceTrend.label, direction: acceptanceTrend.direction } : undefined} isLoading={salesOrderMetrics.isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer
          title="Embudo de Cumplimiento"
          isLoading={shipmentMetrics.isLoading || salesOrderMetrics.isLoading}
          isEmpty={funnelData.every((f) => f.count === 0)}
        >
          <div className="space-y-4">
            {funnelData.map((stage, idx) => {
              const maxCount = funnelData[0]?.count ?? 1
              const pct = (stage.count / maxCount) * 100
              const dropOff = idx > 0 && funnelData[idx - 1].count > 0
                ? ((1 - stage.count / funnelData[idx - 1].count) * 100).toFixed(1)
                : null
              return (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.stage}</span>
                    <span className="text-muted-foreground">{stage.count?.toLocaleString("es-AR") ?? "0"}</span>
                  </div>
                  <div className="h-6 w-full rounded-md bg-muted">
                    <div
                      className="flex h-full items-center justify-end rounded-md bg-chart-1 px-2 text-xs font-medium text-primary-foreground transition-all"
                      style={{ width: `${pct}%` }}
                    >
                      {pct > 15 ? `${pct.toFixed(0)}%` : ""}
                    </div>
                  </div>
                  {dropOff && (
                    <p className="text-xs text-muted-foreground">Pérdida: {dropOff}%</p>
                  )}
                </div>
              )
            })}
          </div>
        </ChartContainer>

        <ChartContainer
          title="Pendientes por Estado"
          isLoading={shipmentMetrics.isLoading}
          error={shipmentMetrics.error?.message}
          isEmpty={backlogData.length === 0}
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={backlogData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} className="text-muted-foreground" width={120} />
              <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "13px" }} />
              <Bar dataKey="count" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer
          title="Aceptación Pendiente de Vendedores"
          isLoading={salesOrderMetrics.isLoading}
          error={salesOrderMetrics.error?.message}
          isEmpty={pendingBySeller.length === 0}
          emptyMessage="Todos los vendedores están al día. Sin órdenes pendientes."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Órdenes Pendientes</TableHead>
                <TableHead>Esperando Desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingBySeller.map((item) => {
                const waitingDays = Math.floor(
                  (Date.now() - new Date(item.oldest_date).getTime()) / (1000 * 60 * 60 * 24),
                )
                return (
                  <TableRow key={item.seller_profile_id}>
                    <TableCell className="text-sm font-medium">{item.seller_name}</TableCell>
                    <TableCell>
                      <Badge variant={waitingDays > 2 ? "destructive" : waitingDays > 1 ? "default" : "secondary"}>
                        {item.count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{waitingDays} días atrás</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </ChartContainer>

        <ChartContainer
          title="Entregas Recientes"
          isLoading={shipmentMetrics.isLoading}
          error={shipmentMetrics.error?.message}
          isEmpty={false}
        >
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Resumen de estado de envíos:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <span className="size-2 rounded-full bg-emerald-500" />
                Entregados: {sm?.delivered_count ?? 0}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <span className="size-2 rounded-full bg-blue-500" />
                En Tránsito: {sm?.in_transit_count ?? 0}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <span className="size-2 rounded-full bg-red-500" />
                Fallidos: {sm?.failed_count ?? 0}
              </Badge>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
               Tasa de cumplimiento: {sm?.fulfillment_rate?.toFixed(1) ?? "—"}%
            </p>
          </div>
        </ChartContainer>
      </div>
    </div>
  )
}
