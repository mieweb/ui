import type { FieldResponse } from '@esheet/core';
import type { EncounterNarrativeFinding } from './types';

const FINDINGS_ATTRIBUTE = 'encounterNarrativeFindings';
const FINDINGS_TEXT_ATTRIBUTE = 'encounterNarrativeFindingsText';
const HTML_ATTRIBUTE = 'encounterNarrativeHtml';
const TEXT_ATTRIBUTE = 'encounterNarrativeText';

function escapedTextHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>');
}

/** Reject imported tags/attributes; browser sanitization and text agreement stay the final gate. */
function hasNarrativeTagsOnly(html: string): boolean {
  return !html
    .replace(/<\/?(?:p|div|strong|b|em|i|u|ul|ol|li)\s*>|<br\s*\/?>/gi, '')
    .includes('<');
}

function appendedRichAttributes(
  response: FieldResponse | undefined,
  answer: string,
  finding: EncounterNarrativeFinding
): Record<string, string> {
  const previous = response?.answer ?? '';
  const html = response?.attributes?.[HTML_ATTRIBUTE];
  if (
    answer === previous ||
    response?.attributes?.[TEXT_ATTRIBUTE] !== previous ||
    typeof html !== 'string' ||
    !hasNarrativeTagsOnly(html)
  )
    return {};
  const next = `${previous.trim() ? html : ''}<p>${escapedTextHtml(finding.text)}${finding.text.endsWith('\n') ? '<br>' : ''}</p>`;
  return { [HTML_ATTRIBUTE]: next, [TEXT_ATTRIBUTE]: answer };
}

/** Whitelist configured or persisted selection provenance, never arbitrary attributes. */
export function validEncounterNarrativeFindings(
  value: unknown
): EncounterNarrativeFinding[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.flatMap((finding) => {
    if (
      !finding ||
      typeof finding !== 'object' ||
      typeof finding.id !== 'string' ||
      !finding.id.trim() ||
      typeof finding.label !== 'string' ||
      !finding.label.trim() ||
      typeof finding.text !== 'string' ||
      !finding.text.trim() ||
      ids.has(finding.id)
    ) {
      return [];
    }
    ids.add(finding.id);
    const code = finding.code;
    return [
      {
        id: finding.id,
        label: finding.label,
        text: finding.text,
        ...(code &&
        typeof code.system === 'string' &&
        code.system.trim() &&
        typeof code.code === 'string' &&
        code.code.trim()
          ? {
              code: {
                system: code.system,
                code: code.code,
                ...(typeof code.display === 'string'
                  ? { display: code.display }
                  : {}),
              },
            }
          : {}),
      },
    ];
  });
}

/** Match complete inserted lines, never a phrase inside unrelated free prose. */
export function hasEncounterNarrativeFindingText(
  answer: string,
  text: string
): boolean {
  const normalize = (value: string) => value.replace(/\r\n?/g, '\n').trim();
  return `\n${normalize(answer)}\n`.includes(`\n${normalize(text)}\n`);
}

/** Codes represent explicit picks and are invalidated by external plain-answer edits. */
export function getEncounterNarrativeFindings(
  response?: FieldResponse
): EncounterNarrativeFinding[] {
  const answer = response?.answer ?? '';
  if (response?.attributes?.[FINDINGS_TEXT_ATTRIBUTE] !== answer) return [];
  const selected = response.attributes[FINDINGS_ATTRIBUTE];
  if (typeof selected !== 'string') return [];
  try {
    return validEncounterNarrativeFindings(JSON.parse(selected)).filter(
      (finding) => hasEncounterNarrativeFindingText(answer, finding.text)
    );
  } catch {
    return [];
  }
}

/**
 * The plain-response equivalent of an explicit quick-pick action, also used by
 * MCP. Valid existing rich formatting is retained without needing a DOM.
 */
export function applyEncounterNarrativeFinding(
  response: FieldResponse | undefined,
  finding: EncounterNarrativeFinding
): FieldResponse {
  const validated = validEncounterNarrativeFindings([finding])[0];
  if (!validated) return response ?? {};
  const selected = getEncounterNarrativeFindings(response);
  if (selected.some((item) => item.id === validated.id)) return response ?? {};
  const previousAnswer = response?.answer ?? '';
  const answer = hasEncounterNarrativeFindingText(
    previousAnswer,
    validated.text
  )
    ? previousAnswer
    : `${previousAnswer.trim() ? `${previousAnswer}${previousAnswer.endsWith('\n') ? '' : '\n'}` : ''}${validated.text}`;
  return {
    ...response,
    answer,
    _ai: false,
    attributes: {
      ...response?.attributes,
      ...appendedRichAttributes(response, answer, validated),
      [FINDINGS_ATTRIBUTE]: JSON.stringify([...selected, validated]),
      [FINDINGS_TEXT_ATTRIBUTE]: answer,
    },
  };
}
