/**
 * Agent tool restrictions for session.prompt calls.
 * OpenCode SDK's session.prompt `tools` parameter expects boolean values.
 * true = tool allowed, false = tool denied.
 */

/**
 * Context-Engine MCP tools — granted to all agents that need code intelligence.
 * Wildcard patterns match tool names prefixed by the MCP server name.
 */
const CONTEXT_ENGINE_MCP_TOOLS: Record<string, boolean> = {
  "context-engine_*": true,
  "context-engine-indexer_*": true,
  "context-engine-memory_*": true,
}

const EXPLORATION_AGENT_DENYLIST: Record<string, boolean> = {
  ...CONTEXT_ENGINE_MCP_TOOLS,
  write: false,
  edit: false,
  task: false,
  call_omo_agent: false,
}

const AGENT_RESTRICTIONS: Record<string, Record<string, boolean>> = {
  explore: EXPLORATION_AGENT_DENYLIST,

  librarian: EXPLORATION_AGENT_DENYLIST,

  oracle: {
    ...CONTEXT_ENGINE_MCP_TOOLS,
    write: false,
    edit: false,
    task: false,
    call_omo_agent: false,
  },

  metis: {
    write: false,
    edit: false,
    task: false,
  },

  momus: {
    write: false,
    edit: false,
    task: false,
  },

  "multimodal-looker": {
    ...CONTEXT_ENGINE_MCP_TOOLS,
    read: true,
  },

  "sisyphus-junior": {
    ...CONTEXT_ENGINE_MCP_TOOLS,
    task: false,
  },
}

export function getAgentToolRestrictions(agentName: string): Record<string, boolean> {
  return AGENT_RESTRICTIONS[agentName]
    ?? Object.entries(AGENT_RESTRICTIONS).find(([key]) => key.toLowerCase() === agentName.toLowerCase())?.[1]
    ?? {}
}

export function hasAgentToolRestrictions(agentName: string): boolean {
  const restrictions = AGENT_RESTRICTIONS[agentName]
    ?? Object.entries(AGENT_RESTRICTIONS).find(([key]) => key.toLowerCase() === agentName.toLowerCase())?.[1]
  return restrictions !== undefined && Object.keys(restrictions).length > 0
}
