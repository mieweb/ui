import * as React from 'react';
import DOMPurify from 'dompurify';
import type { FieldComponentProps, FieldResponse } from '@esheet/core';
import type { MacroGroup } from '../MacroLibrary';
import { TextAreaRich } from '../TextAreaRich';
import type { EncounterNarrativeFinding } from './types';
import { useEncounterMessages } from './messages';
import {
  applyEncounterNarrativeFinding,
  getEncounterNarrativeFindings,
  hasEncounterNarrativeFindingText,
  validEncounterNarrativeFindings,
} from './narrativeFindings';

const HTML_ATTRIBUTE = 'encounterNarrativeHtml';
const TEXT_ATTRIBUTE = 'encounterNarrativeText';
const FINDINGS_ATTRIBUTE = 'encounterNarrativeFindings';
const FINDINGS_TEXT_ATTRIBUTE = 'encounterNarrativeFindingsText';

/** Keep visit formatting small: no links, media, styles, or imported document chrome. */
export function sanitizeEncounterNarrativeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'div',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'ul',
      'ol',
      'li',
    ],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
}

function textToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>');
}

/** Extract readable narrative text without flattening paragraphs or list items together. */
export function encounterNarrativeText(html: string): string {
  const documentBody = document.createElement('div');
  documentBody.innerHTML = sanitizeEncounterNarrativeHtml(html);
  let text = '';
  const lineBreak = () => {
    if (text && !text.endsWith('\n')) text += '\n';
  };
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? '';
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === 'BR') {
      text += '\n';
      return;
    }
    const isBlock = ['P', 'DIV', 'UL', 'OL', 'LI'].includes(node.tagName);
    if (isBlock) lineBreak();
    if (node.tagName === 'LI') {
      const list = node.parentElement;
      const index = list ? Array.from(list.children).indexOf(node) + 1 : 1;
      text += list?.tagName === 'OL' ? `${index}. ` : '• ';
    }
    node.childNodes.forEach(visit);
    if (isBlock) lineBreak();
  };
  documentBody.childNodes.forEach(visit);
  return text.replace(/\u00a0/g, ' ').replace(/\n$/, '');
}

function responseHtml(response?: FieldResponse): string {
  const answer = response?.answer ?? '';
  const attributes = response?.attributes;
  // Programmatic edits retain native response metadata. Its baseline prevents
  // formatting from an earlier answer from overriding a newer MCP/plain edit.
  if (
    typeof window !== 'undefined' &&
    attributes?.[TEXT_ATTRIBUTE] === answer &&
    typeof attributes[HTML_ATTRIBUTE] === 'string'
  ) {
    const html = sanitizeEncounterNarrativeHtml(attributes[HTML_ATTRIBUTE]);
    if (encounterNarrativeText(html) === answer) return html;
  }
  return textToHtml(answer);
}

/**
 * Typeable dot-phrase shortcuts, one per finding ("No fever" → `.nf`), built
 * from each label's word initials with numeric suffixes on collision.
 */
function findingShortcuts(
  findings: EncounterNarrativeFinding[]
): Map<string, string> {
  const used = new Set<string>();
  const shortcuts = new Map<string, string>();
  for (const finding of findings) {
    const initials = (finding.label.match(/[\p{L}\p{N}]+/gu) ?? [])
      .map((word) => word[0])
      .join('')
      .toLowerCase();
    if (!initials) continue;
    let candidate = `.${initials}`;
    for (let n = 2; used.has(candidate); n += 1) candidate = `.${initials}${n}`;
    used.add(candidate);
    shortcuts.set(finding.id, candidate);
  }
  return shortcuts;
}

/** A report-like narrative surface that grows with its content, backed by eSheet text. */
export function EncounterNarrativeField({
  field,
  response,
  isPreview,
  isEnabled,
  isReadOnly,
  isRequired,
  isSoftRequired,
  onResponse,
}: FieldComponentProps): React.JSX.Element {
  const m = useEncounterMessages();
  const editorRef = React.useRef<HTMLDivElement>(null);
  const responseRef = React.useRef(response);
  responseRef.current = response;
  const labelId = React.useId();
  const definition = field.definition as {
    question?: string;
    unit?: string;
    _sourceData?: {
      encounterHideLabel?: boolean;
      encounterFindings?: EncounterNarrativeFinding[];
    };
  };
  const question = definition.question || m('Narrative');
  const readOnly = !isPreview || !isEnabled || isReadOnly;
  const html = React.useMemo(() => responseHtml(response), [response]);
  const findings = validEncounterNarrativeFindings(
    definition._sourceData?.encounterFindings
  );
  // Common findings dock as a section-specific macro group; picking one
  // inserts its text at the caret like any other macro. Each gets a derived
  // dot-phrase so it can also be typed inline (`.nf` + space).
  const shortcuts = findingShortcuts(findings);
  const macros: MacroGroup[] | undefined = findings.length
    ? [
        {
          id: 'common-findings',
          label: m('Common findings'),
          macros: findings.map((finding) => ({
            id: finding.id,
            label: finding.label,
            content: finding.text,
            shortcut: shortcuts.get(finding.id),
          })),
        },
      ]
    : undefined;

  const publish = (
    value: string,
    previous: FieldResponse | undefined,
    selected: EncounterNarrativeFinding[]
  ) => {
    const sanitized = sanitizeEncounterNarrativeHtml(value);
    const answer = encounterNarrativeText(sanitized);
    const attributes = {
      ...previous?.attributes,
      [HTML_ATTRIBUTE]: sanitized,
      [TEXT_ATTRIBUTE]: answer,
      ...(selected.length ||
      previous?.attributes?.[FINDINGS_ATTRIBUTE] !== undefined
        ? {
            [FINDINGS_ATTRIBUTE]: JSON.stringify(selected),
            [FINDINGS_TEXT_ATTRIBUTE]: answer,
          }
        : {}),
    };
    const next = { ...previous, answer, _ai: false, attributes };
    delete next.selected;
    responseRef.current = next;
    onResponse(next);
  };

  React.useEffect(() => {
    editorRef.current?.setAttribute('dir', 'auto');
    editorRef.current?.setAttribute('aria-readonly', String(readOnly));
    editorRef.current?.setAttribute('aria-labelledby', labelId);
    editorRef.current?.setAttribute(
      'aria-required',
      String(isRequired || isSoftRequired)
    );
  }, [isRequired, isSoftRequired, labelId, readOnly]);

  return (
    <div data-slot="encounter-narrative" className="min-w-0">
      <div
        id={labelId}
        className={
          definition._sourceData?.encounterHideLabel
            ? 'sr-only'
            : 'text-muted-foreground text-sm font-medium'
        }
      >
        {question}
        {definition.unit && ` (${definition.unit})`}
        {(isRequired || isSoftRequired) && (
          <span className="text-destructive ms-0.5">*</span>
        )}
      </div>
      <TextAreaRich
        ref={editorRef}
        value={html}
        onChange={(value) => {
          if (readOnly) return;
          const sanitized = sanitizeEncounterNarrativeHtml(value);
          const answer = encounterNarrativeText(sanitized);
          const previous = responseRef.current;
          publish(
            sanitized,
            previous,
            getEncounterNarrativeFindings(previous).filter((finding) =>
              hasEncounterNarrativeFindingText(answer, finding.text)
            )
          );
        }}
        // An explicit macro invocation — a panel pick or a typed dot-phrase
        // — codes the finding: its text is appended as its own line (never
        // duplicated) and recorded in the response's finding provenance.
        // Typed prose that merely matches macro content stays uncoded.
        onMacroInsert={(macro) => {
          const finding = findings.find((item) => item.id === macro.id);
          if (!finding || readOnly) return true;
          const previous = responseRef.current;
          const next = applyEncounterNarrativeFinding(previous, finding);
          if (next === previous) return true;
          const answer = previous?.answer ?? '';
          const nextHtml = hasEncounterNarrativeFindingText(
            answer,
            finding.text
          )
            ? responseHtml(previous)
            : `${answer.trim() ? responseHtml(previous) : ''}<p>${textToHtml(finding.text)}</p>`;
          publish(nextHtml, previous, getEncounterNarrativeFindings(next));
          return true;
        }}
        aria-label={question}
        disabled={readOnly}
        enableDictation={false}
        macros={readOnly ? undefined : macros}
        defaultMacrosOpen
        macroLabels={{
          macros: m('Macros'),
          showMacros: m('Show macros'),
          hideMacros: m('Hide macros'),
          insertInto: m('Insert into'),
          searchPlaceholder: m('Search macros…'),
          searchLabel: m('Search macros'),
          close: m('Close macros'),
          empty: m('No macros available'),
          emptyHint: m('The application has not provided a macro list.'),
          noResults: m('No macros match'),
          clearSearch: m('Clear search'),
          // {count} is substituted by MacroLibrary per group.
          showMore: m('Show {count} more'),
        }}
        sanitizeHtml={sanitizeEncounterNarrativeHtml}
        className="mt-1"
      />
    </div>
  );
}
