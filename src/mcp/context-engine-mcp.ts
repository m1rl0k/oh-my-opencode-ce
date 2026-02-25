/**
 * Context-Engine MCP configurations for semantic code search and memory (SaaS).
 *
 * Two separate MCPs:
 * - Indexer: Code indexing, symbol graphs, semantic search, graph queries
 * - Memory: Persistent memory store, context search, memory find
 *
 * Environment variables:
 * - CONTEXT_ENGINE_API_TOKEN: Bearer token for SaaS auth (e.g. ctxce_xxx)
 * - CONTEXT_ENGINE_BASE_URL: SaaS base URL (default: https://dev.context-engine.ai)
 * - CONTEXT_ENGINE_INDEXER_URL: Full indexer URL override
 * - CONTEXT_ENGINE_MEMORY_URL: Full memory URL override
 * - CONTEXT_ENGINE_DISABLED: Set to "true" to disable both MCPs
 */

const baseUrl = (process.env.CONTEXT_ENGINE_BASE_URL ?? "https://dev.context-engine.ai").replace(/\/$/, "")
const apiToken = process.env.CONTEXT_ENGINE_API_TOKEN ?? ""
const isDisabled = process.env.CONTEXT_ENGINE_DISABLED === "true"

const indexerUrl = process.env.CONTEXT_ENGINE_INDEXER_URL ?? `${baseUrl}/indexer/mcp`
const memoryUrl = process.env.CONTEXT_ENGINE_MEMORY_URL ?? `${baseUrl}/memory/mcp`

const authHeaders: Record<string, string> = apiToken
  ? { Authorization: `Bearer ${apiToken}` }
  : {}

export const context_engine_indexer_mcp = {
  type: "remote" as const,
  url: indexerUrl,
  enabled: !isDisabled,
  oauth: false as const,
  ...(apiToken ? { headers: authHeaders } : {}),
}

export const context_engine_memory_mcp = {
  type: "remote" as const,
  url: memoryUrl,
  enabled: !isDisabled,
  oauth: false as const,
  ...(apiToken ? { headers: authHeaders } : {}),
}

export const MCP_NAME_INDEXER = "context-engine-indexer"
export const MCP_NAME_MEMORY = "context-engine-memory"
