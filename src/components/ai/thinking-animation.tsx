"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const DEFAULT_WORDS = [
  "pensando", "analizando", "cocinando", "procesando",
  "consultando", "computando", "calculando", "reflexionando",
]

interface ThinkingAnimationProps {
  words?: string[]
  speed?: number
  size?: "sm" | "md"
  className?: string
}

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-primary)",
  "var(--color-ring)",
  "var(--color-chart-3)",
  "var(--color-chart-5)",
  "var(--color-chart-2)",
  "var(--color-chart-4)",
  "var(--color-chart-1)",
  "var(--color-ring)",
  "var(--color-primary)",
]

export function ThinkingAnimation({
  words = DEFAULT_WORDS,
  speed = 3000,
  size = "sm",
  className,
}: ThinkingAnimationProps) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * words.length))
  const [phase, setPhase] = useState<"in" | "out">("in")

  useEffect(() => {
    if (words.length === 0) return
    const fadeOut = setTimeout(() => setPhase("out"), speed - 200)
    const fadeIn = setTimeout(() => {
      setIdx((i) => (i + 1) % words.length)
      setPhase("in")
    }, speed)
    return () => { clearTimeout(fadeOut); clearTimeout(fadeIn) }
  }, [idx, words, speed])

  const word = words[idx]
  if (!word) return null

  return (
    <span
      role="status"
      aria-label="Procesando tu consulta"
      className={cn(
        "inline-flex items-center gap-1",
        size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
    >
      <span className={cn("inline-flex", phase === "in" ? "think-word" : "think-word-out")}>
        {word.split("").map((letter, li) => (
          <span
            key={`${word}-${li}`}
            className="think-letter inline-block"
            style={{
              color: COLORS[(idx * word.length + li) % COLORS.length],
              animation: `thinkLetter 2.5s ease-in-out ${li * 0.08}s infinite`,
            }}
          >
            {letter === " " ? "\u00A0" : letter}
          </span>
        ))}
      </span>
      <span
        className="think-pulse inline-block"
        style={{ animation: "thinkPulse 1.6s ease-in-out infinite" }}
      >
        ...
      </span>
    </span>
  )
}
