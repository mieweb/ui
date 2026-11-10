'use client';

import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import {
  MessagesProvider,
  useMessages,
  type ComponentMessages,
} from '../../utils/messages';
import { Button } from '../Button';
import { SearchIcon } from '../Icons';
import { inputVariants } from '../Input';
import { Label } from '../Label';
import {
  candidateLabel,
  chooseDefaultCandidate,
  NO_PHARMACY,
  normalizePharmId,
  serviceLevelFlags,
  type PharmacyCandidate,
} from './pharmacy';

export interface PharmacyInputProps
  extends
    Omit<
      React.SelectHTMLAttributes<HTMLSelectElement>,
      'value' | 'defaultValue' | 'size' | 'children'
    >,
    Pick<VariantProps<typeof inputVariants>, 'size'> {
  /** The patient's short list, already ordered (preferred, then most recent). */
  candidates: readonly PharmacyCandidate[];
  /**
   * Selected `pharmId` (controlled). `""` or the placeholder value selects
   * the placeholder. Omit to let the input apply the default-selection rule
   * whenever the list's contents (ids and ranks) or `overridePharmId` change.
   * A new array with the same contents keeps the user's choice.
   */
  value?: string;
  /**
   * Called when the selection changes, with the chosen candidate. When
   * uncontrolled, also called each time the default selection is applied
   * (on mount and whenever the list's contents change).
   */
  onValueChange?: (pharmId: string, pharmacy: PharmacyCandidate | null) => void;
  /** Opens the pharmacy search. The button is disabled without it. */
  onSearchClick?: () => void;
  /**
   * Ref to the search button. Pass it to `PharmacySearch`'s
   * `returnFocusRef` so focus comes back here in every browser.
   */
  searchButtonRef?: React.Ref<HTMLButtonElement>;
  /**
   * The `pharmId` most recently returned by the search. Written to the
   * hidden field and used by the default-selection rule.
   */
  overridePharmId?: string;
  /** Shows a loading placeholder and marks the field busy. */
  loading?: boolean;
  /** Error message shown under the field. */
  error?: string;
  /** Visible label. Defaults to "Pharmacy". */
  label?: string;
  /** Hide the label visually but keep it for screen readers. */
  hideLabel?: boolean;
  /** Hidden field name for `overridePharmId`. Default `pharm_id`. */
  hiddenName?: string;
  /** Placeholder option value. Default `"0"`, as WebChart forms expect. */
  placeholderValue?: string;
  /** Translate built-in labels. */
  messages?: ComponentMessages;
}

/** Identifies what the default selection depends on, not the array object. */
function listKey(
  candidates: readonly PharmacyCandidate[],
  overridePharmId: string | undefined
): string {
  return `${candidates.map((c) => `${c.pharmId}:${c.preferred}`).join('|')}#${normalizePharmId(overridePharmId)}`;
}

/** Attributes WebChart's `transmitOptionSet` reads, plus `data-*` twins. */
function optionAttributes(pharmacy: PharmacyCandidate): Record<string, string> {
  const newrx = serviceLevelFlags(pharmacy).newRx ? '1' : '0';
  return {
    ncpdpid: pharmacy.ncpdpid,
    npi: pharmacy.npi,
    newrx,
    'data-ncpdpid': pharmacy.ncpdpid,
    'data-npi': pharmacy.npi,
    'data-newrx': newrx,
  };
}

const PharmacyInputField = React.forwardRef<
  HTMLSelectElement,
  Omit<PharmacyInputProps, 'messages'>
>(
  (
    {
      candidates,
      value,
      onValueChange,
      onChange,
      onSearchClick,
      searchButtonRef,
      overridePharmId,
      loading = false,
      error,
      label,
      hideLabel = false,
      name = 'pharmacy',
      hiddenName = 'pharm_id',
      placeholderValue = NO_PHARMACY,
      size,
      id,
      disabled,
      className,
      ...selectProps
    },
    ref
  ) => {
    const m = useMessages();
    const generatedId = React.useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(() =>
      chooseDefaultCandidate(candidates, overridePharmId)
    );

    // Uncontrolled: re-apply the default selection during render when the
    // list's contents change, so the DOM is current before any parent effect
    // reads it. Comparing contents, not identity, keeps the user's choice when
    // a host re-renders with a freshly mapped array.
    const key = listKey(candidates, overridePharmId);
    const [appliedKey, setAppliedKey] = React.useState(key);
    if (!isControlled && appliedKey !== key) {
      setAppliedKey(key);
      setInternalValue(chooseDefaultCandidate(candidates, overridePharmId));
    }

    // Report each applied default (on mount and after every change).
    const reportedKey = React.useRef<string | null>(null);
    React.useEffect(() => {
      if (isControlled || reportedKey.current === key) return;
      reportedKey.current = key;
      onValueChange?.(
        internalValue,
        candidates.find((c) => c.pharmId === internalValue) ?? null
      );
    }, [key, candidates, internalValue, isControlled, onValueChange]);

    const selected = normalizePharmId(isControlled ? value : internalValue);
    const selectValue = candidates.some((c) => c.pharmId === selected)
      ? selected
      : placeholderValue;

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const next = normalizePharmId(
        event.target.value === placeholderValue ? '' : event.target.value
      );
      if (!isControlled) setInternalValue(next);
      onChange?.(event);
      onValueChange?.(next, candidates.find((c) => c.pharmId === next) ?? null);
    };

    return (
      <div
        data-slot="pharmacy-input"
        className={cn('flex w-full flex-col gap-1.5', className)}
      >
        <Label htmlFor={selectId} className={cn(hideLabel && 'sr-only')}>
          {label ?? m('Pharmacy')}
        </Label>
        <div data-slot="pharmacy-input-group" className="flex w-full">
          <select
            ref={ref}
            id={selectId}
            name={name}
            value={selectValue}
            onChange={handleChange}
            disabled={disabled}
            aria-busy={loading || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            data-slot="pharmacy-input-select"
            className={cn(
              inputVariants({ size, hasError: !!error }),
              'min-w-0 flex-1 rounded-e-none'
            )}
            {...selectProps}
          >
            <option value={placeholderValue}>
              {loading ? m('Loading pharmacies…') : m('Choose Pharmacy...')}
            </option>
            {candidates.map((candidate) => (
              <option
                key={candidate.pharmId}
                value={candidate.pharmId}
                {...optionAttributes(candidate)}
              >
                {candidateLabel(candidate)}
              </option>
            ))}
          </select>
          <Button
            ref={searchButtonRef}
            type="button"
            variant="secondary"
            size={size === 'sm' ? 'icon-sm' : 'icon'}
            data-slot="pharmacy-input-search"
            aria-label={m('Search pharmacies')}
            onClick={onSearchClick}
            disabled={disabled || !onSearchClick}
            className={cn(
              'shrink-0 rounded-s-none',
              size === 'lg' && 'h-12 w-12'
            )}
          >
            <SearchIcon size={16} aria-hidden="true" />
          </Button>
        </div>
        <input
          type="hidden"
          name={hiddenName}
          value={normalizePharmId(overridePharmId)}
        />
        {error && (
          <p id={errorId} role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </div>
    );
  }
);
PharmacyInputField.displayName = 'PharmacyInputField';

/**
 * The patient's pharmacy as a form field: a native select of likely
 * pharmacies (preferred first, then recently used) and a button that opens
 * the pharmacy search. Data arrives as props; pair it with
 * `PharmacySearch`, or use `PharmacyField` to wire both to a data source.
 */
const PharmacyInput = React.forwardRef<HTMLSelectElement, PharmacyInputProps>(
  ({ messages, ...props }, ref) => (
    <MessagesProvider messages={messages}>
      <PharmacyInputField ref={ref} {...props} />
    </MessagesProvider>
  )
);
PharmacyInput.displayName = 'PharmacyInput';

export { PharmacyInput };
