declare const require: (name: string) => any
const { describe, expect, it } = require("bun:test")
import { createExploreAgent } from "./explore"

describe("createExploreAgent", () => {
  it("allows wildcard access while keeping mutation and planning tools denied", () => {
    const agent = createExploreAgent("openai/gpt-5.3-codex")
    const permission = agent.permission as Record<string, string>

    expect(permission["*"]).toBe("allow")
    expect(permission.write).toBe("deny")
    expect(permission.edit).toBe("deny")
    expect(permission.apply_patch).toBe("deny")
    expect(permission.task).toBe("deny")
    expect(permission.call_omo_agent).toBe("deny")
    expect(permission.question).toBe("deny")
    expect(permission.todowrite).toBe("deny")
    expect(permission.todoread).toBe("deny")
    expect(permission.plan_enter).toBe("deny")
    expect(permission.plan_exit).toBe("deny")
  })

  it("keeps Context-Engine MCP wildcard permissions enabled", () => {
    const agent = createExploreAgent("openai/gpt-5.3-codex")
    const permission = agent.permission as Record<string, string>

    expect(permission["context-engine-indexer_*"]).toBe("allow")
    expect(permission["context-engine-memory_*"]).toBe("allow")
    expect(permission["context-engine_*"]).toBe("allow")
  })
})
