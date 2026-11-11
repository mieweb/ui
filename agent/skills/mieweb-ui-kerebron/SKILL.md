---
name: mieweb-ui-kerebron
description: Integrating @mieweb/ui rich-text editors — the Kerebron entry (RichEditor, CodeEditor, TextAreaRich), the Kerebron-backed main-barrel Textarea, EmailEditor, and MarkdownRenderer — including the exact-0.8.12 peer set, ProseMirror version overrides, WASM grammar serving, the consumer-side @kerebron patches, Yjs collaboration and its degrade path. USE WHEN installing or configuring any rich-text editor, typing/toolbar/WASM/collab misbehaves, markdown round-trip drops marks, or an editor value contract (markdown vs HTML vs plain text) is in question.
---

# Kerebron rich text in @mieweb/ui

Sourced from `MIGRATION.md`, `src/catalog/Editors.mdx`, the RichEditor/Email
docs and `patches/` in the mieweb/ui repo. Selection guidance ("which
editor?") lives in the `mieweb-ui-catalog` skill; general install/CSS
foundation in `mieweb-ui-tailwind4`.

## Surfaces and their value contracts

The **stored format decides the surface** — this is the first question to
settle in any integration:

| Surface | Entry | Value contract |
| --- | --- | --- |
| `RichEditor` | `@mieweb/ui/kerebron` | **Markdown** in/out (`valueType: 'text/x-markdown'` default; `'text/html'` for an HTML-valued surface) |
| `CodeEditor` | `@mieweb/ui/kerebron` | Source code (tree-sitter highlighting) |
| `TextAreaRich` | `@mieweb/ui/kerebron` | **HTML**, textarea-like chrome: one Input row tall, auto-grows, toolbar hidden until asked, markdown block shortcuts, Notion-style `+` gutter menu, `.shortcut` macros |
| `Textarea` | main barrel | **Plain text** contract over the same engine (since 0.12): `value`/`onChange(event.target.value)` are strings, `name` posts via a hidden mirror `<textarea>`. Opt out per field with `richText={false}` or `TextAreaPlain` |
| `EmailEditor` + `renderEmailMjml` | main barrel | **JSON blocks** (hero, columns, buttons, images, social, footer) compiled to MJML — not HTML; each `text` block hosts a `TextAreaRich` |
| `MarkdownRenderer` + blocks, `useMarkdown` | main barrel | **Read-only display** of Markdown (sanitised HTML, code highlighting, `mermaid`/`csv`/`survey`/`html` fences, `streaming` for token-by-token AI output) |

**Deprecated — never for new work** (mieweb/ui#692): main-barrel
`RichTextEditor` and legacy `TextAreaRich` (the `document.execCommand`
engine). Replacements: Kerebron `TextAreaRich` for HTML (+ `variableGroups` +
dictation), `RichEditor` for Markdown. `RichTextEditor` emits raw unsanitised
`innerHTML` and its output does **not** go through `MarkdownRenderer`.

## Install — the three-legged stool

Every consumer needs all three legs since 0.12 (the main-barrel `Textarea`
rides the engine, so none of this is optional):

**1. Peers at exactly 0.8.12.** `@kerebron/editor`, `editor-kits`,
`extension-basic-editor`, `extension-menu`, `wasm` are required peers —
install with `--save-exact`: newer Kerebron (0.8.13+) pins different
ProseMirror versions, so a `^0.8.12` range drifts and splits
`prosemirror-model` (mieweb/ui#709). Collab peers stay optional:
`@kerebron/extension-yjs`, `yjs`, `y-protocols`.

```sh
npm install --save-exact @kerebron/editor@0.8.12 @kerebron/editor-kits@0.8.12 \
  @kerebron/extension-basic-editor@0.8.12 @kerebron/extension-menu@0.8.12 \
  @kerebron/wasm@0.8.12
```

**2. ProseMirror overrides in the host.** Even with matching pins,
ProseMirror's own `^`-ranged internals float to the newest release on any
fresh install — the library's own overrides do **not** propagate. Add to the
host (pnpm 10: `overrides:` in `pnpm-workspace.yaml`; npm: `"overrides"`;
Yarn: `"resolutions"` — full snippets in
[MIGRATION.md](https://github.com/mieweb/ui/blob/main/MIGRATION.md#esheet-and-encountervisit)):

```yaml
overrides:
  prosemirror-view: "1.42.3"
  prosemirror-model: "1.25.9"
  prosemirror-state: "1.4.3"
  prosemirror-transform: "1.10.4"
```

`prosemirror-view` is 1.42.3 (not Kerebron's pinned 1.40.0) for the protected
MDY link bridge. Verify after install: `pnpm why prosemirror-model` /
`pnpm why prosemirror-view` (or `npm ls`/`yarn why`) must each show a
**single** version. `pnpm dedupe` cannot fix a split — only overrides can.

**3. CSS + WASM assets.** Import `@mieweb/ui/kerebron.css` beside
`styles.css` (`markdown.css` too if rendering Markdown). The editor loads
tree-sitter WASM grammars at runtime from `/kerebron-wasm`: serve
`@kerebron/wasm`'s `assets/` directory at that path — e.g. copy or symlink it
into Vite's `public/kerebron-wasm`, or add a Storybook `staticDirs` mapping —
or pass a custom `assetLoad` (`createAssetLoad('/my-path')`) when it lives
elsewhere.

## The consumer-side patches

The repo's [`patches/@kerebron__*`](https://github.com/mieweb/ui/tree/main/patches)
fixes target `@kerebron/*@0.8.12` exactly and must be applied **in the host
app** until fixed upstream — the library's own `patchedDependencies` do not
propagate. They are pnpm-format (list under `patchedDependencies` as-is);
npm/yarn hosts convert to their patch tool's format (`patch-package` expects
its own filenames and `node_modules/…` paths). What breaks without each:

| Patch | Without it |
| --- | --- |
| `extension-menu` | Toolbar **Heading/List dropdowns do not fire** in browsers (also: full toolbar re-render per transaction) |
| `extension-markdown` | **highlight/superscript/subscript marks silently dropped** when saving back to Markdown (patched: round-trip as `<mark>`/`<sup>`/`<sub>` inline HTML, mieweb/ui#536) |
| `extension-codecrock` | Code-block language `<select>` has no accessible name (axe `select-name` failure) |

## RichEditor integration facts

- **Read on submit, not from mirrored state:** `onChange` can lag the last
  keystroke — use the ref's `getContent()` (async, awaits the initial load).
- **Read-once props:** `collab`, `mediaUpload`, `modifyMenu`,
  `omitExtensions` are read when the editor mounts — **remount via `key`** to
  change any of them.
- **`mediaUpload.uploadHandler` is required whenever documents persist.**
  Without it a pasted image embeds as base64 (`~4 MB screenshot → ~5.8 MB of
  markdown`) and video as a dead-on-reload blob URL.
- **`omitExtensions` removes whole features schema-first** — toolbar, input
  rules and paste handling are all schema-driven, so
  `['task_list', 'task_item']` removes checklists everywhere in one move.
- **`modifyMenu`** reshapes the stock toolbar (append macros/dictation
  controls, drop stock groups) before first render.
- **Controlled semantics are opt-in:** default tolerates read-once hosts; set
  `strictValue` for native controlled-input behavior (un-echoed edits
  revert). Changing `value` reloads the editor unless `collab` is set.
- **Labelling:** the host is a `div`, not a labelable control — `<label
  htmlFor>` won't associate; use `aria-label`/`aria-labelledby` (the `id`
  prop is the anchor).

## Collaboration (Yjs)

`collab: { room, wsUrl?, params? }` joins one shared document per `room` over
the `/yjs` websocket relay (default `<ws|wss>://<location.host>/yjs`;
`params` for auth tokens). Requires the optional peers
`@kerebron/extension-yjs` + `yjs` + `y-protocols`. **Best-effort degrade:**
if the Yjs **kit fails to load** (e.g. the optional peers are absent), the
editor still mounts locally and `collab.onUnavailable` fires once, before
the editor is created — pass it when users must know they're editing
unshared. `onUnavailable` is **not for connection trouble**: a reachable
room that is currently disconnected still has the kit loaded, and the
provider retries on its own. The kit lazy-loads via dynamic `import` so plain-mode consumers
never pull Yjs code (versions before the mieweb/ui#706 fix had static named
imports in the lazy chunk — rolldown-Vite builds failed with
`MISSING_EXPORT`; fix: upgrade, or externalize
`/^@kerebron\/extension-yjs/`, `/^y-websocket/`). Pair with the
`CollabStatus` component (Feedback family) for presence/sync UI. Collab mode
is uncontrolled — remount via `key` to switch rooms.

## Textarea-on-Kerebron behaviour changes (0.12)

- `maxLength` no longer enforced while typing (counter still renders/turns
  red) — enforce in `onChange` or use `TextAreaPlain`.
- `labelVariant="floating"`, `resize`, `autoResize={false}` ignored (one-time
  dev warning).
- **DOM shape:** no visible `<textarea>` — a ProseMirror `contenteditable`
  (`role="textbox"`, class `kb-editor`) plus hidden mirror
  `[data-slot="textarea-mirror"]` carrying `name`/`value`. `textarea { … }`
  CSS and element refs no longer match; target the `data-slot` hooks
  (`[data-slot^="textarea-"]` prefix selector, or a concrete slot like
  `textarea-wrapper`). `getByRole('textbox')` tests keep working.
- Controlled transforms of `event.target.value` reset formatting (the
  reported value is flattened plain text).

## EmailEditor constraints

Email `text` blocks are `TextAreaRich` surfaces with
`omitExtensions={['task_list', 'task_item']}` — checkbox inputs are
sanitizer-forbidden and inert in mail clients (mieweb/ui#695), so checklists
are removed schema-first rather than filtered after the fact. Compile
`renderEmailMjml` output with `mjml`/`mjml-browser` **host-side** (not a
peer). Sending, recipients and templates are the host's concern.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Typing throws `RangeError: Can not convert … to a Fragment (looks like multiple versions of prosemirror-model)` | Split ProseMirror resolution: Kerebron range drifted to 0.8.13+, or transitive `^`-ranges floated on a fresh install (mieweb/ui#709) | Pin `@kerebron/*` 0.8.12 exact + the four overrides; verify single version via `pnpm why prosemirror-model` |
| `vite build` fails `MISSING_EXPORT` from `@kerebron/extension-yjs` in a `collabKit-*` chunk | Optional collab peers absent + @mieweb/ui older than the #706 fix (static named imports in the lazy chunk) | Upgrade @mieweb/ui; or externalize `/^@kerebron\/extension-yjs/`, `/^y-websocket/` |
| Code blocks render without highlighting; 404s for `*.wasm` | `@kerebron/wasm/assets` not served at `/kerebron-wasm` | Serve/symlink the assets dir, or pass `assetLoad` with the actual path |
| Toolbar Heading/List dropdowns don't open | Host missing the `extension-menu` patch | Apply `patches/@kerebron__extension-menu@0.8.12.patch` in the host |
| Highlight/superscript/subscript lost after save | Host missing the `extension-markdown` patch (marks absent from the serializer table) | Apply the `extension-markdown` patch (mieweb/ui#536) |
| axe: `select-name` on code blocks | Host missing the `extension-codecrock` patch | Apply the `extension-codecrock` patch |
| Pasted screenshot balloons the document / image dies on reload | No `mediaUpload.uploadHandler` — base64/blob embedding | Provide `uploadHandler` returning a hosted URL |
| Edits revert while typing in a controlled host | Host `onChange` doesn't echo into `value` and `strictValue` is set — or the host echoes flattened text back into a rich surface | Echo the value correctly, or drop `strictValue` for read-once + `getContent()` on submit |
| `collab` set but edits don't sync, no error | Yjs kit failed to load (missing optional peers) → silent local degrade; or the relay is disconnected (kit loaded, provider retrying) | Install the collab peers and pass `collab.onUnavailable` to surface load failures; for connectivity, check the `/yjs` relay — the provider retries on its own |
| `<label htmlFor>` doesn't focus/name the editor | Editor host is a `div`, not a labelable control | `aria-label` / `aria-labelledby` via the `id` anchor |
| Checklist items vanish in EmailEditor | By design — `task_list`/`task_item` are email-unsafe (mieweb/ui#695) | Use a different block structure; not a bug |
