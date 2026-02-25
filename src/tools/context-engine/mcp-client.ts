/**
 * Lazy-initialized MCP client for Context-Engine SaaS.
 *
 * Connects to CE indexer and memory MCP endpoints on first use,
 * then caches connections for subsequent calls. Uses the official
 * MCP SDK with SSE/StreamableHTTP transport.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { CallToolResultSchema, type Tool as MCPToolDef } from "@modelcontextprotocol/sdk/types.js"
import { log } from "../../shared"

const CONNECT_TIMEOUT_MS = 30_000

export interface CeMcpEndpoint {
  name: string
  url: string
  headers: Record<string, string>
}

export interface ConnectedMcpClient {
  client: Client
  tools: MCPToolDef[]
}

type TransportKind = StreamableHTTPClientTransport | SSEClientTransport

/**
 * Connects to an MCP endpoint, trying StreamableHTTP first then SSE fallback.
 */
async function connectEndpoint(endpoint: CeMcpEndpoint): Promise<ConnectedMcpClient> {
  const transports: Array<{ label: string; transport: TransportKind }> = [
    {
      label: "StreamableHTTP",
      transport: new StreamableHTTPClientTransport(new URL(endpoint.url), {
        requestInit: { headers: endpoint.headers },
      }),
    },
    {
      label: "SSE",
      transport: new SSEClientTransport(new URL(endpoint.url), {
        requestInit: { headers: endpoint.headers },
      }),
    },
  ]

  let lastError: Error | undefined
  for (const { label, transport } of transports) {
    try {
      const client = new Client({ name: "oh-my-opencode-ce", version: "1.0.0" })
      await withTimeout(client.connect(transport), CONNECT_TIMEOUT_MS)
      const result = await withTimeout(client.listTools(), CONNECT_TIMEOUT_MS)
      log(`[ce-mcp] Connected to ${endpoint.name} via ${label}, ${result.tools.length} tools`)
      return { client, tools: result.tools }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      log(`[ce-mcp] ${label} failed for ${endpoint.name}: ${lastError.message}`)
    }
  }
  throw lastError ?? new Error(`Failed to connect to ${endpoint.name}`)
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

/**
 * Manages lazy-initialized MCP connections to CE indexer and memory servers.
 */
export class CeMcpClientManager {
  private indexerConnection: ConnectedMcpClient | null = null
  private memoryConnection: ConnectedMcpClient | null = null
  private indexerConnecting: Promise<ConnectedMcpClient> | null = null
  private memoryConnecting: Promise<ConnectedMcpClient> | null = null
  private initFailed = { indexer: false, memory: false }

  constructor(
    private readonly indexerEndpoint: CeMcpEndpoint,
    private readonly memoryEndpoint: CeMcpEndpoint,
  ) {}

  private async getIndexer(): Promise<ConnectedMcpClient | null> {
    if (this.indexerConnection) return this.indexerConnection
    if (this.initFailed.indexer) return null
    if (!this.indexerConnecting) {
      this.indexerConnecting = connectEndpoint(this.indexerEndpoint)
        .then((conn) => {
          this.indexerConnection = conn
          return conn
        })
        .catch((err) => {
          log(`[ce-mcp] Indexer init failed permanently: ${err.message}`)
          this.initFailed.indexer = true
          this.indexerConnecting = null
          throw err
        })
    }
    return this.indexerConnecting.catch(() => null)
  }

  private async getMemory(): Promise<ConnectedMcpClient | null> {
    if (this.memoryConnection) return this.memoryConnection
    if (this.initFailed.memory) return null
    if (!this.memoryConnecting) {
      this.memoryConnecting = connectEndpoint(this.memoryEndpoint)
        .then((conn) => {
          this.memoryConnection = conn
          return conn
        })
        .catch((err) => {
          log(`[ce-mcp] Memory init failed permanently: ${err.message}`)
          this.initFailed.memory = true
          this.memoryConnecting = null
          throw err
        })
    }
    return this.memoryConnecting.catch(() => null)
  }

  async callIndexerTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const conn = await this.getIndexer()
    if (!conn) throw new Error("Context-Engine indexer MCP not connected")
    return conn.client.callTool(
      { name: toolName, arguments: args },
      CallToolResultSchema,
      { timeout: CONNECT_TIMEOUT_MS },
    )
  }

  async callMemoryTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const conn = await this.getMemory()
    if (!conn) throw new Error("Context-Engine memory MCP not connected")
    return conn.client.callTool(
      { name: toolName, arguments: args },
      CallToolResultSchema,
      { timeout: CONNECT_TIMEOUT_MS },
    )
  }

  /**
   * Pre-connect to both endpoints. Call during plugin init.
   * Failures are non-fatal -- tools will report errors on use.
   */
  async warmup(): Promise<void> {
    await Promise.allSettled([this.getIndexer(), this.getMemory()])
  }

  async getIndexerToolSchemas(): Promise<MCPToolDef[]> {
    const conn = await this.getIndexer()
    return conn?.tools ?? []
  }

  async getMemoryToolSchemas(): Promise<MCPToolDef[]> {
    const conn = await this.getMemory()
    return conn?.tools ?? []
  }

  async close(): Promise<void> {
    await Promise.allSettled([
      this.indexerConnection?.client.close(),
      this.memoryConnection?.client.close(),
    ])
    this.indexerConnection = null
    this.memoryConnection = null
    this.indexerConnecting = null
    this.memoryConnecting = null
  }
}
