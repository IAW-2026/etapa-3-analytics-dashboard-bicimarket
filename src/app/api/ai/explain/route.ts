import { NextRequest } from "next/server"
import { streamText } from "ai"
import { getModel } from "@/lib/ai/provider"
import { getAdminUser } from "@/lib/auth"

const CHART_EXPLAIN_PROMPT = `You are explaining a data visualization to a marketplace manager.

The chart data will be provided in the message. Analyze it and provide:

1. **Trend** — Is the metric going up, down, or flat? How strongly?
2. **Key statistics** — Min, max, mean, median, and range
3. **Notable points** — Peaks, valleys, and unusual patterns
4. **Comparison** — How does this compare to the previous period?
5. **Insight** — What actionable takeaway can the manager derive?
6. **Follow-up** — One suggested next question

CRITICAL RULES:
- Only comment on data visible in the chart
- Do not speculate about causes without data to support it
- If the chart shows a decline, suggest possible investigations but never assume causes
- Format currency values in ARS (Argentine Pesos)
- Respond in Spanish (Argentina)`

export async function POST(req: NextRequest) {
  if (!(await getAdminUser())) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "Admin requerido" } },
      { status: 403 },
    )
  }

  const { chartType, labels, values, series } = await req.json()

  const userPrompt = [
    `Chart type: ${chartType}`,
    `Labels: ${JSON.stringify(labels)}`,
    series
      ? series.map((s: { name: string; data: number[] }) => `${s.name}: ${JSON.stringify(s.data)}`).join("\n")
      : `Values: ${JSON.stringify(values)}`,
  ].join("\n")

  const model = getModel()
  const result = streamText({
    model,
    system: CHART_EXPLAIN_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  })

  return result.toUIMessageStreamResponse()
}
