/**
 * Due-evaluation engine — the "knowledge" layer of health surveillance.
 * Given a patient's history and the program metadata (programs.json from
 * mieweb/codify, or a deployment's own), decides which programs/measures are
 * due, overdue, pending, or satisfied. Pure functions, no I/O — the metadata
 * is small, so this runs on the main thread.
 */

import type { PatientHistory } from './history';

/**
 * One entry in a program's order set:
 * - `"CODETYPE|FULLCODE"` — a plain required order
 * - `{ alt: [a, b] }` — mutually exclusive alternatives (one-of): a
 *   colonoscopy OR a FIT satisfies colorectal screening
 * - `{ key, after: […] }` — depends on completed prerequisites (Gantt edge):
 *   the RMO's fitness-for-duty determination needs the panel results first,
 *   and a program may carry several determinations (per panel / per SEG)
 */
export type ProgramOrder =
  | string
  | {
      key?: string;
      alt?: string[];
      after?: string[];
    };

/** Normalized order entry: alternative keys + prerequisite keys. */
export interface OrderSpec {
  /** Alternatives — exactly one should be ordered */
  keys: string[];
  /** Order keys that must be completed before this one can be performed */
  after: string[];
}

export function normalizeOrders(orders?: ProgramOrder[]): OrderSpec[] {
  return (orders ?? [])
    .map((o) =>
      typeof o === 'string'
        ? { keys: [o], after: [] }
        : { keys: o.alt ?? (o.key ? [o.key] : []), after: o.after ?? [] }
    )
    .filter((s) => s.keys.length > 0);
}

/** Every key that can satisfy/appear in the program's order set. */
export function flattenOrderKeys(orders?: ProgramOrder[]): string[] {
  return normalizeOrders(orders).flatMap((s) => s.keys);
}

/** Keys of everything completed in the history (orders, procedures,
 * immunizations) — used to unlock dependent orders. */
export function completedKeys(history: PatientHistory): Set<string> {
  const done = new Set<string>();
  for (const o of history.orders) {
    if (o.status === 'completed') done.add(o.key);
  }
  for (const p of history.procedures ?? []) done.add(p.key);
  for (const i of history.immunizations ?? []) done.add(i.key);
  return done;
}

/** Program metadata — mirrors programs.json (see mieweb/codify). */
export interface ProgramMeta {
  kind?: 'surveillance' | 'fitness' | 'credential' | 'quality';
  /** Omitted = one-time / event-driven (satisfied forever once done) */
  periodicityMonths?: number;
  ageMin?: number;
  ageMax?: number;
  sex?: 'M' | 'F';
  /** Satisfying orders — plain keys, one-of alternatives, or dependent
   * entries (see ProgramOrder) */
  orders?: ProgramOrder[];
}

export type ProgramsMap = Record<string, ProgramMeta>;

export type DueStatus =
  | 'due' // applicable, never satisfied (or history silent)
  | 'overdue' // applicable, last satisfied longer ago than the periodicity
  | 'pending' // a satisfying order is in flight
  | 'satisfied' // satisfied within the periodicity window (or one-time done)
  | 'not-applicable'; // age/sex gates exclude the patient

export interface DueItem {
  /** Program key, CODETYPE|FULLCODE (e.g. "OSHA|1910.95", "eCQM|CMS125") */
  key: string;
  program: ProgramMeta;
  status: DueStatus;
  /** Most recent completion date of any satisfying order */
  lastCompleted?: string;
  /** When the current/last satisfaction lapses (satisfied/overdue only) */
  dueDate?: string;
  /** Satisfying orders currently pending */
  pendingKeys: string[];
}

/** Add months to an ISO date, returning an ISO date (YYYY-MM-DD). */
function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** Is the patient inside the program's age/sex gates? */
export function isApplicable(
  history: Pick<PatientHistory, 'age' | 'sex'>,
  program: ProgramMeta
): boolean {
  if (program.sex && program.sex !== history.sex) return false;
  if (program.ageMin !== undefined && history.age < program.ageMin)
    return false;
  if (program.ageMax !== undefined && history.age > program.ageMax)
    return false;
  return true;
}

/**
 * Evaluate one program against the history.
 * `now` defaults to today; injectable for tests.
 */
export function evaluateProgram(
  key: string,
  program: ProgramMeta,
  history: PatientHistory,
  now: Date = new Date()
): DueItem {
  const base = { key, program, pendingKeys: [] as string[] };
  if (!isApplicable(history, program)) {
    return { ...base, status: 'not-applicable' };
  }

  const satisfying = new Set(flattenOrderKeys(program.orders));
  // Completions come from finished orders, procedures and immunizations —
  // whatever the source system recorded them as.
  const completions: string[] = [];
  for (const o of history.orders) {
    if (!satisfying.has(o.key)) continue;
    if (o.status === 'completed') completions.push(o.date);
    else base.pendingKeys.push(o.key);
  }
  for (const p of history.procedures ?? []) {
    if (satisfying.has(p.key)) completions.push(p.date);
  }
  for (const i of history.immunizations ?? []) {
    if (satisfying.has(i.key)) completions.push(i.date);
  }

  const lastCompleted = completions.sort().at(-1);

  if (!lastCompleted) {
    return base.pendingKeys.length > 0
      ? { ...base, status: 'pending' }
      : { ...base, status: 'due' };
  }

  // One-time programs (no periodicity) stay satisfied once completed.
  if (program.periodicityMonths === undefined) {
    return { ...base, status: 'satisfied', lastCompleted };
  }

  const dueDate = addMonths(lastCompleted, program.periodicityMonths);
  if (dueDate > now.toISOString().slice(0, 10)) {
    return { ...base, status: 'satisfied', lastCompleted, dueDate };
  }
  return base.pendingKeys.length > 0
    ? { ...base, status: 'pending', lastCompleted, dueDate }
    : { ...base, status: 'overdue', lastCompleted, dueDate };
}

/**
 * Evaluate a set of programs against the history, most actionable first
 * (overdue → due → pending → satisfied; not-applicable omitted unless
 * `includeNotApplicable`).
 *
 * `enrolledKeys` restricts occupational programs to the patient's actual
 * enrollments (a clerk isn't due for cadmium surveillance just because the
 * program exists); quality measures apply to everyone passing their gates.
 */
export function evaluateDue(
  history: PatientHistory,
  programs: ProgramsMap,
  options?: { enrolledKeys?: string[]; includeNotApplicable?: boolean; now?: Date }
): DueItem[] {
  const enrolled = options?.enrolledKeys ? new Set(options.enrolledKeys) : null;
  const now = options?.now ?? new Date();
  const items: DueItem[] = [];
  for (const [key, program] of Object.entries(programs)) {
    if (enrolled && program.kind !== 'quality' && !enrolled.has(key)) continue;
    const item = evaluateProgram(key, program, history, now);
    if (item.status === 'not-applicable' && !options?.includeNotApplicable)
      continue;
    items.push(item);
  }
  const rank: Record<DueStatus, number> = {
    overdue: 0,
    due: 1,
    pending: 2,
    satisfied: 3,
    'not-applicable': 4,
  };
  return items.sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      (a.dueDate ?? '').localeCompare(b.dueDate ?? '') ||
      a.key.localeCompare(b.key)
  );
}

/**
 * Ordering-time prompt: is this order key part of a due/overdue program?
 * Returns the matching due items so the UI can badge "due for OSHA 1910.95"
 * or warn "already satisfied" while the clinician is ordering.
 */
export function dueForOrder(orderKey: string, dueItems: DueItem[]): DueItem[] {
  return dueItems.filter(
    (i) =>
      (i.status === 'due' || i.status === 'overdue') &&
      flattenOrderKeys(i.program.orders).includes(orderKey)
  );
}
