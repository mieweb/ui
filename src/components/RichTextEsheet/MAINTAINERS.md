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
the body. Narrative answers stay plain text in `FieldResponse.answer`; rich
markup handling lives in the shared `EsheetNarrativeField`, not here.

Required sections block save with a focusable error summary rather than
discarding the draft. Save failures keep the draft editable. All user-facing
shell text goes through the messages context for translation.
