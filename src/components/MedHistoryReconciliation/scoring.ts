/**
 * Standalone medication-history match scoring. Pure TypeScript — no React,
 * no DOM — so hosts can run it in a browser, a worker, or Node.
 *
 * Pipeline: normalize each record once → heuristic gates → field scores
 * (bounded Levenshtein for text) → weighted score against a threshold.
 * See MAINTAINERS.md for the rules and how to tune them.
 */

import type { MedicationCode } from '../MedicationList/MedicationList';
import { parseSig } from '../MedicationList/sig';
import {
  baseDoseForm,
  parseMedicationLabel,
} from '../MedicationList/medicationLabel';
import { parsePharmId } from '../Pharmacy/pharmacy';
import type { MedHistoryRecord, PharmacyRef } from './types';

// =============================================================================
// Public types
// =============================================================================

/** Fields that contribute to a match score. */
export type MatchField =
  | 'identity'
  | 'strengthForm'
  | 'sig'
  | 'date'
  | 'prescriber'
  | 'pharmacy'
  | 'quantity';

export type MatchWeights = Record<MatchField, number>;

export type FieldOutcome = 'agree' | 'partial' | 'differ' | 'missing';

/** Why a field scored as it did. The component translates these codes. */
export type MatchReasonCode =
  | 'same-product'
  | 'brand-generic'
  | 'same-name'
  | 'similar-name'
  | 'different-name'
  | 'same-strength-form'
  | 'different-strength'
  | 'different-form'
  | 'different-strength-form'
  | 'same-sig'
  | 'similar-sig'
  | 'different-sig'
  | 'same-date'
  | 'near-date'
  | 'distant-date'
  | 'same-prescriber'
  | 'similar-prescriber'
  | 'different-prescriber'
  | 'same-pharmacy'
  | 'similar-pharmacy'
  | 'different-pharmacy'
  | 'same-quantity'
  | 'same-quantity-unit'
  | 'different-quantity'
  | 'missing'
  | 'custom';

/** Why a pair was ruled out before field scoring. */
export type DismissReason =
  | 'different-drug'
  | 'supply-vs-drug'
  | 'name-length'
  | 'no-shared-prefix';

export interface FieldResult {
  field: MatchField;
  outcome: FieldOutcome;
  /** 0–1 when compared. */
  similarity?: number;
  weight: number;
  reason: MatchReasonCode;
}

export interface MatchScore {
  /** 0–1 weighted result over compared fields. */
  score: number;
  /** Share of the total weight that was compared (0–1). */
  coverage: number;
  /** `score >= duplicateThreshold` and not dismissed. */
  isPotentialDuplicate: boolean;
  /** Set when a gate ruled the pair out; `score` is then 0. */
  dismissedBy?: DismissReason;
  fields: FieldResult[];
}

/**
 * Replaces one field's built-in scorer. Return `null` when either side
 * lacks the data (the field is then left out of the score).
 */
export type FieldScorer = (
  a: MedHistoryRecord,
  b: MedHistoryRecord
) => { similarity: number; reason?: MatchReasonCode } | null;

export interface MatchScoringOptions {
  /** 0–1; default 0.8. */
  duplicateThreshold?: number;
  /** Override default weights. */
  weights?: Partial<MatchWeights>;
  /** 0–1 share of the identity points for a brand ↔ generic match; default 0.9. */
  brandGenericCredit?: number;
  /** Host brand/generic groups, e.g. `[['Sprycel', 'dasatinib']]`. */
  aliases?: string[][];
  /** Replace individual field scorers. */
  scorers?: Partial<Record<MatchField, FieldScorer>>;
}

/** A chart record an incoming record may duplicate. */
export interface DuplicateCandidate {
  incomingId: string;
  chartId: string;
  match: MatchScore;
}

// =============================================================================
// Defaults
// =============================================================================

export const DEFAULT_DUPLICATE_THRESHOLD = 0.8;
export const DEFAULT_BRAND_GENERIC_CREDIT = 0.9;

export const DEFAULT_MATCH_WEIGHTS: Readonly<MatchWeights> = {
  identity: 35,
  strengthForm: 20,
  sig: 10,
  date: 10,
  prescriber: 10,
  pharmacy: 10,
  quantity: 5,
};

/** Display and scoring order. */
export const MATCH_FIELDS: readonly MatchField[] = [
  'identity',
  'strengthForm',
  'sig',
  'date',
  'prescriber',
  'pharmacy',
  'quantity',
];

/** Names less similar than this are different drugs. */
const MIN_NAME_SIMILARITY = 0.5;
/** Dates this close score as the same date. */
const SAME_DATE_DAYS = 7;
/** Dates this far apart score 0. */
const MAX_DATE_DAYS = 365;

// =============================================================================
// Levenshtein
// =============================================================================

function editDistance(s: readonly string[], t: readonly string[]): number {
  if (s.length === 0) return t.length;
  if (t.length === 0) return s.length;
  let prev = new Int32Array(t.length + 1);
  let curr = new Int32Array(t.length + 1);
  for (let j = 0; j <= t.length; j++) prev[j] = j;
  for (let i = 1; i <= s.length; i++) {
    curr[0] = i;
    const si = s[i - 1];
    for (let j = 1; j <= t.length; j++) {
      const cost = si === t[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[t.length];
}

function charSimilarity(s: readonly string[], t: readonly string[]): number {
  const longest = Math.max(s.length, t.length);
  return longest === 0 ? 1 : 1 - editDistance(s, t) / longest;
}

/** Levenshtein edit distance over Unicode code points. */
export function levenshtein(a: string, b: string): number {
  return editDistance(Array.from(a), Array.from(b));
}

/** 1 − distance / longer length; 1 for two empty strings. */
export function textSimilarity(a: string, b: string): number {
  return a === b ? 1 : charSimilarity(Array.from(a), Array.from(b));
}

// =============================================================================
// Normalization (once per record)
// =============================================================================

const ABBREVIATIONS: Record<string, string> = {
  tab: 'tablet',
  tabs: 'tablet',
  tablets: 'tablet',
  cap: 'capsule',
  caps: 'capsule',
  capsules: 'capsule',
  hcl: 'hydrochloride',
  soln: 'solution',
  susp: 'suspension',
  inj: 'injection',
  dosepak: 'dose pack',
  dosepack: 'dose pack',
};

/** Form words removed from names (scored in the strength-and-form field). */
const FORM_WORDS = new Set([
  'tablet',
  'capsule',
  'solution',
  'suspension',
  'syrup',
  'cream',
  'ointment',
  'gel',
  'patch',
  'suppository',
  'spray',
  'drops',
  'inhaler',
  'injection',
  'lozenge',
  'powder',
  'film',
  'vial',
  'dose',
  'pack',
]);

const STRENGTH_IN_NAME =
  /\d{1,7}(?:\.\d{1,4})?(?:\s{0,4}\/\s{0,4}\d{1,7}(?:\.\d{1,4})?)?\s{0,4}(?:mg\/ml|mcg\/ml|mg|mcg|g|ml|units?|%|meq)\b/g;

function basicText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}%/.\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandAbbreviations(text: string): string {
  return text
    .split(' ')
    .map((word) => ABBREVIATIONS[word] ?? word)
    .join(' ');
}

/**
 * Drug name without strength or form words, e.g. "Sprycel 70 mg tablet" →
 * "sprycel". Falls back to the whole name when nothing else is left.
 */
export function normalizeMedicationName(name: string): string {
  const text = basicText(name);
  const words = expandAbbreviations(text.replace(STRENGTH_IN_NAME, ' '))
    .split(' ')
    .filter((w) => w && !FORM_WORDS.has(w) && !/^[\d.]+$/.test(w));
  return words.length > 0 ? words.join(' ') : text;
}

function sortedTokens(text: string): string {
  return text.split(' ').filter(Boolean).sort().join(' ');
}

function normalizeStrength(strength: string): string | undefined {
  const match = basicText(strength).match(
    /(\d{1,7}(?:\.\d{1,4})?(?:\s{0,4}\/\s{0,4}\d{1,7}(?:\.\d{1,4})?)?)\s{0,4}(mg\/ml|mcg\/ml|mg|mcg|g|ml|units?|%|meq)?/
  );
  if (!match) return undefined;
  const value = match[1]
    .replace(/\s+/g, '')
    .split('/')
    .map((n) => String(Number(n)))
    .join('/');
  return `${value} ${(match[2] ?? '').replace(/s$/, '')}`.trim();
}

function normalizeNdc(code: string): string {
  return code.replace(/\D/g, '');
}

function codeKey(code: MedicationCode): string {
  const system = code.system.trim().toUpperCase();
  const value = system === 'NDC' ? normalizeNdc(code.code) : code.code.trim();
  return `${system}:${value}`;
}

const DAY_MS = 86_400_000;

function dayNumber(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const time = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(time) ? undefined : Math.round(time / DAY_MS);
}

/** Classifies any pharmacy identifier as NCPDP ID, NPI, or a name. */
export function parsePharmacyIdentifier(
  value: string | PharmacyRef | undefined
): PharmacyRef {
  if (!value) return {};
  if (typeof value !== 'string') {
    return {
      ncpdpid: value.ncpdpid?.trim() || undefined,
      npi: value.npi?.trim() || undefined,
      name: value.name?.trim() || undefined,
    };
  }
  const trimmed = value.trim();
  if (/^N\d{10}$/.test(trimmed)) {
    const parsed = parsePharmId(trimmed);
    return parsed ? { npi: parsed.id } : {};
  }
  if (/^\d{7}$/.test(trimmed)) return { ncpdpid: trimmed };
  if (/^\d{10}$/.test(trimmed)) return { npi: trimmed };
  return trimmed ? { name: trimmed } : {};
}

interface NormalizedRecord {
  record: MedHistoryRecord;
  name: string;
  nameChars: string[];
  nameSorted: string;
  nameSortedChars: string[];
  namePrefixes: Set<string>;
  productCodes: Set<string>;
  hasDrugCode: boolean;
  drugId?: string;
  isSupply: boolean;
  strength?: string;
  form?: string;
  sigText?: string;
  sigParsed?: ReturnType<typeof parseSig>;
  dates: number[];
  prescriberNpi?: string;
  prescriberName?: string;
  pharmacy: PharmacyRef;
  quantity?: number;
  quantityUnit?: string;
}

function normalizeRecord(record: MedHistoryRecord): NormalizedRecord {
  const med = record.medication;
  const name = normalizeMedicationName(med.name);
  const nameSorted = sortedTokens(name);
  const codes = record.codes ?? (med.code ? [med.code] : []);
  const label = parseMedicationLabel(med.name);
  const strengthText = med.strength ?? label.strength;
  const formText = med.doseForm ?? label.doseForm;
  const sigText = med.patientSig ?? med.sig;
  const structured = record.prescriber;
  const prescriberName = structured?.lastName
    ? [structured.lastName, structured.firstName].filter(Boolean).join(' ')
    : med.prescriber;
  const quantity = med.quantity ? Number(med.quantity) : undefined;

  return {
    record,
    name,
    nameChars: Array.from(name),
    nameSorted,
    nameSortedChars: Array.from(nameSorted),
    namePrefixes: new Set(
      name
        .split(' ')
        .filter((w) => w.length >= 3)
        .map((w) => w.slice(0, 3))
    ),
    productCodes: new Set(codes.map(codeKey)),
    hasDrugCode: codes.some((c) =>
      ['FDB', 'RXNORM'].includes(c.system.trim().toUpperCase())
    ),
    drugId: record.drugId?.trim() || undefined,
    isSupply: med.uncodedType === 'SP',
    strength: strengthText ? normalizeStrength(strengthText) : undefined,
    form: formText
      ? (baseDoseForm(formText) ?? (basicText(formText) || undefined))
      : undefined,
    sigText: sigText ? basicText(sigText) : undefined,
    sigParsed: sigText ? parseSig(sigText) : undefined,
    dates: [med.startDate, record.dispensedDate]
      .map(dayNumber)
      .filter((d): d is number => d !== undefined),
    prescriberNpi: structured?.npi?.trim() || undefined,
    prescriberName: prescriberName
      ? sortedTokens(basicText(prescriberName))
      : undefined,
    pharmacy: {
      ...parsePharmacyIdentifier(med.pharmacyId),
      ...parsePharmacyIdentifier(record.pharmacy),
    },
    quantity:
      quantity !== undefined && !Number.isNaN(quantity) ? quantity : undefined,
    quantityUnit: med.quantityUnit ? basicText(med.quantityUnit) : undefined,
  };
}

// =============================================================================
// Field scorers
// =============================================================================

interface Scored {
  similarity: number;
  reason: MatchReasonCode;
}

interface ScoringContext {
  weights: MatchWeights;
  threshold: number;
  brandGenericCredit: number;
  aliasGroups: Map<string, number>;
  scorers: Partial<Record<MatchField, FieldScorer>>;
}

function nameSimilarity(a: NormalizedRecord, b: NormalizedRecord): number {
  if (a.name === b.name || a.nameSorted === b.nameSorted) return 1;
  const direct = charSimilarity(a.nameChars, b.nameChars);
  const reordered = a.nameSorted !== a.name || b.nameSorted !== b.name;
  return reordered
    ? Math.max(direct, charSimilarity(a.nameSortedChars, b.nameSortedChars))
    : direct;
}

function sharesAlias(
  a: NormalizedRecord,
  b: NormalizedRecord,
  aliasGroups: Map<string, number>
): boolean {
  const groupA = aliasGroups.get(a.name);
  return groupA !== undefined && groupA === aliasGroups.get(b.name);
}

function sharesProductCode(a: NormalizedRecord, b: NormalizedRecord): boolean {
  for (const code of a.productCodes) if (b.productCodes.has(code)) return true;
  return false;
}

function scoreStrengthForm(
  a: NormalizedRecord,
  b: NormalizedRecord
): Scored | null {
  const strengthSame =
    a.strength && b.strength ? a.strength === b.strength : undefined;
  const formSame = a.form && b.form ? a.form === b.form : undefined;
  const parts = [strengthSame, formSame].filter(
    (p): p is boolean => p !== undefined
  );
  if (parts.length === 0) return null;
  const similarity = parts.filter(Boolean).length / parts.length;
  const reason: MatchReasonCode =
    strengthSame === false && formSame === false
      ? 'different-strength-form'
      : strengthSame === false
        ? 'different-strength'
        : formSame === false
          ? 'different-form'
          : 'same-strength-form';
  return { similarity, reason };
}

function scoreSig(a: NormalizedRecord, b: NormalizedRecord): Scored | null {
  if (!a.sigText || !b.sigText) return null;
  const pa = a.sigParsed;
  const pb = b.sigParsed;
  if (
    pa?.route &&
    pa.frequency &&
    pa.route === pb?.route &&
    pa.frequency === pb.frequency &&
    pa.prn === pb.prn
  ) {
    return { similarity: 1, reason: 'same-sig' };
  }
  const similarity = textSimilarity(a.sigText, b.sigText);
  return {
    similarity,
    reason:
      similarity >= 0.9
        ? 'same-sig'
        : similarity >= 0.5
          ? 'similar-sig'
          : 'different-sig',
  };
}

function scoreDate(a: NormalizedRecord, b: NormalizedRecord): Scored | null {
  if (a.dates.length === 0 || b.dates.length === 0) return null;
  let days = Infinity;
  for (const da of a.dates)
    for (const db of b.dates) days = Math.min(days, Math.abs(da - db));
  if (days <= SAME_DATE_DAYS) return { similarity: 1, reason: 'same-date' };
  const similarity = Math.max(
    0,
    1 - (days - SAME_DATE_DAYS) / (MAX_DATE_DAYS - SAME_DATE_DAYS)
  );
  return {
    similarity,
    reason: similarity > 0 ? 'near-date' : 'distant-date',
  };
}

function scoreByIdOrName(
  idA: string | undefined,
  idB: string | undefined,
  nameA: string | undefined,
  nameB: string | undefined,
  reasons: [MatchReasonCode, MatchReasonCode, MatchReasonCode]
): Scored | null {
  const [same, similar, different] = reasons;
  if (idA && idB) {
    return idA === idB
      ? { similarity: 1, reason: same }
      : { similarity: 0, reason: different };
  }
  if (!nameA || !nameB) return null;
  const similarity = textSimilarity(nameA, nameB);
  return {
    similarity,
    reason: similarity >= 0.9 ? same : similarity >= 0.5 ? similar : different,
  };
}

function scorePrescriber(
  a: NormalizedRecord,
  b: NormalizedRecord
): Scored | null {
  return scoreByIdOrName(
    a.prescriberNpi,
    b.prescriberNpi,
    a.prescriberName,
    b.prescriberName,
    ['same-prescriber', 'similar-prescriber', 'different-prescriber']
  );
}

function scorePharmacy(
  a: NormalizedRecord,
  b: NormalizedRecord
): Scored | null {
  const pa = a.pharmacy;
  const pb = b.pharmacy;
  const reasons: [MatchReasonCode, MatchReasonCode, MatchReasonCode] = [
    'same-pharmacy',
    'similar-pharmacy',
    'different-pharmacy',
  ];
  if (pa.ncpdpid && pb.ncpdpid)
    return scoreByIdOrName(
      pa.ncpdpid,
      pb.ncpdpid,
      undefined,
      undefined,
      reasons
    );
  if (pa.npi && pb.npi)
    return scoreByIdOrName(pa.npi, pb.npi, undefined, undefined, reasons);
  return scoreByIdOrName(
    undefined,
    undefined,
    pa.name && sortedTokens(basicText(pa.name)),
    pb.name && sortedTokens(basicText(pb.name)),
    reasons
  );
}

function scoreQuantity(
  a: NormalizedRecord,
  b: NormalizedRecord
): Scored | null {
  if (a.quantity === undefined || b.quantity === undefined) return null;
  const unitsKnown = a.quantityUnit && b.quantityUnit;
  const unitSame = !unitsKnown || a.quantityUnit === b.quantityUnit;
  if (!unitSame) return { similarity: 0, reason: 'different-quantity' };
  if (a.quantity === b.quantity)
    return { similarity: 1, reason: 'same-quantity' };
  return unitsKnown
    ? { similarity: 0.5, reason: 'same-quantity-unit' }
    : { similarity: 0, reason: 'different-quantity' };
}

const BUILT_IN_SCORERS: Record<
  Exclude<MatchField, 'identity'>,
  (a: NormalizedRecord, b: NormalizedRecord) => Scored | null
> = {
  strengthForm: scoreStrengthForm,
  sig: scoreSig,
  date: scoreDate,
  prescriber: scorePrescriber,
  pharmacy: scorePharmacy,
  quantity: scoreQuantity,
};

function runCustomScorer(
  scorer: FieldScorer,
  a: NormalizedRecord,
  b: NormalizedRecord
): Scored | null {
  const result = scorer(a.record, b.record);
  return result
    ? { similarity: result.similarity, reason: result.reason ?? 'custom' }
    : null;
}

function outcomeFor(similarity: number): FieldOutcome {
  return similarity >= 0.9 ? 'agree' : similarity >= 0.5 ? 'partial' : 'differ';
}

// =============================================================================
// Scoring
// =============================================================================

function createContext(options: MatchScoringOptions = {}): ScoringContext {
  const aliasGroups = new Map<string, number>();
  options.aliases?.forEach((group, index) =>
    group.forEach((name) =>
      aliasGroups.set(normalizeMedicationName(name), index)
    )
  );
  return {
    weights: { ...DEFAULT_MATCH_WEIGHTS, ...options.weights },
    threshold: options.duplicateThreshold ?? DEFAULT_DUPLICATE_THRESHOLD,
    brandGenericCredit:
      options.brandGenericCredit ?? DEFAULT_BRAND_GENERIC_CREDIT,
    aliasGroups,
    scorers: options.scorers ?? {},
  };
}

function dismissed(reason: DismissReason): MatchScore {
  return {
    score: 0,
    coverage: 0,
    isPotentialDuplicate: false,
    dismissedBy: reason,
    fields: [],
  };
}

/** Product, brand/generic, and drug-level gates; `undefined` = compare names. */
function identityGate(
  a: NormalizedRecord,
  b: NormalizedRecord,
  ctx: ScoringContext
): Scored | DismissReason | undefined {
  if (sharesProductCode(a, b)) return { similarity: 1, reason: 'same-product' };
  if ((a.isSupply && b.hasDrugCode) || (b.isSupply && a.hasDrugCode))
    return 'supply-vs-drug';
  const sameDrug = a.drugId !== undefined && a.drugId === b.drugId;
  if (sameDrug || sharesAlias(a, b, ctx.aliasGroups)) {
    const names = nameSimilarity(a, b);
    return names >= ctx.brandGenericCredit
      ? { similarity: names, reason: 'same-name' }
      : { similarity: ctx.brandGenericCredit, reason: 'brand-generic' };
  }
  if (a.drugId && b.drugId) return 'different-drug';
  return undefined;
}

function nameGate(
  a: NormalizedRecord,
  b: NormalizedRecord
): DismissReason | undefined {
  const lengthA = a.nameChars.length;
  const lengthB = b.nameChars.length;
  const longest = Math.max(lengthA, lengthB);
  if (
    longest > 0 &&
    1 - Math.abs(lengthA - lengthB) / longest < MIN_NAME_SIMILARITY
  )
    return 'name-length';
  for (const prefix of a.namePrefixes)
    if (b.namePrefixes.has(prefix)) return undefined;
  return a.name === b.name ? undefined : 'no-shared-prefix';
}

function scoreNormalized(
  a: NormalizedRecord,
  b: NormalizedRecord,
  ctx: ScoringContext
): MatchScore {
  const fields: FieldResult[] = [];
  const custom = ctx.scorers;

  let identity: Scored;
  if (custom.identity) {
    identity = runCustomScorer(custom.identity, a, b) ?? {
      similarity: 0,
      reason: 'different-name',
    };
  } else {
    const gate = identityGate(a, b, ctx);
    if (typeof gate === 'string') return dismissed(gate);
    if (gate) {
      identity = gate;
    } else {
      const nameDismissal = nameGate(a, b);
      if (nameDismissal) return dismissed(nameDismissal);
      const similarity = nameSimilarity(a, b);
      identity = {
        similarity,
        reason:
          similarity >= 0.9
            ? 'same-name'
            : similarity >= MIN_NAME_SIMILARITY
              ? 'similar-name'
              : 'different-name',
      };
    }
  }
  fields.push({
    field: 'identity',
    outcome: outcomeFor(identity.similarity),
    similarity: identity.similarity,
    weight: ctx.weights.identity,
    reason: identity.reason,
  });

  for (const field of MATCH_FIELDS) {
    if (field === 'identity') continue;
    const weight = ctx.weights[field];
    const override = custom[field];
    const result = override
      ? runCustomScorer(override, a, b)
      : BUILT_IN_SCORERS[field](a, b);
    fields.push(
      result
        ? {
            field,
            outcome: outcomeFor(result.similarity),
            similarity: result.similarity,
            weight,
            reason: result.reason,
          }
        : { field, outcome: 'missing', weight, reason: 'missing' }
    );
  }

  let earned = 0;
  let compared = 0;
  let total = 0;
  for (const f of fields) {
    total += f.weight;
    if (f.similarity === undefined) continue;
    earned += f.weight * f.similarity;
    compared += f.weight;
  }
  const score = compared > 0 ? earned / compared : 0;
  return {
    score,
    coverage: total > 0 ? compared / total : 0,
    // Tolerance keeps scores like 0.8 from failing a 0.8 threshold on rounding.
    isPotentialDuplicate: score >= ctx.threshold - 1e-9,
    fields,
  };
}

/** Why an incoming record can't be a refill of a chart record. */
export type FillBlocker =
  | 'not-a-match'
  | 'different-name'
  | 'different-strength'
  | 'different-form'
  | 'different-strength-form'
  | 'unknown-strength-form';

/**
 * Why the incoming record can't be recorded as a refill of the chart
 * record, or `undefined` when it can: the same product (shared product
 * code), or the same drug by name or brand/generic with matching strength
 * and dose form.
 */
export function fillBlocker(match: MatchScore): FillBlocker | undefined {
  if (match.dismissedBy) return 'not-a-match';
  const identity = match.fields.find((f) => f.field === 'identity');
  if (identity?.reason === 'same-product') return undefined;
  if (identity?.reason !== 'brand-generic' && identity?.outcome !== 'agree')
    return 'different-name';
  const strengthForm = match.fields.find((f) => f.field === 'strengthForm');
  if (strengthForm?.outcome === 'agree') return undefined;
  switch (strengthForm?.reason) {
    case 'different-strength':
    case 'different-form':
    case 'different-strength-form':
      return strengthForm.reason;
    default:
      return 'unknown-strength-form';
  }
}

/** Whether the incoming record can be recorded as a refill of the chart record. */
export function canBeFillOf(match: MatchScore): boolean {
  return fillBlocker(match) === undefined;
}

/** Scores one incoming record against one chart (or incoming) record. */
export function scoreMedicationPair(
  a: MedHistoryRecord,
  b: MedHistoryRecord,
  options?: MatchScoringOptions
): MatchScore {
  return scoreNormalized(
    normalizeRecord(a),
    normalizeRecord(b),
    createContext(options)
  );
}

/**
 * Every incoming × chart pair at or above the threshold, best match first
 * for each incoming record. Records are normalized once.
 */
export function findDuplicateCandidates(
  incoming: readonly MedHistoryRecord[],
  chart: readonly MedHistoryRecord[],
  options?: MatchScoringOptions
): DuplicateCandidate[] {
  const ctx = createContext(options);
  const chartNormalized = chart.map(normalizeRecord);
  const candidates: DuplicateCandidate[] = [];
  for (const record of incoming) {
    const a = normalizeRecord(record);
    const matches = chartNormalized
      .map((b) => ({ chartId: b.record.id, match: scoreNormalized(a, b, ctx) }))
      .filter((m) => m.match.isPotentialDuplicate)
      .sort((x, y) => y.match.score - x.match.score);
    for (const m of matches)
      candidates.push({
        incomingId: record.id,
        chartId: m.chartId,
        match: m.match,
      });
  }
  return candidates;
}

/**
 * Groups incoming records that duplicate each other (e.g. repeat fills of
 * one prescription). Returns groups of two or more ids, in input order.
 */
export function findRepeatFillGroups(
  incoming: readonly MedHistoryRecord[],
  options?: MatchScoringOptions
): string[][] {
  const ctx = createContext(options);
  const normalized = incoming.map(normalizeRecord);
  const parent = normalized.map((_, i) => i);
  const find = (i: number): number =>
    parent[i] === i ? i : (parent[i] = find(parent[i]));

  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      if (find(i) === find(j)) continue;
      if (
        scoreNormalized(normalized[i], normalized[j], ctx).isPotentialDuplicate
      )
        parent[find(j)] = find(i);
    }
  }

  const groups = new Map<number, string[]>();
  normalized.forEach((n, i) => {
    const root = find(i);
    groups.set(root, [...(groups.get(root) ?? []), n.record.id]);
  });
  return [...groups.values()].filter((g) => g.length > 1);
}
