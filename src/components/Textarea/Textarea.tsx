import * as React from 'react';
import { cn } from '../../utils/cn';
import { RequiredMark } from '../Input';
import { TextAreaRich } from '../TextAreaRich';
import { TextAreaPlain } from '../TextAreaPlain';
import type { TextAreaPlainProps } from '../TextAreaPlain';

/**
 * `Textarea` keeps `TextAreaPlain`'s prop surface so existing call sites
 * compile unchanged while rendering `TextAreaRich` underneath.
 */
export interface TextareaProps extends TextAreaPlainProps {
  /**
   * Set `false` to opt out of the rich surface: renders the native
   * `TextAreaPlain` instead — no block gutter menu, no formatting, no HTML —
   * and restores every native textarea behaviour (`maxLength` enforcement,
   * `resize`, `autoResize={false}`, floating labels).
   */
  richText?: boolean;
}

// --- plain text <-> HTML (lossless round-trip for plain text) --------------

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/**
 * Newline normalization applied to every incoming plain value: a native
 * textarea's API value never contains CR, so CRLF/CR collapse to LF before
 * any conversion. Without this, `'a\r\nb'` would leave a literal CR inside a
 * paragraph and gain a blank line on the next round-trip.
 */
function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

/**
 * Converts plain text to the editor's HTML: each line becomes a paragraph,
 * empty lines become `<p><br></p>`. Newlines are normalized to LF first
 * (matching native textarea behaviour); after that,
 * `htmlToPlain(plainToHtml(text)) === text` for every string, so stored
 * plain values survive untouched.
 */
export function plainToHtml(text: string): string {
  if (!text) return '';
  return normalizeNewlines(text)
    .split('\n')
    .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : '<p><br></p>'))
    .join('');
}

const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'LI',
  'UL',
  'OL',
  'BLOCKQUOTE',
  'PRE',
  'TABLE',
  'CAPTION',
  'THEAD',
  'TBODY',
  'TFOOT',
  'TR',
]);

/** Table cells separate with tabs; their row supplies the newline. */
const CELL_TAGS = new Set(['TD', 'TH']);

/** Tags whose text is invisible — contributing it would leak code as text. */
const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT']);

function nodeListToText(nodes: Iterable<Node>): string {
  let out = '';
  // Cell separators are positional, not content-based: an empty cell still
  // owns a column, so `Drug | (blank) | Dose` must stay `Drug\t\tDose`.
  let afterCell = false;
  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      out += text;
      // Inter-cell whitespace from pretty-printed table markup does not
      // break the cell sequence.
      if (text.trim()) afterCell = false;
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as Element;
    if (IGNORED_TAGS.has(el.tagName)) continue;
    if (el.tagName === 'BR') {
      afterCell = false;
      out += '\n';
      continue;
    }
    if (CELL_TAGS.has(el.tagName)) {
      if (afterCell) out += '\t';
      out += nodeListToText(el.childNodes);
      afterCell = true;
      continue;
    }
    afterCell = false;
    if (BLOCK_TAGS.has(el.tagName)) {
      // A block starts its own line — inline content before it
      // (`a<div>b</div>`) must not fuse with the block's first line.
      if (out && !out.endsWith('\n')) out += '\n';
      let inner = nodeListToText(el.childNodes);
      // A lone <br> inside a block is the "empty paragraph" convention,
      // not an extra line break.
      if (inner === '\n') inner = '';
      out += inner;
      // A block ends its own line — but a nested block
      // (`<blockquote><p>a</p></blockquote>`) already supplied the
      // newline; adding another would fabricate a blank line.
      if (inner === '' || !inner.endsWith('\n')) out += '\n';
      continue;
    }
    out += nodeListToText(el.childNodes);
  }
  return out;
}

/** Extracts plain text from editor HTML: blocks and `<br>` become newlines. */
export function htmlToPlain(html: string): string {
  if (!html) return '';
  // A <template> is the spec's inert parser: untrusted markup (pasted HTML
  // reaches this extractor) cannot load resources or run handlers like
  // `<img onerror>` while being read — unlike a detached <div>, whose
  // subtree is still "browsing-context connected" enough to fetch.
  const root = document.createElement('template');
  root.innerHTML = html;
  const text = nodeListToText(root.content.childNodes);
  return text.endsWith('\n') ? text.slice(0, -1) : text;
}

/**
 * Paste/drop insertion policy: clipboard HTML is flattened to escaped plain
 * paragraphs before it reaches the live editable, so clipboard styles, host
 * CSS classes and embedded content never become active inside a field whose
 * contract is plain text.
 */
function sanitizePastedHtml(html: string): string {
  return plainToHtml(htmlToPlain(html));
}

// --- dev-only one-time warnings for dropped native behaviours ---------------

const warned = new Set<string>();
function warnOnce(key: string, message: string): void {
  if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
    warned.add(key);
    console.warn(`[mieweb/ui Textarea] ${message}`);
  }
}

/**
 * The rich implementation behind `Textarea` (see its docs). Separate
 * component so the `richText={false}` branch never mounts these hooks.
 */
const RichTextarea = React.forwardRef<HTMLTextAreaElement, TextAreaPlainProps>(
  (
    {
      label,
      labelVariant = 'stacked',
      hideLabel,
      error,
      helperText,
      maxLength,
      showCount,
      autoResize = true,
      requiredVariant,
      size = 'md',
      hasError,
      resize,
      className,
      value,
      defaultValue,
      onChange,
      onBlur,
      onFocus,
      onKeyDown,
      onKeyUp,
      name,
      form,
      id,
      rows,
      required,
      readOnly,
      disabled,
      placeholder,
      'aria-describedby': ariaDescribedBy,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    },
    ref
  ) => {
    if (labelVariant === 'floating') {
      warnOnce(
        'floating',
        'labelVariant="floating" is not supported by the rich surface; ' +
          'falling back to a stacked label. Use TextAreaPlain for floating labels.'
      );
    }
    if (autoResize === false) {
      warnOnce(
        'autoResize',
        'autoResize={false} is ignored; the rich surface always grows with ' +
          'content. Use TextAreaPlain for a fixed-height textarea.'
      );
    }
    if (resize !== undefined) {
      warnOnce(
        'resize',
        'resize is ignored; the rich surface has no native resize handle. ' +
          'Use TextAreaPlain for drag-resizing.'
      );
    }
    if (maxLength !== undefined) {
      warnOnce(
        'maxLength',
        'maxLength is not enforced while typing; the character count still ' +
          'reflects it. Enforce limits in onChange or use TextAreaPlain.'
      );
    }

    const reactId = React.useId();
    const errorId = `${reactId}-error`;
    const helperId = `${reactId}-helper`;
    const countId = `${reactId}-count`;

    const controlledValue =
      value !== undefined ? normalizeNewlines(String(value)) : undefined;

    const [state, setState] = React.useState(() => {
      const plain =
        controlledValue ??
        (defaultValue !== undefined
          ? normalizeNewlines(String(defaultValue))
          : '');
      return { html: plainToHtml(plain), plain };
    });

    // Controlled resync: only when the parent hands us a value different from
    // the plain text we last reported — echoing our own value back (the usual
    // controlled round-trip) keeps the user's rich formatting intact.
    if (controlledValue !== undefined && controlledValue !== state.plain) {
      setState({ html: plainToHtml(controlledValue), plain: controlledValue });
    }

    const hiddenRef = React.useRef<HTMLTextAreaElement>(null);
    const editorWrapperRef = React.useRef<HTMLDivElement>(null);

    // Rejected-edit resync. When a controlled parent refuses an edit, the
    // committed value never changes — the optimistic state above is reverted
    // during the same render — so the editor's [value]-gated sync never
    // fires and its DOM would keep the rejected text. Compare *plain* text
    // (not HTML) so accepted edits keep the user's rich formatting.
    React.useEffect(() => {
      const editable =
        editorWrapperRef.current?.querySelector<HTMLElement>(
          '[role="textbox"]'
        );
      if (editable && htmlToPlain(editable.innerHTML) !== state.plain) {
        editable.innerHTML = state.html;
      }
    });

    const focusEditor = React.useCallback(() => {
      editorWrapperRef.current
        ?.querySelector<HTMLElement>('[role="textbox"]')
        ?.focus();
    }, []);

    // The forwarded ref is the hidden mirror <textarea> — `ref.current.value`
    // reads the current plain text — with focus/blur redirected to the editor.
    React.useImperativeHandle(ref, () => {
      const node = hiddenRef.current as HTMLTextAreaElement;
      node.focus = focusEditor;
      node.blur = () => {
        const editable =
          editorWrapperRef.current?.querySelector<HTMLElement>(
            '[role="textbox"]'
          );
        if (document.activeElement === editable) editable?.blur();
      };
      return node;
    }, [focusEditor]);

    // External-label bridge: existing call sites pair
    // `<Label htmlFor={id}>` with `<Textarea id={id}>`. The id now lands on a
    // contenteditable div, which `htmlFor` neither names nor focuses. Find
    // the external label, point `aria-labelledby` at it (restoring the
    // accessible name) and focus the editor when it is clicked.
    const [externalLabelId, setExternalLabelId] = React.useState<string>();
    React.useEffect(() => {
      if (!id) return;
      const externalLabel = document.querySelector<HTMLLabelElement>(
        `label[for="${globalThis.CSS.escape(id)}"]`
      );
      if (!externalLabel) return;
      if (!externalLabel.id) externalLabel.id = `${reactId}-external-label`;
      setExternalLabelId(externalLabel.id);
      const handleClick = () => focusEditor();
      externalLabel.addEventListener('click', handleClick);
      return () => externalLabel.removeEventListener('click', handleClick);
    }, [id, reactId, focusEditor]);

    // Re-targets editor events at the mirror so legacy handlers keep reading
    // `event.target.value` as plain text, like they did on the native
    // textarea. The original event is the prototype — reads and propagation
    // state delegate to it — with only the targets overridden;
    // stopPropagation/preventDefault forward to the original so React's
    // dispatch loop (which checks the original) honours them.
    const retargetEvent = React.useCallback(
      <E extends React.SyntheticEvent>(event: E): E => {
        const node = hiddenRef.current;
        if (!node) return event;
        const retargeted = Object.create(event) as E;
        Object.defineProperties(retargeted, {
          target: { value: node, enumerable: true },
          currentTarget: { value: node, enumerable: true },
          stopPropagation: { value: () => event.stopPropagation() },
          preventDefault: { value: () => event.preventDefault() },
        });
        return retargeted;
      },
      []
    );

    type MirrorFocusEvent = React.FocusEvent<HTMLTextAreaElement>;
    type MirrorKeyboardEvent = React.KeyboardEvent<HTMLTextAreaElement>;

    const handleHtmlChange = (html: string) => {
      const plain = htmlToPlain(html);
      setState({ html, plain });
      const node = hiddenRef.current;
      if (onChange && node) {
        node.value = plain;
        const nativeEvent = new Event('change');
        onChange({
          target: node,
          currentTarget: node,
          type: 'change',
          bubbles: false,
          cancelable: false,
          defaultPrevented: false,
          eventPhase: 0,
          isTrusted: false,
          timeStamp: Date.now(),
          nativeEvent,
          preventDefault: () => {},
          stopPropagation: () => {},
          isDefaultPrevented: () => false,
          isPropagationStopped: () => false,
          persist: () => {},
        } as React.ChangeEvent<HTMLTextAreaElement>);
      }
    };

    const showError = !!error;
    const invalid = hasError || showError;
    const describedByIds =
      [
        showError ? errorId : null,
        helperText && !showError ? helperId : null,
        showCount ? countId : null,
        ariaDescribedBy,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    const characterCount = state.plain.length;

    // The editable's own metrics (RichTextEditor pins `text-base` and a
    // one-row min-height): `size` restyles the font, `rows` restores the
    // size-aware growth floor a native textarea got for free.
    const lineHeightPx = size === 'sm' ? 20 : size === 'lg' ? 28 : 24;
    const editorStyle = rows
      ? // 7px block padding each side, matching the editable's py-[7px].
        { minHeight: `${rows * lineHeightPx + 14}px` }
      : undefined;

    return (
      <div data-slot="textarea-wrapper" className="flex flex-col gap-1.5">
        {label && (
          <label
            data-slot="textarea-label"
            className={cn(
              'text-foreground text-sm font-medium',
              hideLabel && 'sr-only'
            )}
          >
            {label}
            {required && <RequiredMark variant={requiredVariant} />}
          </label>
        )}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions --
            not interactive itself: delegates events bubbling from the
            contenteditable textbox inside, like a native field's wrapper */}
        <div
          ref={editorWrapperRef}
          className="w-full"
          // Composed like native textarea events: blur/focus only fire when
          // focus actually leaves/enters the field (moves inside the editor
          // chrome — gutter menu, toolbar — don't count), and all events are
          // re-targeted at the mirror so `event.target.value` stays plain.
          onBlur={
            onBlur &&
            ((event: React.FocusEvent<HTMLDivElement>) => {
              if (event.currentTarget.contains(event.relatedTarget)) return;
              onBlur(retargetEvent(event) as unknown as MirrorFocusEvent);
            })
          }
          onFocus={
            onFocus &&
            ((event: React.FocusEvent<HTMLDivElement>) => {
              if (event.currentTarget.contains(event.relatedTarget)) return;
              onFocus(retargetEvent(event) as unknown as MirrorFocusEvent);
            })
          }
          onKeyDown={
            onKeyDown &&
            ((event: React.KeyboardEvent<HTMLDivElement>) =>
              onKeyDown(retargetEvent(event) as unknown as MirrorKeyboardEvent))
          }
          onKeyUp={
            onKeyUp &&
            ((event: React.KeyboardEvent<HTMLDivElement>) =>
              onKeyUp(retargetEvent(event) as unknown as MirrorKeyboardEvent))
          }
        >
          <TextAreaRich
            value={state.html}
            onChange={handleHtmlChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            id={id}
            sanitizeHtml={sanitizePastedHtml}
            aria-label={ariaLabel ?? label}
            aria-labelledby={ariaLabelledBy ?? externalLabelId}
            aria-describedby={describedByIds}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            editorClassName={cn(
              // A native textarea renders repeated spaces and tabs
              // faithfully; normal HTML layout would collapse them.
              'whitespace-pre-wrap',
              size === 'sm' && 'text-sm',
              size === 'lg' && 'text-lg'
            )}
            editorStyle={editorStyle}
            className={cn(
              size === 'sm' && 'text-sm',
              size === 'lg' && 'text-lg',
              invalid &&
                'border-destructive focus-within:ring-destructive focus-within:border-destructive',
              disabled && 'cursor-not-allowed opacity-50',
              className
            )}
          />
        </div>
        {/* Mirrors the plain value for form posts and the forwarded ref. */}
        <textarea
          data-slot="textarea-mirror"
          ref={hiddenRef}
          hidden
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          name={name}
          form={form}
          required={required}
          disabled={disabled}
          value={state.plain}
        />
        <div
          data-slot="textarea-footer"
          className="flex items-center justify-between gap-2"
        >
          <div className="flex-1">
            {showError && (
              <p
                id={errorId}
                data-slot="textarea-error"
                className="text-destructive-700 dark:text-destructive-400 text-sm"
                role="alert"
              >
                {error}
              </p>
            )}
            {helperText && !showError && (
              <p
                id={helperId}
                data-slot="textarea-helper"
                className="text-muted-foreground text-sm"
              >
                {helperText}
              </p>
            )}
          </div>
          {showCount && (
            <p
              id={countId}
              data-slot="textarea-count"
              className={cn(
                'text-muted-foreground shrink-0 text-xs',
                maxLength && characterCount >= maxLength && 'text-destructive'
              )}
            >
              {characterCount}
              {maxLength && `/${maxLength}`}
            </p>
          )}
        </div>
      </div>
    );
  }
);

RichTextarea.displayName = 'RichTextarea';

/**
 * A multi-line text input that is rich text underneath. `Textarea` keeps its
 * plain-text contract — `value`, `defaultValue` and `onChange`'s
 * `event.target.value` are plain strings — while rendering `TextAreaRich`
 * (hidden toolbar, markdown shortcuts, block gutter menu) so every note
 * field gets formatting for free.
 *
 * Formatting the user applies is visible while editing but only the plain
 * text is reported through `onChange`; hosts that persist HTML should use
 * `TextAreaRich` directly. Need the native `<textarea>` element (hard
 * `maxLength`, native validation, autofill, drag-resize, floating label) —
 * pass `richText={false}` or use `TextAreaPlain`.
 *
 * A hidden `<textarea>` mirrors the plain value so `name` form posts and
 * `ref.current.value` keep working; `ref.current.focus()` focuses the editor.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ richText = true, ...props }, ref) =>
    richText ? (
      <RichTextarea ref={ref} {...props} />
    ) : (
      <TextAreaPlain ref={ref} {...props} />
    )
);

Textarea.displayName = 'Textarea';

export { Textarea };
