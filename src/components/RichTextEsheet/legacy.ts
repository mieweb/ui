import type { FieldDefinition, FormDefinition } from '@esheet/core';
import type { NarrativeFinding } from '../../esheet-fields/narrativeFindings';
import {
  getRichTextEsheetFieldId,
  getRichTextEsheetSectionFieldId,
} from './definition';

/**
 * Legacy document schema (mieweb/ui#772): `RichTextEsheetDefinition` is no
 * longer a runtime model. This module exists solely to migrate previously
 * stored definitions (templates or the `richTextEsheet` front-matter key
 * written before #772) into the native eSheet `FormDefinition` that every
 * RichTextEsheet surface now reads.
 */

/** Legacy section config, superseded by native section fields + `_sourceData`. */
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

/** Legacy document schema, superseded by the native eSheet FormDefinition. */
export interface RichTextEsheetDefinition {
  id: string;
  title: string;
  sections: RichTextEsheetSection[];
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function invalid(message: string): never {
  throw new Error(`Invalid RichTextEsheet definition: ${message}`);
}

/** Reject ambiguous identifiers and invalid configuration before migrating. */
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

/**
 * One-time import migration: convert a stored legacy definition into the
 * native form. Party macros are not stamped here — the component injects the
 * live parties' macros at the rendering boundary.
 */
export function richTextEsheetFormFromLegacy(
  definition: RichTextEsheetDefinition
): FormDefinition {
  validateRichTextEsheetDefinition(definition);
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
            // override keeps its findings and hidden label.
            _sourceData:
              fieldType === 'esheetNarrative'
                ? {
                    narrativeHideLabel: true,
                    narrativeFindings: section.findings ?? [],
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
