import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, renderHook, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  getPrescriptionReadinessState,
  createPrescriptionPreview,
  usePrescriptionClock,
  PrescriptionIssueSummary,
} from './PrescriptionReadiness';
import {
  completeUiPrescription,
  prescribingUiConfiguration,
  simulatedWorkflow,
  uiReadiness,
} from './storyData';
const identity = { expectedOrderId: 'rx-ui-1', expectedOrderRevision: '1' };
describe('prescription readiness presentation', () => {
  it('distinguishes local complete fields from host-confirmed send eligibility', () => {
    expect(
      getPrescriptionReadinessState({
        ...identity,
        readiness: uiReadiness(completeUiPrescription),
      })
    ).toBe('complete');
    expect(
      getPrescriptionReadinessState({
        ...identity,
        readiness: simulatedWorkflow({
          review: 'pass',
          sign: 'pass',
          transmit: 'pass',
        }),
      })
    ).toBe('send');
  });
  it('does not trust a stale or unrelated result', () => {
    const readiness = simulatedWorkflow({
      review: 'pass',
      sign: 'pass',
      transmit: 'pass',
    });
    expect(
      getPrescriptionReadinessState({
        ...identity,
        expectedOrderRevision: '2',
        readiness,
      })
    ).toBe('unknown');
    expect(
      getPrescriptionReadinessState({
        ...identity,
        expectedOrderId: 'another-order',
        readiness,
      })
    ).toBe('unknown');
    expect(
      getPrescriptionReadinessState({
        ...identity,
        readiness: {
          ...readiness,
          workflow: { ...readiness.workflow!, validity: 'expired' },
        },
      })
    ).toBe('unknown');
    expect(getPrescriptionReadinessState({ readiness })).toBe('unknown');
  });
  it('renders text, reasons, and completion for a name-only draft', () => {
    const complete = vi.fn();
    renderWithTheme(
      <PrescriptionIssueSummary
        {...identity}
        medicationName="Lasix"
        readiness={uiReadiness({ name: 'Lasix' })}
        onCompletePrescription={complete}
      />
    );
    expect(screen.getByText('Needs prescription details')).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', { name: 'Complete prescription: Lasix' })
    );
    expect(complete).toHaveBeenCalledWith(
      expect.objectContaining({ remediation: 'edit-prescription' })
    );
  });
  it('keeps reasons visible while hiding mutations for read-only users', () => {
    renderWithTheme(
      <PrescriptionIssueSummary
        {...identity}
        readOnly
        readiness={uiReadiness({ name: 'Lasix' })}
        onCompletePrescription={vi.fn()}
        onIssueAction={vi.fn()}
      />
    );
    expect(screen.getByText('Needs prescription details')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('always marks simulated authority', () => {
    renderWithTheme(
      <PrescriptionIssueSummary
        {...identity}
        readiness={simulatedWorkflow({
          review: 'pass',
          sign: 'pass',
          transmit: 'unknown',
        })}
      />
    );
    expect(screen.getByText('Simulation')).toBeVisible();
  });
});

describe('prescription expiry and unresolved context', () => {
  it('expires a passing host projection without an API response', () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.UTC(2026, 9, 3, 12));
    try {
      const readiness = simulatedWorkflow({
        review: 'pass',
        sign: 'pass',
        transmit: 'pass',
      });
      readiness.workflow!.expiresAt = '2026-10-03T12:00:01.000Z';
      renderWithTheme(
        <PrescriptionIssueSummary {...identity} readiness={readiness} />
      );
      expect(screen.getByText('Ready to send')).toBeVisible();
      act(() => {
        vi.advanceTimersByTime(1002);
      });
      expect(screen.queryByText('Ready to send')).not.toBeInTheDocument();
      expect(screen.getAllByText('Readiness not checked')[0]).toBeVisible();
    } finally {
      vi.useRealTimers();
    }
  });
  it('accepts an injected simulation clock and rejects invalid or elapsed expiry', () => {
    const readiness = simulatedWorkflow({
      review: 'pass',
      sign: 'pass',
      transmit: 'pass',
    });
    readiness.workflow!.expiresAt = '2026-10-03T13:00:00.000Z';
    expect(
      getPrescriptionReadinessState({
        ...identity,
        readiness,
        now: '2026-10-03T12:00:00.000Z',
      })
    ).toBe('send');
    expect(
      getPrescriptionReadinessState({
        ...identity,
        readiness,
        now: '2026-10-03T13:00:00.000Z',
      })
    ).toBe('unknown');
  });
  it('preserves host references and local field issues while patient facts are unknown', () => {
    const result = createPrescriptionPreview(
      { name: 'Lasix' },
      {
        ...prescribingUiConfiguration,
        references: {
          patientId: 'patient-demo',
          prescriberId: 'prescriber-demo',
        },
        input: {
          ...prescribingUiConfiguration.input,
          context: {
            ...prescribingUiConfiguration.input.context,
            patient: {
              state: 'unknown',
              reason: 'Patient details are unavailable.',
            },
          },
        },
      }
    )!;
    expect(
      result.validation.issues.some((issue) => issue.code === 'INPUT_MALFORMED')
    ).toBe(false);
    expect(
      result.validation.issues.some(
        (issue) => issue.fieldPath === 'prescription.strength'
      )
    ).toBe(true);
    expect(result.validation.checks.review).not.toBe('pass');
  });
});

it('preserves a matching delivery receipt after clinical workflow expiry', () => {
  const readiness = simulatedWorkflow({
    review: 'pass',
    sign: 'pass',
    transmit: 'pass',
  });
  readiness.workflow!.expiresAt = '2026-10-03T12:00:01.000Z';
  expect(
    getPrescriptionReadinessState({
      ...identity,
      readiness: { ...readiness, delivery: 'sent' },
      now: '2026-10-03T13:00:00.000Z',
    })
  ).toBe('sent');
  expect(
    getPrescriptionReadinessState({
      ...identity,
      readiness: { ...readiness, delivery: 'failed' },
      now: '2026-10-03T13:00:00.000Z',
    })
  ).toBe('failed');
  expect(
    getPrescriptionReadinessState({
      ...identity,
      readiness,
      now: '2026-10-03T13:00:00.000Z',
    })
  ).toBe('unknown');
});

it('rejects date-less or timezone-less workflow timestamps and injected clocks', () => {
  const readiness = simulatedWorkflow({
    review: 'pass',
    sign: 'pass',
    transmit: 'pass',
  });
  for (const expiresAt of [
    '13:00:00',
    '2026-10-03',
    '2026-10-03T13:00:00',
    '',
  ]) {
    expect(
      getPrescriptionReadinessState({
        ...identity,
        readiness: {
          ...readiness,
          workflow: { ...readiness.workflow!, expiresAt },
        },
        now: '2026-10-03T12:00:00Z',
      })
    ).toBe('unknown');
  }
  expect(
    getPrescriptionReadinessState({ ...identity, readiness, now: '12:00:00' })
  ).toBe('unknown');
});

it('reschedules capped expiry timers and disposes the outstanding timer', () => {
  vi.useFakeTimers();
  const beginning = Date.UTC(2026, 9, 3, 12);
  vi.setSystemTime(beginning);
  try {
    const expiresAt = new Date(beginning + 2147483647 + 1000).toISOString();
    const { result, unmount } = renderHook(() =>
      usePrescriptionClock(expiresAt)
    );
    const initial = result.current;
    expect(vi.getTimerCount()).toBe(1);
    act(() => {
      vi.advanceTimersByTime(2147483647);
    });
    expect(result.current).toBe(initial);
    expect(vi.getTimerCount()).toBe(1);
    act(() => {
      vi.advanceTimersByTime(1002);
    });
    expect(result.current).not.toBe(initial);
    expect(vi.getTimerCount()).toBe(0);
    unmount();
    const pending = renderHook(() =>
      usePrescriptionClock(new Date(beginning + 2147483647 * 2).toISOString())
    );
    expect(vi.getTimerCount()).toBe(1);
    pending.unmount();
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});
