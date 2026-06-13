# SuperChat — Maintainer Notes

> **Provider notes** — how to *change* the SuperChat module. Consumers should read
> the [README.md](README.md) (getting started + vocabulary), the Storybook autodocs
> (Product › Feature Modules › SuperChat), and
> [superchat-plan.md](../../../superchat-plan.md). General conventions live in
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

## Architecture (3 decisions from the plan)

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

## Not yet implemented (tracked against the plan)

- `shiki` upgrade path for the code plugin (currently `rehype-highlight`).

## Testing

- Stories: [SuperChat.stories.tsx](SuperChat.stories.tsx) drives the autodocs page
  (Markdown core / rich plugins / read-only).
- When adding a plugin, add a story exercising it and confirm sanitized output
  still renders.
