"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-primary)",
]

interface ChartData {
  type: "chart"
  chartType: "line" | "bar" | "pie"
  title: string
  labels: string[]
  values: number[]
  series?: { name: string; data: number[] }[]
}

export function ChatChart({ data }: { data: ChartData }) {
  if (data.chartType === "pie") {
    const pieData = data.labels.map((label, i) => ({
      name: label,
      value: data.values[i] ?? 0,
    }))

    return (
      <div className="my-2">
        <p className="mb-1 text-xs font-medium text-muted-foreground">{data.title}</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={70}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (data.series && data.series.length > 0) {
    const multiData = data.labels.map((label, i) => {
      const point: Record<string, string | number> = { name: label }
      for (const s of data.series!) {
        point[s.name] = s.data[i] ?? 0
      }
      return point
    })

    const ChartComponent = data.chartType === "bar" ? BarChart : LineChart
    const DataComponent = data.chartType === "bar" ? Bar : Line

    return (
      <div className="my-2">
        <p className="mb-1 text-xs font-medium text-muted-foreground">{data.title}</p>
        <ResponsiveContainer width="100%" height={200}>
          <ChartComponent data={multiData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            {data.series.map((s, i) => (
              <DataComponent
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                strokeWidth={2}
              />
            ))}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    )
  }

  const singleData = data.labels.map((label, i) => ({
    name: label,
    value: data.values[i] ?? 0,
  }))

  const ChartComponent = data.chartType === "bar" ? BarChart : LineChart
  const DataComponent = data.chartType === "bar" ? Bar : Line

  return (
    <div className="my-2">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{data.title}</p>
      <ResponsiveContainer width="100%" height={200}>
        <ChartComponent data={singleData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <DataComponent
            type="monotone"
            dataKey="value"
            stroke={COLORS[0]}
            fill={COLORS[0]}
            strokeWidth={2}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}

export function isChartData(value: unknown): value is ChartData {
  if (!value || typeof value !== "object") return false
  const obj = value as Record<string, unknown>
  return (
    obj.type === "chart" &&
    typeof obj.chartType === "string" &&
    ["line", "bar", "pie"].includes(obj.chartType as string) &&
    typeof obj.title === "string" &&
    Array.isArray(obj.labels) &&
    Array.isArray(obj.values)
  )
}
