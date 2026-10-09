# EmailEditor — maintainer notes

- **Origin.** Ported from Waggleline's email builder (`app/imports/ui/emails/EmailEditorPage.tsx`,
  `app/imports/api/emails/{types,renderer}.ts`). Block field names are kept identical so
  documents built from the shared block set load here unchanged; Waggleline-only blocks
  (`signature`, `feedback`, `survey-link`, `app-download`, `section`, `cta-bar`,
  `video-thumbnail`) were left behind. The compatibility contract for those is conversion:
  the host maps them to shared types (most flatten to `text`/`html`/`button`) before
  loading. Unconverted blocks are not lost — they stay in the document and the canvas
  shows an "unsupported block" placeholder — but `renderEmailMjml` omits them from the
  sent email. Add a block type here only when it has no product dependency.
- **Two renderers, one model.** `EmailBlockPreview` (React, canvas) and `renderEmailMjml`
  (string, send) must change together. Run the MJML through `mjml` with
  `validationLevel: 'strict'` after touching the renderer — MJML rejects attributes the
  browser preview would happily accept (e.g. `%` widths on `mj-image`, `css-inline` on
  `mj-table`).
- **Sanitising is the renderer's job, not the editor's.** The editor stores raw HTML for
  `text`/`html` blocks; the canvas and `renderEmailMjml` both sanitise on output. Every
  interpolated colour, URL and gradient goes through `safeColor` / `safeUrl` / `safeGradient`.
- **Drag is pointer-only by design**, matching `BoardView`: keyboard reordering is the
  Move up/down buttons, announced through `useLiveAnnouncement`.
