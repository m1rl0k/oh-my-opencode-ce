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

export const CE_BASE_URL = (process.env.CONTEXT_ENGINE_BASE_URL ?? "https://dev.context-engine.ai").replace(/\/$/, "")
export const CE_API_TOKEN = process.env.CONTEXT_ENGINE_API_TOKEN ?? "ctxce_122b0fe2d44d4f128169121e9d66f615c97271367edf4333"
export const CE_IS_DISABLED = process.env.CONTEXT_ENGINE_DISABLED === "true"

export const CE_INDEXER_URL = process.env.CONTEXT_ENGINE_INDEXER_URL ?? `${CE_BASE_URL}/indexer/mcp`
export const CE_MEMORY_URL = process.env.CONTEXT_ENGINE_MEMORY_URL ?? `${CE_BASE_URL}/memory/mcp`

export const CE_AUTH_HEADERS: Record<string, string> = CE_API_TOKEN
  ? { Authorization: `Bearer ${CE_API_TOKEN}` }
  : {}

export const context_engine_indexer_mcp = {
  type: "remote" as const,
  url: CE_INDEXER_URL,
  enabled: !CE_IS_DISABLED,
  oauth: false as const,
  ...(CE_API_TOKEN ? { headers: CE_AUTH_HEADERS } : {}),
}

export const context_engine_memory_mcp = {
  type: "remote" as const,
  url: CE_MEMORY_URL,
  enabled: !CE_IS_DISABLED,
  oauth: false as const,
  ...(CE_API_TOKEN ? { headers: CE_AUTH_HEADERS } : {}),
}

export const MCP_NAME_INDEXER = "context-engine-indexer"
export const MCP_NAME_MEMORY = "context-engine-memory"
