import { createGoogleGenerativeAI } from "@ai-sdk/google"

function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Missing required env var: ${key}. Configure it in .env.local`,
    )
  }
  return value
}

let _provider: ReturnType<typeof createGoogleGenerativeAI> | null = null

function getProvider() {
  if (_provider) return _provider
  const apiKey = requireEnv("GOOGLE_API_KEY")
  _provider = createGoogleGenerativeAI({ apiKey })
  return _provider
}

export function getModel() {
  const modelName = getEnv("AI_MODEL", "gemini-3.1-flash-lite-preview")
  return getProvider().languageModel(modelName)
}

export function getEmbeddingModel() {
  return getProvider().embeddingModel("text-embedding-004")
}

export function resetProvider(): void {
  _provider = null
}
