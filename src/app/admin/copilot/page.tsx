"use client"

import { useState } from "react"
import { Bot, Send, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SectionHeader } from "@/components/analytics/section-header"

const suggestions = [
  "¿Cómo fueron los ingresos esta semana?",
  "¿Qué vendedor rindió mejor?",
  "Mostrame las liquidaciones pendientes",
  "¿Por qué bajaron las ventas ayer?",
  "Pronosticá los ingresos del próximo mes",
]

export default function AICopilotPage() {
  const [input, setInput] = useState("")

  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-6">
      <SectionHeader title="Copilot IA" description="Hacé preguntas sobre tu marketplace en lenguaje natural" />

      <div className="flex flex-1 flex-col items-center justify-center rounded-lg border bg-card p-8 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Bot className="size-8 text-primary" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">¡Hola! Soy tu asistente IA del marketplace.</h2>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          Puedo ayudarte a analizar ingresos, órdenes, liquidaciones y más.
          Preguntame cualquier cosa sobre los datos de tu marketplace.
        </p>

        <div className="mb-1 text-sm font-medium text-muted-foreground">Probá preguntar:</div>
        <div className="flex flex-wrap justify-center gap-2">
          {suggestions.map((q) => (
            <Button
              key={q}
              variant="secondary"
              size="sm"
              className="gap-1.5 rounded-full text-xs"
              onClick={() => setInput(q)}
            >
              <Sparkles className="size-3" />
              {q}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
        <Input
          placeholder="Hacé una pregunta sobre tu marketplace..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              e.preventDefault()
            }
          }}
        />
        <Button
          size="icon"
          disabled={!input.trim()}
          variant="default"
          className="shrink-0"
          title="Pronto — integración con IA"
        >
          <Send className="size-4" />
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Copilot IA está listo para integrarse con un proveedor LLM (OpenAI, Anthropic, Gemini, etc.).
        Conectalo usando el hook <code className="rounded bg-muted px-1">useChat</code> de Vercel AI SDK.
      </p>
    </div>
  )
}
