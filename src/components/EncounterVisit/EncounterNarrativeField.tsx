import * as React from 'react';
import DOMPurify from 'dompurify';
import { ChevronDown, Check } from 'lucide-react';
import type { FieldComponentProps, FieldResponse } from '@esheet/core';
import { Button } from '../Button';
import { RichTextEditor } from '../RichTextEditor';
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
  const responseRef = React.useRef(response);
  responseRef.current = response;
  const labelId = React.useId();
  const findingsId = React.useId();
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
    publish(nextHtml, previous, getEncounterNarrativeFindings(next));
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
      <RichTextEditor
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
        placeholder={readOnly ? m('Not documented') : m('Enter narrative…')}
        disabled={readOnly}
        enableDictation={false}
        sanitizeHtml={sanitizeEncounterNarrativeHtml}
        className="[&_[role=textbox]]:text-foreground overflow-visible rounded-none border-0 bg-transparent [&_.pointer-events-none]:px-0 [&_.pointer-events-none]:py-1.5 [&_[data-slot=rich-text-editor-toolbar]]:static [&_[data-slot=rich-text-editor-toolbar]]:hidden [&_[data-slot=rich-text-editor-toolbar]]:border-0 [&_[data-slot=rich-text-editor-toolbar]]:bg-transparent [&_[data-slot=rich-text-editor-toolbar]]:p-0 focus-within:[&_[data-slot=rich-text-editor-toolbar]]:flex [&_[data-slot=rich-text-editor-toolbar]>*:nth-child(n+7)]:hidden [&_[data-slot=rich-text-editor-toolbar]>button]:h-11 [&_[data-slot=rich-text-editor-toolbar]>button]:w-11 [&_[role=textbox]]:min-h-11 [&_[role=textbox]]:cursor-text [&_[role=textbox]]:overflow-visible [&_[role=textbox]]:bg-transparent [&_[role=textbox]]:px-0 [&_[role=textbox]]:py-1.5 [&_[role=textbox]]:text-base [&_[role=textbox]]:leading-7 [&_[role=textbox]]:break-words [&_[role=textbox]]:whitespace-pre-wrap [&_[role=textbox]_li]:my-0 [&_[role=textbox]_ol]:my-1 [&_[role=textbox]_p]:my-0 [&_[role=textbox]_ul]:my-1"
      />
      {!readOnly && findings.length > 0 && (
        <details
          open
          className="group"
          data-slot="encounter-common-findings"
          onMouseDownCapture={(event) => {
            // Keep the focus-only toolbar in place until click completes.
            // Native summary toggling and keyboard focus remain unchanged.
            if (editorRef.current?.contains(document.activeElement))
              event.preventDefault();
          }}
        >
          <summary
            aria-controls={findingsId}
            className="text-muted-foreground focus-visible:ring-ring flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden"
          >
            <ChevronDown
              aria-hidden="true"
              className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
            />
            {m('Common findings')}
          </summary>
          <div
            id={findingsId}
            role="group"
            aria-label={m('{question} common findings', { question })}
            className="flex flex-wrap gap-1 pb-1"
          >
            {findings.map((finding) => {
              const selected = selectedFindings.some(
                (item) => item.id === finding.id
              );
              return (
                <Button
                  key={finding.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto min-h-11 max-w-full px-2 text-start font-normal whitespace-normal [&>span]:text-wrap [&>span]:whitespace-normal"
                  title={finding.text}
                  aria-label={m(
                    selected ? 'Added {finding}' : 'Add {finding}',
                    { finding: finding.label }
                  )}
                  disabled={selected}
                  leftIcon={selected ? <Check aria-hidden="true" /> : undefined}
                  onClick={() => addFinding(finding)}
                >
                  {finding.label}
                </Button>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
