# SuperChat — Plan

> **Status:** Implemented. The architecture below is the agreed design and is
> shipped in this module (`src/components/SuperChat/`); this doc is retained as
> the design rationale / entry point for maintainers.

## Goal

Bring a first-class **chat UI** into `@mieweb/ui` that:

1. Supports **multiple participants** — any mix of **multiple AI agents** and
   **multiple humans** in one conversation (not just 1 user ↔ 1 assistant).
2. Renders **rich Markdown** message content through a **plugin system**, with
   plugins for **math**, **interactive (`genui`) widgets**, **syntax-highlighted
   code**, and **tables rendered via NITRO DataVis**.

It should reuse the existing AI module's extension seam
(`renderTextContent` in [src/components/AI](src/components/AI)) rather than forking
the renderer, and align with the API contract shape of the standalone
[`mieweb/chat-component`](https://github.com/mieweb/chat-component) repo.

---

## Background: what already exists

### `@mieweb/ui` AI module ([src/components/AI](src/components/AI))

- `AIChat`, `AIMessageDisplay`, `AIChatModal`/`FloatingAIChat`, `MCPToolCallDisplay`.
- Roles today: `user` / `assistant`. Content blocks: `text` / `tool_use` /
  `tool_result` / `thinking` / `code`.
- **`renderTextContent` render-prop** is the rich-rendering seam; host owns
  sanitization. Plain text by default. See
  [src/components/AI/MAINTAINERS.md](src/components/AI/MAINTAINERS.md).
- TypeScript, React 19 peer, Tailwind 4 theme tokens (`--mieweb-*`), CVA, tree-shakeable.

### Standalone `mieweb/chat-component` ([repo](https://github.com/mieweb/chat-component), [demo](https://chat-component.os.mieweb.org/demo-bootstrap.html))

Reviewed repo + live Bootstrap demo. Key facts:

- **Stack:** JavaScript (not TS), React 19 **bundled into a self-contained UMD**,
  **Zustand** store, Tailwind with a **`tw-` prefix** + **preflight disabled** +
  styles scoped to `.chat-component-root` (so it can drop into Bootstrap pages
  without conflicts). MIT.
- **Shape:** multi-conversation sidebar + thread + compose area; read-only mode;
  export/import state; `linkBuilder`; rich callbacks (`onMessageSent`,
  `onConversationOpened/Created/Closed`, `onNewConversation`).
- **Data model:** `conversation { id, title, reference_id?, open, unread,
  lastActivity, thread[] }`; thread items are `type: 'message' | 'ref' | …` with
  `role: 'external' | 'internal' | 'system'`, `senderId`, `sender_name`,
  `channel` (`portal|sms|voicemail|auto`), `time`, `text`. `ref` items carry
  `refType` (`doc|rx|appt`) + `refId` + `title`.
- **Messages are plain text today** — no Markdown rendering. This is exactly the
  gap SuperChat fills.

> Note: the standalone repo's `role`/`channel` model is **healthcare-messaging**
> oriented (external/internal/system), while the AI module's is **assistant**
> oriented (user/assistant). SuperChat needs a participant model that
> generalizes both.

---

## Decision 1 — Native reimplementation *(decided)*

**Build a native `@mieweb/ui` component that preserves the `chat-component` API
contract shape** — not a git submodule of `mieweb/chat-component`.

Reimplement in `src/components/SuperChat/` (TS, CVA, theme tokens, controlled
props, tree-shakeable), **preserving the `chat-component` prop/data-model shape**
(conversation/thread/role/channel/`linkBuilder`/callbacks) so existing consumers
can migrate with minimal churn. Reuse `AIMessageDisplay` + `renderTextContent`
for message rendering.

**Why native:**
- **Native fit:** theme tokens, dark mode, brand switching, a11y, CVA, TS types
  shared with `AIMessage`/`MCPToolCall`.
- **One React, one Tailwind** — no bundled-React/`tw-`-prefix duplication.
- Controlled-props model consistent with the rest of `@mieweb/ui`
  (host owns state; works with any store).
- Unifies the two role models (assistant + healthcare-messaging) under one
  participant model (Decision 2).

The cost is reimplementation — porting the multi-conversation sidebar, read-only
mode, export/import, and search — but the standalone repo's defining traits
(self-contained UMD, bundled React, `tw-` prefix, disabled preflight) exist to be
**framework-agnostic embeddable**, which is the *opposite* of a tree-shakeable,
theme-token-driven library component.

> **Rejected — submodule (`@mieweb/ui/chat` over `mieweb/chat-component`).**
> Fastest to stand up and keeps a single source of truth, but it bundles its own
> React 19 + `tw-` prefix / disabled preflight / `.chat-component-root` scoping
> (two React + two Tailwind configs in one app), can't pick up `--mieweb-*`
> tokens / dark mode / brands without rework, is JavaScript + Zustand-coupled (no
> shared types, store instead of controlled props), and adds submodule friction
> for a central component.

**Resolved:** there is **no requirement** to share a single implementation across
the standalone UMD and `@mieweb/ui`. The new rich features (Markdown, math, code,
GenUI, NITRO tables) do **not** need to ship to Bootstrap/non-React embeds — the
standalone repo stays as-is for that use case, so no shared/headless-core split is
needed. We may optionally vendor the repo as a submodule **for reference only**
during the port (not a runtime dependency).

---

## Decision 2 — Participant model (multi-agent / multi-human)

Generalize both role systems into a **participant** concept:

- `Participant { id, kind: 'human' | 'agent' | 'system', name, avatar?, color?,
  role?, status? }`.
- Messages reference `participantId` (replacing/augmenting the binary
  `user`/`assistant` and `external`/`internal`/`system`).
- Map the existing models onto it: `assistant`→agent, `user`/`external`→human,
  `internal`→human (staff), `system`→system.
- Backwards compatible: a single-agent chat is just a 2-participant conversation;
  `AIChat`'s current API keeps working.

### Turn-taking / routing (resolved)

- **Addressing:** participants address an agent with an `@`-mention. An agent's
  response targets whoever last mentioned it (or a specific participant if named).
- **Concurrency:** if multiple agents respond at once, their messages **interleave
  in the thread by timestamp**. No global lock — the thread is append-only and
  ordered by `time`.
- **Disambiguation:** use visual cues (per-participant `color`, avatar, name
  label) so concurrent/interleaved replies stay legible.
- Presence/typing, agent-to-agent hand-off, and tool-call visualization reuse the
  existing `MCPToolCall` card chrome.

---

## Decision 3 — Markdown + plugin rendering pipeline

Render message text via a **pluggable Markdown pipeline** wired through the
existing `renderTextContent` seam (so `AIChat`/`AIMessageDisplay` stay the host,
and **the host owns sanitization** of untrusted model output).

Proposed core: `react-markdown` + `remark-gfm`, with `rehype-sanitize` on
untrusted content. Rendering is exposed as a **plugin registry** so consumers opt
into weight:

| Plugin | Handles | Proposed impl | Notes |
|--------|---------|---------------|-------|
| **Markdown core** | headings, lists, emphasis, links, blockquote, task lists | `react-markdown` + `remark-gfm` | always on |
| **Math** | `$…$`, `$$…$$`, and bracketed `[ a^2 + b^2 = c^2 ]` blocks | `remark-math` + `rehype-katex` (KaTeX) | lazy-load KaTeX; map the bracket form to a math directive |
| **GenUI widgets** | fenced ` ```genui ` JSON blocks (see below) | `code` node interceptor → **widget registry** | host-registered React widgets keyed by name; lazy + schema-validated; degrades to a code block if plugin/widget absent |
| **Code** | fenced code blocks (` ```javascript … ``` `) | lazy `rehype-highlight` (default); `shiki` as an upgrade path | `rehype-highlight` emits `.hljs-*` classes mapped to `--mieweb-*` tokens (light/dark for free) + copy button. Prototype both; only move to `shiki` if highlight fidelity becomes a complaint |
| **Tables** | GFM tables | **NITRO DataVis** ([DataVisNITRO](src/components/DataVisNITRO/MAINTAINERS.md)) | parse GFM table → NITRO grid for sort/filter/resize; prefer NITRO over AGGrid |
| **Mermaid** | ` ```mermaid ` fences | lazy `mermaid` | from the earlier chat-window goal |
| **Images** | inline images | Messaging attachment lightbox | reuse existing lightbox |

### Plugin contract (sketch)

```ts
interface SuperChatRenderPlugin {
  name: string;
  remarkPlugins?: PluggableList;   // remark/rehype additions
  rehypePlugins?: PluggableList;
  components?: Record<string, React.ComponentType<any>>; // node → React
  /** optional: register named interactive widgets for genui blocks */
  widgets?: GenUIRegistry;
}
```

### GenUI widgets (resolved)

**Wire format — fenced block, not inline.** Drop the inline `genui{…}` string in
favor of a fenced code block with a `genui` info string and a JSON body. This
reuses `react-markdown`'s existing fence tokenizer (no custom micromark plugin),
is streaming-safe (clear start/end markers; parse only once the fence closes),
and **degrades gracefully** to an inert code block if the GenUI plugin isn't
loaded. Identity / version / prefetch policy are explicit fields, not encoded in
the widget name:

````md
```genui
{ "widget": "math_block", "version": 2, "prefetch": "eager", "props": { "content": "a^2+b^2=c^2" } }
```
````

**Registry contract.** Widgets are host-registered, lazy, and schema-validated:

```ts
type GenUIPrefetchPolicy = 'eager' | 'visible' | 'idle';

interface GenUIWidgetProps<T = unknown> {
  data: T;                       // payload, validated against `schema`
  meta: { name: string; version?: number; messageId: string; streaming: boolean };
}

interface GenUIWidgetEntry<T = unknown> {
  /** lazy chunk — keeps widgets out of the base bundle */
  component: () => Promise<{ default: React.ComponentType<GenUIWidgetProps<T>> }>;
  /** optional runtime validation of untrusted payload */
  schema?: StandardSchemaV1<T>;
  /** default policy if the wire payload omits one */
  prefetch?: GenUIPrefetchPolicy;
  /** optional data prefetch, distinct from loading the component code */
  prefetchData?: (data: T) => Promise<unknown>;
}

type GenUIRegistry = Record<string, GenUIWidgetEntry>;
```

**Prefetch semantics — split code from data.** The old `*_always_prefetch_*`
token conflated two things; separate them:

- **Component (code)** prefetch may start as soon as the message arrives, even
  while streaming.
- **Data** prefetch (`prefetchData`) runs only after the JSON payload parses
  completely.
- Policies: `eager` (= old `always_prefetch`; load immediately), `visible`
  (`IntersectionObserver`, the default for long threads), `idle`
  (`requestIdleCallback`).
- **Registry policy overrides the wire hint** so the host controls cost; the wire
  `prefetch` field is a model-expressed hint only.
- Gate **mount + data fetch** on `ctx.streaming` and a complete/valid payload —
  show the `MCPToolCall`-style pending card until then.

**Versioning.** Key the registry by base name and resolve `version` explicitly
(`math_block` + `version: 2`); don't bake the version into the lookup key.

`SuperChat`/`AIChat` accept `renderPlugins?: SuperChatRenderPlugin[]` and compose
them into a single `renderTextContent` implementation. Default export ships only
Markdown core; math/code/genui/NITRO/mermaid are **opt-in** subpath imports to
keep the base bundle light (consistent with the library's tree-shaking and
"prefer NITRO over AGGrid / heavy deps behind subpath entries" conventions in
[CONTRIBUTING.md](CONTRIBUTING.md)).

### Examples to support (acceptance targets)

- Math (inline + block):

  $$ a^2 + b^2 = c^2 $$

- Interactive GenUI block (host-registered widget), fenced:

  ````md
  ```genui
  { "widget": "math_block", "version": 2, "prefetch": "eager", "props": { "content": "a^2+b^2=c^2" } }
  ```
  ````

- Syntax-highlighted code:

  ```javascript
  const growth = 0.18;
  console.log(`Growth: ${growth * 100}%`);
  ```

- GFM table rendered through **NITRO** (sortable/filterable), not a static
  `<table>`.

### Security

Untrusted model/agent output **must** be sanitized (`rehype-sanitize` allow-list).
When composing with `rehype-highlight`, order matters: allow the highlighter's
`className` on `code`/`span` (or highlight after sanitizing) so token colors
survive the allow-list.

GenUI widgets render only **host-registered** components keyed by name — unknown
names fall back to the inert `genui` code block, never arbitrary HTML/script. The
per-widget `schema` validates the payload before it reaches the component; widget
authors must treat `data` as untrusted (no `dangerouslySetInnerHTML` /
data-derived URLs without their own checks). The host owns the trust boundary,
same contract as `renderTextContent` today.

---

## Dependencies (new, all lazy / opt-in)

`react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex` (+ `katex`),
`rehype-sanitize`, `rehype-highlight` (default highlighter; `shiki` reserved as an
upgrade path), `mermaid`. NITRO tables reuse the existing `@mieweb/ui/datavis`
entry. None enter the base bundle; each rich plugin is a subpath/lazy import.

---

## Milestones (rough)

1. **Spike** — `renderTextContent` plugin composer + Markdown core; render the AI
   demo conversation as Markdown.
2. **Participant model** — types + map existing role systems; `@`-mention
   addressing + timestamp-interleaved concurrent replies with per-participant
   visual cues; multi-agent demo.
3. **SuperChat shell** — native component preserving `chat-component` API shape
   (sidebar / thread / compose / read-only / linkBuilder / callbacks).
4. **Rich plugins** — code (`rehype-highlight`, `.hljs-*` → theme tokens), then
   math, then GenUI widget registry (fenced ` ```genui ` JSON; lazy +
   schema-validated; component-vs-data prefetch), then NITRO tables, then mermaid.
   Each behind a subpath import with a Storybook story.
5. **A11y + brand/dark-mode pass**, unit + visual baselines, autodocs +
   `MAINTAINERS.md`.

---

## Resolved decisions

All prior open questions are now settled (details in the sections above):

- **Shared implementation?** No. No Bootstrap/non-React support for the rich
  features; the standalone UMD stays as-is, SuperChat is built natively with a
  compatible API shape. No headless-core split. *(Decision 1)*
- **Turn-taking for concurrent agents?** `@`-mention addressing; responses target
  the last mention; concurrent replies interleave by timestamp with
  per-participant visual cues. *(Decision 2)*
- **Highlighter?** `rehype-highlight` by default (lighter, `.hljs-*` classes map
  to theme tokens); `shiki` reserved as an upgrade path if fidelity disappoints.
  *(Decision 3)*
- **GenUI format + prefetch?** Fenced ` ```genui ` JSON blocks; host-registered,
  lazy, schema-validated widget registry; prefetch split into component vs. data
  with `eager`/`visible`/`idle` policies (registry overrides wire hint).
  *(Decision 3)*
- **Fold into the `AI` module, or a new module?** Ship a **new `SuperChat`
  module** that composes `AI`. The `AI` module stays a lightweight building-block
  layer; the chat UI is heavier and opinionated, so consumers opt into it without
  pulling in chat dependencies they don't need.

## Related

- AI module: [src/components/AI](src/components/AI) ·
  notes: [src/components/AI/MAINTAINERS.md](src/components/AI/MAINTAINERS.md)
- NITRO tables: [src/components/DataVisNITRO/MAINTAINERS.md](src/components/DataVisNITRO/MAINTAINERS.md)
- Provider conventions: [CONTRIBUTING.md](CONTRIBUTING.md)
- Standalone repo: <https://github.com/mieweb/chat-component> ·
  demo: <https://chat-component.os.mieweb.org/demo-bootstrap.html>
