import { describe, it, expect } from 'vitest';
import {
  evaluateProgram,
  evaluateDue,
  dueForOrder,
  isApplicable,
  normalizeOrders,
  flattenOrderKeys,
  completedKeys,
  type ProgramsMap,
} from './evaluate';
import type { PatientHistory } from './history';

const NOW = new Date('2026-07-04');

const hearing = {
  kind: 'surveillance' as const,
  periodicityMonths: 12,
  orders: ['HCPCS|92551', 'HCPCS|0209T'],
};
const mammo = {
  kind: 'quality' as const,
  periodicityMonths: 24,
  sex: 'F' as const,
  ageMin: 40,
  ageMax: 74,
  orders: ['HCPCS|77057'],
};
const hepB = {
  kind: 'surveillance' as const, // one-time (no periodicity)
  orders: ['CVX|45'],
};

const basePatient: PatientHistory = {
  age: 55,
  sex: 'F',
  orders: [],
};

describe('isApplicable', () => {
  it('gates by sex', () => {
    expect(isApplicable({ age: 55, sex: 'M' }, mammo)).toBe(false);
    expect(isApplicable({ age: 55, sex: 'F' }, mammo)).toBe(true);
  });
  it('gates by age range', () => {
    expect(isApplicable({ age: 39, sex: 'F' }, mammo)).toBe(false);
    expect(isApplicable({ age: 75, sex: 'F' }, mammo)).toBe(false);
    expect(isApplicable({ age: 40, sex: 'F' }, mammo)).toBe(true);
  });
});

describe('evaluateProgram', () => {
  it('is due when history is silent', () => {
    const item = evaluateProgram('OSHA|1910.95', hearing, basePatient, NOW);
    expect(item.status).toBe('due');
  });

  it('is satisfied within the periodicity window', () => {
    const item = evaluateProgram(
      'OSHA|1910.95',
      hearing,
      {
        ...basePatient,
        orders: [
          { key: 'HCPCS|92551', status: 'completed', date: '2026-01-15' },
        ],
      },
      NOW
    );
    expect(item.status).toBe('satisfied');
    expect(item.lastCompleted).toBe('2026-01-15');
    expect(item.dueDate).toBe('2027-01-15');
  });

  it('is overdue past the periodicity window', () => {
    const item = evaluateProgram(
      'OSHA|1910.95',
      hearing,
      {
        ...basePatient,
        orders: [
          { key: 'HCPCS|92551', status: 'completed', date: '2024-05-01' },
        ],
      },
      NOW
    );
    expect(item.status).toBe('overdue');
    expect(item.dueDate).toBe('2025-05-01');
  });

  it('pending order suppresses due', () => {
    const item = evaluateProgram(
      'OSHA|1910.95',
      hearing,
      {
        ...basePatient,
        orders: [{ key: 'HCPCS|92551', status: 'pending', date: '2026-06-30' }],
      },
      NOW
    );
    expect(item.status).toBe('pending');
    expect(item.pendingKeys).toEqual(['HCPCS|92551']);
  });

  it('one-time program stays satisfied once completed', () => {
    const item = evaluateProgram(
      'OSHA|1910.1030',
      hepB,
      {
        ...basePatient,
        immunizations: [{ key: 'CVX|45', date: '2015-03-10' }],
      },
      NOW
    );
    expect(item.status).toBe('satisfied');
  });

  it('procedures and immunizations count as completions', () => {
    const item = evaluateProgram(
      'eCQM|CMS125',
      mammo,
      {
        ...basePatient,
        procedures: [{ key: 'HCPCS|77057', date: '2025-09-01' }],
      },
      NOW
    );
    expect(item.status).toBe('satisfied');
  });

  it('uses the most recent completion', () => {
    const item = evaluateProgram(
      'OSHA|1910.95',
      hearing,
      {
        ...basePatient,
        orders: [
          { key: 'HCPCS|92551', status: 'completed', date: '2023-01-01' },
          { key: 'HCPCS|0209T', status: 'completed', date: '2026-02-01' },
        ],
      },
      NOW
    );
    expect(item.status).toBe('satisfied');
    expect(item.lastCompleted).toBe('2026-02-01');
  });
});

describe('evaluateDue', () => {
  const programs: ProgramsMap = {
    'OSHA|1910.95': hearing,
    'eCQM|CMS125': mammo,
    'OSHA|1910.1030': hepB,
  };

  it('sorts overdue before due before satisfied and applies enrollment', () => {
    const items = evaluateDue(
      {
        ...basePatient,
        orders: [
          { key: 'HCPCS|92551', status: 'completed', date: '2024-01-01' },
        ],
        immunizations: [{ key: 'CVX|45', date: '2015-03-10' }],
      },
      programs,
      { enrolledKeys: ['OSHA|1910.95', 'OSHA|1910.1030'], now: NOW }
    );
    expect(items.map((i) => [i.key, i.status])).toEqual([
      ['OSHA|1910.95', 'overdue'],
      ['eCQM|CMS125', 'due'], // quality applies regardless of enrollment
      ['OSHA|1910.1030', 'satisfied'],
    ]);
  });

  it('excludes unenrolled occupational programs and not-applicable measures', () => {
    const items = evaluateDue(
      { age: 30, sex: 'M', orders: [] },
      programs,
      { enrolledKeys: [], now: NOW }
    );
    // hearing/hepB unenrolled; mammo not applicable (sex/age)
    expect(items).toEqual([]);
  });
});

describe('dueForOrder', () => {
  it('flags order keys belonging to due programs', () => {
    const items = evaluateDue(basePatient, { 'OSHA|1910.95': hearing }, {
      enrolledKeys: ['OSHA|1910.95'],
      now: NOW,
    });
    expect(dueForOrder('HCPCS|92551', items).map((i) => i.key)).toEqual([
      'OSHA|1910.95',
    ]);
    expect(dueForOrder('HCPCS|77057', items)).toEqual([]);
  });
});

describe('structured orders — alternatives & dependencies', () => {
  const colorectal = {
    kind: 'quality' as const,
    periodicityMonths: 120,
    // one-of: colonoscopy OR FIT
    orders: [{ alt: ['HCPCS|44388', 'LabCorp Order|182949'] }],
  };
  const ffd = {
    kind: 'fitness' as const,
    periodicityMonths: 12,
    orders: [
      'HCPCS|99173',
      { alt: ['HCPCS|92551', 'HCPCS|0209T'] },
      // RMO determination depends on completed results (Gantt edge)
      { key: 'LOINC|85216-0', after: ['HCPCS|99173'] },
    ],
  };

  it('normalizeOrders handles strings, alt groups and dependencies', () => {
    expect(normalizeOrders(ffd.orders)).toEqual([
      { keys: ['HCPCS|99173'], after: [] },
      { keys: ['HCPCS|92551', 'HCPCS|0209T'], after: [] },
      { keys: ['LOINC|85216-0'], after: ['HCPCS|99173'] },
    ]);
    expect(flattenOrderKeys(colorectal.orders)).toEqual([
      'HCPCS|44388',
      'LabCorp Order|182949',
    ]);
  });

  it('either alternative satisfies the program', () => {
    const item = evaluateProgram(
      'eCQM|CMS130',
      colorectal,
      {
        ...basePatient,
        orders: [
          {
            key: 'LabCorp Order|182949', // FIT, not colonoscopy
            status: 'completed',
            date: '2026-01-01',
          },
        ],
      },
      NOW
    );
    expect(item.status).toBe('satisfied');
  });

  it('completedKeys unlocks dependent orders from any completion source', () => {
    const done = completedKeys({
      ...basePatient,
      orders: [{ key: 'HCPCS|99173', status: 'completed', date: '2026-06-01' }],
      procedures: [{ key: 'HCPCS|G0403', date: '2026-06-01' }],
      immunizations: [{ key: 'CVX|88', date: '2025-10-01' }],
    });
    expect(done.has('HCPCS|99173')).toBe(true);
    expect(done.has('HCPCS|G0403')).toBe(true);
    expect(done.has('CVX|88')).toBe(true);
    expect(done.has('LOINC|85216-0')).toBe(false);
  });

  it('a dependent completion satisfies like any other', () => {
    const item = evaluateProgram(
      'OPM|GS-1811',
      ffd,
      {
        ...basePatient,
        orders: [
          { key: 'LOINC|85216-0', status: 'completed', date: '2026-05-01' },
        ],
      },
      NOW
    );
    expect(item.status).toBe('satisfied');
  });
});
