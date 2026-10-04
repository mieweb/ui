import { describe, expect, it } from 'vitest';
import { orderToMedication, medicationToOrder } from './OrderEditor';
import type { AssessmentOrder } from '../Assessment';
import { completeUiPrescription } from '../PrescriptionReadiness/storyData';

describe('prescription adapters', () => {
  it('round trips canonical details and preserves order identity and metadata', () => {
    const order: AssessmentOrder = {
      orderId: 'rx1',
      type: 'medication',
      display: 'Old projection',
      detail: 'Old Sig',
      prescription: {
        ...completeUiPrescription,
        refills: '0',
        substitution: '1',
        startDate: '2026-10-04',
        endDate: '2026-11-04',
        writtenDate: '2026-10-03',
        daysSupply: '30',
        prn: true,
        prnReason: 'Demo symptom',
        maxDailyDose: '5',
      },
      concernId: 'concern1',
      priority: 'urgent',
      timing: 'next visit',
      prescribingIntent: 'prescribe',
      prescriptionRevision: '4',
    };
    const medication = orderToMedication(order);
    expect(medication.name).toBe('SimDrug A');
    const saved = medicationToOrder(medication, order);
    expect(saved.prescription).toEqual(order.prescription);
    expect(saved).toMatchObject({
      orderId: 'rx1',
      concernId: 'concern1',
      priority: 'urgent',
      timing: 'next visit',
      prescriptionRevision: '4',
      display: 'SimDrug A',
      detail: completeUiPrescription.sig,
    });
  });
  it('retains a free-text legacy draft without inferring authoritative details', () => {
    const order: AssessmentOrder = {
      orderId: 'rx1',
      type: 'medication',
      display: 'Lasix 20 mg tablet',
      detail: 'by mouth daily',
    };
    const medication = orderToMedication(order);
    expect(medication).toMatchObject({
      id: 'rx1',
      name: order.display,
      sig: order.detail,
    });
    expect(medication.strength).toBeUndefined();
    expect(medication.route).toBeUndefined();
    expect(medicationToOrder(medication, order).prescription?.name).toBe(
      order.display
    );
  });
  it('clears projected coding when the canonical coding is removed', () => {
    const order: AssessmentOrder = {
      orderId: 'rx1',
      type: 'medication',
      display: 'Drug',
      code: { fullid: 'old', codetype: 'RxNorm', fullcode: 'old' },
    };
    expect(
      medicationToOrder(
        { id: 'rx1', status: 'unreconciled', name: 'Changed drug' },
        order
      ).code
    ).toBeUndefined();
  });
});

it('does not resurrect obsolete projected directions or coding into a canonical draft', () => {
  const medication = orderToMedication({
    orderId: 'rx1',
    type: 'medication',
    display: 'Lasix',
    detail: 'Old directions',
    code: { fullid: 'old', codetype: 'RxNorm', fullcode: 'old' },
    prescription: { name: 'Lasix', quantity: '30' },
  });
  expect(medication.sig).toBeUndefined();
  expect(medication.code).toBeUndefined();
});
