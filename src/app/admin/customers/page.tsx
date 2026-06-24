"use client"

import { ComposedChart, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Line, LabelList, Legend } from "recharts"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ExecutiveHealthCard } from "@/components/analytics/executive-health-card"
import { ChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { useRevenueByMethod, useBuyerMetrics, usePrevBuyerMetrics, useBuyers } from "@/hooks/use-dashboard-data"
import { translateMethod } from "@/lib/labels"
import { computeTrend } from "@/lib/trends"
import { Users } from "lucide-react"
import { calculateHealth, inversePercentage } from "@/lib/health-score"

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"]

function formatARS(cents: number | undefined | null) {
  if (cents == null || Number.isNaN(cents)) return "—"
  return `ARS ${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`
}

export default function CustomerAnalyticsPage() {
  const byMethod = useRevenueByMethod()
  const buyerMetrics = useBuyerMetrics()
  const prevBuyerMetrics = usePrevBuyerMetrics()
  const buyers = useBuyers({ limit: 100 })

  const methodData = byMethod.data?.map((m) => ({
    label: translateMethod(m.method),
    value: m.value,
  })) ?? []

  const newBuyersTrend = computeTrend(
    prevBuyerMetrics.data?.new_this_period,
    buyerMetrics.data?.new_this_period,
  )
  const customerRetention = inversePercentage(buyerMetrics.data?.at_risk_count, buyerMetrics.data?.total)
  const customerHealth = calculateHealth([
    { value: buyerMetrics.data?.repeat_rate, weight: 60, critical: true },
    { value: customerRetention, weight: 40 },
  ])
  const customersNeedAction = customerHealth && ["urgent", "alert", "attention"].includes(customerHealth.status)

  const MONTH_NAMES_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

  // Agrupa compradores por mes de created_at para el gráfico de adquisición
  const acquisitionData = (() => {
    const list = buyers.data?.data ?? []
    const buckets = new Map<string, number>()
    for (const b of list) {
      const month = b.created_at.slice(0, 7) // "YYYY-MM"
      buckets.set(month, (buckets.get(month) ?? 0) + 1)
    }
    const entries = Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b))
    return entries.map(([month, count], i) => {
      const cumulative = entries.slice(0, i + 1).reduce((sum, [, monthlyCount]) => sum + monthlyCount, 0)
      const [year, monthNum] = month.split("-")
      const prevYear = i > 0 ? entries[i - 1][0].split("-")[0] : null
      const label = prevYear !== year
        ? `${MONTH_NAMES_ES[parseInt(monthNum) - 1]} '${year.slice(2)}`
        : MONTH_NAMES_ES[parseInt(monthNum) - 1]
      return { label, count, cumulative }
    })
  })()

  // Segmenta compradores por cantidad de órdenes
  const segmentData = (() => {
    const list = buyers.data?.data ?? []
    const bins = { "Sin órdenes": 0, "1 orden": 0, "2-4 órdenes": 0, "5+ órdenes": 0 }
    for (const b of list) {
      if (b.orders_count === 0) bins["Sin órdenes"]++
      else if (b.orders_count === 1) bins["1 orden"]++
      else if (b.orders_count <= 4) bins["2-4 órdenes"]++
      else bins["5+ órdenes"]++
    }
    return Object.entries(bins)
      .filter(([, count]) => count > 0)
      .map(([label, count]) => ({ label, count }))
  })()

  // Distribución exacta de órdenes por comprador (0, 1, 2, 3, 4, 5, 6+)
  const frequencyData = (() => {
    const list = buyers.data?.data ?? []
    const buckets: Record<string, number> = { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6+": 0 }
    for (const b of list) {
      const key = b.orders_count >= 6 ? "6+" : String(b.orders_count)
      buckets[key] = (buckets[key] ?? 0) + 1
    }
    return Object.entries(buckets)
      .filter(([, count]) => count > 0)
      .map(([label, count]) => ({ label, count }))
  })()

  const topBuyers = [...(buyers.data?.data ?? [])]
    .sort((a, b) => b.orders_count - a.orders_count)
    .slice(0, 10)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader title="Analítica de Clientes" description="Adquisición, comportamiento y segmentación de clientes" />

      <ExecutiveHealthCard
        section="Clientes"
        result={customerHealth}
        sources={["buyer"]}
        isLoading={buyerMetrics.isLoading}
        error={buyerMetrics.error?.message}
        summary={buyerMetrics.data ? `${buyerMetrics.data.repeat_rate.toFixed(1)}% de recompra y ${buyerMetrics.data.at_risk_count.toLocaleString("es-AR")} compradores sin actividad reciente.` : "Sin información suficiente para evaluar la base de clientes."}
        recommendation={customersNeedAction ? "Activar campañas de recompra y recuperación para los compradores con riesgo de abandono." : "Profundizar fidelización y mantener activa la base de compradores recurrentes."}
        metrics={[
          { label: "Tasa de recompra", value: buyerMetrics.data ? `${buyerMetrics.data.repeat_rate.toFixed(1)}%` : "—" },
          { label: "Retención estimada", value: customerRetention != null ? `${customerRetention.toFixed(1)}%` : "—" },
          { label: "Nuevos compradores", value: buyerMetrics.data?.new_this_period.toLocaleString("es-AR") ?? "—" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Compradores"
          value={buyerMetrics.data?.total != null ? buyerMetrics.data.total.toLocaleString("es-AR") : "—"}
          isLoading={buyerMetrics.isLoading}
          dataSources={["buyer"]}
        />
        <KpiCard
          label="Nuevos Compradores"
          value={buyerMetrics.data?.new_this_period != null ? buyerMetrics.data.new_this_period.toLocaleString("es-AR") : "—"}
          trend={newBuyersTrend ? { value: newBuyersTrend.label, direction: newBuyersTrend.direction } : undefined}
          isLoading={buyerMetrics.isLoading}
          dataSources={["buyer"]}
        />
        <KpiCard
          label="Tasa de Recompra"
          value={buyerMetrics.data?.repeat_rate != null ? `${buyerMetrics.data.repeat_rate.toFixed(1)}%` : "—"}
          isLoading={buyerMetrics.isLoading}
          dataSources={["buyer"]}
        />
        <KpiCard
          label="Compradores en Riesgo"
          value={buyerMetrics.data?.at_risk_count != null ? buyerMetrics.data.at_risk_count.toLocaleString("es-AR") : "—"}
          isLoading={buyerMetrics.isLoading}
          dataSources={["buyer"]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer
          title="Adquisición de Compradores"
          isLoading={buyers.isLoading}
          error={buyers.error?.message}
          isEmpty={acquisitionData.length === 0}
          dataSources={["buyer"]}
        >
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={acquisitionData} margin={{ top: 20, right: 32, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11 }}
                allowDecimals={false}
                className="text-muted-foreground"
                width={28}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                allowDecimals={false}
                className="text-muted-foreground"
                width={36}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                formatter={(value, name) =>
                  name === "count" ? [value, "Nuevos este mes"] : [value, "Acumulado"]
                }
              />
              <Legend
                formatter={(value) => value === "count" ? "Nuevos" : "Acumulado"}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar yAxisId="left" dataKey="count" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey="count"
                  position="top"
                  style={{ fontSize: 10, fill: "var(--color-muted-foreground, #888)" }}
                />
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Segmentos de Clientes"
          isLoading={buyers.isLoading}
          error={buyers.error?.message}
          isEmpty={segmentData.length === 0}
          dataSources={["buyer"]}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <Pie
                data={segmentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                minAngle={10}
                dataKey="count"
                nameKey="label"
                label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {segmentData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, "Compradores"]} />
              <Legend wrapperStyle={{ fontSize: "12px" }} formatter={(value: string) => <span className="text-muted-foreground">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartContainer
          title="Frecuencia de Compra"
          isLoading={buyers.isLoading}
          error={buyers.error?.message}
          isEmpty={frequencyData.length === 0}
          dataSources={["buyer"]}
        >
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={frequencyData} margin={{ top: 24, right: 8, left: 0, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" height={44} label={{ value: "órdenes", position: "insideBottom", offset: 0, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-muted-foreground" width={28} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                formatter={(value) => [value, "Compradores"]}
                labelFormatter={(label) => `${label} orden${label === "1" ? "" : "es"}`}
              />
              <Bar dataKey="count" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: "var(--color-muted-foreground, #888)" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Compradores en Riesgo"
          isLoading={buyerMetrics.isLoading}
          error={buyerMetrics.error?.message}
          isEmpty={false}
          dataSources={["buyer"]}
        >
          <div className="flex h-[230px] flex-col items-center justify-center gap-3 text-center">
            <Users className="size-10 text-muted-foreground" />
            <p className="text-4xl font-bold">
              {buyerMetrics.data?.at_risk_count ?? "—"}
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Compradores con historial de compras pero sin actividad en los últimos 60 días
            </p>
          </div>
        </ChartContainer>

        <ChartContainer
          title="Uso de Métodos de Pago"
          isLoading={byMethod.isLoading}
          error={byMethod.error?.message}
          isEmpty={methodData.length === 0}
          dataSources={["payments"]}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <Pie
                data={methodData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                minAngle={10}
                dataKey="value"
                nameKey="label"
                label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {methodData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => [formatARS(Number(value ?? 0)), "Volumen"]} />
              <Legend wrapperStyle={{ fontSize: "12px" }} formatter={(value: string) => <span className="text-muted-foreground">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      <ChartContainer
        title="Top Compradores"
        isLoading={buyers.isLoading}
        error={buyers.error?.message}
        isEmpty={topBuyers.length === 0}
        dataSources={["buyer"]}
      >
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">#</th>
              <th className="pb-2 pr-4 font-medium">Nombre</th>
              <th className="pb-2 pr-4 font-medium">Email</th>
              <th className="pb-2 text-right font-medium">Órdenes</th>
            </tr>
          </thead>
          <tbody>
            {topBuyers.map((b, i) => (
              <tr key={b.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                <td className="py-2 pr-4 font-medium">{b.full_name}</td>
                <td className="py-2 pr-4 text-muted-foreground">{b.email}</td>
                <td className="py-2 text-right tabular-nums">{b.orders_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ChartContainer>
    </div>
  )
}
