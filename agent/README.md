# agent/ — AI Agent Team Shipped with @mieweb/ui

Rules and agents that teach AI coding agents (Copilot, Claude Code, Cursor,
Codex, …) to use `@mieweb/ui` components — most importantly, **DataVis NITRO
for all tables** — instead of inventing their own UI.

Agents don't read files inside `node_modules`, so consumers install everything
into their repo with:

```bash
npx @mieweb/ui init-agent
```

This directory is growing from a single instructions file into the **MIE UI
Design Agent team** — an orchestrator plus specialist subagents and skills —
per epic [#545](https://github.com/mieweb/ui/issues/545). This README is the
governing spec: later tickets cite it instead of re-deciding.

## Files

| File                                                   | Purpose                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [mieweb-ui.instructions.md](mieweb-ui.instructions.md) | The rules template. Copied verbatim to the consumer's `.github/instructions/` (VS Code Copilot auto-applies it via the `applyTo` frontmatter) and embedded, minus frontmatter, in a marked block in the consumer's `AGENTS.md` (the cross-tool convention).                                                       |
| [init-agent.mjs](init-agent.mjs)                       | The `mieweb-ui` bin. Idempotent — rerun after upgrading `@mieweb/ui` to refresh all targets. `--experimental-agents` additionally installs the agent team below.                                                                                                                                                  |
| [agents/](agents/)                                     | Agent templates: `mieweb-ui-design` (orchestrator) + `mieweb-ui-styling` + `mieweb-ui-install` + `mieweb-ui-a11y` + `mieweb-ui-i18n`. Installed to the consumer's `.github/agents/` behind `--experimental-agents`.                                                                                               |
| [skills/](skills/)                                     | Skill templates: `mieweb-ui-catalog`, `mieweb-ui-tokens`, `mieweb-ui-icons` (generated — `pnpm agent:skills`, never hand-edit) + `mieweb-ui-brands`, `mieweb-ui-tailwind4`, `mieweb-ui-a11y-checklist`, `mieweb-ui-i18n-checklist` (hand-written). Installed to `.github/skills/` behind `--experimental-agents`. |
| `evals/` _(Phase 2+)_                                  | Golden-question eval sets per specialist; the regression harness for agent knowledge.                                                                                                                                                                                                                             |

Rule content is sourced from [lessons/component-policy.md](../lessons/component-policy.md);
keep the two in sync when policy changes.

## Governing rules

Decided in [#545](https://github.com/mieweb/ui/issues/545) (design principles +
execution decisions). Summarized here as the citable spec.

1. **Persona-or-facts test.** A domain earns an _agent seat_ only if it needs a
   persona and workflow (audit procedure, diagnostic method, judgment). If it
   only needs _facts_, it's a `SKILL.md`. Taxonomy buckets ("primitives",
   "complex components") are not domains.
2. **Agents = behavior, skills = facts.** Deep reference material lives in
   skills loaded on demand, never inlined into agent prompts.
3. **Thin orchestrator owns selection.** The orchestrator answers component
   selection/usage itself from the catalog skill and routes everything else
   (see routing spec below). It is not a pure switchboard.
4. **Auditors are read-only.** Audit-persona agents (A11y, i18n/RTL,
   Migration/Compliance) get no edit tools; they produce a report plus an
   "Apply Fixes" handoff. Fixer personas (Styling & Theming) may edit.
5. **Single source of truth.** Shipped files are synced from `lessons/`
   (canonical prose) or generated from source (tokens from the Tailwind preset,
   catalog from exports + `src/catalog/*.mdx`). No third drifting copy.
6. **Promotion rule.** Knowledge starts as a skill on the orchestrator; it is
   promoted to an agent seat only when dogfooding/routing data shows demand for
   a dedicated workflow.
7. **Consumer team vs maintainer team.** `agent/` templates ship to consumers.
   Maintainer agents (PR checks, release, story authoring) live in this repo's
   `.github/agents/` and are never shipped.
8. **Tool-agnostic distribution.** VS Code/Copilot gets `.agent.md` +
   `SKILL.md`; tools without native subagents get the `AGENTS.md` marked block
   extended with an agent roster that references the installed files by path.
9. **Experimental gating.** Until the epic completes, agents/skills/roster
   install **only** with `init-agent --experimental-agents`. The default run
   stays byte-identical to today's behavior (instructions file + `AGENTS.md`
   block). The default flips on in P5.2
   ([#607](https://github.com/mieweb/ui/issues/607)) — the official launch.

## Naming & layout

- Every shipped artifact is prefixed **`mieweb-ui-`** so consumer repos can
  distinguish managed files from their own at a glance.
- Template layout in this repo → installed location in the consumer:

| Template (this repo)                     | Installed (consumer repo)                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| `agent/mieweb-ui.instructions.md`        | `.github/instructions/mieweb-ui.instructions.md`                          |
| `agent/agents/mieweb-ui-<name>.agent.md` | `.github/agents/mieweb-ui-<name>.agent.md`                                |
| `agent/skills/mieweb-ui-<name>/SKILL.md` | `.github/skills/mieweb-ui-<name>/SKILL.md`                                |
| _(embedded block)_                       | `AGENTS.md` between `<!-- mieweb-ui:begin -->` / `<!-- mieweb-ui:end -->` |

- Agent display names: `MIE UI <Domain> Agent` (e.g. `MIE UI Styling Agent`);
  the orchestrator is `MIE UI Design Agent`.
- Generated skills are produced by `scripts/` generators into `agent/skills/`
  at build time and committed, so the installer stays a dumb file copier.

## Managed-file markers

Every **newly shipped** whole-file artifact (agents, skills) carries a managed
marker so reruns can refresh safely:

```
<!-- mieweb-ui:managed @mieweb/ui@X.Y.Z -->
```

- **Scope:** marker-based refresh applies to `--experimental-agents` artifacts
  only. The two legacy targets keep their existing behavior unchanged (rule
  9's byte-identical guarantee): `.github/instructions/mieweb-ui.instructions.md`
  is overwritten verbatim on every run (as today), and `AGENTS.md` uses its own
  `begin`/`end` block markers.
- **Placement:** first line of the file body — immediately after the YAML
  frontmatter block if present, otherwise line 1. (Frontmatter must stay at
  byte 0 for VS Code to parse it.)
- **Refresh rules (idempotent rerun):**
  - Target file exists **with** marker → overwrite with the new template
    (marker version updated).
  - Target file exists **without** marker → **skip and warn**: it's
    user-created; never clobber it.
  - Template removed in a newer release but installed file still present →
    **report, never delete**.
  - `AGENTS.md`: only the content between the `begin`/`end` markers is
    replaced; everything outside is untouched.

## `.agent.md` frontmatter baseline

All shipped agents conform to:

```yaml
---
name: MIE UI <Domain> Agent
description: <one sentence: domain + when to invoke; this is the routing surface>
tools: [<minimal set for the persona>]
# auditors:        ['search', 'codebase', 'fetch'] — no edit/terminal tools
# fixers:          add 'editFiles'
# diagnosticians:  add 'runInTerminal' only if the workflow runs commands
handoffs: # where useful — auditors always include an "Apply Fixes" handoff
  - label: Apply Fixes
    agent: agent
    prompt: Apply the fixes identified above.
    send: false
---
```

- **No pinned `model:`** — agents must be model-agnostic.
- **`description` is the routing surface**: it must state the domain and the
  invoke-when, because orchestrators and humans both select on it.
- **Tools are the persona contract**: read-only auditors cannot hold edit
  tools (governing rule 4).

### Audit: existing `.github/agents/style.agent.md` vs baseline

| Check            | Status | Notes                                                                                                                                                  |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No pinned model  | ❌     | Pins `model: Claude Sonnet 4` — remove when evolved in P1.5 (#599)                                                                                     |
| Minimal tools    | ⚠️     | Holds `editFiles` + `runInTerminal` + `terminalLastCommand`; Styling is a fixer so `editFiles` stays, terminal tools drop unless a workflow needs them |
| Handoffs pattern | ✅     | "Apply Fixes" handoff is the team-wide template                                                                                                        |
| Naming           | ❌     | `Style Agent` → `MIE UI Styling Agent`, file → `mieweb-ui-styling.agent.md` (P1.5)                                                                     |
| Facts in skills  | ❌     | Inlines token tables — dedupe into the generated tokens skill (P1.2, #600)                                                                             |

The original `.github/agents/style.agent.md` stays in place (maintainer use)
until P1.5 ships its consumer replacement.

## Orchestrator routing spec

The orchestrator (`MIE UI Design Agent`) answers **directly** from the catalog
skill: component selection ("Card or Panel?", "which table component?" —
propose DataVis NITRO first per Rule 1 of
[mieweb-ui.instructions.md](mieweb-ui.instructions.md); `Table` only for its
documented static-rows exception), basic props/variants/composition usage,
high-level architecture (headless vs styled, preset vs TW4 `@source`), and
"where do I find X".

Everything else is delegated per this table (final domain boundaries):

| Question is about…                                 | Delegate to            |
| -------------------------------------------------- | ---------------------- |
| install / peer deps / preset / safelist / @source  | MIE UI Install Agent   |
| tokens, CSS vars, Tailwind classes, brands, dark   | MIE UI Styling Agent   |
| ARIA, keyboard nav, screen readers, contrast       | MIE UI A11y Agent      |
| translations, locale bundles, Intl formats, RTL    | MIE UI i18n Agent      |
| migrating code to @mieweb/ui, raw-HTML compliance  | MIE UI Migration Agent |
| DataVis NITRO, eSheet, grids, virtualization       | MIE UI Grids Agent     |
| charts, maps, globes, sparklines, report templates | MIE UI DataVis Agent   |
| ViewSet, dashboards, panels, app shell layout      | MIE UI Views Agent     |
| SuperChat, Inbox, AI messages, media conversation  | MIE UI SuperChat Agent |
| rich text editors, Kerebron, Markdown              | MIE UI Rich Text Agent |

**Tie-breakers for ambiguous cases:**

- _Selection vs depth:_ "which component" is always the orchestrator, even for
  grid/chart components; the specialist owns configuration, APIs, and
  debugging of the chosen component.
- _Styling a specialist's component:_ generic token/Tailwind/brand questions →
  Styling Agent; component-specific theming APIs (e.g. NITRO theme config) →
  that component's specialist.
- _Cross-cutting audits win:_ a11y/i18n questions route to those auditors no
  matter which component they concern.
- _Multi-domain:_ consult each relevant specialist, synthesize one answer,
  attribute which specialist produced which part.
- _No fit / unsure:_ say so and point at the catalog/Storybook — never
  improvise an answer outside the roster.

Until a specialist ships (phases land incrementally), its row is absent from
the installed roster and the orchestrator answers from the catalog skill or
defers to docs.
