# EncounterVisit

This component is exported only through `@mieweb/ui/esheet` so eSheet stays out
of the default UI bundle. `definition.ts` generates a native eSheet document;
the renderer's FormStore owns answers. Custom fields serialize structured data
into `FieldResponse.answer`. Do not introduce a second clinical state store.

The form, RichEdit and view surfaces share the same FormStore responses. The
portable document is MDY: YAML front matter retains the generated form, native
`response` map and `encounterDefinition`, while its Markdown body is stored in
the reserved `__encounter_document__` response. Exclude that reserved response
from the exported `response` map to avoid recursive document copies. Preserve
imported front matter in `attributes.mdyFrontMatterSource`; body edits retain
host metadata while current form responses supply the clinical data.

RichEdit body changes remain uncoded prose unless explicitly linked to recorded
eSheet answers. Never parse free prose into findings, diagnoses, medications or
orders. Mutating a recorded value goes through the same structured section tools
and validation as the form. MDY field links need an explicit resolver mapping to
the generated native IDs, which contain colons and may contain percent escapes.
Do not replace stable response IDs with editor-friendly aliases in persistence.

Narrative fields reuse `RichTextEditor` with natural content height and a
formatting toolbar shown during editing. `answer` stays plain text for notes
and MCP tools. Sanitized markup is retained in native response `attributes`
(`encounterNarrativeHtml` / `encounterNarrativeText`) and restored only when
both the recorded baseline and the markup's text match the current answer.
An MCP text replacement therefore cannot restore stale formatting.

The layout is a continuous report, with a compact sticky section selector
instead of a sidebar. `src/styles/encounter-visit.css` removes questionnaire
card borders and nested padding only inside this composition. Keep the
document inset at 8 px on phones / 12 px on larger screens and preserve
44 px editing targets. Narrative inputs must grow and shrink with loaded
or entered content rather than introduce an internal scrollbar.

`model.ts` validates and exports entered observations and a plain-text note.
Narratives are observations, and a BP observation carries both components.
Keep reading IDs, units and measurement context stable. Empty fields must remain
undocumented; do not invent normal findings or medication lists. The vital
codes and UCUM units follow the [HL7 vital signs table](https://hl7.org/fhir/R4/observation-vitalsigns.html);
the reported pain score uses [LOINC 72514-3](https://loinc.org/72514-3).
These are coded observation objects, not complete FHIR resources.

`mcp.ts` provides an in-process controller, JSON Schema tool definitions and an
MCP result executor. The host owns transport and storage. Runtime validation
and the read-only guard belong here as well as in the UI. A BP write replaces
one serialized vital-set response atomically. Keep unrelated answers intact.
`encounter_visit_get_mdy` reads the portable document;
`encounter_visit_set_document_body` writes only the reserved body response,
preserves imported metadata and marks that response as an AI edit. It must
reject read-only writes without altering recorded section answers.

The upstream support status was verified on 2026-10-10:

- [Kerebron issue #115](https://github.com/mieweb/kerebron/issues/115), **open**,
  defines protected MDY links, a data resolver and preservation of authored
  Markdown and YAML. Published Kerebron 0.8.12 does not yet provide that extension.
  `mdyEditorKit.ts` supplies the local protected-link bridge; clicking a linked
  span opens its native eSheet section, including coordinated inputs. Use
  `mdy:<alias>` links because the current Markdown converter rewrites ordinary
  fragment identifiers from their display text.
- [Templit's MDY specification](https://github.com/mieweb/templit/blob/main/doc/mdy-specification.md)
  and [eSheet template sample](https://github.com/mieweb/templit/blob/main/samples/esheet.mdyt)
  are available in published `@mieweb/templit` 0.2.0. No MDY issue was open in
  that repository at review time. Render the flattened report through Templit
  with an identity template engine and its Markdown renderer: clinical prose
  containing `{{...}}` must remain literal. MDYT template authoring is separate.
- [eSheet PR #122](https://github.com/mieweb/eSheet/pull/122), **open**, implements
  MDY field links and metadata refresh. Its current branch is not included in
  the pinned eSheet checkout and conflicts with main. Its field-ID grammar
  accepts hyphens and dotted paths, but not EncounterVisit's colon/percent IDs.
  The review requests distinct MDY and ordinary rich text handling plus a
  portable eSheet output consumable by standalone Kerebron.
- [eSheet issue #223](https://github.com/mieweb/eSheet/issues/223), **open**, tracks
  template-driven Markdown export, a section-aware fallback and printable HTML.
  EncounterVisit's MDY projection does not make that general export API available.
- [eSheet issue #80](https://github.com/mieweb/eSheet/issues/80), **open**, tracks
  first-class rich text / Markdown naming and simple versus expanded editor modes.
- [eSheet PR #165](https://github.com/mieweb/eSheet/pull/165), **merged**, supplies
  document compose workflows and the existing lossless front-matter/body helpers.

Current eSheet `fields-documents/mdy.ts` carries a `response` envelope with native
`{ answer }` / `{ selected }` values and preserves front-matter bytes when only
the body changes. PR #122 instead projects flat `{ value, display? }` metadata
for field nodes. Keep those contracts explicit when connecting a templit output
or Kerebron resolver; the projection must not discard response attributes,
selection identity, coordinated vital reading IDs or clinical coding.

`EncounterVisitSession` subscribes to eSheet after initialization and unsubscribes
on replacement/unmount. Seeds are loaded once per visit ID. Content-stable
definitions prevent callback-driven parent renders from clearing the draft.
Configuration changes carry the existing answers forward. Save freezes editing
until the host resolves; rejected saves leave the draft available.

Run focused unit/integration tests with
`pnpm exec vitest run src/components/EncounterVisit`. Stories cover the anonymous
case, a 390 px layout, a narrative exam, read-only mode and live MCP calls.
Rebuild eSheet with `pnpm build:esheet` after advancing its submodule. Root
development dependencies link to that checkout. Its shared stylesheet replaces
the older renderer/builder CSS files.
