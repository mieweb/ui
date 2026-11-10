'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  MessagesProvider,
  useMessages,
  type ComponentMessages,
} from '../../utils/messages';
import { Autocomplete } from '../Autocomplete';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { SaveIcon } from '../Icons';
import { Input, inputVariants } from '../Input';
import { Label } from '../Label';
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '../Modal';
import { Radio, RadioGroup } from '../Radio';
import { PharmacyHelp } from './PharmacyHelp';
import { PharmacyInfo } from './PharmacyInfo';
import { PharmacyTypeIcon } from './PharmacyTypeIcon';
import {
  buildSearchParams,
  DEFAULT_SEARCH_FILTERS,
  describePharmacy,
  preferredPharmacyChoice,
  type Pharmacy,
  type PharmacySearchFilters,
  type PharmacySearchMethod,
  type PharmacySearchParams,
  type PreferredPharmacyChoice,
} from './pharmacy';

export interface PharmacyStateOption {
  value: string;
  label: string;
}

export interface PharmacySearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Filters shown when the modal opens, usually from the patient's address.
   * Passing a new object resets the filters, so keep it stable.
   */
  initialFilters?: PharmacySearchFilters;
  /** Called after each filter change, so the host can remember them. */
  onFiltersChange?: (filters: PharmacySearchFilters) => void;
  /** States/provinces for the patient's country. A text field when omitted. */
  stateOptions?: readonly PharmacyStateOption[];
  /** City suggestions for the current state. */
  cityOptions?: readonly string[];
  /** Called as the user types a city. */
  onCityQuery?: (query: string, state: string) => void;
  /** Results for the latest `onSearchRequest`. */
  results: readonly Pharmacy[];
  resultsLoading?: boolean;
  /** A string is shown as is; an `Error` shows a generic message. */
  resultsError?: Error | string | null;
  /**
   * Called when the filters and typed name form a valid search, once per
   * distinct request. The host fetches and passes `results` back.
   */
  onSearchRequest: (params: PharmacySearchParams) => void;
  /** The pharmacy shown in the details panel. */
  selectedPharmacy: Pharmacy | null;
  selectedPharmacyLoading?: boolean;
  /** A result was picked (`pharmacy`) or free text cleared it (`null`). */
  onSelectPharmacy: (pharmacy: Pharmacy | null) => void;
  /**
   * The user finished: "Use Once", or "Make Preferred" after it saved.
   * `pharmId` is `""` when Use Once was pressed with nothing selected.
   * The modal closes itself afterwards.
   */
  onChoose: (pharmId: string) => void;
  /**
   * Saves the selection as the patient's preferred pharmacy. Reject to keep
   * the modal open with an error. Omit to hide "Make Preferred".
   */
  onMakePreferred?: (choice: PreferredPharmacyChoice) => void | Promise<void>;
  /** Append NCPDP and NPI ids to each result. */
  showIds?: boolean;
  /**
   * Element to focus when the modal closes, usually the button that opened
   * it. Without it, focus returns to whatever was focused on open, which is
   * `<body>` after a mouse click in Safari and in Firefox on macOS.
   */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  /** Translate built-in labels and help text. */
  messages?: ComponentMessages;
  className?: string;
}

const METHODS: readonly PharmacySearchMethod[] = [
  'postal',
  'statecity',
  'phone',
  'fax',
];

function useMethodText() {
  const m = useMessages();
  const numberHelp = (kind: string) =>
    m(
      "To search for a pharmacy by its {kind}, type in at least the first 6 digits (including area code) of the {kind} for the pharmacy you are searching for. The first 6 digits are required. You can type them all running together (ex: 260483) or include a space or dash (ex: 260 483 or 260-483). Once you have at least the first 6 digits of the pharmacy's {kind} you are searching for, hit your TAB key to advance and then any matching results will display.",
      { kind }
    );
  return {
    postal: {
      label: m('Postal Code'),
      help: m(
        'Searching by postal/zip code causes pharmacies to order by proximity with nearby pharmacies at the top of the list. This can produce more results than a state/city search, but may also take longer to run.'
      ),
    },
    statecity: {
      label: m('State/City'),
      help: m(
        'Searching by state will limit the pharmacies to those found in that state. Entering a city (optional) will further limit the results by displaying only pharmacies within that city.'
      ),
    },
    phone: { label: m('Phone'), help: numberHelp(m('phone number')) },
    fax: { label: m('Fax'), help: numberHelp(m('fax number')) },
  } satisfies Record<PharmacySearchMethod, { label: string; help: string }>;
}

function useLatest<T>(value: T) {
  const ref = React.useRef(value);
  ref.current = value;
  return ref;
}

function PharmacySearchBody({
  onOpenChange,
  initialFilters = DEFAULT_SEARCH_FILTERS,
  onFiltersChange,
  stateOptions,
  cityOptions = [],
  onCityQuery,
  results,
  resultsLoading,
  resultsError,
  onSearchRequest,
  selectedPharmacy,
  selectedPharmacyLoading,
  onSelectPharmacy,
  onChoose,
  onMakePreferred,
  showIds,
}: Omit<
  PharmacySearchProps,
  'open' | 'messages' | 'className' | 'returnFocusRef'
>) {
  const m = useMessages();
  const methodText = useMethodText();
  const idPrefix = React.useId();

  const [filters, setFilters] = React.useState(initialFilters);
  const [appliedInitial, setAppliedInitial] = React.useState(initialFilters);
  if (appliedInitial !== initialFilters) {
    setAppliedInitial(initialFilters);
    setFilters(initialFilters);
  }

  const [query, setQuery] = React.useState('');
  const [pickedLabel, setPickedLabel] = React.useState('');
  const [numberTouched, setNumberTouched] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveFailed, setSaveFailed] = React.useState(false);

  const updateFilters = (patch: Partial<PharmacySearchFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    onFiltersChange?.(next);
  };

  // A picked row's description is display text, not a new search.
  const searchText = query === pickedLabel ? '' : query;
  const readiness = buildSearchParams(filters, searchText);
  const numberField =
    filters.method === 'phone' || filters.method === 'fax'
      ? filters.method
      : null;
  const isNumberSearch = numberField !== null;

  const onSearchRequestRef = useLatest(onSearchRequest);
  const requestKey =
    readiness.status === 'ready' ? JSON.stringify(readiness.params) : '';
  React.useEffect(() => {
    if (requestKey) onSearchRequestRef.current(JSON.parse(requestKey));
  }, [requestKey, onSearchRequestRef]);

  const pick = (pharmacy: Pharmacy) => {
    const label = describePharmacy(pharmacy, m, { showIds });
    setQuery(label);
    setPickedLabel(label);
    onSelectPharmacy(pharmacy);
  };

  const clearFreeText = () => {
    if (query !== pickedLabel && selectedPharmacy) {
      setPickedLabel('');
      onSelectPharmacy(null);
    }
  };

  const finish = (pharmId: string) => {
    onChoose(pharmId);
    onOpenChange(false);
  };

  const choice = selectedPharmacy
    ? preferredPharmacyChoice(selectedPharmacy)
    : null;

  const makePreferred = async () => {
    if (!choice || !onMakePreferred) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      await onMakePreferred(choice);
    } catch {
      setSaving(false);
      setSaveFailed(true);
      return;
    }
    finish(choice.pharmId);
  };

  const validationId = `${idPrefix}-validation`;
  const validationMessage =
    readiness.status === 'invalid' && numberTouched
      ? readiness.field === 'phone'
        ? m('At least 6 digits are required for phone number search.')
        : m('At least 6 digits are required for fax number search.')
      : '';

  // Number results show in the Search list, which the number field does not
  // open. Announce the count and point to the list until it is opened.
  const [searchFocused, setSearchFocused] = React.useState(false);
  const numberResultsMessage =
    isNumberSearch &&
    readiness.status === 'ready' &&
    !resultsLoading &&
    !resultsError &&
    !searchFocused
      ? m(
          'Pharmacies found: {count}. Press Tab or select Search to see them.',
          { count: results.length }
        )
      : '';
  const statusMessage = validationMessage || numberResultsMessage;

  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const showNumberResults = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const advance =
      event.key === 'Enter' || (event.key === 'Tab' && !event.shiftKey);
    if (!advance || readiness.status !== 'ready') return;
    event.preventDefault();
    searchInputRef.current?.focus();
  };

  const resultsErrorText = resultsError
    ? typeof resultsError === 'string'
      ? resultsError
      : m('The pharmacy search failed. Try again.')
    : '';

  return (
    <>
      <ModalHeader>
        <ModalTitle>{m('Pharmacy Search')}</ModalTitle>
        <ModalClose aria-label={m('Close')} />
      </ModalHeader>
      <ModalBody className="flex flex-col gap-5">
        <RadioGroup
          name="pharm_search_method"
          label={m('Filter Method')}
          value={filters.method}
          onValueChange={(method) => {
            setNumberTouched(false);
            updateFilters({ method: method as PharmacySearchMethod });
          }}
          orientation="horizontal"
          // RadioGroup's horizontal row never wraps; four options overflow on phones.
          className="[&_[data-slot=radio-group-items]]:flex-wrap [&_[data-slot=radio-group-items]]:gap-y-2"
        >
          {METHODS.map((method) => (
            <span
              key={method}
              className="inline-flex items-center gap-1 whitespace-nowrap"
            >
              <Radio value={method} label={methodText[method].label} />
              <PharmacyHelp topic={methodText[method].label}>
                {methodText[method].help}
              </PharmacyHelp>
            </span>
          ))}
        </RadioGroup>

        <fieldset
          data-slot="pharmacy-search-criteria"
          className="flex flex-col gap-3"
        >
          <legend className="text-foreground mb-1.5 text-sm font-medium">
            {m('Filter Criteria')}
          </legend>
          {filters.method === 'postal' && (
            <Input
              name="postal"
              label={m('Postal code')}
              value={filters.postal}
              onChange={(e) => updateFilters({ postal: e.target.value })}
              autoComplete="postal-code"
              size="sm"
            />
          )}
          {filters.method === 'statecity' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <StateField
                id={`${idPrefix}-state`}
                value={filters.state}
                options={stateOptions}
                onChange={(state) => {
                  updateFilters({ state });
                  onCityQuery?.(filters.city, state);
                }}
              />
              <Autocomplete<string>
                label={m('City')}
                placeholder={m('Search for a city...')}
                items={[...cityOptions]}
                getItemKey={(city) => city}
                renderItem={(city) => city}
                value={filters.city}
                onValueChange={(city) => {
                  updateFilters({ city });
                  onCityQuery?.(city, filters.state);
                }}
                onSelect={(city) => updateFilters({ city })}
                clearOnSelect={false}
                size="sm"
                inputProps={{ name: 'city' }}
              />
            </div>
          )}
          {numberField && (
            <Input
              key={numberField}
              name={numberField}
              label={methodText[numberField].label}
              placeholder={
                numberField === 'phone' ? m('Phone number') : m('Fax number')
              }
              value={filters[numberField]}
              onChange={(e) => updateFilters({ [numberField]: e.target.value })}
              onBlur={() => setNumberTouched(true)}
              onKeyDown={showNumberResults}
              type="tel"
              inputMode="tel"
              // Phone digits keep LTR order in RTL layouts.
              dir="ltr"
              aria-describedby={statusMessage ? validationId : undefined}
              size="sm"
            />
          )}
        </fieldset>

        <fieldset
          data-slot="pharmacy-search-filters"
          className="flex flex-wrap gap-x-6 gap-y-2"
        >
          <legend className="text-foreground mb-1.5 text-sm font-medium">
            {m('Additional Filters')}
          </legend>
          <span className="inline-flex items-center gap-1">
            <Checkbox
              name="exclude_npi"
              label={m('Exclude NPI')}
              checked={filters.excludeNpi}
              onChange={(e) => updateFilters({ excludeNpi: e.target.checked })}
            />
            <PharmacyHelp topic={m('Exclude NPI')}>
              {m(
                'Checking this box limits the results to pharmacies in the SureScripts pharmacy directory. NPI data is a U.S. database of all pharmacies, but some do not have fax numbers available.'
              )}
            </PharmacyHelp>
          </span>
          <span className="inline-flex items-center gap-1">
            <Checkbox
              name="mail_only"
              label={m('Mail Only')}
              checked={filters.mailOnly}
              onChange={(e) => updateFilters({ mailOnly: e.target.checked })}
            />
            <PharmacyHelp topic={m('Mail Only')}>
              {m(
                'Checking this box limits the results to Mail-Order pharmacies.'
              )}
            </PharmacyHelp>
          </span>
        </fieldset>

        <div data-slot="pharmacy-search-field" className="flex flex-col gap-1">
          <Autocomplete<Pharmacy>
            label={m('Search')}
            placeholder={m('Pharmacy name')}
            items={readiness.status === 'ready' ? [...results] : []}
            getItemKey={(pharmacy) => pharmacy.pharmId}
            renderItem={(pharmacy) => (
              <span className="flex items-start gap-2">
                <span className="min-w-0 flex-1">
                  <bdi>{describePharmacy(pharmacy, m, { showIds })}</bdi>
                </span>
                <PharmacyTypeIcon pharmacy={pharmacy} className="mt-0.5" />
              </span>
            )}
            value={query}
            onValueChange={(next) => {
              setQuery(next);
              if (isNumberSearch) setNumberTouched(true);
            }}
            onSelect={pick}
            emptyMessage={
              readiness.status !== 'ready'
                ? null
                : resultsLoading
                  ? m('Searching…')
                  : resultsErrorText || m('No pharmacies found.')
            }
            minQueryLength={isNumberSearch ? 0 : 1}
            clearOnSelect={false}
            size="sm"
            inputRef={searchInputRef}
            inputProps={{
              name: 'pharmacy_search',
              onBlur: () => {
                setSearchFocused(false);
                clearFreeText();
                if (isNumberSearch) setNumberTouched(true);
              },
              // Capture phase: Autocomplete's own onFocus opens the list.
              onFocusCapture: () => setSearchFocused(true),
              'aria-describedby': validationMessage ? validationId : undefined,
              'aria-busy': resultsLoading || undefined,
            }}
          />
          <p
            id={validationId}
            role="status"
            aria-live="polite"
            className={cn(
              'text-sm',
              validationMessage ? 'text-destructive' : 'text-muted-foreground',
              !statusMessage && 'sr-only'
            )}
          >
            {statusMessage}
          </p>
        </div>

        <PharmacyInfo
          pharmacy={selectedPharmacy}
          loading={selectedPharmacyLoading}
        />
      </ModalBody>
      <ModalFooter className="flex-wrap">
        {saveFailed && (
          <p role="alert" className="text-destructive me-auto text-sm">
            {m('The preferred pharmacy could not be saved. Try again.')}
          </p>
        )}
        {onMakePreferred && (
          <Button
            type="button"
            variant="secondary"
            leftIcon={<SaveIcon size={16} aria-hidden="true" />}
            onClick={makePreferred}
            disabled={!choice}
            isLoading={saving}
            loadingText={m('Saving…')}
            data-slot="pharmacy-search-make-preferred"
          >
            {m('Make Preferred')}
          </Button>
        )}
        <Button
          type="button"
          onClick={() => finish(selectedPharmacy?.pharmId ?? '')}
          disabled={saving}
          data-slot="pharmacy-search-use-once"
        >
          {m('Use Once')}
        </Button>
      </ModalFooter>
    </>
  );
}

function StateField({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: string;
  options?: readonly PharmacyStateOption[];
  onChange: (state: string) => void;
}) {
  const m = useMessages();
  if (!options?.length) {
    return (
      <Input
        id={id}
        name="state"
        label={m('State')}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        autoComplete="address-level1"
        size="sm"
      />
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{m('State')}</Label>
      <select
        id={id}
        name="state"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputVariants({ size: 'sm' })}
      >
        <option value="">{m('Any state')}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Searches the pharmacy directory by postal code, state/city, phone or fax,
 * shows the chosen pharmacy's details, and returns it for one prescription
 * ("Use Once") or saves it as the patient's preferred pharmacy ("Make
 * Preferred"). Data arrives as props; use `PharmacyField` or
 * `usePharmacySearch` to wire it to a `PharmacyDataSource`.
 */
/**
 * Returns focus when the modal closes. `Modal` traps focus but does not
 * restore it. A layout effect runs before the trap's passive effect moves
 * focus into the dialog, so the fallback opener is still
 * `document.activeElement`.
 *
 * The ref is read a microtask after the closing commit: refs attached with
 * `useImperativeHandle` (such as `Button`'s) are detached while their owner
 * re-renders in the same commit and re-attached at its end.
 */
function useReturnFocus(
  open: boolean,
  returnFocusRef?: React.RefObject<HTMLElement | null>
) {
  React.useLayoutEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    return () => {
      globalThis.queueMicrotask(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps -- read at close on purpose: the button may re-render while the modal is open
        const target = returnFocusRef?.current ?? opener;
        if (target instanceof HTMLElement && target.isConnected) {
          target.focus();
        }
      });
    };
  }, [open, returnFocusRef]);
}

export function PharmacySearch({
  open,
  onOpenChange,
  messages,
  className,
  returnFocusRef,
  ...props
}: PharmacySearchProps) {
  useReturnFocus(open, returnFocusRef);
  return (
    <MessagesProvider messages={messages}>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        size="2xl"
        className={className}
      >
        <PharmacySearchBody onOpenChange={onOpenChange} {...props} />
      </Modal>
    </MessagesProvider>
  );
}
