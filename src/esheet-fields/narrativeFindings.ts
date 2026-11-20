import type { FieldResponse } from '@esheet/core';

/** Standard coding reference attached to a finding (SNOMED, ICD, …). */
export interface NarrativeCode {
  system: string;
  code: string;
  display?: string;
}

/** Explicit quick selections; free prose never becomes a coded finding automatically. */
export interface NarrativeFinding {
  id: string;
  label: string;
  text: string;
  code?: NarrativeCode;
}

/**
 * Response attribute names a narrative field publishes under. Hosts with a
 * published attribute contract (e.g. EncounterVisit's `encounterNarrative*`)
 * supply their own namespace; everyone else uses {@link NARRATIVE_ATTRIBUTES}.
 */
export interface NarrativeAttributeNames {
  /** Sanitized rich HTML mirroring the plain answer. */
  html: string;
  /** Plain text derived from the HTML; must equal the answer to be trusted. */
  text: string;
  /** JSON provenance of explicitly picked findings. */
  findings: string;
  /** Answer snapshot the findings provenance was recorded against. */
  findingsText: string;
}

/** Default attribute namespace for the generic narrative field. */
export const NARRATIVE_ATTRIBUTES: NarrativeAttributeNames = {
  html: 'narrativeHtml',
  text: 'narrativeText',
  findings: 'narrativeFindings',
  findingsText: 'narrativeFindingsText',
};

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
  finding: NarrativeFinding,
  attributes: NarrativeAttributeNames
): Record<string, string> {
  const previous = response?.answer ?? '';
  const html = response?.attributes?.[attributes.html];
  if (
    answer === previous ||
    response?.attributes?.[attributes.text] !== previous ||
    typeof html !== 'string' ||
    !hasNarrativeTagsOnly(html)
  )
    return {};
  // The plain append reuses a trailing newline as the separator, so drop one
  // trailing break to keep the HTML-derived text aligned with the answer.
  const aligned = previous.endsWith('\n')
    ? html.replace(/<br\s*\/?>((?:<\/(?:p|div|ul|ol|li)\s*>|\s)*)$/i, '$1')
    : html;
  const next = `${previous.trim() ? aligned : ''}<p>${escapedTextHtml(finding.text)}${finding.text.endsWith('\n') ? '<br>' : ''}</p>`;
  return { [attributes.html]: next, [attributes.text]: answer };
}

/** Whitelist configured or persisted selection provenance, never arbitrary attributes. */
export function validNarrativeFindings(value: unknown): NarrativeFinding[] {
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
export function hasNarrativeFindingText(answer: string, text: string): boolean {
  const normalize = (value: string) => value.replace(/\r\n?/g, '\n').trim();
  return `\n${normalize(answer)}\n`.includes(`\n${normalize(text)}\n`);
}

/** Codes represent explicit picks and are invalidated by external plain-answer edits. */
export function getNarrativeFindings(
  response?: FieldResponse,
  attributes: NarrativeAttributeNames = NARRATIVE_ATTRIBUTES
): NarrativeFinding[] {
  const answer = response?.answer ?? '';
  if (response?.attributes?.[attributes.findingsText] !== answer) return [];
  const selected = response.attributes[attributes.findings];
  if (typeof selected !== 'string') return [];
  try {
    return validNarrativeFindings(JSON.parse(selected)).filter((finding) =>
      hasNarrativeFindingText(answer, finding.text)
    );
  } catch {
    return [];
  }
}

/**
 * The plain-response equivalent of an explicit quick-pick action, also used by
 * MCP. Valid existing rich formatting is retained without needing a DOM.
 */
export function applyNarrativeFinding(
  response: FieldResponse | undefined,
  finding: NarrativeFinding,
  attributes: NarrativeAttributeNames = NARRATIVE_ATTRIBUTES
): FieldResponse {
  const validated = validNarrativeFindings([finding])[0];
  if (!validated) return response ?? {};
  const selected = getNarrativeFindings(response, attributes);
  if (selected.some((item) => item.id === validated.id)) return response ?? {};
  const previousAnswer = response?.answer ?? '';
  const answer = hasNarrativeFindingText(previousAnswer, validated.text)
    ? previousAnswer
    : `${previousAnswer.trim() ? `${previousAnswer}${previousAnswer.endsWith('\n') ? '' : '\n'}` : ''}${validated.text}`;
  return {
    ...response,
    answer,
    _ai: false,
    attributes: {
      ...response?.attributes,
      ...appendedRichAttributes(response, answer, validated, attributes),
      [attributes.findings]: JSON.stringify([...selected, validated]),
      [attributes.findingsText]: answer,
    },
  };
}
