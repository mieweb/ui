'use client';

import * as React from 'react';
import type { PharmacyDataSource } from './dataSource';
import type { PharmacySearchProps } from './PharmacySearch';
import {
  filtersFromLocation,
  normalizePharmId,
  type Pharmacy,
  type PharmacyCandidate,
  type PharmacySearchFilters,
  type PharmacySearchParams,
} from './pharmacy';

/** Delay before a search request, so typing does not send one per key. */
export const PHARMACY_SEARCH_DEBOUNCE_MS = 250;
const CITY_DEBOUNCE_MS = 200;

const isAbort = (error: unknown) =>
  error instanceof globalThis.DOMException && error.name === 'AbortError';

/**
 * One in-flight request at a time: starting a new one cancels the pending
 * timer, aborts the previous call and drops its result even if the source
 * ignores the signal.
 */
function useLatestRequest() {
  const current = React.useRef<{
    controller?: AbortController;
    timer?: ReturnType<typeof setTimeout>;
  }>({});

  const cancel = React.useCallback(() => {
    clearTimeout(current.current.timer);
    current.current.controller?.abort();
    current.current = {};
  }, []);

  const run = React.useCallback(
    <T>(
      call: (signal: AbortSignal) => Promise<T>,
      onResult: (result: T) => void,
      onError: (error: unknown) => void,
      delayMs = 0
    ) => {
      cancel();
      const controller = new AbortController();
      const start = () => {
        call(controller.signal).then(
          (result) => {
            if (!controller.signal.aborted) onResult(result);
          },
          (error: unknown) => {
            if (!controller.signal.aborted && !isAbort(error)) onError(error);
          }
        );
      };
      current.current = {
        controller,
        timer: delayMs > 0 ? setTimeout(start, delayMs) : undefined,
      };
      if (delayMs <= 0) start();
    },
    [cancel]
  );

  React.useEffect(() => cancel, [cancel]);
  return React.useMemo(() => ({ run, cancel }), [run, cancel]);
}

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

const NO_CANDIDATES: readonly PharmacyCandidate[] = [];

export interface PharmacyCandidatesState {
  candidates: readonly PharmacyCandidate[];
  loading: boolean;
  error: Error | null;
  /** Increments after each successful load. */
  loadCount: number;
  /** Loads again, e.g. after an error or to show the same override again. */
  reload: () => void;
}

/**
 * Loads the patient's short list and reloads it when `patId` or
 * `overridePharmId` changes. The source is read on each call; replacing it
 * does not trigger a reload.
 */
export function usePharmacyCandidates(
  source: PharmacyDataSource,
  patId: string,
  overridePharmId?: string
): PharmacyCandidatesState {
  const sourceRef = React.useRef(source);
  sourceRef.current = source;
  const { run } = useLatestRequest();
  const [token, setToken] = React.useState(0);
  const [state, setState] = React.useState({
    candidates: NO_CANDIDATES,
    loading: true,
    error: null as Error | null,
    loadCount: 0,
  });
  const override = normalizePharmId(overridePharmId) || undefined;

  React.useEffect(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    run(
      (signal) => sourceRef.current.getCandidates(patId, override, signal),
      (candidates) =>
        setState((s) => ({
          candidates,
          loading: false,
          error: null,
          loadCount: s.loadCount + 1,
        })),
      (error) =>
        setState((s) => ({ ...s, loading: false, error: toError(error) }))
    );
  }, [patId, override, token, run]);

  const reload = React.useCallback(() => setToken((t) => t + 1), []);
  return { ...state, reload };
}

export interface UsePharmacySearchOptions {
  /** Load the patient's location and the prefill when this becomes true. */
  open: boolean;
  /** Pharmacy shown in the details panel on open. `"0"` and `""` mean none. */
  prefillPharmId?: string;
  /** Overrides applied on top of the patient's location, e.g. saved prefs. */
  initialFilters?: Partial<PharmacySearchFilters>;
}

export type PharmacySearchBindings = Pick<
  PharmacySearchProps,
  | 'initialFilters'
  | 'results'
  | 'resultsLoading'
  | 'resultsError'
  | 'onSearchRequest'
  | 'selectedPharmacy'
  | 'selectedPharmacyLoading'
  | 'onSelectPharmacy'
  | 'cityOptions'
  | 'onCityQuery'
  | 'onMakePreferred'
>;

const NO_RESULTS: readonly Pharmacy[] = [];
const NO_CITIES: readonly string[] = [];

/**
 * Everything `PharmacySearch` needs from a data source: patient location on
 * open, debounced searches that ignore late results, city suggestions,
 * the prefilled pharmacy, and saving the preferred pharmacy. Spread the
 * result onto `PharmacySearch`.
 */
export function usePharmacySearch(
  source: PharmacyDataSource,
  patId: string,
  {
    open,
    prefillPharmId,
    initialFilters: filterOverrides,
  }: UsePharmacySearchOptions
): PharmacySearchBindings {
  const sourceRef = React.useRef(source);
  sourceRef.current = source;
  const overridesRef = React.useRef(filterOverrides);
  overridesRef.current = filterOverrides;

  const search = useLatestRequest();
  const cities = useLatestRequest();
  const details = useLatestRequest();
  const location = useLatestRequest();

  const [initialFilters, setInitialFilters] =
    React.useState<PharmacySearchFilters>();
  const [results, setResults] = React.useState(NO_RESULTS);
  const [resultsLoading, setResultsLoading] = React.useState(false);
  const [resultsError, setResultsError] = React.useState<Error | null>(null);
  const [cityOptions, setCityOptions] = React.useState(NO_CITIES);
  const [selectedPharmacy, setSelectedPharmacy] =
    React.useState<Pharmacy | null>(null);
  const [selectedPharmacyLoading, setSelectedPharmacyLoading] =
    React.useState(false);

  const prefill = normalizePharmId(prefillPharmId);

  // Separate lifetimes: a late prefill or patient change must not cancel a
  // search already in flight, because PharmacySearch only re-requests when
  // its params change.
  React.useEffect(() => {
    if (!open) return;
    const withOverrides = (filters: PharmacySearchFilters) => ({
      ...filters,
      ...overridesRef.current,
    });
    setInitialFilters(withOverrides(filtersFromLocation(null)));
    location.run(
      (signal) => sourceRef.current.getPatientLocation(patId, signal),
      (patient) => {
        if (patient)
          setInitialFilters(withOverrides(filtersFromLocation(patient)));
      },
      () => {}
    );
    return location.cancel;
  }, [open, patId, location]);

  React.useEffect(() => {
    if (!open) return;
    setSelectedPharmacy(null);
    if (!prefill) return;
    setSelectedPharmacyLoading(true);
    details.run(
      (signal) => sourceRef.current.getPharmacy(prefill, signal),
      (pharmacy) => {
        setSelectedPharmacy(pharmacy);
        setSelectedPharmacyLoading(false);
      },
      () => setSelectedPharmacyLoading(false)
    );
    return () => {
      details.cancel();
      setSelectedPharmacyLoading(false);
    };
  }, [open, prefill, details]);

  React.useEffect(() => {
    if (!open) return;
    setResults(NO_RESULTS);
    setResultsError(null);
    return () => {
      search.cancel();
      cities.cancel();
      setResultsLoading(false);
    };
  }, [open, search, cities]);

  const onSearchRequest = React.useCallback(
    (params: PharmacySearchParams) => {
      setResultsLoading(true);
      setResultsError(null);
      search.run(
        (signal) => sourceRef.current.searchPharmacies(params, signal),
        (found) => {
          setResults(found);
          setResultsLoading(false);
        },
        (error) => {
          setResults(NO_RESULTS);
          setResultsError(toError(error));
          setResultsLoading(false);
        },
        PHARMACY_SEARCH_DEBOUNCE_MS
      );
    },
    [search]
  );

  const onSelectPharmacy = React.useCallback(
    (pharmacy: Pharmacy | null) => {
      details.cancel();
      setSelectedPharmacyLoading(false);
      setSelectedPharmacy(pharmacy);
    },
    [details]
  );

  const onCityQuery = React.useCallback(
    (query: string, state: string) => {
      if (!query.trim()) {
        cities.cancel();
        setCityOptions(NO_CITIES);
        return;
      }
      cities.run(
        (signal) => sourceRef.current.searchCities(query, state, signal),
        setCityOptions,
        () => setCityOptions(NO_CITIES),
        CITY_DEBOUNCE_MS
      );
    },
    [cities]
  );

  const onMakePreferred = React.useCallback<
    NonNullable<PharmacySearchProps['onMakePreferred']>
  >((choice) => sourceRef.current.setPreferred({ ...choice, patId }), [patId]);

  return {
    initialFilters,
    results,
    resultsLoading,
    resultsError,
    onSearchRequest,
    selectedPharmacy,
    selectedPharmacyLoading,
    onSelectPharmacy,
    cityOptions,
    onCityQuery,
    onMakePreferred,
  };
}
