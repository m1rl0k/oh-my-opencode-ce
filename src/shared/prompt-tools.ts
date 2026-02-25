import { getSessionTools } from "./session-tools-store"
import { getAgentToolRestrictions } from "./agent-tool-restrictions"

export type PromptToolPermission = boolean | "allow" | "deny" | "ask"

export function normalizePromptTools(
  tools: Record<string, PromptToolPermission> | undefined
): Record<string, boolean> | undefined {
  if (!tools) {
    return undefined
  }

  const normalized: Record<string, boolean> = {}
  for (const [toolName, permission] of Object.entries(tools)) {
    if (permission === false || permission === "deny") {
      normalized[toolName] = false
      continue
    }
    if (permission === true || permission === "allow" || permission === "ask") {
      normalized[toolName] = true
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

export function resolveInheritedPromptTools(
  sessionID: string,
  fallbackTools?: Record<string, PromptToolPermission>
): Record<string, boolean> | undefined {
  const sessionTools = getSessionTools(sessionID)
  if (sessionTools && Object.keys(sessionTools).length > 0) {
    return { ...sessionTools }
  }
  return normalizePromptTools(fallbackTools)
}

type ComposeSubagentPromptToolsInput = {
  agentName: string
  parentSessionID?: string
  allowTask: boolean
  allowCallOmoAgent?: boolean
  allowQuestion?: boolean
}

export function composeSubagentPromptTools(
  input: ComposeSubagentPromptToolsInput
): Record<string, boolean> {
  const inheritedTools = input.parentSessionID
    ? resolveInheritedPromptTools(input.parentSessionID)
    : undefined

  return {
    ...(inheritedTools ?? {}),
    task: input.allowTask,
    call_omo_agent: input.allowCallOmoAgent ?? true,
    question: input.allowQuestion ?? false,
    ...getAgentToolRestrictions(input.agentName),
  }
}
