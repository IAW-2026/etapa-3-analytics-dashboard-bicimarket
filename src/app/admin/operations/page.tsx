"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Label,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  PackageCheck,
  Truck,
} from "lucide-react"
import { KpiCard } from "@/components/analytics/kpi-card"
import { DataSourceInfo } from "@/components/analytics/data-source-info"
import { ExecutiveHealthCard } from "@/components/analytics/executive-health-card"
import { ChartContainer as AnalyticsChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  usePrevSalesOrderMetrics,
  usePrevShipmentMetrics,
  useSalesOrderMetrics,
  useShipmentMetrics,
  useShipments,
} from "@/hooks/use-dashboard-data"
import { useDashboardStore } from "@/lib/dashboard-store"
import { computeTrend } from "@/lib/trends"
import { calculateHealth, inversePercentage } from "@/lib/health-score"
import type { Shipment } from "@/lib/types"

const STATUS_LABELS: Record<Shipment["status"], string> = {
  created: "Creado",
  ready_for_pickup: "Listo para retirar",
  picked_up: "Retirado",
  in_transit: "En tránsito",
  out_for_delivery: "En reparto",
  delivered: "Entregado",
  failed_delivery: "Entrega fallida",
  returned: "Devuelto",
}

const STATUS_COLORS: Record<Shipment["status"], string> = {
  created: "var(--color-chart-5)",
  ready_for_pickup: "var(--color-chart-4)",
  picked_up: "var(--color-chart-3)",
  in_transit: "var(--color-chart-2)",
  out_for_delivery: "var(--color-chart-1)",
  delivered: "#10b981",
  failed_delivery: "#ef4444",
  returned: "#f97316",
}

const statusChartConfig = {
  count: { label: "Envíos", color: "var(--color-chart-2)" },
} satisfies ChartConfig

const carrierChartConfig = {
  shipments: { label: "Envíos", color: "var(--color-chart-1)" },
  avgDays: { label: "Días promedio", color: "var(--color-chart-3)" },
} satisfies ChartConfig

const funnelChartConfig = {
  count: { label: "Operaciones", color: "var(--color-chart-2)" },
} satisfies ChartConfig

function formatARS(cents: number) {
  return `ARS ${(cents / 100).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
}

function daysBetween(from: string, toTimestamp: number) {
  return Math.max(0, Math.floor((toTimestamp - new Date(from).getTime()) / 86_400_000))
}

function shipmentSeverity(shipment: Shipment, referenceTimestamp: number) {
  if (shipment.status === "failed_delivery" || shipment.status === "returned") return "critical"
  const age = daysBetween(shipment.created_at, referenceTimestamp)
  if (age > shipment.estimated_days_max) return "warning"
  return "normal"
}

export default function OperationsDashboardPage() {
  const shipmentMetrics = useShipmentMetrics()
  const shipments = useShipments()
  const salesOrderMetrics = useSalesOrderMetrics()
  const prevShipmentMetrics = usePrevShipmentMetrics()
  const prevSalesOrderMetrics = usePrevSalesOrderMetrics()
  const referenceTimestamp = useDashboardStore((state) => state.to.getTime())

  const sm = shipmentMetrics.data
  const som = salesOrderMetrics.data
  const psm = prevShipmentMetrics.data
  const psom = prevSalesOrderMetrics.data
  const shipmentList = shipments.data?.data ?? []

  const fulfillmentTrend = computeTrend(psm?.fulfillment_rate, sm?.fulfillment_rate)
  const deliveryTimeTrend = computeTrend(psm?.avg_delivery_time_days, sm?.avg_delivery_time_days)
  const pendingShipTrend = computeTrend(psm?.in_transit_count, sm?.in_transit_count)
  const acceptanceTrend = computeTrend(psom?.acceptance_rate, som?.acceptance_rate)

  const statusBuckets = new Map<Shipment["status"], number>()
  const carrierBuckets = new Map<string, { shipments: number; delivered: number; deliveryDays: number; cost: number }>()

  for (const shipment of shipmentList) {
    statusBuckets.set(shipment.status, (statusBuckets.get(shipment.status) ?? 0) + 1)
    const carrier = carrierBuckets.get(shipment.carrier) ?? { shipments: 0, delivered: 0, deliveryDays: 0, cost: 0 }
    carrier.shipments += 1
    carrier.cost += shipment.cost_cents
    if (shipment.status === "delivered" && shipment.delivered_at) {
      carrier.delivered += 1
      carrier.deliveryDays += (new Date(shipment.delivered_at).getTime() - new Date(shipment.created_at).getTime()) / 86_400_000
    }
    carrierBuckets.set(shipment.carrier, carrier)
  }

  const statusData = Array.from(statusBuckets, ([status, count]) => ({
    status,
    label: STATUS_LABELS[status],
    count,
    fill: STATUS_COLORS[status],
  })).sort((a, b) => b.count - a.count)

  const carrierData = Array.from(carrierBuckets, ([carrier, data]) => ({
    carrier,
    shipments: data.shipments,
    avgDays: data.delivered ? Number((data.deliveryDays / data.delivered).toFixed(1)) : 0,
    fulfillment: data.shipments ? (data.delivered / data.shipments) * 100 : 0,
    cost: data.cost,
  })).sort((a, b) => b.shipments - a.shipments)

  const funnelData = [
    { stage: "Órdenes", count: som?.total ?? 0 },
    { stage: "Aceptadas", count: som?.accepted_and_beyond_count ?? 0 },
    { stage: "Despachadas", count: sm?.total ?? 0 },
    { stage: "Entregadas", count: sm?.delivered_count ?? 0 },
  ]

  const attentionShipments = shipmentList
    .map((shipment) => ({
      ...shipment,
      age: daysBetween(shipment.created_at, referenceTimestamp),
      severity: shipmentSeverity(shipment, referenceTimestamp),
    }))
    .filter((shipment) => shipment.severity !== "normal" && shipment.status !== "delivered")
    .sort((a, b) => (a.severity === "critical" ? -1 : 1) - (b.severity === "critical" ? -1 : 1) || b.age - a.age)
    .slice(0, 8)

  const totalShippingCost = shipmentList.reduce((total, shipment) => total + shipment.cost_cents, 0)
  const criticalCount = attentionShipments.filter((shipment) => shipment.severity === "critical").length
  const deliveryReliability = inversePercentage(sm?.failed_count, sm?.total)
  const operationsHealth = calculateHealth([
    { value: sm?.fulfillment_rate, weight: 60, critical: true },
    { value: deliveryReliability, weight: 25 },
    { value: som?.acceptance_rate, weight: 15 },
  ])
  const operationsNeedsAction = operationsHealth && ["urgent", "alert", "attention"].includes(operationsHealth.status)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader
        title="Ventas y Operaciones"
        description="Visión ejecutiva del flujo desde la venta hasta la entrega"
      />

      <ExecutiveHealthCard
        section="Operaciones"
        result={operationsHealth}
        sources={["shipping", "seller"]}
        isLoading={shipmentMetrics.isLoading || salesOrderMetrics.isLoading}
        error={shipmentMetrics.error?.message ?? salesOrderMetrics.error?.message}
        summary={sm ? `${sm.delivered_count.toLocaleString("es-AR")} entregas completadas, ${sm.in_transit_count.toLocaleString("es-AR")} en curso y ${sm.failed_count.toLocaleString("es-AR")} fallidas.` : "Sin información suficiente para evaluar la operación."}
        recommendation={operationsNeedsAction ? "Resolver entregas fallidas y destrabar los estados con mayor backlog." : "Mantener capacidad logística y reducir gradualmente el tiempo de entrega."}
        metrics={[
          { label: "Cumplimiento", value: sm ? `${sm.fulfillment_rate.toFixed(1)}%` : "—" },
          { label: "Entregas sin fallo", value: deliveryReliability != null ? `${deliveryReliability.toFixed(1)}%` : "—" },
          { label: "Aceptación de ventas", value: som ? `${som.acceptance_rate.toFixed(1)}%` : "—" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Tasa de cumplimiento"
          value={sm ? `${sm.fulfillment_rate.toFixed(1)}%` : "—"}
          trend={fulfillmentTrend ? { value: fulfillmentTrend.label, direction: fulfillmentTrend.direction } : undefined}
          icon={<PackageCheck className="size-5 text-emerald-500" />}
          isLoading={shipmentMetrics.isLoading}
          dataSources={["shipping"]}
        />
        <KpiCard
          label="Tiempo de entrega"
          value={sm ? `${sm.avg_delivery_time_days} días` : "—"}
          trend={deliveryTimeTrend ? { value: deliveryTimeTrend.label, direction: deliveryTimeTrend.direction, positive: deliveryTimeTrend.direction === "down" } : undefined}
          icon={<Clock3 className="size-5 text-blue-500" />}
          isLoading={shipmentMetrics.isLoading}
          dataSources={["shipping"]}
        />
        <KpiCard
          label="Envíos en curso"
          value={sm ? sm.in_transit_count.toLocaleString("es-AR") : "—"}
          trend={pendingShipTrend ? { value: pendingShipTrend.label, direction: pendingShipTrend.direction, positive: false } : undefined}
          icon={<Truck className="size-5 text-amber-500" />}
          isLoading={shipmentMetrics.isLoading}
          dataSources={["shipping"]}
        />
        <KpiCard
          label="Aceptación de ventas"
          value={som ? `${som.acceptance_rate.toFixed(1)}%` : "—"}
          trend={acceptanceTrend ? { value: acceptanceTrend.label, direction: acceptanceTrend.direction } : undefined}
          icon={<CheckCircle2 className="size-5 text-violet-500" />}
          isLoading={salesOrderMetrics.isLoading}
          dataSources={["seller"]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <AnalyticsChartContainer
            title="Embudo de venta a entrega"
            isLoading={salesOrderMetrics.isLoading || shipmentMetrics.isLoading}
            error={salesOrderMetrics.error?.message ?? shipmentMetrics.error?.message}
            isEmpty={funnelData.every((item) => item.count === 0)}
            dataSources={["seller", "shipping"]}
          >
            <ChartContainer config={funnelChartConfig} className="h-[300px] w-full aspect-auto">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 8, right: 30 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} width={82} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={8} barSize={30} />
              </BarChart>
            </ChartContainer>
          </AnalyticsChartContainer>
        </div>

        <div className="xl:col-span-2">
          <AnalyticsChartContainer
            title="Estado de los envíos"
            isLoading={shipments.isLoading}
            error={shipments.error?.message}
            isEmpty={statusData.length === 0}
            dataSources={["shipping"]}
          >
            <ChartContainer config={statusChartConfig} className="mx-auto h-[300px] max-w-md aspect-auto">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="label" hideLabel />} />
                <Pie data={statusData} dataKey="count" nameKey="label" innerRadius={72} outerRadius={104} strokeWidth={3}>
                  {statusData.map((item) => <Cell key={item.status} fill={item.fill} />)}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                              {shipmentList.length.toLocaleString("es-AR")}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 24} className="fill-muted-foreground text-xs">
                              envíos
                            </tspan>
                          </text>
                        )
                      }
                      return null
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </AnalyticsChartContainer>
        </div>
      </div>

      <AnalyticsChartContainer
        title="Rendimiento por transportista"
        isLoading={shipments.isLoading}
        error={shipments.error?.message}
        isEmpty={carrierData.length === 0}
        dataSources={["shipping"]}
      >
        <ChartContainer config={carrierChartConfig} className="h-[330px] w-full aspect-auto">
          <ComposedChart data={carrierData} margin={{ left: 8, right: 12, top: 16 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="carrier" tickLine={false} axisLine={false} />
            <YAxis yAxisId="shipments" tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis yAxisId="days" orientation="right" tickLine={false} axisLine={false} unit=" d" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar yAxisId="shipments" dataKey="shipments" fill="var(--color-shipments)" radius={[7, 7, 0, 0]} barSize={38} />
            <Line yAxisId="days" type="monotone" dataKey="avgDays" stroke="var(--color-avgDays)" strokeWidth={3} dot={{ r: 4 }} />
          </ComposedChart>
        </ChartContainer>
      </AnalyticsChartContainer>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
              Costo logístico por transportista <DataSourceInfo sources={["shipping"]} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-3xl font-bold tracking-tight">{formatARS(totalShippingCost)}</p>
              <p className="text-xs text-muted-foreground">Costo total de los envíos consultados</p>
            </div>
            <div className="space-y-4">
              {carrierData.slice(0, 5).map((carrier) => (
                <div key={carrier.carrier} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{carrier.carrier}</span>
                    <span className="text-muted-foreground">{formatARS(carrier.cost)}</span>
                  </div>
                  <Progress value={totalShippingCost ? (carrier.cost / totalShippingCost) * 100 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">{carrier.fulfillment.toFixed(0)}% entregado</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="xl:col-span-2">
          <AnalyticsChartContainer
            title="Envíos que requieren atención"
            isLoading={shipments.isLoading}
            error={shipments.error?.message}
            isEmpty={attentionShipments.length === 0}
            emptyMessage="No hay envíos demorados, fallidos o devueltos en el período."
            dataSources={["shipping"]}
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Envío</TableHead>
                    <TableHead>Transportista</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Antigüedad</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attentionShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell>
                        <div className="font-medium">{shipment.id}</div>
                        <div className="text-xs text-muted-foreground">{shipment.order_id}</div>
                      </TableCell>
                      <TableCell>{shipment.carrier}</TableCell>
                      <TableCell>
                        <Badge variant={shipment.severity === "critical" ? "destructive" : "secondary"}>
                          {shipment.severity === "critical" && <AlertTriangle className="mr-1 size-3" />}
                          {STATUS_LABELS[shipment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{shipment.age} días</TableCell>
                      <TableCell className="text-right font-medium">{formatARS(shipment.cost_cents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AnalyticsChartContainer>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Lectura gerencial del período</p>
            <p className="text-sm text-muted-foreground">
              {criticalCount > 0
                ? `Priorizar ${criticalCount} casos críticos y revisar capacidad de los transportistas con mayor tiempo promedio.`
                : "La operación no presenta casos críticos. El foco puede mantenerse en reducir tiempos y costo por entrega."}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            Ventas <ArrowRight className="size-4" /> Despacho <ArrowRight className="size-4" /> Entrega
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
