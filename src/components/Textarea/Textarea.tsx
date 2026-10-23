import * as React from 'react';
import { cn } from '../../utils/cn';
import { RequiredMark } from '../Input';
import { TextAreaRich } from '../TextAreaRich';
import type { TextAreaPlainProps } from '../TextAreaPlain';

/**
 * `Textarea` keeps `TextAreaPlain`'s prop surface so existing call sites
 * compile unchanged while rendering `TextAreaRich` underneath.
 */
export type TextareaProps = TextAreaPlainProps;

// --- plain text <-> HTML (lossless round-trip for plain text) --------------

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/**
 * Converts plain text to the editor's HTML: each line becomes a paragraph,
 * empty lines become `<p><br></p>`. `htmlToPlain(plainToHtml(text)) === text`
 * for every string, so stored plain values survive untouched.
 */
export function plainToHtml(text: string): string {
  if (!text) return '';
  return text
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
  'BLOCKQUOTE',
  'PRE',
]);

function nodeToText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as Element;
  if (el.tagName === 'BR') return '\n';
  const inner = Array.from(el.childNodes).map(nodeToText).join('');
  if (BLOCK_TAGS.has(el.tagName)) {
    // A block is its own line. A lone <br> inside a block is the "empty
    // paragraph" convention, not an extra line break.
    return (inner === '\n' ? '' : inner) + '\n';
  }
  return inner;
}

/** Extracts plain text from editor HTML: blocks and `<br>` become newlines. */
export function htmlToPlain(html: string): string {
  if (!html) return '';
  const root = document.createElement('div');
  // Read-only text extraction into a detached element; nothing is inserted
  // into the page.
  root.innerHTML = html;
  const text = Array.from(root.childNodes).map(nodeToText).join('');
  return text.endsWith('\n') ? text.slice(0, -1) : text;
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
 * use `TextAreaPlain`.
 *
 * A hidden `<textarea>` mirrors the plain value so `name` form posts and
 * `ref.current.value` keep working; `ref.current.focus()` focuses the editor.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
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
      name,
      required,
      disabled,
      placeholder,
      'aria-describedby': ariaDescribedBy,
      'aria-label': ariaLabel,
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

    const controlledValue = value !== undefined ? String(value) : undefined;

    const [state, setState] = React.useState(() => {
      const plain =
        controlledValue ??
        (defaultValue !== undefined ? String(defaultValue) : '');
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
        <div ref={editorWrapperRef} className="w-full">
          <TextAreaRich
            value={state.html}
            onChange={handleHtmlChange}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={ariaLabel ?? label}
            aria-describedby={describedByIds}
            aria-invalid={invalid || undefined}
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

Textarea.displayName = 'Textarea';

export { Textarea };
