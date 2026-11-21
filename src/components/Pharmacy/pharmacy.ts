/**
 * Pharmacy domain rules for e-prescribing. One module owns every rule the
 * pharmacy components share, so the input, the search modal and the info
 * panel cannot disagree about what a `pharmId` means or how a pharmacy is
 * classified.
 *
 * Mirrors WebChart's `pharmacyItemClass` / `PharmacyGetIcon` / `setPrefPharm`
 * behavior, with the known defects fixed (see MAINTAINERS.md).
 */

import { formatPhoneNumber } from '../../utils/phone';
import type { MessageTranslator } from '../../utils/messages';

// =============================================================================
// Records
// =============================================================================

/** A pharmacy from the national directory or the site's custom list. */
export interface Pharmacy {
  /**
   * Primary identifier. The NCPDP ID for SureScripts and custom pharmacies;
   * `"N" + npi` for NPI-only (fax) pharmacies.
   */
  pharmId: string;
  /** SureScripts / NCPDP ID. Empty for NPI-only pharmacies. */
  ncpdpid: string;
  /** National Provider Identifier. Empty for custom pharmacies. */
  npi: string;
  storeName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  /** Digits only. */
  phone: string;
  /** Digits only. */
  fax: string;
  /** `ServiceLevel` bitmask. */
  serviceLevel: number;
  /** Mail-order pharmacy (`mailin = 1`). */
  mailOrder: boolean;
}

/**
 * Candidate rank. `1` = the patient's preferred pharmacy; `2` = the override
 * just returned by the search; `0` = recently used.
 */
export type CandidateRank = 0 | 1 | 2;

/** A pharmacy offered in the patient's short list. */
export interface PharmacyCandidate extends Pharmacy {
  preferred: CandidateRank;
  /** Days since last use. Informational; the host orders the list. */
  elapsed?: number;
}

/** `service_level` bits. */
export const ServiceLevel = {
  NewRx: 1,
  RefillRequest: 2,
  ChangeRequest: 4,
  RxFill: 8,
  Cancel: 16,
  MedicationHistory: 32,
  Eligibility: 64,
  Epcs: 2048,
} as const;

/** `user_patients.role_id` for a preferred pharmacy. */
export const PreferredPharmacyRole = {
  Local: 5,
  MailOrder: 6,
} as const;
export type PreferredPharmacyRoleId =
  (typeof PreferredPharmacyRole)[keyof typeof PreferredPharmacyRole];

/** The input's placeholder value. `"0"` and `""` both mean "no pharmacy". */
export const NO_PHARMACY = '0';

/** Treats the legacy placeholder `"0"` (and whitespace) as no pharmacy. */
export function normalizePharmId(pharmId: string | null | undefined): string {
  const trimmed = (pharmId ?? '').trim();
  return trimmed === NO_PHARMACY ? '' : trimmed;
}

// =============================================================================
// Identifiers
// =============================================================================

export type PharmacyIdType = 'ncpdp' | 'npi';

/**
 * Splits a `pharmId` into the `(id, idType)` pair `user_patients` stores.
 * Returns `null` when there is no pharmacy.
 */
export function parsePharmId(
  pharmId: string
): { id: string; idType: PharmacyIdType } | null {
  const normalized = normalizePharmId(pharmId);
  if (normalized.startsWith('N')) {
    const id = normalized.slice(1);
    return id ? { id, idType: 'npi' } : null;
  }
  return normalized ? { id: normalized, idType: 'ncpdp' } : null;
}

// =============================================================================
// Classification
// =============================================================================

export interface PharmacyServiceFlags {
  newRx: boolean;
  refillRequest: boolean;
  epcs: boolean;
}

export function serviceLevelFlags(
  pharmacy: Pick<Pharmacy, 'serviceLevel'>
): PharmacyServiceFlags {
  const level = pharmacy.serviceLevel;
  return {
    newRx: (level & ServiceLevel.NewRx) !== 0,
    refillRequest: (level & ServiceLevel.RefillRequest) !== 0,
    epcs: (level & ServiceLevel.Epcs) !== 0,
  };
}

/**
 * - `electronic`: in the SureScripts directory and accepts NewRx
 * - `fax`: NPI-only, reachable by fax
 * - `none`: neither (print only, or no NewRx and no NPI)
 */
export type PharmacyKind = 'electronic' | 'fax' | 'none';

export interface PharmacyClassification {
  kind: PharmacyKind;
  /** Accepts electronic prescriptions for controlled substances. */
  epcs: boolean;
  mailOrder: boolean;
}

export function classifyPharmacy(
  pharmacy: Pick<Pharmacy, 'ncpdpid' | 'npi' | 'serviceLevel' | 'mailOrder'>
): PharmacyClassification {
  const { newRx, epcs } = serviceLevelFlags(pharmacy);
  if (pharmacy.ncpdpid && newRx) {
    return { kind: 'electronic', epcs, mailOrder: pharmacy.mailOrder };
  }
  if (pharmacy.npi) {
    return { kind: 'fax', epcs: false, mailOrder: pharmacy.mailOrder };
  }
  return { kind: 'none', epcs: false, mailOrder: false };
}

/**
 * Text alternative for the type icon, or `null` when no icon is shown
 * (local fax-only and unclassified pharmacies).
 */
export function pharmacyTypeLabel(
  classification: PharmacyClassification,
  m: MessageTranslator
): string | null {
  const { kind, epcs, mailOrder } = classification;
  if (kind === 'electronic') {
    if (mailOrder) {
      return epcs
        ? m('Mail order, e-prescribing + EPCS')
        : m('Mail order, e-prescribing');
    }
    return epcs ? m('E-prescribing + EPCS') : m('E-prescribing');
  }
  if (kind === 'fax' && mailOrder) return m('Mail order');
  return null;
}

/** Which preferred slot a pharmacy fills. */
export function preferredRoleId(
  pharmacy: Pick<Pharmacy, 'mailOrder'>
): PreferredPharmacyRoleId {
  return pharmacy.mailOrder
    ? PreferredPharmacyRole.MailOrder
    : PreferredPharmacyRole.Local;
}

/** What "Make Preferred" saves for a pharmacy. */
export interface PreferredPharmacyChoice {
  pharmId: string;
  /** NCPDP ID, or the NPI without the `N` prefix. */
  id: string;
  idType: PharmacyIdType;
  /** 5 = local, 6 = mail order. Replaces the patient's pharmacy in that slot. */
  roleId: PreferredPharmacyRoleId;
}

/** `null` when the pharmacy has no usable id, so nothing is cleared by mistake. */
export function preferredPharmacyChoice(
  pharmacy: Pick<Pharmacy, 'pharmId' | 'mailOrder'>
): PreferredPharmacyChoice | null {
  const parsed = parsePharmId(pharmacy.pharmId);
  return parsed
    ? {
        pharmId: pharmacy.pharmId,
        ...parsed,
        roleId: preferredRoleId(pharmacy),
      }
    : null;
}

// =============================================================================
// Candidate list
// =============================================================================

/**
 * Chooses the candidate selected by default: the only candidate; else the
 * override returned by the search; else the first preferred pharmacy; else,
 * when no override was requested, the most recently used one (the first
 * row). Returns `""` to leave the placeholder selected.
 *
 * Unlike WebChart, at most one candidate is chosen even when the patient has
 * both a local and a mail-order preferred pharmacy.
 */
export function chooseDefaultCandidate(
  candidates: readonly PharmacyCandidate[],
  overridePharmId?: string
): string {
  if (candidates.length === 1) return candidates[0].pharmId;
  const override = candidates.find((c) => c.preferred === 2);
  if (override) return override.pharmId;
  const preferred = candidates.find((c) => c.preferred === 1);
  if (preferred) return preferred.pharmId;
  if (!normalizePharmId(overridePharmId) && candidates.length > 0) {
    return candidates[0].pharmId;
  }
  return '';
}

// =============================================================================
// Search
// =============================================================================

export type PharmacySearchMethod = 'postal' | 'statecity' | 'phone' | 'fax';

/** Filter state of the search modal. */
export interface PharmacySearchFilters {
  method: PharmacySearchMethod;
  postal: string;
  state: string;
  city: string;
  phone: string;
  fax: string;
  /** Only pharmacies in the SureScripts directory. */
  excludeNpi: boolean;
  mailOnly: boolean;
}

/** Request for `PharmacyDataSource.searchPharmacies`. Empty fields are omitted. */
export interface PharmacySearchParams {
  /** Typed pharmacy name. */
  query?: string;
  zip?: string;
  state?: string;
  city?: string;
  /** Digits only, at least 6. */
  phone?: string;
  /** Digits only, at least 6. */
  fax?: string;
  excludeNpi: boolean;
  mailOnly: boolean;
}

export const DEFAULT_SEARCH_FILTERS: Readonly<PharmacySearchFilters> = {
  method: 'postal',
  postal: '',
  state: '',
  city: '',
  phone: '',
  fax: '',
  excludeNpi: true,
  mailOnly: false,
};

/** Minimum phone/fax digits the directory search accepts. */
export const MIN_NUMBER_DIGITS = 6;

export type PharmacySearchReadiness =
  | { status: 'ready'; params: PharmacySearchParams }
  /** Nothing to search for yet (no name typed). */
  | { status: 'incomplete' }
  /** The phone or fax criterion has fewer than 6 digits. */
  | { status: 'invalid'; field: 'phone' | 'fax' };

const digitsOnly = (value: string) => value.replace(/\D/g, '');

/**
 * Builds the search request from the filters and the typed name. Phone and
 * fax searches run without a name once they have 6 digits (spaces and dashes
 * allowed); postal and state/city searches wait for a name.
 */
export function buildSearchParams(
  filters: PharmacySearchFilters,
  query: string
): PharmacySearchReadiness {
  const params: PharmacySearchParams = {
    excludeNpi: filters.excludeNpi,
    mailOnly: filters.mailOnly,
  };
  const name = query.trim();
  if (name) params.query = name;

  switch (filters.method) {
    case 'phone':
    case 'fax': {
      const field = filters.method;
      const digits = digitsOnly(filters[field]);
      if (digits.length < MIN_NUMBER_DIGITS) {
        return { status: 'invalid', field };
      }
      params[field] = digits;
      return { status: 'ready', params };
    }
    case 'postal': {
      const zip = filters.postal.trim().slice(0, 5);
      if (zip) params.zip = zip;
      break;
    }
    case 'statecity': {
      const state = filters.state.trim();
      const city = filters.city.trim();
      if (state) params.state = state;
      if (city) params.city = city;
      break;
    }
  }
  return name ? { status: 'ready', params } : { status: 'incomplete' };
}

/** Initial filters from the patient's address. Missing address → defaults. */
export function filtersFromLocation(
  location: { state?: string; city?: string; postal?: string } | null
): PharmacySearchFilters {
  return {
    ...DEFAULT_SEARCH_FILTERS,
    postal: (location?.postal ?? '').trim().slice(0, 5),
    state: location?.state ?? '',
    city: location?.city ?? '',
  };
}

// =============================================================================
// Display
// =============================================================================

/** SureScripts mail-order pharmacies list no walk-in address. */
export function hidesAddress(
  pharmacy: Pick<Pharmacy, 'mailOrder' | 'ncpdpid'>
): boolean {
  return pharmacy.mailOrder && pharmacy.ncpdpid !== '';
}

/**
 * One-line description of a search result:
 * `"{store} - {line1} {city} {state} {phone} f: {fax}"`.
 */
export function describePharmacy(
  pharmacy: Pharmacy,
  m: MessageTranslator,
  options: { showIds?: boolean } = {}
): string {
  const parts = [`${pharmacy.storeName} -`];
  if (!hidesAddress(pharmacy)) {
    parts.push(pharmacy.addressLine1, pharmacy.city, pharmacy.state);
  }
  parts.push(formatPhoneNumber(pharmacy.phone));
  if (pharmacy.fax) {
    parts.push(m('f: {fax}', { fax: formatPhoneNumber(pharmacy.fax) }));
  }
  if (options.showIds) {
    if (pharmacy.ncpdpid) {
      parts.push(m('NCPDPID: {id}', { id: pharmacy.ncpdpid }));
    }
    if (pharmacy.npi) parts.push(m('NPI: {id}', { id: pharmacy.npi }));
  }
  return parts.filter(Boolean).join(' ');
}

/** Candidate option label: `"{store} - {line1} {city}, {state}"`. */
export function candidateLabel(pharmacy: Pharmacy): string {
  const place = [pharmacy.city, pharmacy.state].filter(Boolean).join(', ');
  return [`${pharmacy.storeName} -`, pharmacy.addressLine1, place]
    .filter(Boolean)
    .join(' ');
}
