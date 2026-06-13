# SuperChat — Maintainer Notes

> **Provider notes** — how to *change* the SuperChat module. Consumers should read
> the [README.md](README.md) (getting started + vocabulary) and the Storybook
> autodocs (Product › Feature Modules › SuperChat). The design rationale lives in
> [Mission](#mission), below. General conventions live in
> [CONTRIBUTING.md](../../../CONTRIBUTING.md). This module **composes** the AI
> module — see [../AI/MAINTAINERS.md](../AI/MAINTAINERS.md).

## What's in here

| Surface | File | Role |
|---------|------|------|
| `SuperChatInbox` | [SuperChatInbox.tsx](SuperChatInbox.tsx) | Combined surface: composes the list + panel; owns active-conversation selection (drop-in for the original monolithic component) |
| `SuperChat` | [SuperChat.tsx](SuperChat.tsx) | Single-conversation **panel**: header + thread + composer (takes one `conversation`) |
| `SuperChatConversations` | [SuperChatConversations.tsx](SuperChatConversations.tsx) | Conversation **list** (sidebar); controlled/uncontrolled selection |
| shared internals | [parts.tsx](parts.tsx) | Internal-only helpers + presentational pieces (`ParticipantAvatar`, `ReferenceChip`, `MessageRow`, `Composer`, `sidebarItem`) shared by all three components — **not** exported from `index.ts` |
| `createMarkdownRenderer` | [render/createMarkdownRenderer.tsx](render/createMarkdownRenderer.tsx) | Composes render plugins → one `renderTextContent` (Markdown core) |
| render context | [render/renderContext.ts](render/renderContext.ts) | Threads `messageId`/`streaming` into custom nodes (GenUI) |
| code / math / genui / mermaid / image / nitro-table plugins | [plugins/](plugins) | Opt-in rich plugins (subpath entry) |
| types | [types.ts](types.ts) | Participant model + chat-component-compatible data model + plugin/GenUI contracts |

> **Component split.** The three components share one folder and one import path
> (`@mieweb/ui/components/SuperChat`) and one tsup entry. `SuperChat` owns the
> panel-only state (`renderText` memo, thread scroll effect, `participantById`,
> `orderedThread`); `SuperChatConversations` owns the list-only state (sorting +
> selection); `SuperChatInbox` owns the shared active-conversation coordination
> and renders the other two. Data slots: `superchat-inbox` (inbox root),
> `superchat` (panel root), `superchat-conversations` (list root).

## Architecture (3 decisions, summarized)

1. **Native reimplementation** preserving the `chat-component` prop/data-model
   shape (`SuperChatConversation` / `SuperChatMessage` with `participantId`,
   `channel`, `ref`, `linkBuilder`, callbacks). No bundled React / `tw-` prefix.
2. **Participant model** (`Participant { id, kind, name, color?, … }`) unifies the
   AI module's `user`/`assistant` and chat-component's `external`/`internal`/`system`.
   The thread is append-only and **ordered by `time`**; concurrent agent replies
   interleave and are disambiguated by per-participant `color`/avatar/name.
3. **Pluggable Markdown pipeline** wired through the AI module's
   `renderTextContent` seam. **The host owns sanitization** — untrusted output is
   run through `rehype-sanitize` with an allow-list extended per plugin.

## Bundle / entry layout

- `@mieweb/ui/components/SuperChat` ships the three components (`SuperChatInbox`
  / `SuperChat` / `SuperChatConversations`) **+ Markdown core** only
  (`react-markdown` + `remark-gfm` + `rehype-sanitize`).
- `@mieweb/ui/components/SuperChat/plugins` ships `code` / `math` / `genui` /
  `mermaid` / `image` / `nitro-table`. Each rich dependency (`rehype-highlight`,
  `rehype-katex`/`katex`, `mermaid`, `datavis`/`datavis-ace`) is an **optional
  peer dependency** — not in the base bundle. tsup entries:
  `components/SuperChat/index` and `components/SuperChat/plugins/index`.
- SuperChat is intentionally **not** re-exported from the top-level `src/index.ts`
  (same pattern as `datavis` / `ag-grid`) so the main bundle stays light.

## Render plugin contract (read before adding a plugin)

A `SuperChatRenderPlugin` contributes `remarkPlugins`, `rehypePlugins`,
`components` (node → React), `widgets` (GenUI), and a `sanitizeSchema` fragment.
The composer:

- always prepends `remark-gfm`;
- appends `rehype-sanitize` **last** (after highlight/katex) so their classNames
  exist to be allow-listed — order matters, don't reshuffle;
- merges each plugin's `sanitizeSchema` (tagNames union, per-tag attribute concat).

**Gotchas**

- The base schema broadens `className` on `code`/`pre`/`span`/`div` so `.hljs-*`
  syntax tokens survive. If you tighten this you will strip highlight colors.
- The math plugin must allow KaTeX's HTML+MathML tags — see `KATEX_TAGS`.
- Consumers of the math plugin must import `katex/dist/katex.min.css` themselves.

## GenUI widgets

- Wire format is a **fenced ```genui JSON block**, not inline. A small rehype
  transformer rewrites `<pre><code class="language-genui">` → `<genui-widget>…</genui-widget>`
  (payload as a text child) *before* sanitize (the tag is allow-listed), which
  avoids `pre`/`code` component-override conflicts with the code plugin.
- Widgets are **host-registered, lazy, schema-validated**. Unknown widget →
  inert code-block fallback (never arbitrary HTML).
- Prefetch is split: **component (code)** may load while streaming per policy
  (`eager`/`visible`/`idle`); **data** validation/prefetch runs only once the
  payload parses *and* the message has stopped streaming. **Registry policy
  overrides the wire hint.**
- Versioning: key the registry by base name; resolve `version` explicitly (do not
  bake the version into the lookup key).

## Mermaid / image / NITRO-table plugins

- **Mermaid** ([plugins/mermaid.tsx](plugins/mermaid.tsx)) — a rehype transformer
  rewrites `<pre><code class="language-mermaid">` → `<mermaid-diagram>` (source as
  a text child, like GenUI). `mermaid` is **lazy-loaded once** and initialized
  with `securityLevel: 'strict'`; the rendered SVG is injected via
  `dangerouslySetInnerHTML`, so it **bypasses `rehype-sanitize`** — strict mode is
  the trust boundary. Rendering is gated on `streaming` (partial source shows a
  pending card). Render failure → inert code-block fallback.
- **Image** ([plugins/image.tsx](plugins/image.tsx)) — overrides the `img` node
  with a click-to-zoom button that opens Messaging's `LightboxModal`. Because
  Markdown images live inside a `<p>`, the lightbox is **portaled to
  `document.body`** (don't nest the fixed overlay in the paragraph). `src`/`alt`
  are already protocol-restricted by `rehype-sanitize`.
- **NITRO table** ([plugins/nitroTable.tsx](plugins/nitroTable.tsx)) — overrides
  the `table` node, parses the GFM table out of the hast `node` into
  `{ headers, rows }`, and `React.lazy`-loads the actual grid
  ([plugins/nitroTableGrid.tsx](plugins/nitroTableGrid.tsx)) so `datavis` stays
  out of the base/test path. Data is handed to `DataVisNitroSource type="http"`
  via a short-lived **object-URL** carrying the `{ typeInfo, data }` shape the
  engine expects. A `GridErrorBoundary` + `Suspense` **degrades to the themed HTML
  table** if the grid can't load. **Note:** the `datavis` submodule must be
  checked out (`git submodule update --init`) to render the real grid — without it
  the fallback HTML table is shown (the case in CI/dev when the submodule is
  absent).

## Not yet implemented (tracked against the mission)

- `shiki` upgrade path for the code plugin (currently `rehype-highlight`).

## Testing

- Stories: [SuperChat.stories.tsx](SuperChat.stories.tsx) drives the autodocs page
  (Markdown core / rich plugins / read-only).
- When adding a plugin, add a story exercising it and confirm sanitized output
  still renders.

---

## Mission

> The design rationale behind SuperChat — the *why* behind the architecture above.
> The module is **implemented**; this section is retained as the entry point for
> maintainers and the record of decisions (including rejected alternatives).

### Goal

Bring a first-class **chat UI** into `@mieweb/ui` that:

1. Supports **multiple participants** — any mix of **multiple AI agents** and
   **multiple humans** in one conversation (not just 1 user ↔ 1 assistant).
2. Renders **rich Markdown** message content through a **plugin system**, with
   plugins for **math**, **interactive (`genui`) widgets**, **syntax-highlighted
   code**, and **tables rendered via NITRO DataVis**.

It reuses the AI module's extension seam (`renderTextContent` in
[../AI](../AI)) rather than forking the renderer, and aligns with the API contract
shape of the standalone
[`mieweb/chat-component`](https://github.com/mieweb/chat-component) repo.

### Background: what already existed

**`@mieweb/ui` AI module ([../AI](../AI)).** `AIChat`, `AIMessageDisplay`,
`AIChatModal`/`FloatingAIChat`, `MCPToolCallDisplay`. Roles: `user` / `assistant`;
content blocks `text` / `tool_use` / `tool_result` / `thinking` / `code`. The
**`renderTextContent` render-prop** is the rich-rendering seam (host owns
sanitization; plain text by default). TypeScript, React 19 peer, Tailwind 4 theme
tokens (`--mieweb-*`), CVA, tree-shakeable.

**Standalone `mieweb/chat-component`
([repo](https://github.com/mieweb/chat-component)).** JavaScript (not TS), React 19
**bundled into a self-contained UMD**, **Zustand** store, Tailwind with a `tw-`
prefix + preflight disabled + styles scoped to `.chat-component-root` (drops into
Bootstrap pages without conflicts). Multi-conversation sidebar + thread + compose;
read-only mode; export/import state; `linkBuilder`; callbacks. Data model:
`conversation { id, title, reference_id?, open, unread, lastActivity, thread[] }`;
thread items `type: 'message' | 'ref' | …` with `role: 'external' | 'internal' |
'system'`, `senderId`, `channel` (`portal|sms|voicemail|auto`), `time`, `text`;
`ref` items carry `refType` (`doc|rx|appt`) + `refId` + `title`. **Messages are
plain text today** — that gap is exactly what SuperChat fills. Its `role`/`channel`
model is **healthcare-messaging** oriented while the AI module's is **assistant**
oriented; SuperChat needs a participant model generalizing both.

### Decision 1 — Native reimplementation

**Build a native `@mieweb/ui` component that preserves the `chat-component` API
contract shape** — not a git submodule of `mieweb/chat-component`. Reimplement in
`src/components/SuperChat/` (TS, CVA, theme tokens, controlled props,
tree-shakeable), preserving the prop/data-model shape
(conversation/thread/role/channel/`linkBuilder`/callbacks) so existing consumers
migrate with minimal churn. Reuse `AIMessageDisplay` + `renderTextContent` for
message rendering.

**Why native:** native theme tokens / dark mode / brand switching / a11y / CVA /
shared TS types; one React + one Tailwind (no bundled-React / `tw-`-prefix
duplication); controlled-props model consistent with the rest of `@mieweb/ui`
(host owns state, works with any store); unifies the two role models under one
participant model (Decision 2). The cost is reimplementation — porting the
sidebar, read-only mode, export/import, search — but the standalone repo's
defining traits (self-contained UMD, bundled React, `tw-` prefix, disabled
preflight) exist to be **framework-agnostic embeddable**, the *opposite* of a
tree-shakeable, theme-token-driven library component.

> **Rejected — submodule (`@mieweb/ui/chat` over `mieweb/chat-component`).**
> Fastest to stand up and a single source of truth, but bundles its own React 19 +
> `tw-` prefix / disabled preflight / `.chat-component-root` scoping (two React +
> two Tailwind configs in one app), can't pick up `--mieweb-*` tokens / dark mode /
> brands without rework, is JavaScript + Zustand-coupled (no shared types, store
> instead of controlled props), and adds submodule friction for a central
> component.

There is **no requirement** to share a single implementation across the standalone
UMD and `@mieweb/ui`. The rich features (Markdown, math, code, GenUI, NITRO
tables) do **not** need to ship to Bootstrap/non-React embeds — the standalone UMD
stays as-is for that use case, so no shared/headless-core split is needed.

### Decision 2 — Participant model (multi-agent / multi-human)

Generalize both role systems into a **participant** concept:
`Participant { id, kind: 'human' | 'agent' | 'system', name, avatar?, color?,
role?, status? }`. Messages reference `participantId` (replacing/augmenting the
binary `user`/`assistant` and `external`/`internal`/`system`). Map existing
models: `assistant`→agent, `user`/`external`→human, `internal`→human (staff),
`system`→system. Backwards compatible: a single-agent chat is just a
2-participant conversation; `AIChat`'s current API keeps working.

**Turn-taking / routing.** Participants address an agent with an `@`-mention; an
agent's response targets whoever last mentioned it (or a named participant). If
multiple agents respond at once, their messages **interleave in the thread by
timestamp** — no global lock, the thread is append-only and ordered by `time`.
Disambiguate concurrent/interleaved replies with per-participant `color`, avatar,
and name label. Presence/typing, agent-to-agent hand-off, and tool-call
visualization reuse the `MCPToolCall` card chrome.

### Decision 3 — Markdown + plugin rendering pipeline

Render message text via a **pluggable Markdown pipeline** wired through
`renderTextContent` (so `AIChat`/`AIMessageDisplay` stay the host, and **the host
owns sanitization** of untrusted model output). Core: `react-markdown` +
`remark-gfm`, with `rehype-sanitize` on untrusted content. Rendering is exposed as
a **plugin registry** so consumers opt into weight:

| Plugin | Handles | Impl | Notes |
|--------|---------|------|-------|
| **Markdown core** | headings, lists, emphasis, links, blockquote, task lists | `react-markdown` + `remark-gfm` | always on |
| **Math** | `$…$`, `$$…$$`, bracketed `[ a^2 + b^2 = c^2 ]` | `remark-math` + `rehype-katex` (KaTeX) | lazy-load KaTeX |
| **GenUI widgets** | fenced ` ```genui ` JSON blocks | `code` node interceptor → **widget registry** | host-registered, lazy + schema-validated; degrades to a code block |
| **Code** | fenced code blocks | lazy `rehype-highlight` (default); `shiki` upgrade path | `.hljs-*` classes mapped to `--mieweb-*` tokens + copy button |
| **Tables** | GFM tables | **NITRO DataVis** ([../DataVisNITRO/MAINTAINERS.md](../DataVisNITRO/MAINTAINERS.md)) | GFM table → NITRO grid; prefer NITRO over AGGrid |
| **Mermaid** | ` ```mermaid ` fences | lazy `mermaid` | |
| **Images** | inline images | Messaging attachment lightbox | reuse existing lightbox |

The detailed plugin contract, GenUI wire format/registry, prefetch semantics, and
security model are documented in the implementation sections above
([Render plugin contract](#render-plugin-contract-read-before-adding-a-plugin),
[GenUI widgets](#genui-widgets),
[Mermaid / image / NITRO-table plugins](#mermaid--image--nitro-table-plugins)).
`SuperChat`/`AIChat` accept `renderPlugins?: SuperChatRenderPlugin[]` and compose
them into a single `renderTextContent`. The default export ships only Markdown
core; math/code/genui/NITRO/mermaid are **opt-in** subpath imports to keep the
base bundle light.

**Security.** Untrusted model/agent output **must** be sanitized
(`rehype-sanitize` allow-list). When composing with `rehype-highlight`, order
matters: allow the highlighter's `className` on `code`/`span` (or highlight after
sanitizing) so token colors survive. GenUI widgets render only **host-registered**
components keyed by name — unknown names fall back to the inert `genui` code block,
never arbitrary HTML/script. Per-widget `schema` validates the payload before it
reaches the component. The host owns the trust boundary, same contract as
`renderTextContent` today.

### New dependencies (all lazy / opt-in)

`react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex` (+ `katex`),
`rehype-sanitize`, `rehype-highlight` (default highlighter; `shiki` reserved as an
upgrade path), `mermaid`. NITRO tables reuse the existing `@mieweb/ui/datavis`
entry. None enter the base bundle; each rich plugin is a subpath/lazy import.

### Resolved decisions

- **Shared implementation across UMD and `@mieweb/ui`?** No — no Bootstrap/non-React
  support for the rich features; the standalone UMD stays as-is, SuperChat is built
  natively with a compatible API shape. No headless-core split. *(Decision 1)*
- **Turn-taking for concurrent agents?** `@`-mention addressing; responses target
  the last mention; concurrent replies interleave by timestamp with per-participant
  visual cues. *(Decision 2)*
- **Highlighter?** `rehype-highlight` by default (lighter, `.hljs-*` classes map to
  theme tokens); `shiki` reserved as an upgrade path. *(Decision 3)*
- **GenUI format + prefetch?** Fenced ` ```genui ` JSON blocks; host-registered,
  lazy, schema-validated registry; prefetch split into component vs. data with
  `eager`/`visible`/`idle` policies (registry overrides wire hint). *(Decision 3)*
- **Fold into the `AI` module, or a new module?** A **new `SuperChat` module** that
  composes `AI`. The `AI` module stays a lightweight building-block layer; the chat
  UI is heavier and opinionated, so consumers opt in without pulling in chat
  dependencies they don't need.

### Related

- AI module: [../AI](../AI) · notes: [../AI/MAINTAINERS.md](../AI/MAINTAINERS.md)
- NITRO tables: [../DataVisNITRO/MAINTAINERS.md](../DataVisNITRO/MAINTAINERS.md)
- Provider conventions: [CONTRIBUTING.md](../../../CONTRIBUTING.md)
- Standalone repo: <https://github.com/mieweb/chat-component>
