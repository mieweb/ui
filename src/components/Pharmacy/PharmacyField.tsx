'use client';

import * as React from 'react';
import {
  MessagesProvider,
  useMessages,
  type ComponentMessages,
} from '../../utils/messages';
import type { PharmacyDataSource } from './dataSource';
import { PharmacyInput, type PharmacyInputProps } from './PharmacyInput';
import { PharmacySearch, type PharmacyStateOption } from './PharmacySearch';
import {
  chooseDefaultCandidate,
  normalizePharmId,
  type PharmacyCandidate,
  type PharmacySearchFilters,
} from './pharmacy';
import { usePharmacyCandidates, usePharmacySearch } from './usePharmacyData';

export interface PharmacyFieldProps extends Omit<
  PharmacyInputProps,
  | 'candidates'
  | 'value'
  | 'loading'
  | 'error'
  | 'onSearchClick'
  | 'overridePharmId'
  | 'messages'
> {
  /** Where pharmacies come from. Implemented by the host. */
  source: PharmacyDataSource;
  patId: string;
  /**
   * A pharmacy to add to the list and select, e.g. the one already on the
   * prescription being edited. Replaced by whatever the search returns.
   */
  initialPharmId?: string;
  /** Called after each candidate list load (WebChart's `onReload`). */
  onCandidatesLoaded?: (candidates: readonly PharmacyCandidate[]) => void;
  /** Filters applied on top of the patient's address, e.g. saved prefs. */
  initialFilters?: Partial<PharmacySearchFilters>;
  onFiltersChange?: (filters: PharmacySearchFilters) => void;
  stateOptions?: readonly PharmacyStateOption[];
  /** Append NCPDP and NPI ids to search results. */
  showIds?: boolean;
  /** Hide "Make Preferred" when the user may not change the patient's pharmacy. */
  canMakePreferred?: boolean;
  messages?: ComponentMessages;
}

/**
 * `PharmacyInput` and `PharmacySearch` wired to a `PharmacyDataSource`: the
 * drop-in pharmacy field for a prescription form. Loads the patient's short
 * list, opens the search with the current selection, and reloads the list
 * with the returned pharmacy selected.
 */
export const PharmacyField = React.forwardRef<
  HTMLSelectElement,
  PharmacyFieldProps
>(function PharmacyField({ messages, ...props }, ref) {
  return (
    <MessagesProvider messages={messages}>
      {/* A new patient starts fresh: no override, selection or open search
          carries over from the previous one. */}
      <PharmacyFieldBody key={props.patId} ref={ref} {...props} />
    </MessagesProvider>
  );
});

const PharmacyFieldBody = React.forwardRef<
  HTMLSelectElement,
  Omit<PharmacyFieldProps, 'messages'>
>(function PharmacyFieldBody(
  {
    source,
    patId,
    initialPharmId,
    onCandidatesLoaded,
    initialFilters,
    onFiltersChange,
    stateOptions,
    showIds,
    canMakePreferred = true,
    onValueChange,
    ...inputProps
  },
  ref
) {
  const m = useMessages();
  const [overridePharmId, setOverridePharmId] = React.useState(
    normalizePharmId(initialPharmId)
  );
  const [searchOpen, setSearchOpen] = React.useState(false);
  const searchButtonRef = React.useRef<HTMLButtonElement>(null);

  const list = usePharmacyCandidates(source, patId, overridePharmId);

  // Apply the default once per completed load, during render so the select
  // is current before host effects (e.g. transmit options) read the DOM.
  // Keyed on the load, not the contents: choosing the same pharmacy again
  // reloads an identical list and must still select it.
  const [selectedPharmId, setSelectedPharmId] = React.useState('');
  const [appliedLoad, setAppliedLoad] = React.useState(list.loadCount);
  if (appliedLoad !== list.loadCount) {
    setAppliedLoad(list.loadCount);
    setSelectedPharmId(
      chooseDefaultCandidate(list.candidates, overridePharmId)
    );
  }
  const search = usePharmacySearch(source, patId, {
    open: searchOpen,
    prefillPharmId: selectedPharmId,
    initialFilters,
  });

  const onLoadedRef = React.useRef(onCandidatesLoaded);
  onLoadedRef.current = onCandidatesLoaded;
  const onValueChangeRef = React.useRef(onValueChange);
  onValueChangeRef.current = onValueChange;
  const selectedRef = React.useRef(selectedPharmId);
  selectedRef.current = selectedPharmId;
  const candidatesRef = React.useRef(list.candidates);
  candidatesRef.current = list.candidates;
  React.useEffect(() => {
    if (list.loadCount === 0) return;
    const pharmId = selectedRef.current;
    onValueChangeRef.current?.(
      pharmId,
      candidatesRef.current.find((c) => c.pharmId === pharmId) ?? null
    );
    onLoadedRef.current?.(candidatesRef.current);
  }, [list.loadCount]);

  const handleValueChange = React.useCallback<
    NonNullable<PharmacyInputProps['onValueChange']>
  >(
    (pharmId, pharmacy) => {
      setSelectedPharmId(pharmId);
      onValueChange?.(pharmId, pharmacy);
    },
    [onValueChange]
  );

  const handleChoose = (pharmId: string) => {
    const next = normalizePharmId(pharmId);
    if (next === overridePharmId) list.reload();
    else setOverridePharmId(next);
  };

  return (
    <>
      <PharmacyInput
        ref={ref}
        {...inputProps}
        candidates={list.candidates}
        loading={list.loading}
        error={
          list.error ? m('The pharmacy list could not be loaded.') : undefined
        }
        value={selectedPharmId}
        overridePharmId={overridePharmId}
        onValueChange={handleValueChange}
        onSearchClick={() => setSearchOpen(true)}
        searchButtonRef={searchButtonRef}
      />
      <PharmacySearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        returnFocusRef={searchButtonRef}
        {...search}
        onMakePreferred={canMakePreferred ? search.onMakePreferred : undefined}
        onChoose={handleChoose}
        onFiltersChange={onFiltersChange}
        stateOptions={stateOptions}
        showIds={showIds}
      />
    </>
  );
});
