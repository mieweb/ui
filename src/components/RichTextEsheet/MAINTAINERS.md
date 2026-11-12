# RichTextEsheet

This component is exported only through `@mieweb/ui/esheet` so eSheet stays out
of the default UI bundle. It is the generic, non-clinical sibling of
`EncounterVisit`: an eSheet guides a human through a whole document (referral
letter, support ticket) as a memory aid, with findings docked as macros. Keep
clinical capture (coded findings, orders, vitals) out of this component — that
is EncounterVisit's configuration.

`definition.ts` generates a native eSheet document; the renderer's FormStore
owns answers. Do not introduce a second state store. Each section becomes a
native section field containing an optional display hint and one narrative
field (`esheetNarrative` by default, overridable per section via `fieldType`).
Field IDs are stable and derived from section IDs
(`richtext:<encoded id>:value` / `:section`); do not replace them with
editor-friendly aliases in persistence.

Sections render through the shared `EsheetSectionField`
(`src/esheet-fields/`), the same plain labelled-group renderer EncounterVisit
uses — no accordion chrome. The registration is guarded (host-registered
section components win) and the renderer is remounted once after eSheet's
stock registration settles; keep that settling pass when touching mount logic.
Layout rhythm lives in `src/styles/richtext-esheet.css`: section titles are
document headings (they become `##` in the saved MDY), hints are muted, and
the label-to-input spacing matches EncounterVisit's.

`parties` (patient, provider, reporter, …) are display context plus macros:
they render in the header, join each section's docked findings as
insertable lines, and are recorded in the MDY front matter. They are not form
fields; changing parties must not reset a draft (content identity is the
serialized definition + parties).

The portable output is MDY via `createRichTextEsheetSnapshot`: YAML front
matter (`richTextEsheet` id/title plus `parties`) and a Markdown body with one
`##` heading per documented section. Undocumented sections are omitted from
the body. Authored text stays literal when the body is rendered — Markdown
punctuation and HTML are escaped and editor line breaks become paragraphs —
and completion/body honor both `answer` and `selected` native response shapes
(same rule as encounter MDY). Narrative answers stay plain text in
`FieldResponse.answer`; rich markup handling lives in the shared
`EsheetNarrativeField`, not here. MDY round-trips: `initialMdy` reopens a
saved document, takes precedence over `initialResponses`, and can supply the
definition and parties from its front matter (a mismatched explicit
`definition.id` throws rather than silently rebinding answers).

## Shared MDY document engine (mieweb/ui#758)

`documentMdy.ts` is the generic engine factory: parse/create/render/
refresh-links plus body read/write over a reserved document response, with
diagnostics. `mdy.ts` configures it for this component (`richTextEsheet`
front-matter key, `__document__` reserved response, `doc` link prefix);
EncounterVisit configures the same factory in its own `mdy.ts`. The dependency
direction is one-way — EncounterVisit imports from RichTextEsheet, never the
reverse — and clinical wording (PHI notices, visit labels) stays on the
encounter side. The document surfaces `DocumentMdyEditor`, `DocumentMdyView`,
`DocumentExportView` and `report.ts` live here; the EncounterVisit modules of
the same lineage are thin wrappers that only supply visit wording. The shared
chrome stylesheet is `src/styles/encounter-visit.css`, scoped
`:is(.encounter-visit, .richtext-esheet)` — keep both hosts in any selector
change.

## Modes

eSheet, RichEdit, View and Export share the one FormStore draft; the switcher
is a Select labelled "Document mode" riding a zero-height sticky overlay on
the narrative toolbar row. The rich chrome stays mounted across modes (the
toolbar is the document's constant chrome) but only authors the document while
RichEdit is active; mode switches and Save flush the editor handle first, and
a body commit that lands during serialization wins over the flushed copy.
Activating a protected link opens the owning section in a focus-trapped
resolver dialog instead of letting display-text edits overwrite answers. The
imperative handle exposes `getSnapshot`, `focusSection` and `setMode`.

## Media capture (mieweb/ui#758, generalized from #736)

`mediaCapture` opts every narrative section into the capture ribbon in eSheet
mode through `EsheetNarrativeMediaContext` (registered fields take no props
from the host). Explicit per-field props win over the context, so
EncounterVisit's own wiring is unaffected. Capture is an occasional
attachment, not every section's primary input: each field's bar starts hidden
(`defaultCaptureBarVisible: false`) behind the block (+) menu's "Show capture
bar". `useDocumentMediaCapture` (`mediaCapture.tsx`) owns the mandatory
`uploadHandler` contract and the generic screen-capture confirmation;
EncounterVisit's `useEncounterMediaCapture` delegates to it with clinical PHI
copy. RichEdit deliberately has no capture ribbon in this component.

Required sections block save with a focusable error summary rather than
discarding the draft. Save failures keep the draft editable. All user-facing
shell text goes through the messages context for translation.
