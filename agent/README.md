# agent/ — AI Agent Rules Shipped with @mieweb/ui

Rules that teach AI coding agents (Copilot, Claude Code, Cursor, Codex, …) to
use `@mieweb/ui` components — most importantly, **DataVis NITRO for all
tables** — instead of inventing their own UI.

Agents don't read files inside `node_modules`, so consumers install the rules
into their repo with:

```bash
npx @mieweb/ui init-agent
```

| File                                                   | Purpose                                                                                                                                                                                                                                                     |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [mieweb-ui.instructions.md](mieweb-ui.instructions.md) | The rules template. Copied verbatim to the consumer's `.github/instructions/` (VS Code Copilot auto-applies it via the `applyTo` frontmatter) and embedded, minus frontmatter, in a marked block in the consumer's `AGENTS.md` (the cross-tool convention). |
| [init-agent.mjs](init-agent.mjs)                       | The `mieweb-ui` bin. Idempotent — rerun after upgrading `@mieweb/ui` to refresh both targets.                                                                                                                                                               |

Rule content is sourced from [lessons/component-policy.md](../lessons/component-policy.md);
keep the two in sync when policy changes.
