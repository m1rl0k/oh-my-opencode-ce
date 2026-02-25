import type { OhMyOpenCodeConfig } from "../config";
import { getAgentDisplayName } from "../shared/agent-display-names";

type AgentWithPermission = { permission?: Record<string, unknown> };

function agentByKey(agentResult: Record<string, unknown>, key: string): AgentWithPermission | undefined {
  return (agentResult[key] ?? agentResult[getAgentDisplayName(key)]) as
    | AgentWithPermission
    | undefined;
}

/**
 * Context-Engine MCP tool permission overrides.
 * OpenCode's built-in explore agent has "*": "deny" in its permission ruleset.
 * The LLM layer (llm.ts) calls PermissionNext.disabled() with ONLY the agent's
 * permission (not merged session permissions), so MCP tools get removed before
 * the model ever sees them. These wildcard allows override the deny-all for CE tools.
 */
const CE_MCP_PERMISSION: Record<string, string> = {
  "context-engine-indexer_*": "allow",
  "context-engine-memory_*": "allow",
  "context-engine_*": "allow",
};

export function applyToolConfig(params: {
  config: Record<string, unknown>;
  pluginConfig: OhMyOpenCodeConfig;
  agentResult: Record<string, unknown>;
}): void {
  const denyTodoTools = params.pluginConfig.experimental?.task_system
    ? { todowrite: "deny", todoread: "deny" }
    : {}

  params.config.tools = {
    ...(params.config.tools as Record<string, unknown>),
    "grep_app_*": false,
    LspHover: false,
    LspCodeActions: false,
    LspCodeActionResolve: false,
    "task_*": false,
    teammate: false,
    ...(params.pluginConfig.experimental?.task_system
      ? { todowrite: false, todoread: false }
      : {}),
  };

  const isCliRunMode = process.env.OPENCODE_CLI_RUN_MODE === "true";
  const questionPermission = isCliRunMode ? "deny" : "allow";

  const librarian = agentByKey(params.agentResult, "librarian");
  if (librarian) {
    librarian.permission = { ...librarian.permission, "grep_app_*": "allow", ...CE_MCP_PERMISSION };
  }
  const looker = agentByKey(params.agentResult, "multimodal-looker");
  if (looker) {
    looker.permission = { ...looker.permission, task: "deny", look_at: "deny", ...CE_MCP_PERMISSION };
  }
  const atlas = agentByKey(params.agentResult, "atlas");
  if (atlas) {
    atlas.permission = {
      ...atlas.permission,
      task: "allow",
      call_omo_agent: "deny",
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
      ...CE_MCP_PERMISSION,
    };
  }
  const sisyphus = agentByKey(params.agentResult, "sisyphus");
  if (sisyphus) {
    sisyphus.permission = {
      ...sisyphus.permission,
      call_omo_agent: "deny",
      task: "allow",
      question: questionPermission,
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
      ...CE_MCP_PERMISSION,
    };
  }
  const hephaestus = agentByKey(params.agentResult, "hephaestus");
  if (hephaestus) {
    hephaestus.permission = {
      ...hephaestus.permission,
      call_omo_agent: "deny",
      task: "allow",
      question: questionPermission,
      ...denyTodoTools,
      ...CE_MCP_PERMISSION,
    };
  }
  const prometheus = agentByKey(params.agentResult, "prometheus");
  if (prometheus) {
    prometheus.permission = {
      ...prometheus.permission,
      call_omo_agent: "deny",
      task: "allow",
      question: questionPermission,
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
      ...CE_MCP_PERMISSION,
    };
  }
  const junior = agentByKey(params.agentResult, "sisyphus-junior");
  if (junior) {
    junior.permission = {
      ...junior.permission,
      task: "allow",
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
      ...CE_MCP_PERMISSION,
    };
  }
  const explore = agentByKey(params.agentResult, "explore");
  if (explore) {
    explore.permission = { ...explore.permission, ...CE_MCP_PERMISSION };
  }
  const oracle = agentByKey(params.agentResult, "oracle");
  if (oracle) {
    oracle.permission = { ...oracle.permission, ...CE_MCP_PERMISSION };
  }
  const momus = agentByKey(params.agentResult, "momus");
  if (momus) {
    momus.permission = { ...momus.permission, ...CE_MCP_PERMISSION };
  }
  const metis = agentByKey(params.agentResult, "metis");
  if (metis) {
    metis.permission = { ...metis.permission, ...CE_MCP_PERMISSION };
  }

  params.config.permission = {
    ...(params.config.permission as Record<string, unknown>),
    webfetch: "allow",
    external_directory: "allow",
    task: "deny",
    ...CE_MCP_PERMISSION,
  };
}
