/**
 * Patient history — the minimal longitudinal facts the health-surveillance
 * due engine needs: who the patient is (age, sex) and what has been done or
 * is in flight (orders with status, observations, procedures, immunizations),
 * plus problem-list context (conditions) and allergies for display/interop.
 *
 * All clinical entries are keyed by `CODETYPE|FULLCODE` — the same keys used
 * by programs.json order sets and the codify shards — so the due engine can
 * match history against a program's satisfying orders with plain string
 * equality.
 */

/** ISO date string (YYYY-MM-DD or full ISO timestamp). */
export type IsoDate = string;

export interface HistoryOrder {
  /** CODETYPE|FULLCODE, e.g. "Quest Order|3058" or "HCPCS|92551" */
  key: string;
  /** Display label (optional; the due list falls back to the key) */
  label?: string;
  status: 'completed' | 'pending';
  /** Completion date for completed orders; order date for pending ones */
  date: IsoDate;
  /** Ordering/performing provider display name (e.g. "Dr. Patel") */
  provider?: string;
  /** Requisition the order was bundled into — the document routing a batch
   * of encounter orders to a provider/referral (e.g. "REQ-2024-0117") */
  requisitionId?: string;
  /** Encounter (visit) the order was placed in (e.g. "ENC-2024-0117") */
  encounterId?: string;
}

export interface HistoryObservation {
  /** CODETYPE|FULLCODE, e.g. "LOINC|4548-4" (HbA1c) */
  key: string;
  label?: string;
  /** Display value with units, e.g. "7.2 %" or "38 ug/dL" */
  value?: string;
  date: IsoDate;
}

export interface HistoryProcedure {
  key: string;
  label?: string;
  date: IsoDate;
}

export interface HistoryImmunization {
  /** CODETYPE|FULLCODE, e.g. "CVX|88" */
  key: string;
  label?: string;
  date: IsoDate;
}

export interface HistoryCondition {
  key: string;
  label?: string;
  onset?: IsoDate;
}

export interface HistoryAllergy {
  /** Allergen key when coded (e.g. "RxNORM|7980"), else omit */
  key?: string;
  label: string;
  reaction?: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface HistoryMedication {
  key?: string;
  label: string;
  /** Sig / dose display, e.g. "10 mg daily" */
  detail?: string;
}

export interface PatientHistory {
  /** Age in years */
  age: number;
  sex: 'M' | 'F';
  /** Past + in-flight orders (completion drives the due engine) */
  orders: HistoryOrder[];
  observations?: HistoryObservation[];
  procedures?: HistoryProcedure[];
  immunizations?: HistoryImmunization[];
  conditions?: HistoryCondition[];
  allergies?: HistoryAllergy[];
  medications?: HistoryMedication[];
}
