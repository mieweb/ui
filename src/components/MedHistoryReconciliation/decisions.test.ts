import { describe, expect, it } from 'vitest';
import {
  addAllNew,
  applyPreset,
  buildChangeSet,
  currentPreset,
  decisionValue,
  editedFields,
  pruneReview,
  skipRemaining,
  toMedication,
  toRepeatGroups,
  withGroupDefaults,
  type RepeatGroup,
} from './decisions';
import { chartHistory, incomingHistory } from './storyData';

const sprycel = incomingHistory[0];
const dasatinib = chartHistory[0];

describe('decisionValue', () => {
  it('encodes each decision kind distinctly', () => {
    expect(decisionValue(undefined)).toBe('');
    expect(decisionValue({ kind: 'add' })).toBe('add');
    expect(decisionValue({ kind: 'skip' })).toBe('skip');
    expect(decisionValue({ kind: 'fill', chartId: 'c1' })).toBe('fill:c1');
  });
});

describe('repeat-fill groups', () => {
  const lancetIds = ['rxh-lancets-3', 'rxh-lancets-2', 'rxh-lancets-1'];
  const [group] = toRepeatGroups([lancetIds], incomingHistory);

  it('finds the newest fill by dispensed date', () => {
    expect(group).toEqual({ ids: lancetIds, newestId: 'rxh-lancets-3' });
    const [reversed] = toRepeatGroups(
      [[...lancetIds].reverse()],
      incomingHistory
    );
    expect(reversed.newestId).toBe('rxh-lancets-3');
  });

  it('applies Keep newest and Skip all, overwriting manual choices', () => {
    const manual = {
      'rxh-lancets-2': { kind: 'add' as const },
      'rxh-lancets-3': { kind: 'skip' as const },
    };
    expect(applyPreset(manual, group, 'keep-newest')).toEqual({
      'rxh-lancets-3': { kind: 'add' },
      'rxh-lancets-2': { kind: 'skip' },
      'rxh-lancets-1': { kind: 'skip' },
    });
    expect(applyPreset(manual, group, 'skip-all')).toEqual({
      'rxh-lancets-3': { kind: 'skip' },
      'rxh-lancets-2': { kind: 'skip' },
      'rxh-lancets-1': { kind: 'skip' },
    });
  });

  it('reports the preset the fills match, or none after a manual change', () => {
    const kept = applyPreset({}, group, 'keep-newest');
    expect(currentPreset(kept, group)).toBe('keep-newest');
    expect(currentPreset(applyPreset({}, group, 'skip-all'), group)).toBe(
      'skip-all'
    );
    expect(
      currentPreset({ ...kept, 'rxh-lancets-1': { kind: 'add' } }, group)
    ).toBeUndefined();
    expect(
      currentPreset(
        { ...kept, 'rxh-lancets-3': { kind: 'fill', chartId: 'c' } },
        group
      )
    ).toBeUndefined();
  });

  it('defaults only groups whose fills are all undecided', () => {
    const other: RepeatGroup = { ids: ['x', 'y'], newestId: 'y' };
    const decided = { x: { kind: 'add' as const } };
    expect(withGroupDefaults(decided, [group, other])).toEqual({
      x: { kind: 'add' },
      'rxh-lancets-3': { kind: 'add' },
      'rxh-lancets-2': { kind: 'skip' },
      'rxh-lancets-1': { kind: 'skip' },
    });
  });
});

describe('bulk actions', () => {
  const group: RepeatGroup = { ids: ['g1', 'g2'], newestId: 'g2' };

  it('adds undecided new records only, leaving groups alone', () => {
    expect(
      addAllNew({ b: { kind: 'skip' } }, ['a', 'b', 'g1'], [group])
    ).toEqual({ a: { kind: 'add' }, b: { kind: 'skip' } });
  });

  it('skips every undecided record', () => {
    expect(
      skipRemaining({ a: { kind: 'add' }, g2: { kind: 'add' } }, [
        'a',
        'b',
        'g1',
        'g2',
      ])
    ).toEqual({
      a: { kind: 'add' },
      b: { kind: 'skip' },
      g1: { kind: 'skip' },
      g2: { kind: 'add' },
    });
  });
});

describe('pruneReview', () => {
  it('drops decisions for removed records and unavailable refill targets', () => {
    const decisions = {
      gone: { kind: 'add' as const },
      kept: { kind: 'add' as const },
      fillKept: { kind: 'fill' as const, chartId: 'c1' },
      fillStale: { kind: 'fill' as const, chartId: 'c1' },
    };
    const edits = { gone: toMedication(sprycel.medication) };
    const result = pruneReview(
      decisions,
      edits,
      new Set(['kept', 'fillKept', 'fillStale']),
      new Map([
        ['fillKept', new Set(['c1'])],
        ['fillStale', new Set<string>()],
      ])
    );
    expect(result.decisions).toEqual({
      kept: decisions.kept,
      fillKept: decisions.fillKept,
    });
    expect(result.edits).toEqual({});
  });

  it('returns the same objects when nothing changed', () => {
    const decisions = { a: { kind: 'add' as const } };
    const edits = {};
    const result = pruneReview(decisions, edits, new Set(['a']), new Map());
    expect(result.decisions).toBe(decisions);
    expect(result.edits).toBe(edits);
  });
});

describe('editedFields', () => {
  it('lists only fields that changed', () => {
    const final = { ...toMedication(sprycel.medication), quantity: '90' };
    expect(editedFields(sprycel.medication, final)).toEqual(['quantity']);
  });

  it('treats undefined and missing as equal', () => {
    const final = { ...toMedication(sprycel.medication), endDate: undefined };
    expect(editedFields(sprycel.medication, final)).toEqual([]);
  });
});

describe('buildChangeSet', () => {
  const [, methylpred, syringe] = incomingHistory;

  it('builds adds, refills, skips and undecided records', () => {
    const edited = { ...toMedication(methylpred.medication), quantity: '42' };
    const set = buildChangeSet(
      [sprycel, methylpred, syringe, incomingHistory[3]],
      chartHistory,
      {
        [sprycel.id]: { kind: 'fill', chartId: dasatinib.id },
        [methylpred.id]: { kind: 'add' },
        [syringe.id]: { kind: 'skip' },
      },
      { [methylpred.id]: edited },
      'rev-7'
    );

    expect(set.chartRevision).toBe('rev-7');
    const [fill, add] = set.changes;
    expect(fill).toMatchObject({ action: 'fill', fillOf: dasatinib });
    expect(add).toMatchObject({
      action: 'add',
      editedFields: ['quantity'],
      medication: { quantity: '42', status: 'unreconciled' },
    });
    expect(set.skipped).toEqual([syringe]);
    expect(set.undecided).toEqual([incomingHistory[3]]);
  });

  it('records a refill with the dispense details only', () => {
    const doxy = incomingHistory.find((r) => r.id === 'rxh-doxycycline')!;
    const chartDoxy = chartHistory.find(
      (r) => r.id === 'chart-doxycycline-old'
    )!;
    const set = buildChangeSet(
      [doxy],
      chartHistory,
      { [doxy.id]: { kind: 'fill', chartId: chartDoxy.id } },
      { [doxy.id]: { ...toMedication(doxy.medication), quantity: '99' } }
    );
    expect(set.changes).toEqual([
      {
        action: 'fill',
        incoming: doxy,
        fillOf: chartDoxy,
        fill: {
          fillDate: '2026-03-02',
          quantity: '20',
          quantityUnit: 'capsule',
          daysSupply: '10',
          refillsRemaining: '0',
          substitution: '0',
          pharmacy: doxy.pharmacy,
          prescriber: doxy.prescriber,
          prescriberName: 'Waterford-Fielding, Fielding',
        },
      },
    ]);
  });

  it('treats a refill of an unknown chart record as undecided', () => {
    const set = buildChangeSet(
      [sprycel],
      [],
      { [sprycel.id]: { kind: 'fill', chartId: 'missing' } },
      {}
    );
    expect(set.changes).toEqual([]);
    expect(set.undecided).toEqual([sprycel]);
  });
});
