import type {
  Medication,
  MedicationCode,
  MedicationStatus,
} from '../MedicationList/MedicationList';

/** Where an incoming medication history came from. */
export type MedHistorySourceKind =
  | 'pharmacy'
  | 'pbm'
  | 'hie'
  | 'external'
  | 'other';

/** Provenance of an incoming record, passed through to the change set. */
export interface MedHistorySource {
  /** Display label, e.g. "Brooklyn @ Gates" (NCPDP HistorySource). */
  label: string;
  kind?: MedHistorySourceKind;
  /** Host reference to the raw message, e.g. an `escript_messages` id. */
  messageRef?: string;
}

/** Known import warning codes; hosts may send their own codes too. */
export type ImportWarningCode =
  | 'ndc-missing'
  | 'ndc-unknown'
  | 'ndc-ambiguous'
  | 'substitution-invalid'
  | 'unit-unknown';

/** A problem the host found while importing a record. */
export interface ImportWarning {
  code: ImportWarningCode | (string & {});
  /** Host text; when omitted the component describes known codes. */
  message?: string;
}

/** Pharmacy identifiers in any combination. */
export interface PharmacyRef {
  /** NCPDP ID (7 digits, keep leading zeros). */
  ncpdpid?: string;
  /** National Provider Identifier (10 digits). */
  npi?: string;
  /** Store or business name. */
  name?: string;
}

/** Structured prescriber used for matching. */
export interface PrescriberRef {
  npi?: string;
  dea?: string;
  firstName?: string;
  lastName?: string;
}

/** A medication without a required reconciliation status. */
export type MedHistoryMedication = Omit<Medication, 'status'> & {
  status?: MedicationStatus;
};

/**
 * One medication in either source — incoming history or the chart.
 * Values arrive normalized by the host; missing values are `undefined`,
 * never `''`. Dates are ISO `yyyy-mm-dd`.
 */
export interface MedHistoryRecord {
  /** Unique within its list. */
  id: string;
  /** Prescription details in the shared `Medication` model. */
  medication: MedHistoryMedication;
  /**
   * Every known code, e.g. `{ system: 'NDC' }`, `{ system: 'RxNORM' }`,
   * `{ system: 'FDB' }` (RDB medid). Takes precedence over
   * `medication.code` for matching.
   */
  codes?: MedicationCode[];
  /** FDB `drug_id`; records sharing it are the same drug (brand ↔ generic). */
  drugId?: string;
  /** Last fill / dispensed date. */
  dispensedDate?: string;
  /** Refills remaining — not refills authorized. */
  refillsRemaining?: string;
  /**
   * Any pharmacy identifier: a pharmId (`"N"` + NPI for NPI-only
   * pharmacies), an NCPDP ID, an NPI, a name, or a {@link PharmacyRef}.
   * Falls back to `medication.pharmacyId`.
   */
  pharmacy?: string | PharmacyRef;
  /** Falls back to `medication.prescriber` text. */
  prescriber?: PrescriberRef;
  /** Incoming only: stable key for recognizing re-imported records. */
  sourceKey?: string;
  /** Incoming only: provenance. */
  source?: MedHistorySource;
  /** Incoming only: host import warnings, shown on the record. */
  warnings?: ImportWarning[];
}

/**
 * One dispense of an existing chart prescription (WebChart: an
 * `rxlist_refills` row). Values come from the incoming record as received.
 */
export interface MedHistoryFill {
  /** Last fill / dispensed date (ISO). */
  fillDate?: string;
  quantity?: string;
  quantityUnit?: string;
  daysSupply?: string;
  /** Refills remaining after this fill. */
  refillsRemaining?: string;
  /** NCPDP meaning: '0' substitution permitted, '1' dispense as written. */
  substitution?: '0' | '1';
  pharmacy?: string | PharmacyRef;
  prescriber?: PrescriberRef;
  /** Prescriber display text. */
  prescriberName?: string;
}

/** An incoming record added as a new chart medication. */
export interface MedHistoryAddChange {
  action: 'add';
  /** The incoming record as received. */
  incoming: MedHistoryRecord;
  /** Final values to write, including any edits. */
  medication: Medication;
  /** Names of `Medication` fields the reviewer changed. */
  editedFields: string[];
}

/** An incoming record recorded as a refill of a chart prescription. */
export interface MedHistoryFillChange {
  action: 'fill';
  incoming: MedHistoryRecord;
  /** The dispense to add; the chart prescription itself is unchanged. */
  fill: MedHistoryFill;
  /** Chart record the refill belongs to. */
  fillOf: MedHistoryRecord;
}

/** One accepted incoming record. */
export type MedHistoryChange = MedHistoryAddChange | MedHistoryFillChange;

/** Everything the reviewer confirmed, for the host to apply atomically. */
export interface MedHistoryChangeSet {
  changes: MedHistoryChange[];
  /** Incoming records the reviewer chose not to import. */
  skipped: MedHistoryRecord[];
  /** Incoming records left without a decision (not imported). */
  undecided: MedHistoryRecord[];
  /** Chart revision the review was based on, echoed from the prop. */
  chartRevision?: string;
}

/** An optional AI hint that two records may be the same medication. */
export interface MedHistoryAiSuggestion {
  incomingId: string;
  chartId: string;
  /** Host-localized explanation, e.g. "Possible match: spelling variation". */
  reason: string;
  /** 0–1, shown when provided. */
  confidence?: number;
}
