---
name: codegraph
description: Use when a repository has a CodeGraph index and the user asks for code exploration, dependency tracing, impact analysis, or indexed semantic search.
---

# CodeGraph

Use the `codegraph` MCP server for indexed repository exploration. The external
`codegraph` executable must be on `PATH`, and the repository must contain a
`.codegraph/` index.

## Workflow

1. Prefer the tools exposed by the `codegraph` MCP server.
2. If the tools are unavailable, run `codegraph status` to distinguish a missing
   CLI from a missing or unhealthy project index.
3. If `.codegraph/` is missing, ask for explicit permission before running
   `codegraph init`; initialization writes a project-local index.
4. After `codegraph init`, use the MCP tools immediately. `init` already performs
   the first full index, so do not follow it with `codegraph index`.
5. If initialization is not authorized or CodeGraph remains unavailable, continue
   with native file search such as `rg` and explain the fallback briefly.

When MCP tools are unavailable but the CLI and index are healthy, use the CLI
equivalents: `codegraph explore`, `codegraph node`, `codegraph query`,
`codegraph callers`, `codegraph callees`, and `codegraph impact`.

## Index maintenance

| Situation | Action |
| --- | --- |
| Check health | `codegraph status` |
| Files changed while MCP was stopped | `codegraph sync` |
| Full rebuild is actually needed | `codegraph index` |
| Corrupt index confirmed | Ask before `codegraph index --force` |

The MCP watcher normally keeps an active index synchronized.

## Boundaries

- Do not run `codegraph install`; it writes global agent configuration that would
  duplicate this plugin's MCP registration.
- Do not run `codegraph serve --mcp` manually; Codex starts it from `.mcp.json`.
- Never initialize a home directory or filesystem root.
