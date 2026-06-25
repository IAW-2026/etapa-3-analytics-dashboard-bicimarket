import { NextRequest } from "next/server"
import { streamText } from "ai"
import { getModel } from "@/lib/ai/provider"
import { getAdminUser } from "@/lib/auth"

const CHART_EXPLAIN_PROMPT = `Sos un analista de negocios explicando una visualización a un gerente del marketplace BiciMarket.

Analizá los datos del gráfico y proporcioná:

1. **Tendencia** — ¿La métrica sube, baja o se mantiene? ¿Con qué fuerza?
2. **Estadísticas clave** — Mínimo, máximo, promedio, mediana y rango
3. **Puntos notables** — Picos, valles y patrones inusuales
4. **Comparación** — ¿Cómo se compara con el período anterior?
5. **Insight** — ¿Qué conclusión práctica puede sacar el gerente?
6. **Siguiente paso** — Una pregunta sugerida para profundizar

REGLAS:
- Comentá solo sobre datos visibles en el gráfico
- No especules sobre causas sin datos que lo respalden
- Si el gráfico muestra una caída, sugerí posibles investigaciones pero no asumas causas
- Formateá montos en ARS (Pesos Argentinos)
- Respondé siempre en español argentino`

export async function POST(req: NextRequest) {
  if (!(await getAdminUser())) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "Admin requerido" } },
      { status: 403 },
    )
  }

  const { chartType, labels, values, series } = await req.json()

  const userPrompt = [
    `Tipo de gráfico: ${chartType}`,
    `Etiquetas: ${JSON.stringify(labels)}`,
    series
      ? series.map((s: { name: string; data: number[] }) => `${s.name}: ${JSON.stringify(s.data)}`).join("\n")
      : `Valores: ${JSON.stringify(values)}`,
  ].join("\n")

  const model = getModel()
  const result = streamText({
    model,
    system: CHART_EXPLAIN_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  })

  return result.toUIMessageStreamResponse()
}
