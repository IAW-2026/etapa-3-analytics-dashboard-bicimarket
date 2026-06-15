"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { StatusBadge } from "@/components/analytics/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useShipmentMetrics, useSalesOrderMetrics } from "@/hooks/use-dashboard-data"

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export default function OperationsDashboardPage() {
  const shipmentMetrics = useShipmentMetrics()
  const salesOrderMetrics = useSalesOrderMetrics()

  const sm = shipmentMetrics.data
  const som = salesOrderMetrics.data

  const funnelData = [
    { stage: "Paid", count: som?.total ?? 0 },
    { stage: "Accepted", count: som?.accepted_count ?? 0 },
    { stage: "Shipped", count: sm?.delivered_count ?? 0 },
    { stage: "Delivered", count: sm?.delivered_count ?? 0 },
  ]

  const backlogData = sm?.backlog_by_status.map((b) => ({
    ...b,
    label: b.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  })) ?? []

  const pendingBySeller = som?.pending_by_seller ?? []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader title="Operations Dashboard" description="Fulfillment pipeline, bottlenecks, and delivery performance" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Fulfillment Rate" value={sm ? `${sm.fulfillment_rate.toFixed(1)}%` : "—"} trend={{ value: "+2% WoW", direction: "up" }} isLoading={shipmentMetrics.isLoading} />
        <KpiCard label="Avg Delivery Time" value={sm ? `${sm.avg_delivery_time_days} days` : "—"} trend={{ value: "-0.3d WoW", direction: "down", positive: true }} isLoading={shipmentMetrics.isLoading} />
        <KpiCard label="Pending Shipments" value={sm ? String(sm.in_transit_count) : "—"} trend={{ value: "+5 WoW", direction: "up", positive: false }} isLoading={shipmentMetrics.isLoading} />
        <KpiCard label="Seller Accept. Rate" value={som ? `${som.acceptance_rate.toFixed(1)}%` : "—"} trend={{ value: "-3% WoW", direction: "down", positive: false }} isLoading={salesOrderMetrics.isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer
          title="Fulfillment Funnel"
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
                    <span className="text-muted-foreground">{stage.count.toLocaleString("es-AR")}</span>
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
                    <p className="text-xs text-muted-foreground">Drop-off: {dropOff}%</p>
                  )}
                </div>
              )
            })}
          </div>
        </ChartContainer>

        <ChartContainer
          title="Backlog by Status"
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
          title="Pending Seller Acceptance"
          isLoading={salesOrderMetrics.isLoading}
          error={salesOrderMetrics.error?.message}
          isEmpty={pendingBySeller.length === 0}
          emptyMessage="All sellers are up to date. No pending orders."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Pending Orders</TableHead>
                <TableHead>Waiting Since</TableHead>
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
                    <TableCell className="text-sm text-muted-foreground">{waitingDays} days ago</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </ChartContainer>

        <ChartContainer
          title="Recent Deliveries"
          isLoading={shipmentMetrics.isLoading}
          error={shipmentMetrics.error?.message}
          isEmpty={false}
        >
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Shipment status summary:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <span className="size-2 rounded-full bg-emerald-500" />
                Delivered: {sm?.delivered_count ?? 0}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <span className="size-2 rounded-full bg-blue-500" />
                In Transit: {sm?.in_transit_count ?? 0}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <span className="size-2 rounded-full bg-red-500" />
                Failed: {sm?.failed_count ?? 0}
              </Badge>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Fulfillment rate: {sm?.fulfillment_rate.toFixed(1) ?? "—"}%
            </p>
          </div>
        </ChartContainer>
      </div>
    </div>
  )
}
