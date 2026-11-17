import type { FieldResponse, FormDefinition } from '@esheet/core';
import {
  createMdyDocumentEngine,
  type MdyDocumentDiagnostic,
  type MdyDocumentField,
  type ParsedMdyDocument,
} from './documentMdy';
import {
  getRichTextEsheetFieldId,
  getRichTextEsheetFormSections,
  getRichTextEsheetSectionText,
  withRichTextEsheetParties,
  type RichTextEsheetParty,
  type RichTextEsheetResponses,
} from './definition';
import {
  richTextEsheetFormFromLegacy,
  validateRichTextEsheetDefinition,
  type RichTextEsheetDefinition,
} from './legacy';

/** Authored prose is a native answer; it is excluded from its own MDY response layer. */
export const RICHTEXT_ESHEET_DOCUMENT_FIELD_ID = '__document__';

/** The document state the portable MDY is derived from. */
export interface RichTextEsheetMdyInput {
  /** The native eSheet form — the single structural schema (mieweb/ui#772). */
  form: FormDefinition;
  responses: RichTextEsheetResponses;
  parties?: RichTextEsheetParty[];
}

export type RichTextEsheetMdyField = MdyDocumentField;

export type RichTextEsheetMdyDiagnostic = MdyDocumentDiagnostic;

export type ParsedRichTextEsheetMdy = ParsedMdyDocument & {
  definition?: RichTextEsheetDefinition;
};

/** One link projection per document section, including empty memory aids. */
export function getRichTextEsheetMdyFields(
  snapshot: RichTextEsheetMdyInput
): RichTextEsheetMdyField[] {
  return engine.fields(snapshot);
}

/** Links imported with the document whose sections were since removed. */
export function getRichTextEsheetRetiredMdyFields(
  snapshot: RichTextEsheetMdyInput
): RichTextEsheetMdyField[] {
  return engine.retiredFields(snapshot);
}

function validParty(value: unknown): value is RichTextEsheetParty {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as RichTextEsheetParty).role === 'string' &&
    typeof (value as RichTextEsheetParty).name === 'string'
  );
}

/** Restore the front matter's parties so a reopened document keeps its macros. */
export function getRichTextEsheetMdyParties(
  frontMatter: Record<string, unknown> | null
): RichTextEsheetParty[] | undefined {
  const parties = frontMatter?.parties;
  if (!Array.isArray(parties) || !parties.every(validParty)) return undefined;
  return parties.map((party) => ({
    role: party.role,
    name: party.name,
    ...(typeof party.detail === 'string' ? { detail: party.detail } : {}),
  }));
}

/** A legacy richTextEsheet definition is a one-time import, never written back (mieweb/ui#772). */
function readMdyDefinition(
  parsed: ParsedMdyDocument
): RichTextEsheetDefinition | undefined {
  const raw = parsed.frontMatter?.richTextEsheet;
  if (raw === undefined) return undefined;
  try {
    validateRichTextEsheetDefinition(raw as RichTextEsheetDefinition);
    return raw as RichTextEsheetDefinition;
  } catch {
    parsed.diagnostics.push({
      severity: 'error',
      code: 'definition',
      message: 'Front matter contains an invalid richTextEsheet definition.',
    });
    return undefined;
  }
}

const engine = createMdyDocumentEngine<RichTextEsheetMdyInput>({
  documentFieldId: RICHTEXT_ESHEET_DOCUMENT_FIELD_ID,
  linkPrefix: 'doc',
  engineName: 'richtext-esheet-mdy-document',
  missingFrontMatterMessage:
    'A RichTextEsheet MDY document requires YAML front matter.',
  sourceDataProperties: ['narrativeHideLabel', 'narrativeFindings'],
  projectField: ({ field }, snapshot) => {
    // Views are recomputed from the live form: callers may mutate a form
    // in place between operations, so nothing is cached across calls.
    const section = getRichTextEsheetFormSections(snapshot.form).find(
      (candidate) => getRichTextEsheetFieldId(candidate.id) === field.id
    );
    if (!section) return undefined;
    return {
      sectionId: section.id,
      label: section.title,
      display: getRichTextEsheetSectionText(snapshot.responses, section.id),
      narrative: true,
    };
  },
  // Saves stop writing the legacy schema; undefined deletes an imported key.
  extraFrontMatter: (snapshot) => ({
    richTextEsheet: undefined,
    parties: snapshot.parties?.length ? snapshot.parties : undefined,
  }),
  rebuildSnapshot: async (parsed) => {
    // A portable document may have been edited outside this component. The
    // canonical response wins over cached doc_* values and display strings.
    // Import lazily because snapshot creation itself calls the engine.
    // Prefer the legacy import when present: pre-#772 documents stamped the
    // complete section metadata there.
    const legacy = readMdyDefinition(parsed);
    const form = legacy ? richTextEsheetFormFromLegacy(legacy) : parsed.form;
    if (!form || !parsed.response) return null;
    const parties = getRichTextEsheetMdyParties(parsed.frontMatter);
    const { createRichTextEsheetSnapshot } = await import('./model');
    try {
      return createRichTextEsheetSnapshot(
        form,
        {
          ...parsed.response,
          [RICHTEXT_ESHEET_DOCUMENT_FIELD_ID]: richTextEsheetDocumentResponse(
            parsed.source
          ),
        },
        parties
      );
    } catch (error) {
      parsed.diagnostics.push({
        severity: 'error',
        code: 'definition',
        message:
          error instanceof Error ? error.message : 'Invalid document form.',
      });
      return null;
    }
  },
});

/** Parse safe YAML and native objects without dropping unknown metadata or provenance. */
export function parseRichTextEsheetMdy(
  source: string
): ParsedRichTextEsheetMdy {
  const parsed = engine.parse(source);
  return { ...parsed, definition: readMdyDefinition(parsed) };
}

/** Update existing projections only: unlinked prose and removed links stay authored. */
export function refreshRichTextEsheetMdyLinks(
  body: string,
  fields: RichTextEsheetMdyField[]
): string {
  return engine.refreshLinks(body, fields);
}

export function getRichTextEsheetDocumentBody(
  responses: RichTextEsheetResponses
): string | undefined {
  return engine.getDocumentBody(responses);
}

export function updateRichTextEsheetDocumentBody(
  responses: RichTextEsheetResponses,
  body: string,
  options: { _ai?: boolean } = {}
): RichTextEsheetResponses {
  return engine.updateDocumentBody(responses, body, options);
}

/** Carry the exact imported block alongside prose through the native response store. */
export function richTextEsheetDocumentResponse(source: string): FieldResponse {
  return engine.documentResponse(source);
}

/**
 * Assemble a portable, flattened .mdy. Canonical form/response are native
 * eSheet objects. Flat doc_* projections bridge the native colon-bearing ids
 * to Templit/Kerebron's MDY id grammar; they are never another answer store.
 */
export function createRichTextEsheetMdy(
  snapshot: RichTextEsheetMdyInput,
  body?: string,
  source?: string
): string {
  // Party macros are rendering state: the persisted form keeps only authored
  // findings, even when the snapshot's form was imported with stamped macros.
  return engine.create(
    { ...snapshot, form: withRichTextEsheetParties(snapshot.form) },
    body,
    source
  );
}

/**
 * Render an already flattened document through Templit's actual pipeline.
 * This identity engine deliberately preserves {{authored prose}} literally;
 * .mdy is data and markdown, never a template. Hosts sanitize returned HTML.
 */
export function renderRichTextEsheetMdy(source: string): Promise<{
  raw: string;
  html?: string;
  fields: RichTextEsheetMdyField[];
  diagnostics: RichTextEsheetMdyDiagnostic[];
}> {
  return engine.render(source);
}
