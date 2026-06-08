# SuperChat — Maintainer Notes

> **Provider notes** — how to *change* the SuperChat module. Consumers should read
> the Storybook autodocs (Product › Feature Modules › SuperChat) and
> [superchat-plan.md](../../../superchat-plan.md). General conventions live in
> [CONTRIBUTING.md](../../../CONTRIBUTING.md). This module **composes** the AI
> module — see [../AI/MAINTAINERS.md](../AI/MAINTAINERS.md).

## What's in here

| Surface | File | Role |
|---------|------|------|
| `SuperChat` | [SuperChat.tsx](SuperChat.tsx) | Native shell: sidebar + thread + composer (controlled props) |
| `createMarkdownRenderer` | [render/createMarkdownRenderer.tsx](render/createMarkdownRenderer.tsx) | Composes render plugins → one `renderTextContent` (Markdown core) |
| render context | [render/renderContext.ts](render/renderContext.ts) | Threads `messageId`/`streaming` into custom nodes (GenUI) |
| code / math / genui plugins | [plugins/](plugins) | Opt-in rich plugins (subpath entry) |
| types | [types.ts](types.ts) | Participant model + chat-component-compatible data model + plugin/GenUI contracts |

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

- `@mieweb/ui/components/SuperChat` ships the shell **+ Markdown core** only
  (`react-markdown` + `remark-gfm` + `rehype-sanitize`).
- `@mieweb/ui/components/SuperChat/plugins` ships `code` / `math` / `genui`. Each
  rich dependency (`rehype-highlight`, `rehype-katex`/`katex`) is an **optional
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
  transformer rewrites `<pre><code class="language-genui">` → `<genui-widget
  data-genui="…">` *before* sanitize (the tag/attr are allow-listed), which
  avoids `pre`/`code` component-override conflicts with the code plugin.
- Widgets are **host-registered, lazy, schema-validated**. Unknown widget →
  inert code-block fallback (never arbitrary HTML).
- Prefetch is split: **component (code)** may load while streaming per policy
  (`eager`/`visible`/`idle`); **data** validation/prefetch runs only once the
  payload parses *and* the message has stopped streaming. **Registry policy
  overrides the wire hint.**
- Versioning: key the registry by base name; resolve `version` explicitly (do not
  bake the version into the lookup key).

## Not yet implemented (tracked against the plan)

- **NITRO tables** plugin (GFM table → `DataVisNITRO` grid) — reuse the
  `@mieweb/ui/datavis` entry; see [../DataVisNITRO/MAINTAINERS.md](../DataVisNITRO/MAINTAINERS.md).
- **Mermaid** plugin (lazy `mermaid` on ` ```mermaid ` fences).
- **Image lightbox** reuse from Messaging.
- Composer `@`-mention **autocomplete** (mentions are currently detected on send;
  see `detectMentions`).

## Testing

- Stories: [SuperChat.stories.tsx](SuperChat.stories.tsx) drives the autodocs page
  (Markdown core / rich plugins / read-only).
- When adding a plugin, add a story exercising it and confirm sanitized output
  still renders.
