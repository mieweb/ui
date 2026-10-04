import { DateTime } from 'luxon';

export const isoMillis = (value: string): number =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
    value
  )
    ? DateTime.fromISO(value, { zone: 'UTC' }).toMillis()
    : Number.NaN;
export const millisISO = (value: number): string =>
  DateTime.fromMillis(value, { zone: 'UTC' }).toISO()!;

/** A deterministic clock: reads never progress jobs; only explicit advances do. */
export interface SimulationClock {
  now(): string;
  advance(ms: number): void;
}

export function createSimulationClock(
  start = '2026-10-03T12:00:00.000Z'
): SimulationClock {
  let milliseconds = isoMillis(start);
  if (!Number.isFinite(milliseconds))
    throw new Error('Invalid simulation start time');
  return {
    now: () => millisISO(milliseconds),
    advance(ms) {
      if (!Number.isFinite(ms) || ms < 0)
        throw new Error('Advance requires nonnegative milliseconds');
      if (!DateTime.fromMillis(milliseconds + ms, { zone: 'UTC' }).isValid)
        throw new Error('Clock advance exceeds the supported calendar');
      milliseconds += ms;
    },
  };
}

export interface SimulationScheduler {
  schedule(operationId: string, delayMs: number, run: () => void): void;
  runDue(): void;
  runAll(): void;
  clear(): void;
  snapshot(): Array<{ operationId: string; dueAt: string; sequence: number }>;
}

export function createSimulationScheduler(
  clock: SimulationClock
): SimulationScheduler {
  let sequence = 0;
  let jobs: Array<{
    operationId: string;
    dueAt: number;
    sequence: number;
    run: () => void;
  }> = [];
  const runDue = () => {
    for (;;) {
      jobs.sort((a, b) => a.dueAt - b.dueAt || a.sequence - b.sequence);
      const job = jobs[0];
      if (!job || job.dueAt > isoMillis(clock.now())) return;
      jobs.shift();
      job.run();
    }
  };
  return {
    schedule(operationId, delayMs, run) {
      if (!Number.isFinite(delayMs) || delayMs < 0)
        throw new Error('Invalid job delay');
      jobs.push({
        operationId,
        dueAt: isoMillis(clock.now()) + delayMs,
        sequence: ++sequence,
        run,
      });
    },
    runDue,
    runAll() {
      while (jobs.length) {
        const dueAt = Math.min(...jobs.map((job) => job.dueAt));
        clock.advance(Math.max(0, dueAt - isoMillis(clock.now())));
        runDue();
      }
    },
    clear() {
      jobs = [];
      sequence = 0;
    },
    snapshot: () =>
      jobs.map(({ operationId, dueAt, sequence: order }) => ({
        operationId,
        dueAt: millisISO(dueAt),
        sequence: order,
      })),
  };
}

/** Sorted JSON is a correlation fingerprint, never signing evidence. */
export function canonical(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`
    )
    .join(',')}}`;
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createSequentialIds(): (prefix: string) => string {
  const counters: Record<string, number> = {};
  return (prefix) =>
    `${prefix}-${String((counters[prefix] = (counters[prefix] ?? 0) + 1)).padStart(4, '0')}`;
}
