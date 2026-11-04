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
- **Sanitising happens on output, through one policy.** Stored `text`/`html` content is
  not normalised in place; the editing surface, canvas preview and `renderEmailMjml` each
  sanitise it with `sanitizeEmailHtml` on the way out. Text blocks are edited with the
  Kerebron `TextAreaRich` surface (mieweb/ui#695), which filters pasted or dropped markup
  through its ProseMirror schema — a stricter subset of the same policy. Every
  interpolated colour,
  URL and gradient goes through `safeColor` / `safeUrl` / `safeGradient`, and the policy
  applies `isSafeUrl` to URL attributes inside the markup.
- **Merge tags must survive the editor verbatim.** Kerebron renders `{{token}}` as an
  atomic `shortcode_inline` chip whose stock serializer drops the braces — corrupting
  every merge tag on save. `fixShortcodeRoundTrip` in `RichEditor/editorKits.ts`
  patches the node spec in the kit we ship (so npm consumers are covered — `@kerebron/*`
  is externalized, a workspace package patch would not reach them); keep it until fixed
  upstream.
- **Pasted image files must not become `data:` URLs.** The email URL policy rejects
  `data:`, so an embedded image would render broken in the canvas and MJML. Text blocks
  pass `mediaUpload` to the editor: files go through the host's `onUploadImage` when
  provided, and are skipped otherwise.
- **Drag is pointer-only by design**, matching `BoardView`: keyboard reordering is the
  Move up/down buttons, announced through `useLiveAnnouncement`.
