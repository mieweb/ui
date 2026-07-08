import { describe, it, expect } from 'vitest';
import { buildChartOrderRows, buildEncounterOrderRows } from './orderRows';
import type { ProgramsMap } from './evaluate';
import type { PatientHistory } from './history';

const NOW = new Date('2026-07-04');

const PROGRAMS: ProgramsMap = {
  'OSHA|1910.95': {
    kind: 'surveillance',
    periodicityMonths: 12,
    orders: ['HCPCS|92551'],
  },
  'eCQM|CMS130': {
    kind: 'quality',
    periodicityMonths: 120,
    ageMin: 45,
    orders: [{ alt: ['HCPCS|G0121', 'HCPCS|G0328'] }],
  },
  'OSHA|1910.134': {
    kind: 'fitness',
    periodicityMonths: 12,
    orders: ['CPT|94010', { key: 'MIE|RMO-FFD', after: ['CPT|94010'] }],
  },
};

const HISTORY: PatientHistory = {
  age: 55,
  sex: 'F',
  orders: [
    {
      key: 'HCPCS|92551',
      label: 'Audiometry screening',
      status: 'completed',
      date: '2025-01-10',
      provider: 'Dr. Patel',
      requisitionId: 'REQ-2025-001',
      encounterId: 'ENC-2025-001',
    },
    {
      key: 'HCPCS|G0328',
      label: 'FIT test',
      status: 'pending',
      date: '2026-07-01',
      provider: 'Dr. Okafor',
      encounterId: 'ENC-2026-007',
    },
  ],
};

describe('buildChartOrderRows', () => {
  it('emits one row per history order with provider/requisition/encounter', () => {
    const rows = buildChartOrderRows(HISTORY, PROGRAMS, {
      enrolledKeys: ['OSHA|1910.95', 'OSHA|1910.134'],
      now: NOW,
    });
    const audio = rows.find(
      (r) => r.orderKey === 'HCPCS|92551' && r.status === 'completed'
    );
    expect(audio).toMatchObject({
      order: 'Audiometry screening',
      reasonKey: 'OSHA|1910.95',
      kind: 'surveillance',
      date: '2025-01-10',
      provider: 'Dr. Patel',
      requisitionId: 'REQ-2025-001',
      encounterId: 'ENC-2025-001',
    });

    const fit = rows.find((r) => r.orderKey === 'HCPCS|G0328');
    expect(fit).toMatchObject({
      status: 'pending',
      reasonKey: 'eCQM|CMS130',
      kind: 'quality measure',
      requisitionId: '', // unprocessed
      encounterId: 'ENC-2026-007',
    });
  });

  it('adds available rows for unplaced due orders and blocked rows for unmet prerequisites', () => {
    const rows = buildChartOrderRows(HISTORY, PROGRAMS, {
      enrolledKeys: ['OSHA|1910.95', 'OSHA|1910.134'],
      now: NOW,
    });
    // audiometry overdue (completed 2025-01, 12mo periodicity) → available again
    const audioDue = rows.find(
      (r) => r.orderKey === 'HCPCS|92551' && r.status !== 'completed'
    );
    // already placed once → suppressed (placed set); overdue re-order handled
    // by the due-list card, so no duplicate available row:
    expect(audioDue).toBeUndefined();

    // spirometry never placed → available
    const spiro = rows.find((r) => r.orderKey === 'CPT|94010');
    expect(spiro?.status).toBe('available');

    // RMO determination blocked until spirometry completes
    const rmo = rows.find((r) => r.orderKey === 'MIE|RMO-FFD');
    expect(rmo?.status).toBe('blocked');
    expect(rmo?.blockedBy).toContain('CPT|94010');

    // colonoscopy alternative of the pending FIT → still available
    const scope = rows.find((r) => r.orderKey === 'HCPCS|G0121');
    expect(scope?.status).toBe('available');
  });

  it('resolves reason to the program whose order set contains the key', () => {
    const rows = buildChartOrderRows(HISTORY, PROGRAMS, {
      enrolledKeys: ['OSHA|1910.95'],
      now: NOW,
      programLabels: { 'eCQM|CMS130': 'Colorectal cancer screening' },
    });
    const fit = rows.find((r) => r.orderKey === 'HCPCS|G0328');
    expect(fit?.reason).toBe('Colorectal cancer screening');
    expect(fit?.dueDate).toBe('');
  });

  it('omits due rows when includeDue is false', () => {
    const rows = buildChartOrderRows(HISTORY, PROGRAMS, {
      enrolledKeys: ['OSHA|1910.134'],
      now: NOW,
      includeDue: false,
    });
    expect(rows).toHaveLength(HISTORY.orders.length);
    expect(
      rows.every((r) => r.status === 'completed' || r.status === 'pending')
    ).toBe(true);
  });
});

describe('buildEncounterOrderRows', () => {
  it('keeps the encounter’s own orders plus available/blocked due rows', () => {
    const rows = buildEncounterOrderRows(HISTORY, PROGRAMS, 'ENC-2026-007', {
      enrolledKeys: ['OSHA|1910.95', 'OSHA|1910.134'],
      now: NOW,
    });
    // the other encounter's completed audiometry is excluded
    expect(rows.find((r) => r.encounterId === 'ENC-2025-001')).toBeUndefined();
    // this encounter's pending FIT is included
    expect(
      rows.find((r) => r.orderKey === 'HCPCS|G0328' && r.status === 'pending')
    ).toBeDefined();
    // actionable due orders remain placeable this visit
    expect(rows.find((r) => r.status === 'available')).toBeDefined();
    expect(rows.find((r) => r.status === 'blocked')).toBeDefined();
  });
});
