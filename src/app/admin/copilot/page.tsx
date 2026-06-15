"use client"

import { useState } from "react"
import { Bot, Send, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SectionHeader } from "@/components/analytics/section-header"

const suggestions = [
  "How was revenue this week?",
  "Which seller performed best?",
  "Show me pending settlements",
  "Why did sales drop yesterday?",
  "Forecast next month's revenue",
]

export default function AICopilotPage() {
  const [input, setInput] = useState("")

  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-6">
      <SectionHeader title="AI Copilot" description="Ask questions about your marketplace in natural language" />

      <div className="flex flex-1 flex-col items-center justify-center rounded-lg border bg-card p-8 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Bot className="size-8 text-primary" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Hi! I&apos;m your marketplace AI assistant.</h2>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          I can help you analyze revenue, orders, settlements, and more.
          Ask me anything about your marketplace data.
        </p>

        <div className="mb-1 text-sm font-medium text-muted-foreground">Try asking:</div>
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
          placeholder="Ask a question about your marketplace..."
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
          title="Coming soon — AI integration"
        >
          <Send className="size-4" />
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        AI Copilot is ready for integration with an LLM provider (OpenAI, Anthropic, Gemini, etc.).
        Connect using the <code className="rounded bg-muted px-1">useChat</code> hook from Vercel AI SDK.
      </p>
    </div>
  )
}
