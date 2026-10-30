/**
 * EsheetNarrativeField — generic esheet-guided narrative field.
 *
 * A report-like rich text surface backed by eSheet text: the field rests as a
 * plain one-line input, expands while the author writes, docks the section's
 * common findings as a macro group (each with a derived dot-phrase), and
 * records explicit finding picks as provenance on the response.
 *
 * The response attribute namespace, findings source, and styling slot are
 * parameterized so hosts with a published contract (EncounterNarrativeField's
 * `encounterNarrative*`) configure it without forking the behavior.
 *
 * Exposed via the `@mieweb/ui/esheet` entry point (NOT the main bundle) so
 * that @esheet/* stays an optional dependency.
 */

import * as React from 'react';
import DOMPurify from 'dompurify';
import type { FieldComponentProps, FieldResponse } from '@esheet/core';
import { getFieldComponent, registerCustomFieldTypes } from '@esheet/fields';
import type { MacroGroup } from '../components/MacroLibrary';
import { TextAreaRich } from '../components/TextAreaRich';
import { useMessages } from '../utils/messages';
import {
  applyNarrativeFinding,
  getNarrativeFindings,
  hasNarrativeFindingText,
  NARRATIVE_ATTRIBUTES,
  validNarrativeFindings,
  type NarrativeAttributeNames,
  type NarrativeFinding,
} from './narrativeFindings';

/**
 * Keep document formatting small: no links, media, styles, or imported
 * document chrome. Every block format the editor's block menu and markdown
 * shortcuts offer (headings 1–3, quote, lists) is allowed, so published
 * formatting survives reopening the field.
 */
export function sanitizeNarrativeHtml(html: string): string {
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
      'h1',
      'h2',
      'h3',
      'blockquote',
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
export function narrativeText(html: string): string {
  const documentBody = document.createElement('div');
  documentBody.innerHTML = sanitizeNarrativeHtml(html);
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
    const isBlock = [
      'P',
      'DIV',
      'H1',
      'H2',
      'H3',
      'BLOCKQUOTE',
      'UL',
      'OL',
      'LI',
    ].includes(node.tagName);
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

function responseHtml(
  response: FieldResponse | undefined,
  attributes: NarrativeAttributeNames
): string {
  const answer = response?.answer ?? '';
  const responseAttributes = response?.attributes;
  // Programmatic edits retain native response metadata. Its baseline prevents
  // formatting from an earlier answer from overriding a newer MCP/plain edit.
  if (
    typeof window !== 'undefined' &&
    responseAttributes?.[attributes.text] === answer &&
    typeof responseAttributes[attributes.html] === 'string'
  ) {
    const html = sanitizeNarrativeHtml(responseAttributes[attributes.html]);
    if (narrativeText(html) === answer) return html;
  }
  return textToHtml(answer);
}

/**
 * Typeable dot-phrase shortcuts, one per finding ("No fever" → `.nf`), built
 * from each label's word initials with numeric suffixes on collision.
 */
function findingShortcuts(findings: NarrativeFinding[]): Map<string, string> {
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

export interface EsheetNarrativeFieldProps extends FieldComponentProps {
  /** Response attribute namespace; defaults to {@link NARRATIVE_ATTRIBUTES}. */
  attributes?: NarrativeAttributeNames;
  /** `definition._sourceData` key holding the section's common findings. */
  findingsKey?: string;
  /** `definition._sourceData` key that hides the visible field label. */
  hideLabelKey?: string;
  /** `data-slot` value for host CSS hooks. */
  slot?: string;
}

/** A report-like narrative surface that grows with its content, backed by eSheet text. */
export function EsheetNarrativeField({
  field,
  response,
  isPreview,
  isEnabled,
  isReadOnly,
  isRequired,
  isSoftRequired,
  onResponse,
  attributes = NARRATIVE_ATTRIBUTES,
  findingsKey = 'narrativeFindings',
  hideLabelKey = 'narrativeHideLabel',
  slot = 'esheet-narrative',
}: EsheetNarrativeFieldProps): React.JSX.Element {
  const m = useMessages();
  const editorRef = React.useRef<HTMLDivElement>(null);
  const responseRef = React.useRef(response);
  responseRef.current = response;
  const labelId = React.useId();
  const definition = field.definition as {
    question?: string;
    unit?: string;
    _sourceData?: Record<string, unknown>;
  };
  const question = definition.question || m('Narrative');
  const readOnly = !isPreview || !isEnabled || isReadOnly;
  const html = React.useMemo(
    () => responseHtml(response, attributes),
    [response, attributes]
  );
  const findings = validNarrativeFindings(
    definition._sourceData?.[findingsKey]
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
    selected: NarrativeFinding[]
  ) => {
    const sanitized = sanitizeNarrativeHtml(value);
    const answer = narrativeText(sanitized);
    const nextAttributes = {
      ...previous?.attributes,
      [attributes.html]: sanitized,
      [attributes.text]: answer,
      ...(selected.length ||
      previous?.attributes?.[attributes.findings] !== undefined
        ? {
            [attributes.findings]: JSON.stringify(selected),
            [attributes.findingsText]: answer,
          }
        : {}),
    };
    const next = {
      ...previous,
      answer,
      _ai: false,
      attributes: nextAttributes,
    };
    delete next.selected;
    responseRef.current = next;
    onResponse(next);
  };

  React.useEffect(() => {
    // `dir` is inherited, so localizing the wrapper localizes the editable
    // region too; the ARIA wiring travels as props so each editor surface
    // can place it on its own textbox element.
    editorRef.current?.setAttribute('dir', 'auto');
  }, []);

  return (
    <div data-slot={slot} className="min-w-0">
      <div
        id={labelId}
        className={
          definition._sourceData?.[hideLabelKey]
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
          const sanitized = sanitizeNarrativeHtml(value);
          const answer = narrativeText(sanitized);
          const previous = responseRef.current;
          publish(
            sanitized,
            previous,
            getNarrativeFindings(previous, attributes).filter((finding) =>
              hasNarrativeFindingText(answer, finding.text)
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
          const next = applyNarrativeFinding(previous, finding, attributes);
          if (next === previous) return true;
          const answer = previous?.answer ?? '';
          const nextHtml = hasNarrativeFindingText(answer, finding.text)
            ? responseHtml(previous, attributes)
            : `${answer.trim() ? responseHtml(previous, attributes) : ''}<p>${textToHtml(finding.text)}</p>`;
          publish(nextHtml, previous, getNarrativeFindings(next, attributes));
          return true;
        }}
        aria-label={question}
        aria-labelledby={labelId}
        aria-required={isRequired || isSoftRequired}
        // Read-only (not disabled): a previewed narrative stays selectable
        // and announces aria-readonly, matching the native textarea field.
        readOnly={readOnly}
        enableDictation={false}
        macros={readOnly ? undefined : macros}
        // The field rests as a plain one-line input; the findings panel
        // animates in while the author is writing in the section and
        // animates away when focus moves on.
        macrosOnFocus
        // One short, well-known findings list per section: the panel header,
        // search box, and group heading would double the vertical space for
        // no navigation value.
        compactMacros
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
        blockMenuLabels={{
          blockMenu: m('Block menu'),
          text: m('Text'),
          heading1: m('Heading 1'),
          heading2: m('Heading 2'),
          heading3: m('Heading 3'),
          bulletList: m('Bullet list'),
          numberedList: m('Numbered list'),
          quote: m('Quote'),
          insertMacro: m('Insert macro'),
          showMacroLibrary: m('Show macro library'),
          showToolbar: m('Show toolbar'),
          hideToolbar: m('Hide toolbar'),
        }}
        sanitizeHtml={sanitizeNarrativeHtml}
        className="mt-1"
      />
    </div>
  );
}

/**
 * Register the `esheetNarrative` field type with eSheet.
 * Call once before rendering EsheetBuilder or EsheetRenderer. Hosts that
 * already registered their own `esheetNarrative` component keep it.
 */
export function registerEsheetNarrativeFieldType(): void {
  if (getFieldComponent('esheetNarrative')) return;
  registerCustomFieldTypes({
    esheetNarrative: {
      label: 'Narrative',
      category: 'rich',
      answerType: 'text',
      hasOptions: false,
      hasMatrix: false,
      defaultProps: { question: 'Narrative' },
      component: EsheetNarrativeField,
    },
  });
}
