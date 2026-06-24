"use client"

import { AlertTriangle, Ban, Info } from "lucide-react"
import { DataSourceInfo, type DataSource } from "@/components/analytics/data-source-info"
import type { AttentionItem } from "@/lib/mock/types"

interface AttentionItemsProps {
  items: AttentionItem[]
  dataSources?: DataSource[]
}

const severityConfig = {
  critical: { icon: Ban, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-900" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-900" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-900" },
}

function Title({ dataSources }: { dataSources?: DataSource[] }) {
  return (
    <div className="flex items-center gap-1.5">
      <h3 className="text-sm font-medium">Atención requerida</h3>
      {dataSources?.length ? <DataSourceInfo sources={dataSources} /> : null}
    </div>
  )
}

export function AttentionItems({ items, dataSources }: AttentionItemsProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border p-4">
        <Title dataSources={dataSources} />
        <p className="mt-2 text-sm text-muted-foreground">No hay elementos que requieran atención.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-4">
      <Title dataSources={dataSources} />
      <div className="mt-3 space-y-2">
        {items.map((item) => {
          const config = severityConfig[item.severity]
          const Icon = config.icon
          return (
            <div key={item.id} className={`flex items-start gap-3 rounded-md border p-3 ${config.bg} ${config.border}`}>
              <Icon className={`mt-0.5 size-4 shrink-0 ${config.color}`} />
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
