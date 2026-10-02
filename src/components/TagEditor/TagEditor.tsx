'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';
import { useClickOutside } from '../../hooks/useClickOutside';

export interface TagEditorLabels {
  /** Accessible name of the text input when no visible `label` is given. */
  input: string;
  placeholder: string;
  remove: (tag: string) => string;
  duplicate: (tag: string) => string;
  maxReached: (max: number) => string;
  saving: string;
  saveFailed: string;
  /** Accessible name of the suggestions list. */
  suggestions: string;
}

export const defaultTagEditorLabels: TagEditorLabels = {
  input: 'Add tag',
  placeholder: 'Add a tag…',
  remove: (tag) => `Remove ${tag}`,
  duplicate: (tag) => `"${tag}" is already added`,
  maxReached: (max) => `You can add up to ${max} tags`,
  saving: 'Saving…',
  saveFailed: 'Could not save tags. Try again.',
  suggestions: 'Suggestions',
};

const containerVariants = cva(
  [
    'flex w-full flex-wrap items-center gap-1.5 rounded-lg border bg-background',
    'focus-within:ring-ring focus-within:ring-2',
  ],
  {
    variants: {
      size: { sm: 'min-h-8 px-2 py-1 text-sm', md: 'min-h-10 px-3 py-1.5' },
      hasError: { true: 'border-destructive', false: 'border-input' },
    },
    defaultVariants: { size: 'md', hasError: false },
  }
);

export interface TagEditorProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'>,
    Omit<VariantProps<typeof containerVariants>, 'hasError'> {
  /** Current tags (controlled). */
  value: string[];
  /** Receives the next tag list. May return a promise; a rejection shows an error. */
  onChange: (tags: string[]) => void | Promise<void>;
  /** Optional values offered while typing. */
  suggestions?: string[];
  /** Maximum number of tags. */
  maxTags?: number;
  /** Return an error message to reject a tag. */
  validate?: (tag: string) => string | undefined;
  /** Visible label for the field. */
  label?: string;
  readOnly?: boolean;
  disabled?: boolean;
  /** Translatable strings. */
  labels?: Partial<TagEditorLabels>;
}

/**
 * Edit a list of free-form tags: chips with remove buttons plus an input that
 * adds on Enter or comma, with optional suggestions.
 */
export const TagEditor = React.forwardRef<HTMLDivElement, TagEditorProps>(
  function TagEditor(
    {
      value,
      onChange,
      suggestions,
      maxTags,
      validate,
      label,
      readOnly,
      disabled,
      size,
      labels: labelOverrides,
      className,
      ...props
    },
    ref
  ) {
    const labels = { ...defaultTagEditorLabels, ...labelOverrides };
    const [draft, setDraft] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);
    const [pending, setPending] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const id = React.useId();
    const inputId = `${id}-input`;
    const errorId = `${id}-error`;
    const listId = `${id}-list`;

    const { anchorRef, floatingRef, style } = useAnchoredPosition<
      HTMLDivElement,
      HTMLDivElement
    >({ open, matchWidth: true, maxHeight: 240 });
    const outsideRefs = React.useMemo(
      () => [containerRef, floatingRef],
      [floatingRef]
    );
    useClickOutside(outsideRefs, () => setOpen(false), open);

    const has = (tag: string) =>
      value.some((t) => t.toLowerCase() === tag.toLowerCase());
    const query = draft.trim().toLowerCase();
    const matches = (suggestions ?? []).filter(
      (s) => !has(s) && (!query || s.toLowerCase().includes(query))
    );
    const isOpen = open && matches.length > 0 && !pending;
    const interactive = !readOnly && !disabled && !pending;
    const atMax = maxTags !== undefined && value.length >= maxTags;
    // State lags a render behind; the ref blocks a second save from the same tick.
    const inFlight = React.useRef(false);

    const commit = async (next: string[], refocus = true) => {
      inFlight.current = true;
      setPending(true);
      try {
        await onChange(next);
      } catch {
        setError(labels.saveFailed);
      } finally {
        inFlight.current = false;
        setPending(false);
        if (refocus) inputRef.current?.focus();
      }
    };

    const add = (raw: string[], refocus = true) => {
      if (inFlight.current) return;
      const next = [...value];
      for (const piece of raw) {
        const tag = piece.trim();
        if (!tag) continue;
        if (next.some((t) => t.toLowerCase() === tag.toLowerCase())) {
          setError(labels.duplicate(tag));
          return;
        }
        if (maxTags !== undefined && next.length >= maxTags) {
          setError(labels.maxReached(maxTags));
          return;
        }
        const invalid = validate?.(tag);
        if (invalid) {
          setError(invalid);
          return;
        }
        next.push(tag);
      }
      setError(null);
      setDraft('');
      setActiveIndex(-1);
      if (next.length !== value.length) void commit(next, refocus);
    };

    const remove = (index: number) => {
      if (inFlight.current) return;
      setError(null);
      void commit(value.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setOpen(true);
        if (!matches.length) return;
        const step = e.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex((i) => (i + step + matches.length) % matches.length);
      } else if (e.key === 'Enter' || e.key === ',') {
        if (e.key === 'Enter' && !draft.trim() && activeIndex < 0) return;
        e.preventDefault();
        add([isOpen && activeIndex >= 0 ? matches[activeIndex] : draft]);
      } else if (e.key === 'Backspace' && !draft && value.length) {
        remove(value.length - 1);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const parts = e.target.value.split(',');
      setOpen(true);
      setActiveIndex(-1);
      if (parts.length > 1) {
        add(parts.slice(0, -1));
        setDraft(parts[parts.length - 1]);
      } else {
        setDraft(e.target.value);
        if (error) setError(null);
      }
    };

    return (
      <div
        ref={ref}
        data-slot="tag-editor"
        className={cn('w-full', className)}
        {...props}
      >
        {label && (
          <label
            htmlFor={inputId}
            className="text-foreground mb-1.5 block text-sm font-medium"
          >
            {label}
          </label>
        )}
        <div
          ref={(node) => {
            containerRef.current = node;
            anchorRef.current = node;
          }}
          data-slot="tag-editor-field"
          aria-busy={pending || undefined}
          className={cn(
            containerVariants({ size, hasError: !!error }),
            disabled && 'cursor-not-allowed opacity-50',
            readOnly && 'focus-within:ring-0'
          )}
        >
          {value.length > 0 && (
            <ul
              aria-label={label ?? labels.input}
              className="flex max-w-full flex-wrap items-center gap-1.5"
            >
              {value.map((tag, index) => (
                <li
                  key={tag}
                  data-slot="tag-editor-tag"
                  className="bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100 inline-flex max-w-full items-center gap-1 rounded-full py-0.5 ps-2.5 pe-1 text-sm"
                >
                  <span className="truncate">{tag}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      aria-label={labels.remove(tag)}
                      disabled={!interactive}
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(index);
                      }}
                      className="hover:bg-primary-200 dark:hover:bg-primary-800 focus-visible:ring-ring rounded-full p-0.5 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
                    >
                      <X aria-hidden="true" className="h-3 w-3" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!readOnly && (
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              role="combobox"
              aria-label={label ? undefined : labels.input}
              aria-expanded={isOpen}
              aria-controls={suggestions ? listId : undefined}
              aria-autocomplete="list"
              aria-activedescendant={
                isOpen && activeIndex >= 0
                  ? `${listId}-${activeIndex}`
                  : undefined
              }
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              autoComplete="off"
              value={draft}
              placeholder={atMax ? undefined : labels.placeholder}
              disabled={disabled}
              readOnly={pending || atMax}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                setOpen(false);
                if (draft.trim()) add([draft], false);
              }}
              className="placeholder:text-muted-foreground text-foreground min-w-24 flex-1 bg-transparent py-0.5 outline-none disabled:cursor-not-allowed"
            />
          )}
          {pending && (
            <span role="status" className="inline-flex">
              <Loader2
                aria-hidden="true"
                className="text-muted-foreground h-4 w-4 animate-spin motion-reduce:animate-none"
              />
              <span className="sr-only">{labels.saving}</span>
            </span>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            role="alert"
            data-slot="tag-editor-error"
            className="text-destructive mt-1 text-sm"
          >
            {error}
          </p>
        )}
        {isOpen &&
          createPortal(
            <div
              ref={floatingRef}
              style={style}
              id={listId}
              role="listbox"
              aria-label={labels.suggestions}
              data-slot="tag-editor-suggestions"
              className="border-border bg-card text-card-foreground overflow-auto rounded-md border py-1 shadow-lg"
            >
              {matches.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  tabIndex={-1}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add([s])}
                  className={cn(
                    'block w-full px-3 py-2 text-start text-sm',
                    i === activeIndex ? 'bg-muted' : 'hover:bg-muted'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>,
            document.body
          )}
      </div>
    );
  }
);

TagEditor.displayName = 'TagEditor';
