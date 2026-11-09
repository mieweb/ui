# FileViewer — Maintainer Notes

Short notes on the invariants that are easy to break. User-facing docs live in
[FileViewer.stories.tsx](./FileViewer.stories.tsx) and
[FileDocument.stories.tsx](./FileDocument.stories.tsx).

## Separate entry, optional peers

The module ships as `@mieweb/ui/components/FileViewer` (`tsup.entries.mjs`), not
from the main entry, because the default renderer pulls in SuperChat's
optional Markdown peers: `react-markdown`, `remark-gfm`, `rehype-sanitize` and
`rehype-highlight`. Don't re-export it from `src/index.ts`; consumers who never
show files must not need those peers. Both stories declare the same `peers` in
`parameters.catalog`; keep them in step with [index.ts](./index.ts).

`FileViewer.tsx` imports `../Markdown/styles.css` for its side effect (the
`.md-prose` and highlight colours used by Storybook and the visual baselines).
Consumers still import `@mieweb/ui/markdown.css` themselves.

## Renderer and sanitising boundary

- The default renderer is SuperChat's `createMarkdownRenderer` with
  `createCodePlugin()`, built once per module on first use (`defaultRenderer ??=`)
  and called with `messageId: path`. It is created without `trusted`, so it
  sanitises through `rehype-sanitize` and raw HTML in a file never renders.
  Never pass `trusted: true` here. **The guarantee belongs to the default
  renderer only.** A host `renderMarkdown` replaces it completely, and that
  host owns sanitising. Don't add a second sanitising pass around a custom
  renderer.
- Code files go through the **same** `renderMarkdown` as one fenced block
  (`toCodeFence(text, fileViewLanguage(path))`). This is why a host renderer
  with extra plugins also styles code. `toCodeFence` makes the fence one
  backtick longer than the longest run in the text. Keep that, or a file that
  contains its own fences closes the block early.
- Text over `highlightLimit` skips `renderMarkdown` entirely and renders a
  plain `<pre>`, **including Markdown files**. Large files stay responsive and
  never reach a host renderer.
- `fileViewLanguage` maps only to languages in rehype-highlight's default
  (`common`) set. The code plugin runs with `ignoreMissing: true`, so a
  language outside that set fails silently and renders unhighlighted. Register
  it with the renderer before mapping an extension to it.

## Direction

Code is an LTR island (`dir="ltr"` on the region). Markdown uses `dir="auto"`,
and its fenced code is forced back to LTR with the arbitrary utility
`[&_pre]:[direction:ltr]`. That class is assembled at runtime from a boolean
condition, so it is safelisted in **both** `src/tailwind-preset.ts` and
`src/tailwind-preset.cjs`. Change or remove it in all three places together.
The plain over-limit `<pre>` doesn't get it because there is no prose around it.

## FileDocument draft synchronisation

- The uncontrolled draft follows `content` while it is unedited. This uses
  React's "adjust state during render" pattern (`syncedContent`), not an
  effect: an effect would paint one frame of the stale draft and report a
  spurious dirty flip. The draft is replaced only when it still equals the
  previous `content`. Edits always win over a reload.
- A controlled `draft` bypasses this. The host decides what a reload does.
- `dirty` is `draft !== content`. `onDirtyChange` fires from an effect only
  when the value **changes** (`reportedDirty` ref), so a clean mount reports
  nothing. Keep the callback in a ref so a new inline function each render
  doesn't fire it again.
- `FileDocumentLabels` extends `FileViewerLabels`, and the merged labels are
  passed straight to the inner viewer. A new viewer string needs a default in
  `defaultFileViewerLabels` only. FileDocument picks it up through the spread.

## FileDocument async actions

- **Save.** While `onSave` is pending, Save shows `isLoading`, Cancel is
  disabled and the textarea is `readOnly`. Edits typed during a save could be
  overwritten when the host reloads `content`. On rejection the component
  switches to Edit (even if Save was pressed from the View preview) and shows
  `labels.saveFailed` as a `role="alert"`. The host must update `content`
  **before** resolving, or the document returns to View still dirty.
- **Cancel.** Only one Cancel may wait on `confirmDiscard` at a time
  (`cancelling` ref). A late duplicate would otherwise discard edits made
  after the first confirmation resolved. After the await, Cancel restores
  `contentRef.current`, not the `content` captured when it was clicked, so a
  reload during the dialog is not reverted.
- Both buttons are `type="button"` so a FileDocument inside a `<form>` never
  submits it.

## Tests and baselines

- Unit tests: [FileViewer.test.tsx](./FileViewer.test.tsx),
  [FileDocument.test.tsx](./FileDocument.test.tsx) and
  [fileView.test.ts](./fileView.test.ts). Each invariant above has a test.
  Add one when you add a path that changes the draft, mode or save state.
- Visual: `tests/visual/file-viewer.spec.ts` (Markdown, code, Arabic RTL,
  FileDocument view and edit) and the `file-document` row in
  `tests/visual/rtl-matrix.spec.ts`, which asserts that Cancel/Save sit at the
  toolbar's inline end. Shared SuperChat renderer or `markdown.css` changes
  show up in these baselines too. Regenerate with
  `pnpm playwright test --update-snapshots=all` and **view the PNG** before
  committing.
