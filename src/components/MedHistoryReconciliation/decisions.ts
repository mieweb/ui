/**
 * Pure review-state rules for MedHistoryReconciliation: reviewer
 * decisions, repeat-fill group presets, bulk actions, and the change set.
 * No React.
 */

import type {
  Medication,
  MedicationStatus,
} from '../MedicationList/MedicationList';
import type {
  MedHistoryChange,
  MedHistoryChangeSet,
  MedHistoryFill,
  MedHistoryMedication,
  MedHistoryRecord,
} from './types';

/** What the reviewer chose for one incoming record. */
export type MedHistoryDecision =
  | { kind: 'skip' }
  | { kind: 'add' }
  /** Record as a refill (dispense) of an existing chart prescription. */
  | { kind: 'fill'; chartId: string };

export type DecisionMap = Readonly<Record<string, MedHistoryDecision>>;
export type EditMap = Readonly<Record<string, Medication>>;

/** Status given to imported records — import is not reconciliation. */
const IMPORTED_STATUS: MedicationStatus = 'unreconciled';

/** Fields compared to report what the reviewer edited. */
const EDITABLE_FIELDS = [
  'name',
  'code',
  'uncodedType',
  'compoundIngredients',
  'strength',
  'doseForm',
  'quantity',
  'quantityUnit',
  'daysSupply',
  'sig',
  'patientSig',
  'route',
  'frequency',
  'prn',
  'refills',
  'substitution',
  'startDate',
  'endDate',
  'indication',
  'prescriber',
  'pharmacyId',
  'pharmacyNotes',
  'note',
] as const satisfies readonly (keyof Medication)[];

export type EditableField = (typeof EDITABLE_FIELDS)[number];

/** Encodes a decision as a stable string (button value). */
export function decisionValue(
  decision: MedHistoryDecision | undefined
): string {
  if (!decision) return '';
  return decision.kind === 'fill' ? `fill:${decision.chartId}` : decision.kind;
}

/** Repeat-fill group preset: newest fill Add as New, or skip every fill. */
export type GroupPreset = 'keep-newest' | 'skip-all';

/** A repeat-fill group: member ids (input order) and the newest member. */
export interface RepeatGroup {
  ids: readonly string[];
  newestId: string;
}

function fillDay(record: MedHistoryRecord): string {
  return record.dispensedDate ?? record.medication.startDate ?? '';
}

/**
 * Groups with their newest member (latest dispensed or start date; the
 * first listed wins a tie).
 */
export function toRepeatGroups(
  groups: readonly (readonly string[])[],
  records: readonly MedHistoryRecord[]
): RepeatGroup[] {
  const byId = new Map(records.map((r) => [r.id, r]));
  return groups.map((ids) => {
    let newestId = ids[0];
    for (const id of ids) {
      const record = byId.get(id);
      const newest = byId.get(newestId);
      if (record && newest && fillDay(record) > fillDay(newest)) newestId = id;
    }
    return { ids, newestId };
  });
}

/** Overwrites every fill in the group with the preset. */
export function applyPreset(
  decisions: DecisionMap,
  group: RepeatGroup,
  preset: GroupPreset
): DecisionMap {
  const next: Record<string, MedHistoryDecision> = { ...decisions };
  for (const id of group.ids)
    next[id] =
      preset === 'keep-newest' && id === group.newestId
        ? { kind: 'add' }
        : { kind: 'skip' };
  return next;
}

/** The preset the group's fills currently match exactly, if any. */
export function currentPreset(
  decisions: DecisionMap,
  group: RepeatGroup
): GroupPreset | undefined {
  const kinds = group.ids.map((id) => decisions[id]?.kind);
  if (kinds.every((k) => k === 'skip')) return 'skip-all';
  const newestAdded = decisions[group.newestId]?.kind === 'add';
  const othersSkipped = group.ids.every(
    (id) => id === group.newestId || decisions[id]?.kind === 'skip'
  );
  return newestAdded && othersSkipped ? 'keep-newest' : undefined;
}

/**
 * Applies Keep newest to every group whose fills are all undecided — the
 * default for new groups, and after pruning emptied one.
 */
export function withGroupDefaults(
  decisions: DecisionMap,
  groups: readonly RepeatGroup[]
): DecisionMap {
  let next = decisions;
  for (const group of groups)
    if (group.ids.every((id) => !next[id]))
      next = applyPreset(next, group, 'keep-newest');
  return next;
}

/** Undecided records with no chart match → Add as New (groups untouched). */
export function addAllNew(
  decisions: DecisionMap,
  newIds: readonly string[],
  groups: readonly RepeatGroup[]
): DecisionMap {
  const grouped = new Set(groups.flatMap((g) => g.ids));
  const next: Record<string, MedHistoryDecision> = { ...decisions };
  for (const id of newIds)
    if (!next[id] && !grouped.has(id)) next[id] = { kind: 'add' };
  return next;
}

/** Every undecided record → Skip. */
export function skipRemaining(
  decisions: DecisionMap,
  incomingIds: readonly string[]
): DecisionMap {
  const next: Record<string, MedHistoryDecision> = { ...decisions };
  for (const id of incomingIds) if (!next[id]) next[id] = { kind: 'skip' };
  return next;
}

/**
 * Drops decisions and edits that no longer apply after the sources change:
 * removed incoming records, and refill targets that are no longer offered.
 * Returns the same objects when nothing changed.
 */
export function pruneReview(
  decisions: DecisionMap,
  edits: EditMap,
  incomingIds: ReadonlySet<string>,
  fillOptions: ReadonlyMap<string, ReadonlySet<string>>
): { decisions: DecisionMap; edits: EditMap } {
  let decisionsChanged = false;
  const nextDecisions: Record<string, MedHistoryDecision> = {};
  for (const [id, decision] of Object.entries(decisions)) {
    const valid =
      incomingIds.has(id) &&
      (decision.kind !== 'fill' ||
        (fillOptions.get(id)?.has(decision.chartId) ?? false));
    if (valid) nextDecisions[id] = decision;
    else decisionsChanged = true;
  }
  let editsChanged = false;
  const nextEdits: Record<string, Medication> = {};
  for (const [id, medication] of Object.entries(edits)) {
    if (incomingIds.has(id)) nextEdits[id] = medication;
    else editsChanged = true;
  }
  return {
    decisions: decisionsChanged ? nextDecisions : decisions,
    edits: editsChanged ? nextEdits : edits,
  };
}

/** A `Medication` for the editor or the change set. */
export function toMedication(medication: MedHistoryMedication): Medication {
  return { ...medication, status: medication.status ?? IMPORTED_STATUS };
}

/** Fields of `final` that differ from the incoming values. */
export function editedFields(
  original: MedHistoryMedication,
  final: Medication
): EditableField[] {
  return EDITABLE_FIELDS.filter(
    (field) =>
      JSON.stringify(original[field] ?? null) !==
      JSON.stringify(final[field] ?? null)
  );
}

/** The dispense details an incoming record adds as a refill. */
export function fillFromRecord(record: MedHistoryRecord): MedHistoryFill {
  const med = record.medication;
  return {
    fillDate: record.dispensedDate,
    quantity: med.quantity,
    quantityUnit: med.quantityUnit,
    daysSupply: med.daysSupply,
    refillsRemaining: record.refillsRemaining,
    substitution: med.substitution,
    pharmacy: record.pharmacy ?? med.pharmacyId,
    prescriber: record.prescriber,
    prescriberName: med.prescriber,
  };
}

/** Builds the change set the host applies. */
export function buildChangeSet(
  incoming: readonly MedHistoryRecord[],
  chart: readonly MedHistoryRecord[],
  decisions: DecisionMap,
  edits: EditMap,
  chartRevision?: string
): MedHistoryChangeSet {
  const chartById = new Map(chart.map((r) => [r.id, r]));
  const changes: MedHistoryChange[] = [];
  const skipped: MedHistoryRecord[] = [];
  const undecided: MedHistoryRecord[] = [];

  for (const record of incoming) {
    const decision = decisions[record.id];
    if (!decision) {
      undecided.push(record);
      continue;
    }
    if (decision.kind === 'skip') {
      skipped.push(record);
      continue;
    }
    if (decision.kind === 'fill') {
      const fillOf = chartById.get(decision.chartId);
      if (fillOf)
        changes.push({
          action: 'fill',
          incoming: record,
          fill: fillFromRecord(record),
          fillOf,
        });
      else undecided.push(record);
      continue;
    }
    const edited = edits[record.id];
    changes.push({
      action: 'add',
      incoming: record,
      medication: {
        ...(edited ?? toMedication(record.medication)),
        status: IMPORTED_STATUS,
      },
      editedFields: edited ? editedFields(record.medication, edited) : [],
    });
  }

  return { changes, skipped, undecided, chartRevision };
}
