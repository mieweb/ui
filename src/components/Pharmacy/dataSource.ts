import type {
  Pharmacy,
  PharmacyCandidate,
  PharmacySearchParams,
  PreferredPharmacyChoice,
} from './pharmacy';

/** The patient's address, used to prefill the search filters. */
export interface PatientLocation {
  country?: string;
  state?: string;
  city?: string;
  /** Postal code. The search uses the first 5 characters. */
  postal?: string;
}

/** Saves a pharmacy as the patient's preferred local or mail-order pharmacy. */
export interface SetPreferredPharmacyRequest extends PreferredPharmacyChoice {
  patId: string;
}

/**
 * How the connected pharmacy components reach the host's data. The library
 * never knows URLs or transport; each host implements these functions over
 * its own API. Reject a promise to report a failure.
 *
 * The connected layer debounces, aborts superseded calls through `signal`
 * and ignores late results, so implementations may ignore `signal`.
 */
export interface PharmacyDataSource {
  /**
   * Up to 5 pharmacies for the patient's short list, ordered by rank then
   * recency. Include `overridePharmId` first with `preferred: 2` when given.
   */
  getCandidates(
    patId: string,
    overridePharmId: string | undefined,
    signal?: AbortSignal
  ): Promise<PharmacyCandidate[]>;
  /** The patient's address, or `null` when the patient is not found. */
  getPatientLocation(
    patId: string,
    signal?: AbortSignal
  ): Promise<PatientLocation | null>;
  /** Directory search. Only called with valid params. */
  searchPharmacies(
    params: PharmacySearchParams,
    signal?: AbortSignal
  ): Promise<Pharmacy[]>;
  /** One pharmacy, or `null` when the id is unknown. */
  getPharmacy(pharmId: string, signal?: AbortSignal): Promise<Pharmacy | null>;
  /** City names starting with `query`, within `state` when given. */
  searchCities(
    query: string,
    state: string,
    signal?: AbortSignal
  ): Promise<string[]>;
  /** Must enforce patient-level authorization on the server. */
  setPreferred(request: SetPreferredPharmacyRequest): Promise<void>;
}
