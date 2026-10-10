# EncounterVisit

This component is exported only through `@mieweb/ui/esheet` so eSheet stays out
of the default UI bundle. `definition.ts` generates a native eSheet document;
the renderer's FormStore owns answers. Custom fields serialize structured data
into `FieldResponse.answer`. Do not introduce a second clinical state store.

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
