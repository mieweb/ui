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
        concernId: 'concern1',
        indication: 'Hypertension',
        indicationCode: {
          system: 'ICD-10-CM',
          code: 'I10',
          display: 'Essential hypertension',
          version: '2026',
        },
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
  it('uses the current durable assessment link when an order has been moved to another concern', () => {
    const order: AssessmentOrder = {
      orderId: 'rx1',
      type: 'medication',
      display: 'Drug',
      concernId: 'current-concern',
      prescription: { name: 'Drug', concernId: 'previous-concern' },
    };
    const medication = orderToMedication(order);
    expect(medication.concernId).toBe('current-concern');
    const saved = medicationToOrder(medication, order);
    expect(saved.concernId).toBe('current-concern');
    expect(saved.prescription?.concernId).toBe('current-concern');
  });
  it('clears explicit concern links while preserving legacy omitted links', () => {
    const order: AssessmentOrder = {
      orderId: 'rx1',
      type: 'medication',
      display: 'Drug',
      concernId: 'concern1',
      prescription: { name: 'Drug', concernId: 'concern1' },
    };
    const medication = {
      id: 'rx1',
      status: 'unreconciled' as const,
      name: 'Drug',
    };
    const preserved = medicationToOrder(medication, order);
    expect(preserved.concernId).toBe('concern1');
    expect(preserved.prescription?.concernId).toBe('concern1');
    const cleared = medicationToOrder(
      { ...medication, concernId: undefined },
      order
    );
    expect(cleared.concernId).toBeUndefined();
    expect(cleared.prescription?.concernId).toBeUndefined();
    expect(
      orderToMedication({ ...order, concernId: undefined }).concernId
    ).toBeUndefined();
  });
  it('retains a canonical concern link when the legacy order has no link property', () => {
    const order: AssessmentOrder = {
      orderId: 'rx1',
      type: 'medication',
      display: 'Drug',
      prescription: { name: 'Drug', concernId: 'canonical-concern' },
    };
    expect(orderToMedication(order).concernId).toBe('canonical-concern');
    expect(medicationToOrder(orderToMedication(order), order).concernId).toBe(
      'canonical-concern'
    );
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
