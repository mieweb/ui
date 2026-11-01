'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { DateTime } from 'luxon';
import { cn } from '../../utils/cn';
import { inputVariants } from '../Input';

export type InlineEditType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'email'
  | 'url'
  | 'tel';

export interface InlineEditOption {
  value: string;
  label: string;
}

export interface InlineEditLabels {
  /** Accessible name of the display button. */
  edit: (label: string) => string;
  save: string;
  cancel: string;
  saving: string;
  /** Shown when the value is empty and no `placeholder` is given. */
  empty: string;
  /** Shown when `onSave` rejects without an `Error` message. */
  saveFailed: string;
}

export const defaultInlineEditLabels: InlineEditLabels = {
  edit: (label) => `Edit ${label}`,
  save: 'Save',
  cancel: 'Cancel',
  saving: 'Saving…',
  empty: 'Click to add',
  saveFailed: 'Could not save. Try again.',
};

const displayVariants = cva(
  [
    'group inline-flex w-full min-w-0 items-center gap-2 rounded-md text-start',
    'text-foreground transition-colors motion-reduce:transition-none',
    'hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
  ],
  {
    variants: {
      size: {
        sm: 'min-h-8 px-2 py-1 text-sm',
        md: 'min-h-10 px-3 py-2 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

export interface InlineEditProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'>,
    VariantProps<typeof displayVariants> {
  /** Current persisted value. Dates are ISO `yyyy-MM-dd`. */
  value: string;
  /** Persist the new value. Rejecting restores the previous value and shows an error. */
  onSave: (value: string) => void | Promise<void>;
  /** Field name, used for the accessible names of the controls. */
  label: string;
  /** Which control to render while editing. */
  type?: InlineEditType;
  /** Choices for `type="select"`. */
  options?: InlineEditOption[];
  /** Shown when the value is empty. */
  placeholder?: string;
  /** Return an error message to block the save. */
  validate?: (value: string) => string | undefined;
  /** Custom rendering of a non-empty value in display mode. */
  formatDisplay?: (value: string) => React.ReactNode;
  /** Render the value as plain text with no edit affordance. */
  readOnly?: boolean;
  disabled?: boolean;
  /** Save when focus leaves the editor (default). When false, blur cancels. */
  saveOnBlur?: boolean;
  /** Translatable strings. */
  labels?: Partial<InlineEditLabels>;
}

function defaultDisplay(
  value: string,
  type: InlineEditType,
  options?: InlineEditOption[]
): string {
  if (type === 'select') {
    return options?.find((o) => o.value === value)?.label ?? value;
  }
  if (type === 'date') {
    const date = DateTime.fromISO(value);
    return date.isValid ? date.toLocaleString(DateTime.DATE_MED) : value;
  }
  return value;
}

/**
 * Click-to-edit value: a button in display mode, the matching control in edit
 * mode. Enter saves (Cmd/Ctrl+Enter in a textarea), Escape cancels.
 */
export const InlineEdit = React.forwardRef<HTMLDivElement, InlineEditProps>(
  function InlineEdit(
    {
      value,
      onSave,
      label,
      type = 'text',
      options,
      placeholder,
      validate,
      formatDisplay,
      readOnly,
      disabled,
      saveOnBlur = true,
      size,
      labels: labelOverrides,
      className,
      'aria-describedby': describedBy,
      ...props
    },
    ref
  ) {
    const labels = { ...defaultInlineEditLabels, ...labelOverrides };
    const [editing, setEditing] = React.useState(false);
    const [draft, setDraft] = React.useState(value);
    const [pendingValue, setPendingValue] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const displayRef = React.useRef<HTMLButtonElement>(null);
    const fieldRef = React.useRef<
      HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement
    >(null);
    const refocusDisplay = React.useRef(false);
    const errorId = React.useId();
    const describedByIds =
      [describedBy, error && errorId].filter(Boolean).join(' ') || undefined;

    React.useImperativeHandle(ref, () => containerRef.current!);

    React.useEffect(() => {
      if (editing) fieldRef.current?.focus();
      else if (refocusDisplay.current) {
        refocusDisplay.current = false;
        displayRef.current?.focus();
      }
    }, [editing]);

    const startEditing = () => {
      if (disabled || readOnly || pendingValue !== null) return;
      setDraft(value);
      setError(null);
      setEditing(true);
    };

    const cancel = (restoreFocus: boolean) => {
      refocusDisplay.current = restoreFocus;
      setError(null);
      setEditing(false);
    };

    const commit = async (restoreFocus: boolean) => {
      const next = type === 'select' ? draft : draft.trim();
      if (next === value) return cancel(restoreFocus);
      const invalid = validate?.(next);
      if (invalid) {
        setError(invalid);
        return;
      }
      refocusDisplay.current = restoreFocus;
      setError(null);
      setEditing(false);
      setPendingValue(next);
      try {
        await onSave(next);
      } catch (e) {
        setError(
          e instanceof Error && e.message ? e.message : labels.saveFailed
        );
      } finally {
        setPendingValue(null);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel(true);
      } else if (
        e.key === 'Enter' &&
        (type !== 'textarea' || e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault();
        void commit(true);
      }
    };

    const handleBlur = (e: React.FocusEvent) => {
      if (containerRef.current?.contains(e.relatedTarget as Node | null)) {
        return;
      }
      if (saveOnBlur) void commit(false);
      else cancel(false);
    };

    const shown = pendingValue ?? value;
    const isEmpty = shown.trim() === '';
    const displayContent = isEmpty ? (
      <span className="text-muted-foreground italic">
        {placeholder ?? labels.empty}
      </span>
    ) : (
      (formatDisplay?.(shown) ?? (
        <span className="break-words whitespace-pre-wrap">
          {defaultDisplay(shown, type, options)}
        </span>
      ))
    );

    const errorNode = error && (
      <p
        id={errorId}
        role="alert"
        data-slot="inline-edit-error"
        className="text-destructive-700 dark:text-destructive-400 mt-1 text-sm"
      >
        {error}
      </p>
    );

    if (readOnly) {
      return (
        <div
          ref={containerRef}
          data-slot="inline-edit"
          data-state="read-only"
          aria-describedby={describedBy}
          className={cn(
            displayVariants({ size }),
            'hover:bg-transparent',
            className
          )}
          {...props}
        >
          {displayContent}
        </div>
      );
    }

    if (!editing) {
      return (
        <div
          ref={containerRef}
          data-slot="inline-edit"
          data-state="display"
          className={cn('min-w-0', className)}
          {...props}
        >
          <button
            ref={displayRef}
            type="button"
            data-slot="inline-edit-display"
            aria-label={labels.edit(label)}
            aria-describedby={describedByIds}
            aria-busy={pendingValue !== null || undefined}
            disabled={disabled}
            onClick={startEditing}
            className={displayVariants({ size })}
          >
            <span className="min-w-0 flex-1">{displayContent}</span>
            {pendingValue !== null ? (
              <span role="status" className="inline-flex items-center">
                <Loader2
                  aria-hidden="true"
                  className="text-muted-foreground h-4 w-4 animate-spin motion-reduce:animate-none"
                />
                <span className="sr-only">{labels.saving}</span>
              </span>
            ) : (
              <Pencil
                aria-hidden="true"
                className="text-muted-foreground h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
              />
            )}
          </button>
          {errorNode}
        </div>
      );
    }

    const fieldProps = {
      ref: fieldRef,
      'aria-label': label,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': describedByIds,
      'data-slot': 'inline-edit-field',
      value: draft,
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      ) => setDraft(e.target.value),
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
      className: cn(
        inputVariants({ size: size === 'sm' ? 'sm' : 'md', hasError: !!error })
      ),
    };

    return (
      <div
        ref={containerRef}
        data-slot="inline-edit"
        data-state="editing"
        className={cn('min-w-0', className)}
        {...props}
      >
        <div className="flex items-start gap-1">
          {type === 'textarea' ? (
            <textarea
              {...fieldProps}
              rows={3}
              placeholder={placeholder}
              className={cn(fieldProps.className, 'h-auto min-h-20')}
            />
          ) : type === 'select' ? (
            <select {...fieldProps}>
              {!options?.some((o) => o.value === draft) && (
                <option value={draft}>{placeholder ?? ''}</option>
              )}
              {options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input {...fieldProps} type={type} placeholder={placeholder} />
          )}
          <button
            type="button"
            aria-label={labels.save}
            title={labels.save}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => void commit(true)}
            onBlur={handleBlur}
            className="text-success hover:bg-muted focus-visible:ring-ring mt-1 rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
          >
            <Check aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={labels.cancel}
            title={labels.cancel}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => cancel(true)}
            onBlur={handleBlur}
            className="text-muted-foreground hover:bg-muted focus-visible:ring-ring mt-1 rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        {errorNode}
      </div>
    );
  }
);

InlineEdit.displayName = 'InlineEdit';
