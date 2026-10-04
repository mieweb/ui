import { describe, expect, it } from 'vitest';
import { buildChartOrderRows } from './orderRows';
import { uiReadiness } from '../PrescriptionReadiness/storyData';
import type { PatientHistory } from './history';
describe('prescribing order instance projection', () => {
  it('keeps identical coded prescriptions separate and excludes historical completion', () => {
    const readiness = uiReadiness({ name: 'Lasix' });
    const history: PatientHistory = {
      age: 40,
      sex: 'F',
      orders: [
        {
          key: 'RxNorm|same',
          orderId: 'rx-ui-1',
          prescriptionRevision: '1',
          prescribingIntent: 'prescribe',
          label: 'Lasix',
          status: 'pending',
          date: '2026-10-03',
          prescriptionReadiness: readiness,
        },
        {
          key: 'RxNorm|same',
          orderId: 'rx-ui-2',
          prescriptionRevision: '2',
          prescribingIntent: 'prescribe',
          label: 'Lasix',
          status: 'pending',
          date: '2026-10-03',
          prescriptionReadiness: readiness,
        },
        {
          key: 'RxNorm|same',
          orderId: 'rx-old',
          prescribingIntent: 'prescribe',
          label: 'Lasix',
          status: 'completed',
          date: '2025-10-03',
          prescriptionReadiness: readiness,
        },
      ],
    };
    const rows = buildChartOrderRows(history, {}, { includeDue: false });
    expect(rows.map((row) => row.orderId)).toEqual([
      'rx-ui-1',
      'rx-ui-2',
      'rx-old',
    ]);
    expect(rows[0].prescriptionReadiness).toBe('incomplete');
    expect(rows[1].prescriptionReadiness).toBe('unknown');
    expect(rows[2].prescriptionReadiness).toBeUndefined();
    expect(JSON.parse(JSON.stringify(rows))[0].orderId).toBe('rx-ui-1');
  });
});
