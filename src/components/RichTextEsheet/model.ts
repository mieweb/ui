import {
  getRichTextEsheetFormSections,
  getRichTextEsheetSectionText,
  type RichTextEsheetParty,
  type RichTextEsheetResponses,
  type RichTextEsheetSnapshot,
} from './definition';
import type { FormDefinition } from '@esheet/core';
import { createRichTextEsheetMdy } from './mdy';

/** Derive the full document state — progress, validation and portable MDY — from native responses. */
export function createRichTextEsheetSnapshot(
  form: FormDefinition,
  responses: RichTextEsheetResponses,
  parties?: RichTextEsheetParty[]
): RichTextEsheetSnapshot {
  const sections = getRichTextEsheetFormSections(form);
  const documentedSections = sections
    .filter(
      (section) =>
        getRichTextEsheetSectionText(responses, section.id).length > 0
    )
    .map((section) => section.id);
  const errors = sections
    .filter(
      (section) => section.required && !documentedSections.includes(section.id)
    )
    .map((section) => ({
      sectionId: section.id,
      message: `${section.title} is required.`,
    }));
  const input = { form, responses, parties };
  return {
    ...input,
    documentedSections,
    errors,
    mdy: createRichTextEsheetMdy(input),
  };
}
