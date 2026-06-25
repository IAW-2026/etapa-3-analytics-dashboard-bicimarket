import { embed, embedMany, cosineSimilarity } from "ai"
import { getEmbeddingModel } from "./provider"
import * as fs from "node:fs/promises"
import * as path from "node:path"

/* ── Types ───────────────────────────────────────────── */

interface Chunk {
  id: string
  text: string
  source: string
  heading: string
}

interface ChunkWithEmbedding extends Chunk {
  embedding: number[]
}

/* ── Configuration ───────────────────────────────────── */

const CHUNK_SIZE = 512
const CHUNK_OVERLAP = 64
const TOP_K = 5

const DOC_PATHS = [
  "docs/manager-dashboard/03-metrics/01-revenue.md",
  "docs/manager-dashboard/03-metrics/02-orders.md",
  "docs/manager-dashboard/03-metrics/03-products.md",
  "docs/manager-dashboard/03-metrics/04-operations.md",
  "docs/manager-dashboard/03-metrics/05-finance.md",
  "docs/manager-dashboard/03-metrics/06-customers.md",
  "docs/manager-dashboard/01-system-analysis/03-kpi-inventory.md",
]

/* ── Chunking ────────────────────────────────────────── */

function splitIntoChunks(text: string, source: string): Chunk[] {
  const lines = text.split("\n")
  const chunks: Chunk[] = []
  let currentHeading = "General"
  let buffer: string[] = []
  let charCount = 0

  function flush() {
    if (buffer.length === 0) return
    const chunkText = buffer.join("\n").trim()
    if (!chunkText) return
    chunks.push({
      id: `${source}::${chunks.length}`,
      text: chunkText,
      source,
      heading: currentHeading,
    })
  }

  for (const line of lines) {
    if (line.startsWith("## ")) {
      flush()
      currentHeading = line.replace(/^##\s+/, "").trim()
      buffer = [line]
      charCount = line.length
      continue
    }

    buffer.push(line)
    charCount += line.length + 1

    if (charCount >= CHUNK_SIZE) {
      flush()
      const overlapLines = getOverlapLines(buffer, CHUNK_OVERLAP)
      buffer = [...overlapLines]
      charCount = overlapLines.reduce((sum, l) => sum + l.length + 1, 0)
    }
  }

  flush()
  return chunks
}

function getOverlapLines(lines: string[], targetChars: number): string[] {
  const result: string[] = []
  let count = 0
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    if (count + line.length > targetChars && result.length > 0) break
    result.unshift(line)
    count += line.length + 1
  }
  return result
}

/* ── Document Loader ─────────────────────────────────── */

async function loadDocuments(): Promise<Chunk[]> {
  const allChunks: Chunk[] = []
  const projectRoot = process.cwd()

  for (const relPath of DOC_PATHS) {
    const fullPath = path.join(projectRoot, relPath)
    try {
      const content = await fs.readFile(fullPath, "utf-8")
      const chunks = splitIntoChunks(content, relPath)
      allChunks.push(...chunks)
    } catch {
      console.warn(`[RAG] Could not read ${relPath}, skipping`)
    }
  }

  return allChunks
}

/* ── Vector Store (in-memory) ────────────────────────── */

let store: ChunkWithEmbedding[] | null = null

async function ensureIndexed() {
  if (store) return

  const model = getEmbeddingModel()
  const chunks = await loadDocuments()
  const texts = chunks.map((c) => c.text)

  const { embeddings } = await embedMany({ model, values: texts })

  store = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i] as number[],
  }))
}

export async function retrieveContext(
  query: string,
  topK: number = TOP_K,
): Promise<Chunk[]> {
  await ensureIndexed()
  if (!store || store.length === 0) return []

  const model = getEmbeddingModel()
  const { embedding } = await embed({ model, value: query })

  const scored = store
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(embedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return scored.map((s) => ({
    id: s.chunk.id,
    text: s.chunk.text,
    source: s.chunk.source,
    heading: s.chunk.heading,
  }))
}

export function formatRagContext(chunks: Chunk[]): string {
  if (chunks.length === 0) return ""

  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] Source: ${c.source} — ${c.heading}\n${c.text}`,
    )
    .join("\n\n---\n\n")
}

export function isRagIndexed(): boolean {
  return store !== null && store.length > 0
}

export function getStoredChunkCount(): number {
  return store?.length ?? 0
}
