import * as React from 'react';
import DOMPurify from 'dompurify';
import type { FieldComponentProps, FieldResponse } from '@esheet/core';
import { RichTextEditor } from '../RichTextEditor';

const HTML_ATTRIBUTE = 'encounterNarrativeHtml';
const TEXT_ATTRIBUTE = 'encounterNarrativeText';

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
  const editorRef = React.useRef<HTMLDivElement>(null);
  const labelId = React.useId();
  const definition = field.definition as {
    question?: string;
    unit?: string;
    _sourceData?: { encounterHideLabel?: boolean };
  };
  const question = definition.question || 'Narrative';
  const readOnly = !isPreview || !isEnabled || isReadOnly;
  const html = React.useMemo(() => responseHtml(response), [response]);

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
          onResponse({
            ...response,
            answer,
            _ai: false,
            attributes: {
              ...response?.attributes,
              [HTML_ATTRIBUTE]: sanitized,
              [TEXT_ATTRIBUTE]: answer,
            },
          });
        }}
        aria-label={question}
        placeholder={readOnly ? 'Not documented' : 'Enter narrative…'}
        disabled={readOnly}
        enableDictation={false}
        sanitizeHtml={sanitizeEncounterNarrativeHtml}
        className="[&_[role=textbox]]:text-foreground overflow-visible rounded-none border-0 bg-transparent [&_.pointer-events-none]:px-0 [&_.pointer-events-none]:py-1.5 [&_[data-slot=rich-text-editor-toolbar]]:static [&_[data-slot=rich-text-editor-toolbar]]:hidden [&_[data-slot=rich-text-editor-toolbar]]:border-0 [&_[data-slot=rich-text-editor-toolbar]]:bg-transparent [&_[data-slot=rich-text-editor-toolbar]]:p-0 focus-within:[&_[data-slot=rich-text-editor-toolbar]]:flex [&_[data-slot=rich-text-editor-toolbar]>*:nth-child(n+7)]:hidden [&_[data-slot=rich-text-editor-toolbar]>button]:h-11 [&_[data-slot=rich-text-editor-toolbar]>button]:w-11 [&_[role=textbox]]:min-h-11 [&_[role=textbox]]:cursor-text [&_[role=textbox]]:overflow-visible [&_[role=textbox]]:bg-transparent [&_[role=textbox]]:px-0 [&_[role=textbox]]:py-1.5 [&_[role=textbox]]:text-base [&_[role=textbox]]:leading-7 [&_[role=textbox]]:break-words [&_[role=textbox]]:whitespace-pre-wrap [&_[role=textbox]_li]:my-0 [&_[role=textbox]_ol]:my-1 [&_[role=textbox]_p]:my-0 [&_[role=textbox]_ul]:my-1"
      />
    </div>
  );
}
