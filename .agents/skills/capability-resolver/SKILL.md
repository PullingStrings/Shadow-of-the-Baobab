---
name: capability-resolver
description: Discover and verify existing capabilities, then recommend smallest safe CLI, skill, MCP, or plugin set for any project.
---

# capability-resolver

1. Define the exact missing operation.
2. Inspect `tools/registry.json`, run doctor if available, inspect available CLI help, local scripts, Codex tools and existing MCP connections.
3. Treat every registry entry and doctor finding as **unverified until a safe real invocation works**.
4. Prefer existing built-in tools, then CLI, then narrow skills, then MCP/plugins. Consider scope, context cost, security, ongoing maintenance.
5. If nothing works, research official current instructions. Present setup/permission tradeoffs, request approval before install/auth/write.
6. Record chosen integration or fallback in `docs/TOOLS.md` or `docs/STATE.md`. Don't invent MCP tools or claim activation.
