import type { FieldResponse, FormDefinition } from '@esheet/core';
import {
  validNarrativeFindings,
  type NarrativeFinding,
} from '../../esheet-fields/narrativeFindings';

/** A person or system the document references, e.g. a patient and a provider. */
export interface RichTextEsheetParty {
  /** Displayed role, e.g. "Patient", "Provider", "Reporter". */
  role: string;
  name: string;
  /** Identifying line shown beside the name, e.g. a DOB, NPI or email. */
  detail?: string;
}

/** Native eSheet answers, keyed by generated field id. */
export type RichTextEsheetResponses = Record<string, FieldResponse>;

export interface RichTextEsheetIssue {
  sectionId: string;
  message: string;
}

/** The document surfaces; all modes share the same native draft. */
export type RichTextEsheetMode = 'esheet' | 'rich' | 'view' | 'export';

export interface RichTextEsheetSnapshot {
  /** The native eSheet form — the single structural schema (mieweb/ui#772). */
  form: FormDefinition;
  /** Native eSheet responses — the canonical draft state. */
  responses: RichTextEsheetResponses;
  /** The parties the document references, retained in the MDY front matter. */
  parties?: RichTextEsheetParty[];
  /** Ids of sections with recorded content. */
  documentedSections: string[];
  /** Required sections still missing content. */
  errors: RichTextEsheetIssue[];
  /** Portable document: YAML front matter + Markdown body. */
  mdy: string;
}

/**
 * One document section reconstructed from its native fields. The form is the
 * single source of truth; views only exist so document logic can iterate
 * sections without a parallel schema (mieweb/ui#772).
 */
export interface RichTextEsheetSectionView {
  id: string;
  title: string;
  /** Require content in this section before submitting. */
  required?: boolean;
}

/** Encode the identifier separately so punctuation cannot collide with delimiters. */
export function getRichTextEsheetFieldId(sectionId: string): string {
  return `richtext:${encodeURIComponent(sectionId)}:value`;
}

export function getRichTextEsheetSectionFieldId(sectionId: string): string {
  return `richtext:${encodeURIComponent(sectionId)}:section`;
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function invalid(message: string): never {
  throw new Error(`Invalid RichTextEsheet form: ${message}`);
}

function safeDecode(value: string): string | undefined {
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

const SECTION_FIELD_ID = /^richtext:([^:]+):section$/;

type FieldNode = Record<string, unknown> & { fields?: unknown };

function fieldNodes(fields: unknown): FieldNode[] {
  return Array.isArray(fields) ? (fields as FieldNode[]) : [];
}

function sectionView(field: FieldNode): RichTextEsheetSectionView {
  if (field.fieldType !== 'section' || typeof field.id !== 'string')
    invalid('every top-level field is a richtext section');
  const encoded = SECTION_FIELD_ID.exec(field.id);
  const id = encoded ? safeDecode(encoded[1]) : undefined;
  if (id === undefined)
    invalid(`section field ids use richtext:<section>:section (${field.id})`);
  if (field.id !== getRichTextEsheetSectionFieldId(id))
    invalid(
      `section field ids use the canonical encoded section id (${field.id})`
    );
  if (!nonempty(field.title)) invalid(`sections require a title in ${id}`);
  const valueId = getRichTextEsheetFieldId(id);
  const descriptionId = `${field.id}:description`;
  let value: FieldNode | undefined;
  for (const child of fieldNodes(field.fields)) {
    if (child.id === descriptionId && child.fieldType === 'display') continue;
    if (child.id === valueId && child.fieldType !== 'display') {
      if (value) invalid(`duplicate section value field in ${id}`);
      value = child;
      continue;
    }
    invalid(`unexpected field ${String(child.id)} in section ${id}`);
  }
  if (!value) invalid(`section ${id} requires its richtext value field`);
  if (!nonempty(value.fieldType))
    invalid(`fieldType must be a nonempty string in ${id}`);
  if (value.required !== undefined && typeof value.required !== 'boolean')
    invalid(`required must be boolean in ${id}`);
  return {
    id,
    title: field.title as string,
    ...(value.required === true ? { required: true } : {}),
  };
}

/**
 * Rebuild the document's section views from the native form, validating the
 * structural conventions every RichTextEsheet surface relies on.
 */
export function getRichTextEsheetFormSections(
  form: FormDefinition
): RichTextEsheetSectionView[] {
  if (!form || typeof form !== 'object') invalid('expected an object');
  if (!nonempty(form.id) || !nonempty(form.title))
    invalid('id and title must be nonempty strings');
  if (!Array.isArray(form.pages) || form.pages.length === 0)
    invalid('at least one page is required');
  const views: RichTextEsheetSectionView[] = [];
  const ids = new Set<string>();
  for (const page of form.pages) {
    for (const field of fieldNodes(
      (page as unknown as FieldNode).fields ?? []
    )) {
      const view = sectionView(field);
      if (ids.has(view.id)) invalid(`duplicate section id ${view.id}`);
      ids.add(view.id);
      views.push(view);
    }
  }
  if (views.length === 0) invalid('at least one section is required');
  return views;
}

/** Reject ambiguous identifiers and invalid configuration before constructing an eSheet. */
export function validateRichTextEsheetForm(form: FormDefinition): void {
  getRichTextEsheetFormSections(form);
}

/** Each party becomes an insertable macro so authors can drop names into the text. */
export function partyFindings(
  parties: RichTextEsheetParty[] | undefined
): NarrativeFinding[] {
  return (parties ?? []).map((party) => ({
    // Content-derived identity: editing or reordering a party yields a new
    // macro id, so the updated text stays insertable after an earlier
    // version was applied (selection dedupe is by id).
    id: `party:${encodeURIComponent(party.role)}:${encodeURIComponent(
      party.name
    )}:${encodeURIComponent(party.detail ?? '')}`,
    label: `${party.role}: ${party.name}`,
    text: party.detail ? `${party.name} (${party.detail})` : party.name,
  }));
}

/**
 * Dock each party's macro beside every guided narrative section. Macros are
 * derived presentation state injected at the rendering boundary: previously
 * generated `party:` findings (forms that stamped macros before mieweb/ui#772)
 * are replaced by the live parties — including removal when the live list is
 * empty — while authored findings are kept, sanitized through the same
 * whitelist the narrative field applies.
 */
export function withRichTextEsheetParties(
  form: FormDefinition,
  parties?: RichTextEsheetParty[]
): FormDefinition {
  const macros = partyFindings(parties);
  return {
    ...form,
    pages: form.pages.map((page) => ({
      ...page,
      fields: fieldNodes((page as unknown as FieldNode).fields).map(
        (section) => ({
          ...section,
          fields: fieldNodes(section.fields).map((field) => {
            if (field.fieldType !== 'esheetNarrative') return field;
            const source = (field._sourceData ?? {}) as Record<string, unknown>;
            // The `party:` id prefix is reserved for generated macros.
            const authored = validNarrativeFindings(
              source.narrativeFindings
            ).filter((finding) => !finding.id.startsWith('party:'));
            const known = new Set(authored.map((finding) => finding.id));
            return {
              ...field,
              _sourceData: {
                ...source,
                narrativeFindings: [
                  ...authored,
                  ...macros.filter((macro) => !known.has(macro.id)),
                ],
              },
            };
          }),
        })
      ),
    })),
    // Field nodes are opaque records; eSheet keeps custom types outside its union.
  } as unknown as FormDefinition;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number' || typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.some(hasValue);
  if (record(value)) return Object.values(value).some(hasValue);
  return false;
}

function valueText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (Array.isArray(value))
    return value.map(valueText).filter(Boolean).join(', ');
  return '';
}

/** Selection labels alone are not a selected value (same rule as encounter MDY). */
function selectedText(selected: unknown): string {
  if (Array.isArray(selected))
    return selected.map(selectedText).filter(Boolean).join(', ');
  if (!record(selected)) return '';
  if ('value' in selected) {
    if (!hasValue(selected.value)) return '';
    const text = valueText(selected.value);
    const label =
      typeof selected.label === 'string' ? selected.label.trim() : '';
    return label && label !== text ? `${label}: ${text}` : text;
  }
  return Object.values(selected).map(selectedText).filter(Boolean).join(', ');
}

/** Normalize the supported native response shapes — text answers and selections. */
export function getRichTextEsheetSectionText(
  responses: RichTextEsheetResponses,
  sectionId: string
): string {
  const response = responses[getRichTextEsheetFieldId(sectionId)];
  return valueText(response?.answer) || selectedText(response?.selected);
}
