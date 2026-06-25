import { generateText } from "ai"
import { getModel } from "./provider"

export type Intent =
  | "query"
  | "compare"
  | "analyze"
  | "forecast"
  | "explain"
  | "whatif"
  | "rootcause"

const INTENTS: Intent[] = [
  "query",
  "compare",
  "analyze",
  "forecast",
  "explain",
  "whatif",
  "rootcause",
]

const CLASSIFIER_PROMPT = `You are an intent classifier for a marketplace analytics dashboard.
Given a user query, classify it into exactly one of these intents:

- query: Asking for specific data or metrics ("How much revenue last week?", "Show me pending settlements")
- compare: Comparing periods or entities ("How does this week compare to last?", "Which seller performed better?")
- analyze: Understanding why something happened ("Why did sales drop?", "What caused the spike in refunds?")
- forecast: Predicting future values ("Predict next month revenue", "What will orders look like next week?")
- explain: Explaining a visualization or data point ("Explain this chart", "Why is this metric important?")
- whatif: Running hypothetical scenarios ("What if we raise commission to 12%?", "If we reduce fees by 2%")
- rootcause: Investigating root causes of metric changes ("Investigate why sales dropped", "Why are refunds increasing?")

Respond with ONLY the intent word, nothing else.`

export async function classifyIntent(userMessage: string): Promise<Intent> {
  const model = getModel()

  const { text } = await generateText({
    model,
    system: CLASSIFIER_PROMPT,
    prompt: userMessage,
    temperature: 0,
    maxOutputTokens: 16,
  })

  const cleaned = text.trim().toLowerCase() as Intent

  if (INTENTS.includes(cleaned)) {
    return cleaned
  }

  return "query"
}
