import * as React from 'react';
import DOMPurify from 'dompurify';
import { Check, Plus } from 'lucide-react';
import type { FieldComponentProps, FieldResponse } from '@esheet/core';
import { Badge, badgeVariants } from '../Badge';
import { cn } from '../../utils/cn';
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
  const chipsRef = React.useRef<HTMLDivElement>(null);
  const pendingFocusId = React.useRef<string | null>(null);
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
  const selectedFindings = getEncounterNarrativeFindings(response);

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

  const addFinding = (finding: EncounterNarrativeFinding) => {
    if (readOnly) return;
    const previous = responseRef.current;
    const next = applyEncounterNarrativeFinding(previous, finding);
    if (next === previous) return;
    const answer = previous?.answer ?? '';
    // An explicit pick may code an already entered matching line, but never
    // inserts the same line twice or treats unpicked prose as coded capture.
    const nextHtml = hasEncounterNarrativeFindingText(answer, finding.text)
      ? responseHtml(previous)
      : `${answer.trim() ? responseHtml(previous) : ''}<p>${textToHtml(finding.text)}</p>`;
    pendingFocusId.current = finding.id;
    publish(nextHtml, previous, getEncounterNarrativeFindings(next));
  };

  const removeFinding = (finding: EncounterNarrativeFinding) => {
    if (readOnly) return;
    const previous = responseRef.current;
    const selected = getEncounterNarrativeFindings(previous).filter(
      (item) => item.id !== finding.id
    );
    pendingFocusId.current = finding.id;
    const body = document.createElement('div');
    body.innerHTML = responseHtml(previous);
    const matches = Array.from(body.querySelectorAll('p, div, li')).filter(
      (block) => (block.textContent ?? '').trim() === finding.text.trim()
    );
    // The innermost matching block, so a wrapper holding only the finding's
    // paragraph is not removed along with unrelated siblings.
    const target = matches.find(
      (block) =>
        !matches.some((other) => other !== block && block.contains(other))
    );
    if (target) {
      const list = target.closest('ul, ol');
      target.remove();
      if (list && !list.children.length) list.remove();
      publish(body.innerHTML, previous, selected);
      return;
    }
    // Plain-text narratives have no block markup; drop the matching line.
    const lines = (previous?.answer ?? '').replace(/\r\n?/g, '\n').split('\n');
    const index = lines.findIndex(
      (line) => line.trim() === finding.text.trim()
    );
    if (index >= 0) lines.splice(index, 1);
    publish(textToHtml(lines.join('\n').trim()), previous, selected);
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

  // Toggling a chip swaps its add button and removable badge, so keyboard
  // focus would fall to the body; hand it to the replacement control.
  React.useEffect(() => {
    if (!pendingFocusId.current) return;
    const chip = chipsRef.current?.querySelector<HTMLElement>(
      `[data-finding-id="${globalThis.CSS.escape(pendingFocusId.current)}"]`
    );
    const control =
      chip instanceof HTMLButtonElement
        ? chip
        : chip?.querySelector<HTMLButtonElement>('[data-slot="badge-remove"]');
    if (control && document.activeElement === document.body) {
      pendingFocusId.current = null;
      control.focus();
    }
  });

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
        aria-label={question}
        disabled={readOnly}
        enableDictation={false}
        defaultToolbar="visible"
        sanitizeHtml={sanitizeEncounterNarrativeHtml}
        className="mt-1"
      />
      {!readOnly && findings.length > 0 && (
        <div data-slot="encounter-common-findings" className="mt-1.5">
          <div
            ref={chipsRef}
            role="group"
            aria-label={m('{question} common findings', { question })}
            className="flex flex-wrap gap-1.5"
          >
            {findings.map((finding) => {
              const selected = selectedFindings.some(
                (item) => item.id === finding.id
              );
              return selected ? (
                <Badge
                  key={finding.id}
                  data-finding-id={finding.id}
                  variant="success"
                  icon={<Check aria-hidden="true" className="h-3.5 w-3.5" />}
                  title={finding.text}
                  onRemove={() => removeFinding(finding)}
                  removeLabel={m('Remove {finding}', {
                    finding: finding.label,
                  })}
                >
                  {finding.label}
                </Badge>
              ) : (
                <button
                  key={finding.id}
                  type="button"
                  data-finding-id={finding.id}
                  className={cn(
                    badgeVariants({ variant: 'secondary' }),
                    'focus-visible:ring-ring cursor-pointer hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none dark:hover:bg-neutral-700'
                  )}
                  title={finding.text}
                  aria-label={m('Add {finding}', { finding: finding.label })}
                  onClick={() => addFinding(finding)}
                >
                  <span className="me-1 shrink-0">
                    <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                  </span>
                  {finding.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
