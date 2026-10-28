import type {
  FieldDefinition,
  FieldResponse,
  FormDefinition,
} from '@esheet/core';
import { stringify } from 'yaml';
import type { NarrativeFinding } from '../../esheet-fields/narrativeFindings';

/** A person or system the document references, e.g. a patient and a provider. */
export interface RichTextEsheetParty {
  /** Displayed role, e.g. "Patient", "Provider", "Reporter". */
  role: string;
  name: string;
  /** Identifying line shown beside the name, e.g. a DOB, NPI or email. */
  detail?: string;
}

export interface RichTextEsheetSection {
  id: string;
  title: string;
  /** Guidance shown above the section's field. */
  description?: string;
  /** Memory-aid phrases docked as macros, each with a derived dot-phrase. */
  findings?: NarrativeFinding[];
  /** Require content in this section before submitting. */
  required?: boolean;
  /**
   * Registered custom eSheet field type for non-narrative sections. Defaults
   * to the built-in guided narrative; any other value must be registered with
   * `registerCustomFieldTypes` before the component mounts.
   */
  fieldType?: string;
}

/** Document sections and their memory aids; contains no identity data. */
export interface RichTextEsheetDefinition {
  id: string;
  title: string;
  sections: RichTextEsheetSection[];
}

/** Native eSheet answers, keyed by generated field id. */
export type RichTextEsheetResponses = Record<string, FieldResponse>;

export interface RichTextEsheetIssue {
  sectionId: string;
  message: string;
}

export interface RichTextEsheetSnapshot {
  definition: RichTextEsheetDefinition;
  /** Native eSheet responses — the canonical draft state. */
  responses: RichTextEsheetResponses;
  /** Ids of sections with recorded content. */
  documentedSections: string[];
  /** Required sections still missing content. */
  errors: RichTextEsheetIssue[];
  /** Portable document: YAML front matter + Markdown body. */
  mdy: string;
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
  throw new Error(`Invalid RichTextEsheet definition: ${message}`);
}

/** Reject ambiguous identifiers and invalid configuration before constructing an eSheet. */
export function validateRichTextEsheetDefinition(
  definition: RichTextEsheetDefinition
): void {
  if (!definition || typeof definition !== 'object')
    invalid('expected an object');
  if (!nonempty(definition.id) || !nonempty(definition.title))
    invalid('id and title must be nonempty strings');
  if (!Array.isArray(definition.sections) || definition.sections.length === 0)
    invalid('at least one section is required');
  const sectionIds = new Set<string>();
  for (const section of definition.sections) {
    if (!section || typeof section !== 'object')
      invalid('expected a section object');
    if (!nonempty(section.id) || !nonempty(section.title))
      invalid('each section requires an id and title');
    if (sectionIds.has(section.id))
      invalid(`duplicate section id ${section.id}`);
    sectionIds.add(section.id);
    if (
      section.description !== undefined &&
      typeof section.description !== 'string'
    )
      invalid(`invalid description in ${section.id}`);
    if (section.required !== undefined && typeof section.required !== 'boolean')
      invalid(`required must be boolean in ${section.id}`);
    if (section.fieldType !== undefined && !nonempty(section.fieldType))
      invalid(`fieldType must be a nonempty string in ${section.id}`);
    if (section.findings === undefined) continue;
    if (!Array.isArray(section.findings))
      invalid(`findings must be an array in ${section.id}`);
    const findingIds = new Set<string>();
    for (const finding of section.findings) {
      if (
        !finding ||
        typeof finding !== 'object' ||
        !nonempty(finding.id) ||
        !nonempty(finding.label) ||
        !nonempty(finding.text)
      )
        invalid(`findings require id, label and text in ${section.id}`);
      if (findingIds.has(finding.id))
        invalid(`duplicate finding id ${finding.id} in ${section.id}`);
      findingIds.add(finding.id);
    }
  }
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

/** All sections remain native eSheet sections with native FieldResponse values. */
export function createRichTextEsheetFormDefinition(
  definition: RichTextEsheetDefinition,
  parties?: RichTextEsheetParty[]
): FormDefinition {
  validateRichTextEsheetDefinition(definition);
  const partyMacros = partyFindings(parties);
  return {
    id: definition.id,
    title: definition.title,
    pages: [
      {
        id: `${definition.id}:document`,
        title: definition.title,
        fields: definition.sections.map((section) => {
          const fields: FieldDefinition[] = [];
          if (section.description) {
            fields.push({
              id: `${getRichTextEsheetSectionFieldId(section.id)}:description`,
              fieldType: 'display',
              content: section.description,
              width: 'full',
            });
          }
          // eSheet deliberately keeps custom types outside its built-in TypeScript union.
          const fieldType = section.fieldType ?? 'esheetNarrative';
          fields.push({
            id: getRichTextEsheetFieldId(section.id),
            fieldType,
            question: section.title,
            required: section.required,
            width: 'full',
            // Keyed off the resolved type: an explicit 'esheetNarrative'
            // override keeps its findings, macros and hidden label.
            _sourceData:
              fieldType === 'esheetNarrative'
                ? {
                    narrativeHideLabel: true,
                    narrativeFindings: [
                      ...(section.findings ?? []),
                      ...partyMacros,
                    ],
                  }
                : undefined,
          } as unknown as FieldDefinition);
          return {
            id: getRichTextEsheetSectionFieldId(section.id),
            fieldType: 'section' as const,
            title: section.title,
            sectionCollapse: 'expanded' as const,
            width: 'full' as const,
            fields,
          };
        }),
      },
    ],
  };
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
function sectionText(
  responses: RichTextEsheetResponses,
  sectionId: string
): string {
  const response = responses[getRichTextEsheetFieldId(sectionId)];
  return valueText(response?.answer) || selectedText(response?.selected);
}

// Mirrors EncounterVisit's mdy.ts escaping; consolidate in Phase 3 of #665.
function markdownText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/[\\[\]`*_~<>]/g, '\\$&');
}

function markdownHeading(value: string): string {
  return markdownText(value).replace(/\r?\n/g, ' · ');
}

/** Authored plain text stays literal; editor line breaks become Markdown paragraphs. */
function markdownBody(value: string): string {
  return value
    .split(/\r?\n/)
    .map((line) => markdownText(line.trim()))
    .filter(Boolean)
    .join('\n\n');
}

/** Derive the full document state — progress, validation and portable MDY — from native responses. */
export function createRichTextEsheetSnapshot(
  definition: RichTextEsheetDefinition,
  responses: RichTextEsheetResponses,
  parties?: RichTextEsheetParty[]
): RichTextEsheetSnapshot {
  validateRichTextEsheetDefinition(definition);
  const documentedSections = definition.sections
    .filter((section) => sectionText(responses, section.id).length > 0)
    .map((section) => section.id);
  const errors = definition.sections
    .filter(
      (section) => section.required && !documentedSections.includes(section.id)
    )
    .map((section) => ({
      sectionId: section.id,
      message: `${section.title} is required.`,
    }));
  const frontMatter: Record<string, unknown> = {
    richTextEsheet: { id: definition.id, title: definition.title },
    ...(parties?.length ? { parties } : {}),
  };
  const body = definition.sections
    .filter((section) => documentedSections.includes(section.id))
    .map(
      (section) =>
        `## ${markdownHeading(section.title)}\n\n${markdownBody(
          sectionText(responses, section.id)
        )}`
    )
    .join('\n\n');
  const mdy = `---\n${stringify(frontMatter)}---\n\n# ${markdownHeading(
    definition.title
  )}\n${body ? `\n${body}\n` : ''}`;
  return { definition, responses, documentedSections, errors, mdy };
}
