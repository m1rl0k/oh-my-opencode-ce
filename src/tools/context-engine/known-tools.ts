/**
 * Hardcoded list of known CE MCP tools with descriptions.
 *
 * This avoids the chicken-and-egg problem of needing an async MCP
 * connection to discover tools during synchronous plugin init.
 * Tool names match what the MCP server exposes.
 */

export interface KnownToolEntry {
  server: "indexer" | "memory"
  mcpName: string
  description: string
}

export const KNOWN_CE_TOOLS: KnownToolEntry[] = [
  // ---- Indexer tools ----
  { server: "indexer", mcpName: "search", description: "Unified search -- single entry point for all code intelligence queries. Auto-detects intent and routes to best backend. Handles: code search, conceptual answers, test discovery, config search, symbol relationships, import tracing." },
  { server: "indexer", mcpName: "repo_search", description: "Primary hybrid semantic + lexical code search. Find code spans matching a natural language concept. Supports language, path, symbol filters. Args: query (str), limit (int), language (str), under (str), include_snippet (bool), compact (bool)." },
  { server: "indexer", mcpName: "batch_search", description: "Run multiple independent searches in one call. Reduces token overhead by ~75-85% vs sequential repo_search calls. Args: searches (list of {query, limit, ...}), shared params: collection, language, limit, compact." },
  { server: "indexer", mcpName: "context_answer", description: "LLM-powered answers with citations grounded in retrieved code. Use for explanations, not raw results. Args: query (str), limit (int), language (str), under (str), include_snippet (bool)." },
  { server: "indexer", mcpName: "symbol_graph", description: "AST-backed symbol graph queries for precise code relationships. Find callers, definitions, importers, callees, subclasses. Args: symbol (str), query_type (callers|definition|importers|callees|subclasses|base_classes), limit (int), depth (int), language (str)." },
  { server: "indexer", mcpName: "batch_symbol_graph", description: "Run multiple independent symbol_graph queries in one call. Args: queries (list of {symbol, query_type, ...}), shared params: collection, language, limit, depth." },
  { server: "indexer", mcpName: "search_tests_for", description: "Find test files related to a query. Presets common test file patterns. Args: query (str), limit (int), language (str), under (str), include_snippet (bool)." },
  { server: "indexer", mcpName: "search_config_for", description: "Find configuration files related to a query. Presets common config file patterns. Args: query (str), limit (int), under (str), include_snippet (bool)." },
  { server: "indexer", mcpName: "search_callers_for", description: "Heuristic text-based search for callers/usages of a symbol. Fast but less precise than symbol_graph. Args: query (str), limit (int), language (str)." },
  { server: "indexer", mcpName: "search_importers_for", description: "Heuristic text-based search for files importing a module/symbol. Args: query (str), limit (int), language (str)." },
  { server: "indexer", mcpName: "context_search", description: "Blend code search results with memory-store entries. Set include_memories=true to enable memory blending. Args: query (str), include_memories (bool), memory_weight (float), limit (int), language (str)." },
  { server: "indexer", mcpName: "cross_repo_search", description: "Cross-repository search with smart discovery and boundary tracing. Args: query (str), target_repos (list), discover (auto|always|never), trace_boundary (bool), limit (int)." },
  { server: "indexer", mcpName: "pattern_search", description: "Find structurally similar code patterns across all languages. Search by code structure, not text. Args: query (str), query_mode (auto|code|description), language (str), limit (int), target_languages (list)." },
  { server: "indexer", mcpName: "info_request", description: "Simplified codebase discovery with optional explanation mode. Args: info_request (str), include_explanation (bool), include_relationships (bool), limit (int), language (str)." },
  { server: "indexer", mcpName: "code_search", description: "Alias of repo_search for discoverability. Args: query (str), limit (int), language (str), under (str), include_snippet (bool)." },
  { server: "indexer", mcpName: "search_commits_for", description: "Search git commit history indexed in Qdrant. Args: query (str), path (str), limit (int), predict_related (bool)." },
  { server: "indexer", mcpName: "change_history_for_path", description: "Summarize recent change metadata for a file path. Args: path (str), include_commits (bool)." },
  { server: "indexer", mcpName: "expand_query", description: "LLM-assisted query expansion. Generate 1-2 compact alternates before search. Args: query (str), max_new (int)." },
  { server: "indexer", mcpName: "qdrant_status", description: "Check collection status or list all collections. Args: collection (str), list_all (bool), include_status (bool)." },
  { server: "indexer", mcpName: "qdrant_list", description: "List all Qdrant collections. Args: include_status (bool)." },
  { server: "indexer", mcpName: "set_session_defaults", description: "Set defaults (collection, mode, language, under) for subsequent calls. Args: collection (str), mode (str), language (str), under (str), compact (bool), limit (int)." },
  { server: "indexer", mcpName: "graph_query", description: "Advanced graph queries for symbol relationships. Query types: callers, callees, transitive_callers, transitive_callees, impact, dependencies, definition, cycles. Args: query_type (str), symbol (str), depth (int), limit (int)." },
  { server: "indexer", mcpName: "batch_graph_query", description: "Run multiple independent graph_query calls in one call. Args: queries (list of {symbol, query_type, ...}), shared params." },

  // ---- Memory tools ----
  { server: "memory", mcpName: "set_session_defaults", description: "Set defaults for subsequent memory calls. Args: collection (str), mode (str), language (str)." },
  { server: "memory", mcpName: "memory_store", description: "Store knowledge/notes into the memory system. Args: information (str, required), metadata (object with kind, topic, tags, priority)." },
  { server: "memory", mcpName: "memory_find", description: "Retrieve stored memories/notes by semantic similarity. Args: query (str, required), kind (str), topic (str), tags (str|list), limit (int), priority_min (int)." },
]
