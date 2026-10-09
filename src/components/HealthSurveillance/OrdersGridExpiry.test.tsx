import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../test/test-utils';
import { simulatedWorkflow } from '../PrescriptionReadiness/storyData';
import type { OrderRow } from './orderRows';
import type { PatientHistory } from './history';
import { ChartOrdersGrid, EncounterOrdersGrid } from './OrdersGrid';

vi.mock('../DataVisNITRO', async () => {
  const React = await import('react');
  return {
    DataVisNitroContext: React.createContext(null),
    DataVisNitroSource: ({
      url,
      children,
    }: {
      url: string;
      children: React.ReactNode;
    }) => (
      <section>
        <output data-testid="serialized-orders">{url}</output>
        {children}
      </section>
    ),
    DataVisNitroGrid: () => null,
  };
});
vi.mock('./ordersGridShared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./ordersGridShared')>()),
  useOrderRowsUrl: (rows: OrderRow[]) => JSON.stringify(rows),
}));

describe('grid prescription expiry projection', () => {
  it.each(['chart', 'encounter'] as const)(
    'refreshes %s serialized rows, counts, and filtering without new props',
    (surface) => {
      vi.useFakeTimers();
      vi.setSystemTime(Date.UTC(2026, 9, 3, 12));
      try {
        const readiness = simulatedWorkflow({
          review: 'pass',
          sign: 'pass',
          transmit: 'pass',
        });
        readiness.workflow!.expiresAt = '2026-10-03T12:00:01.000Z';
        const history: PatientHistory = {
          age: 40,
          sex: 'F',
          orders: [
            {
              key: 'SIM|A',
              orderId: 'rx-ui-1',
              prescriptionRevision: '1',
              prescribingIntent: 'prescribe',
              label: 'SimDrug A',
              status: 'pending',
              date: '2026-10-03',
              encounterId: 'encounter-1',
              prescriptionReadiness: readiness,
            },
          ],
        };
        renderWithTheme(
          surface === 'chart' ? (
            <ChartOrdersGrid
              history={history}
              programs={{}}
              includeDue={false}
            />
          ) : (
            <EncounterOrdersGrid
              history={history}
              programs={{}}
              encounterId="encounter-1"
            />
          )
        );
        expect(
          screen.getByText('0 prescriptions need attention')
        ).toBeVisible();
        expect(
          JSON.parse(screen.getByTestId('serialized-orders').textContent!)[0]
            .prescriptionReadiness
        ).toBe('send');
        fireEvent.change(screen.getByLabelText('Prescription readiness'), {
          target: { value: 'attention' },
        });
        expect(
          JSON.parse(screen.getByTestId('serialized-orders').textContent!)
        ).toEqual([]);
        act(() => {
          vi.advanceTimersByTime(1002);
        });
        expect(screen.getByText('1 prescription need attention')).toBeVisible();
        expect(
          JSON.parse(screen.getByTestId('serialized-orders').textContent!)
        ).toEqual([
          expect.objectContaining({
            orderId: 'rx-ui-1',
            prescriptionRevision: '1',
            prescriptionReadiness: 'unknown',
            prescriptionNeedsCompletion: 'true',
          }),
        ]);
      } finally {
        vi.useRealTimers();
      }
    }
  );
});
