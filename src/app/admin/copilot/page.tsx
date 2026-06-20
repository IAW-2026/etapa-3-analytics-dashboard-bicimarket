"use client"

import { useRef, useState, useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai"
import { Bot, Send, Sparkles, Square, User, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SectionHeader } from "@/components/analytics/section-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { ThinkingAnimation } from "@/components/ai/thinking-animation"
import { ChatChart, isChartData } from "@/components/ai/chat-chart"
import { useDashboardStore } from "@/lib/dashboard-store"

const suggestions = [
  "¿Cuál es nuestra proyección de ingresos para el próximo trimestre?",
  "¿Qué vendedores concentran más ingresos y cómo evolucionan?",
  "¿Conviene subir la comisión general? Simulá escenarios del 12%, 15% y 18%",
  "¿Por qué cayeron las ventas ayer vs. la semana pasada?",
  "¿Cuánto tenemos en liquidaciones pendientes por vendedor?",
]

export default function AICopilotPage() {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const from = useDashboardStore((s) => s.from)
  const to = useDashboardStore((s) => s.to)
  const activeFilters = useMemo(
    () => ({ from: from.toISOString(), to: to.toISOString() }),
    [from, to],
  )

  const { messages, status, error, sendMessage, stop, regenerate, clearError } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat", body: { activeFilters } }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  })

  const isLoading = status === "submitted" || status === "streaming"

  function handleSend(text: string) {
    if (!text.trim() || isLoading) return
    sendMessage({ text: text.trim() })
    setInput("")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  function handleSuggestionClick(q: string) {
    sendMessage({ text: q })
    setInput("")
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-4">
      <SectionHeader
        title="Copilot IA"
        description="Hacé preguntas sobre tu marketplace en lenguaje natural"
        hideFilter
      />

      <div className="flex min-h-0 flex-1 flex-col rounded-lg border bg-card">
        <ScrollArea ref={scrollRef} className="flex-1 min-h-0 px-4 py-4">
          {messages.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
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
                    onClick={() => handleSuggestionClick(q)}
                  >
                    <Sparkles className="size-3" />
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.filter((msg) => {
                if (msg.role === "user") return true
                return msg.parts.some((p) => p.type === "text" || p.type === "reasoning" || p.type === "tool-result")
              }).map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="size-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] overflow-x-auto break-words rounded-lg px-4 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    {msg.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <div key={i} className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {part.text}
                              </ReactMarkdown>
                            </div>
                          )
                        case "reasoning":
                          return null
                        default:
                          if (
                            (part.type === "dynamic-tool" || part.type.startsWith("tool-")) &&
                            "state" in part &&
                            part.state === "output-available" &&
                            isChartData(part.output)
                          ) {
                            return <ChatChart key={i} data={part.output} />
                          }
                          return null
                      }
                    })}
                  </div>
                  {msg.role === "user" && (
                    <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary">
                      <User className="size-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {(() => {
                const lastMsg = messages[messages.length - 1]
                const hasNoText = !lastMsg || lastMsg.role !== "assistant" || !lastMsg.parts.some((p) => p.type === "text" && p.text.trim())
                if (isLoading && hasNoText) {
                  return (
                    <div className="flex gap-3 justify-start">
                      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="size-4 text-primary" />
                      </div>
                      <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2.5">
                        <ThinkingAnimation />
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              {error && (
                <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
                  <AlertCircle className="size-5 shrink-0 text-destructive" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">Error al conectar con la IA</p>
                    <p className="text-muted-foreground">{error.message || "Ocurrió un error inesperado. Intentá de nuevo."}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearError}>
                    <RefreshCw className="mr-1 size-3" />
                    Reintentar
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center gap-2 border-t p-3">
          <Input
            ref={inputRef}
            placeholder="Hacé una pregunta sobre tu marketplace..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
            disabled={isLoading}
          />
          {isLoading ? (
            <Button size="icon" variant="secondary" onClick={stop} title="Detener">
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              disabled={!input.trim()}
              variant="default"
              onClick={() => handleSend(input)}
              title="Enviar"
            >
              <Send className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1 text-center">
        <p className="text-xs text-muted-foreground">
          Copilot IA usa Gemini 3.1 Flash Lite. Los datos se consultan en tiempo real a través del dashboard.
        </p>
        <p className="text-[11px] text-muted-foreground/60">
          La IA puede cometer errores. Verificá la información importante con las fuentes originales del dashboard.
        </p>
      </div>
    </div>
  )
}
