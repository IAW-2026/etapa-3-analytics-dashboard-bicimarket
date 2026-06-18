"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { useRevenueByMethod } from "@/hooks/use-dashboard-data"
import { translateMethod } from "@/lib/labels"

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"]

function formatARS(cents: number | undefined | null) {
  if (cents == null || Number.isNaN(cents)) return "—"
  return `ARS ${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`
}

export default function CustomerAnalyticsPage() {
  const byMethod = useRevenueByMethod()

  const methodData = byMethod.data?.map((m) => ({
    label: translateMethod(m.method),
    value: m.value,
  })) ?? []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader title="Analítica de Clientes" description="Adquisición, comportamiento y segmentación de clientes" />

      <Alert>
        <Info className="size-4" />
        <AlertTitle>Disponibilidad Limitada de Datos</AlertTitle>
        <AlertDescription>
          La Analítica de Clientes requiere un endpoint del Buyer App (<code>GET /api/v1/admin/buyers</code>) que aún no está disponible.
          Solo se muestran los datos de Uso de Métodos de Pago (del Payments App) a continuación.
          Todas las tarjetas KPI, gráficos de adquisición y datos de segmentación requieren el endpoint del Buyer App.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Compradores" value="—" />
        <KpiCard label="Nuevos Compradores" value="—" />
        <KpiCard label="Tasa de Recompra" value="—" />
        <KpiCard label="Compradores en Riesgo" value="—" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Adquisición de Compradores (Últimos 12 Meses)" isLoading={false}>
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            Datos no disponibles — requiere endpoint del Buyer App
          </div>
        </ChartContainer>

        <ChartContainer title="Segmentos de Clientes" isLoading={false}>
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            Datos no disponibles — requiere endpoint del Buyer App
          </div>
        </ChartContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Compradores en Riesgo" isLoading={false}>
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            Datos no disponibles — requiere endpoint del Buyer App
          </div>
        </ChartContainer>

        <ChartContainer title="Uso de Métodos de Pago" isLoading={byMethod.isLoading} error={byMethod.error?.message} isEmpty={methodData.length === 0}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={methodData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="label" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {methodData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => [formatARS(Number(value ?? 0)), "Volumen"]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
