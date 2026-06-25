"use client"

import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type DataSource = "buyer" | "seller" | "shipping" | "payments"

const SOURCE_LABELS: Record<DataSource, string> = {
  buyer: "Buyer",
  seller: "Seller",
  shipping: "Shipping",
  payments: "Payments",
}

export function DataSourceInfo({ sources }: { sources: DataSource[] }) {
  const sourceText = [...new Set(sources)].map((source) => SOURCE_LABELS[source]).join(" + ")

  return (
    <TooltipProvider delay={250}>
      <Tooltip>
        <TooltipTrigger
          aria-label={`Fuente de datos: ${sourceText}`}
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="size-3" />
        </TooltipTrigger>
        <TooltipContent side="top">Fuente: {sourceText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
