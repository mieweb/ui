# Evals — Rich text / Kerebron editors

Primary agent: **MIE UI Rich Text Agent**. See [README.md](./README.md) for
format and scoring.

### RT-1 — Which editor for the stored format

- **Ask:** "I need a rich input whose saved value is HTML, looking like a plain textarea until the user asks for the toolbar. Which component?"
- **Expect:** Kerebron `TextAreaRich` from `@mieweb/ui/kerebron` (HTML
  contract, one Input row tall, auto-grows, toolbar hidden until asked) — not
  `RichEditor` (Markdown contract) and not the deprecated main-barrel
  `TextAreaRich`. Selection may be answered by the orchestrator directly.
- **Agent:** MIE UI Design Agent (selection) → MIE UI Rich Text Agent for config
- **Source:** src/catalog/Editors.mdx — Which one? table; agent/skills/mieweb-ui-kerebron/SKILL.md — Surfaces

### RT-2 — Install legs

- **Ask:** "What exactly do I install and configure to use RichEditor in my Vite app?"
- **Expect:** All three legs: (1) `@kerebron/*` peers at **exactly 0.8.12**
  (`--save-exact`; `editor`, `editor-kits`, `extension-basic-editor`,
  `extension-menu`, `wasm`), (2) the four ProseMirror overrides in the host
  (view 1.42.3, model 1.25.9, state 1.4.3, transform 1.10.4), (3)
  `@mieweb/ui/kerebron.css` + serve `@kerebron/wasm/assets` at
  `/kerebron-wasm`. Plus the consumer-side `@kerebron` patches.
- **Agent:** MIE UI Rich Text Agent
- **Source:** MIGRATION.md — eSheet and EncounterVisit / 0.12 sections; agent/skills/mieweb-ui-kerebron/SKILL.md — Install

### RT-3 — Fragment RangeError

- **Ask:** "Typing in any editor throws `RangeError: Can not convert <…> to a Fragment (looks like multiple versions of prosemirror-model were loaded)`. What's wrong?"
- **Expect:** Split ProseMirror resolution (mieweb/ui#709): Kerebron range
  drifted to 0.8.13+ or transitive `^`-ranges floated on a fresh install. Fix:
  pin `@kerebron/*` to 0.8.12 exactly + add the four overrides;
  `pnpm dedupe` cannot fix it; verify with `pnpm why prosemirror-model`
  (single version).
- **Agent:** MIE UI Rich Text Agent
- **Source:** MIGRATION.md — mieweb/ui#709 section; kerebron skill troubleshooting

### RT-4 — Why prosemirror-view 1.42.3

- **Ask:** "Kerebron pins prosemirror-view 1.40.0 — why does the override force 1.42.3?"
- **Expect:** The protected MDY link bridge uses 1.42.3; two view instances
  can make decorations incompatible and leave the older view's behavior
  active.
- **Agent:** MIE UI Rich Text Agent
- **Source:** MIGRATION.md — prosemirror-view note

### RT-5 — WASM 404s

- **Ask:** "Code blocks have no syntax highlighting and the console shows 404s for `.wasm` files."
- **Expect:** The editor loads tree-sitter grammars at runtime from
  `/kerebron-wasm`; serve `@kerebron/wasm`'s `assets/` dir at that path (copy
  or symlink into `public/`, or Storybook `staticDirs`), or pass a custom
  `assetLoad` (`createAssetLoad('/other-path')`).
- **Agent:** MIE UI Rich Text Agent
- **Source:** src/kerebron.ts header; RichEditor `assetLoad` prop docs

### RT-6 — Dead toolbar dropdowns

- **Ask:** "The Heading and List dropdowns in the RichEditor toolbar don't open when clicked."
- **Expect:** Host is missing the `@kerebron/extension-menu` patch — the
  library's `patchedDependencies` don't propagate; apply
  `patches/@kerebron__extension-menu@0.8.12.patch` in the host (pnpm-format;
  npm/yarn convert for patch-package).
- **Agent:** MIE UI Rich Text Agent
- **Source:** RichEditor.stories.tsx docs; patches/; kerebron skill — patches table

### RT-7 — Marks dropped on save

- **Ask:** "Highlight, superscript and subscript formatting disappears when the document is saved and reloaded."
- **Expect:** Missing `@kerebron/extension-markdown` patch (mieweb/ui#536):
  the serializer's mark table has no entries for those marks, so they're
  silently dropped on the markdown round-trip; patched they serialize as
  `<mark>`/`<sup>`/`<sub>` inline HTML.
- **Agent:** MIE UI Rich Text Agent
- **Source:** patches/@kerebron__extension-markdown@0.8.12.patch; kerebron skill — patches table

### RT-8 — Reading the value on submit

- **Ask:** "Should I trust my `onChange`-mirrored state when the user hits Save?"
- **Expect:** No — `onChange` can lag the last keystroke; call the ref's
  `getContent()` on submit (async, awaits the initial load; rejects if setup
  failed — see `onError`).
- **Agent:** MIE UI Rich Text Agent
- **Source:** RichEditorHandle docs — getContent

### RT-9 — Changing collab/mediaUpload at runtime

- **Ask:** "How do I switch the RichEditor to a different collaboration room without reloading the page?"
- **Expect:** `collab` (like `mediaUpload`, `modifyMenu`, `omitExtensions`)
  is read once at mount — **remount via `key`** to switch rooms; collab mode
  is uncontrolled.
- **Agent:** MIE UI Rich Text Agent
- **Source:** RichEditor collab prop docs; kerebron skill — read-once props

### RT-10 — Pasted images bloat the document

- **Ask:** "A pasted screenshot turned my saved markdown into a 6 MB payload. How do I prevent that?"
- **Expect:** Set `mediaUpload.uploadHandler` — without it images embed as
  base64 `data:` URLs (and video as reload-dead blob URLs); the handler
  uploads the file and returns a URL so the document carries a link, not
  bytes. Required whenever documents persist.
- **Agent:** MIE UI Rich Text Agent
- **Source:** RichEditor mediaUpload prop docs

### RT-11 — Removing a feature wholesale

- **Ask:** "How do I remove checklists (toolbar button, `- [ ]` shortcut, paste) from the editor in one move?"
- **Expect:** `omitExtensions={['task_list', 'task_item']}` — toolbar, input
  rules and paste handling are all schema-driven, so dropping the nodes
  removes the whole feature; read once at mount.
- **Agent:** MIE UI Rich Text Agent
- **Source:** RichEditor omitExtensions prop docs

### RT-12 — Collab silently local

- **Ask:** "I pass `collab={{ room }}` but edits don't sync between users, and there's no error."
- **Expect:** `onUnavailable` reports **kit-load failures only** (optional
  peers `@kerebron/extension-yjs`, `yjs`, `y-protocols` missing): the editor
  mounts as a local one and the callback fires once, before the editor is
  created. A reachable-but-disconnected relay is different — the kit stays
  loaded and the provider retries on its own, with no callback. Fix: install
  the peers and pass `collab.onUnavailable` to surface load failures; for
  connectivity, check the `/yjs` websocket relay (`wsUrl` default
  `<ws|wss>://<location.host>/yjs`).
- **Agent:** MIE UI Rich Text Agent
- **Source:** RichEditor collab docs; collabKit.ts; kerebron skill — Collaboration

### RT-13 — MISSING_EXPORT at build

- **Ask:** "My `vite build` fails with `MISSING_EXPORT` from `@kerebron/extension-yjs` in a `collabKit-*` chunk, but I never use collaboration."
- **Expect:** Optional collab peers absent + an @mieweb/ui version older than
  the mieweb/ui#706 fix (static named imports in the lazy collab chunk; the
  optional-peer stub has no named exports). Fix: upgrade @mieweb/ui, or
  externalize `/^@kerebron\/extension-yjs/` and `/^y-websocket/`.
- **Agent:** MIE UI Rich Text Agent
- **Source:** collabKit.ts header (mieweb/ui#706); tailwind4 + kerebron skill troubleshooting

### RT-14 — Legacy RichTextEditor

- **Ask:** "Can I use RichTextEditor for a new templated-letter feature? It has `{{variables}}` and dictation."
- **Expect:** No — `RichTextEditor` (the `document.execCommand` engine) is
  deprecated (mieweb/ui#692), never for new work; use Kerebron `TextAreaRich`
  for HTML with `variableGroups` + dictation, or `RichEditor` for Markdown.
  Note it emits raw unsanitised `innerHTML`.
- **Agent:** MIE UI Rich Text Agent
- **Source:** src/catalog/Editors.mdx — deprecated rows (mieweb/ui#692)

### RT-15 — Textarea DOM shape

- **Ask:** "After upgrading to 0.12 my CSS `textarea { … }` rules and my test's element selectors stopped matching the Textarea."
- **Expect:** Since 0.12 `Textarea` renders the Kerebron engine: no visible
  `<textarea>` — a ProseMirror `contenteditable` (`role="textbox"`, class
  `kb-editor`) plus a hidden mirror `[data-slot="textarea-mirror"]` carrying
  `name`/`value`. Target the `data-slot` hooks (`[data-slot^="textarea-"]`
  or a concrete slot); `getByRole('textbox')`
  keeps working; `TextAreaPlain` / `richText={false}` restores the native
  element.
- **Agent:** MIE UI Rich Text Agent
- **Source:** MIGRATION.md — Textarea is rich text underneath (0.12.0)

### RT-16 — maxLength not enforced

- **Ask:** "Textarea's `maxLength` no longer blocks typing past the limit — bug?"
- **Expect:** Known behaviour change (0.12): `maxLength` isn't enforced while
  typing; the `showCount` counter still renders and turns red. Enforce in
  `onChange` or switch to `TextAreaPlain`.
- **Agent:** MIE UI Rich Text Agent
- **Source:** MIGRATION.md — Behaviour changes to review

### RT-17 — Email checklists vanish

- **Ask:** "Why can't users add checklists inside EmailEditor text blocks?"
- **Expect:** By design (mieweb/ui#695): email `text` blocks are
  `TextAreaRich` with `omitExtensions={['task_list', 'task_item']}` —
  checkbox inputs are sanitizer-forbidden and inert in mail clients, so the
  feature is removed schema-first. Not a bug.
- **Agent:** MIE UI Rich Text Agent
- **Source:** EmailBlockSettings.tsx — EMAIL_OMITTED_EXTENSIONS; kerebron skill — EmailEditor

### RT-18 — Compiling EmailEditor output

- **Ask:** "EmailEditor gives me MJML from `renderEmailMjml` — does @mieweb/ui compile it to email HTML?"
- **Expect:** No — compile with `mjml` (Node) or `mjml-browser` **host-side**;
  it is not a peer. The editor's document is JSON blocks, not HTML; sending,
  recipients and templates are the host's concern.
- **Agent:** MIE UI Rich Text Agent
- **Source:** src/catalog/Editors.mdx — EmailEditor row + peers table

### RT-19 — Labelling the editor

- **Ask:** "My `<label htmlFor={editorId}>` doesn't give the RichEditor an accessible name."
- **Expect:** The host is a `div`, not a labelable control — `htmlFor` won't
  associate; use `aria-label` or `aria-labelledby` (the `id` prop is the
  anchor). Deeper audits go to the A11y agent.
- **Agent:** MIE UI Rich Text Agent
- **Source:** RichEditor id/aria props docs; Editors.mdx — Labelling

### RT-20 — Displaying what RichEditor saved

- **Ask:** "What renders the markdown a RichEditor produced, in a read-only record view with mermaid diagrams?"
- **Expect:** `MarkdownRenderer` (main barrel, `@mieweb/ui/markdown.css`) —
  sanitised HTML, code highlighting, `mermaid`/`csv`/`survey`/`html` fences,
  `streaming` for token-by-token AI output. Conditional deps: `mermaid` for
  the mermaid fence, `papaparse` for csv, `js-yaml` only for YAML-input
  surveys (JSON surveys and the html fence need none). Legacy
  `RichTextEditor` HTML does **not** go through it.
- **Agent:** MIE UI Rich Text Agent
- **Source:** src/catalog/Editors.mdx — Markdown row + "Markdown closes the loop"

### RT-21 — Controlled value semantics

- **Ask:** "I set `value` and `onChange` on RichEditor but rejected edits don't revert like a native controlled input."
- **Expect:** Default is tolerant of read-once hosts (`getContent()` on
  submit); opt in to native controlled semantics with `strictValue` —
  converges the document to `value` on every render so un-echoed edits
  revert. Also: changing `value` reloads the editor (unless `collab`).
- **Agent:** MIE UI Rich Text Agent
- **Source:** RichEditor strictValue/value prop docs

### RT-22 — HTML-valued RichEditor

- **Ask:** "Can RichEditor speak HTML instead of Markdown without switching components?"
- **Expect:** Yes — `valueType="text/html"` governs both how `value` is
  parsed and what `onChange`/`getContent()` emit (default
  `'text/x-markdown'`). But if the goal is a textarea-like HTML field,
  `TextAreaRich` is the intended surface.
- **Agent:** MIE UI Rich Text Agent
- **Source:** RichEditor valueType prop docs; Editors.mdx — Which one? table
