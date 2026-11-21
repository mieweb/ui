import { describe, it, expect } from 'vitest';
import { orderToMedication, medicationToOrder } from './OrderEditor';
import type { AssessmentOrder } from '../Assessment';
import type { Medication } from '../MedicationList';

describe('orderToMedication / medicationToOrder', () => {
  const compoundOrder: AssessmentOrder = {
    orderId: 'o1',
    type: 'medication',
    display: 'hormone troche',
    uncodedType: 'CP',
    compoundIngredients: [
      {
        name: 'estradiol',
        strength: '0.5 mg',
        quantity: '1',
        quantityUnit: 'gram',
      },
    ],
  };

  it('round-trips uncodedType and compoundIngredients through the order', () => {
    const med = orderToMedication(compoundOrder);
    expect(med.uncodedType).toBe('CP');
    expect(med.compoundIngredients).toEqual(compoundOrder.compoundIngredients);

    const order = medicationToOrder(med, compoundOrder);
    expect(order.uncodedType).toBe('CP');
    expect(order.compoundIngredients).toEqual(
      compoundOrder.compoundIngredients
    );
  });

  it('clears uncodedType and compoundIngredients once the medication is coded', () => {
    const med: Medication = {
      id: 'o1',
      name: 'hormone troche',
      status: 'unreconciled',
      // coded — no longer a compound
      code: { system: 'RxNORM', code: '123' },
    };
    const order = medicationToOrder(med, compoundOrder);
    expect(order.uncodedType).toBeUndefined();
    expect(order.compoundIngredients).toBeUndefined();
  });
});
