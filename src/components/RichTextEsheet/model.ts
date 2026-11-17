import {
  getRichTextEsheetSectionText,
  validateRichTextEsheetDefinition,
  type RichTextEsheetDefinition,
  type RichTextEsheetParty,
  type RichTextEsheetResponses,
  type RichTextEsheetSnapshot,
} from './definition';
import { createRichTextEsheetMdy } from './mdy';

/** Derive the full document state — progress, validation and portable MDY — from native responses. */
export function createRichTextEsheetSnapshot(
  definition: RichTextEsheetDefinition,
  responses: RichTextEsheetResponses,
  parties?: RichTextEsheetParty[]
): RichTextEsheetSnapshot {
  validateRichTextEsheetDefinition(definition);
  const documentedSections = definition.sections
    .filter(
      (section) =>
        getRichTextEsheetSectionText(responses, section.id).length > 0
    )
    .map((section) => section.id);
  const errors = definition.sections
    .filter(
      (section) => section.required && !documentedSections.includes(section.id)
    )
    .map((section) => ({
      sectionId: section.id,
      message: `${section.title} is required.`,
    }));
  const input = { definition, responses, parties };
  return {
    ...input,
    documentedSections,
    errors,
    mdy: createRichTextEsheetMdy(input),
  };
}
