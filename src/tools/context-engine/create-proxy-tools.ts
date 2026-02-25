/**
 * Factory for Context-Engine proxy tools.
 *
 * Creates plugin-level tools that proxy to CE SaaS MCP endpoints.
 * These tools go through ToolRegistry (not MCP.tools()), so they
 * are available to ALL sessions including subagents.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import { CeMcpClientManager, type CeMcpEndpoint } from "./mcp-client"
import { KNOWN_CE_TOOLS } from "./known-tools"
import { log } from "../../shared"
import {
  CE_API_TOKEN,
  CE_INDEXER_URL,
  CE_MEMORY_URL,
  CE_IS_DISABLED,
  CE_AUTH_HEADERS,
} from "../../mcp/context-engine-mcp"

function buildEndpoints(): { indexer: CeMcpEndpoint; memory: CeMcpEndpoint } {
  return {
    indexer: { name: "context-engine-indexer", url: CE_INDEXER_URL, headers: CE_AUTH_HEADERS },
    memory: { name: "context-engine-memory", url: CE_MEMORY_URL, headers: CE_AUTH_HEADERS },
  }
}

/**
 * Creates CE proxy tools registered as plugin custom tools.
 *
 * Returns empty record if CE is disabled or not configured.
 * MCP connection happens lazily on first tool call.
 */
export function createContextEngineProxyTools(): Record<string, ToolDefinition> {
  if (CE_IS_DISABLED) {
    log("[ce-proxy] Context-Engine disabled via CONTEXT_ENGINE_DISABLED=true")
    return {}
  }

  if (!CE_API_TOKEN) {
    log("[ce-proxy] No CONTEXT_ENGINE_API_TOKEN set, skipping CE proxy tools")
    return {}
  }

  const endpoints = buildEndpoints()
  const manager = new CeMcpClientManager(endpoints.indexer, endpoints.memory)

  // Start connecting in background (non-blocking)
  manager.warmup().catch((err) => {
    log(`[ce-proxy] Background warmup failed: ${err instanceof Error ? err.message : err}`)
  })

  return buildKnownProxyTools(manager)
}

function buildKnownProxyTools(manager: CeMcpClientManager): Record<string, ToolDefinition> {
  const tools: Record<string, ToolDefinition> = {}

  for (const entry of KNOWN_CE_TOOLS) {
    const serverPrefix = entry.server === "indexer" ? "context-engine-indexer" : "context-engine-memory"
    const key = `${serverPrefix}_${entry.mcpName}`
    const caller = entry.server === "indexer"
      ? (args: Record<string, unknown>) => manager.callIndexerTool(entry.mcpName, args)
      : (args: Record<string, unknown>) => manager.callMemoryTool(entry.mcpName, args)

    tools[key] = makeProxyTool(entry.mcpName, entry.description, caller)
  }

  log(`[ce-proxy] Registered ${Object.keys(tools).length} CE proxy tools`)
  return tools
}

function makeProxyTool(
  mcpToolName: string,
  description: string,
  callMcp: (args: Record<string, unknown>) => Promise<unknown>,
): ToolDefinition {
  return tool({
    description,
    args: {
      arguments: tool.schema
        .union([tool.schema.string(), tool.schema.object({})])
        .optional()
        .describe("JSON string or object of tool arguments"),
    },
    async execute(rawArgs: { arguments?: string | Record<string, unknown> }) {
      const parsed = parseArgs(rawArgs.arguments)
      try {
        const result = await callMcp(parsed)
        return typeof result === "string" ? result : JSON.stringify(result, null, 2)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        log(`[ce-proxy] ${mcpToolName} failed: ${msg}`)
        return `Error: ${msg}`
      }
    },
  })
}

function parseArgs(input: string | Record<string, unknown> | undefined): Record<string, unknown> {
  if (!input) return {}
  if (typeof input === "object") return input
  try {
    const cleaned = input.startsWith("'") && input.endsWith("'") ? input.slice(1, -1) : input
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    return {}
  }
}
