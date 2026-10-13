import { describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  renderHook,
  screen,
  within,
} from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  getPrescriptionReadinessState,
  createPrescriptionPreview,
  getPrescriptionIssues,
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
  it('starts floating alerts collapsed and links the toggle to its scrollable issue region', () => {
    const readiness = uiReadiness({ name: 'Lasix' });
    const complete = vi.fn();
    const resolve = vi.fn();
    renderWithTheme(
      <PrescriptionIssueSummary
        {...identity}
        presentation="floating"
        medicationName="Lasix"
        readiness={readiness}
        onCompletePrescription={complete}
        onIssueAction={resolve}
      />
    );
    const toggle = screen.getByRole('button', {
      name: /^Expand prescription issues: Lasix,/,
    });
    const issueCount = getPrescriptionIssues({ ...identity, readiness }).length;
    expect(within(toggle).getByText(`${issueCount} issues`)).toBeVisible();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Complete prescription: Lasix' })
    ).not.toBeInTheDocument();

    fireEvent.click(toggle);
    const region = screen.getByRole('region', {
      name: 'Prescription issues: Lasix',
    });
    expect(toggle).toHaveAttribute('aria-controls', region.id);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(region).toHaveAttribute('tabindex', '0');
    fireEvent.click(
      within(region).getAllByRole('button', { name: /^Resolve issue:/ })[0]
    );
    expect(resolve).toHaveBeenCalledWith(readiness.validation.issues[0]);
    fireEvent.click(
      within(region).getByRole('button', {
        name: 'Complete prescription: Lasix',
      })
    );
    expect(complete).toHaveBeenCalledWith(
      expect.objectContaining({ remediation: 'edit-prescription' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: /^Collapse prescription issues:/ })
    );
    expect(region).not.toBeVisible();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
  it('allows read-only users to expand floating reasons without offering mutations', () => {
    renderWithTheme(
      <PrescriptionIssueSummary
        {...identity}
        presentation="floating"
        floatingPlacement="container"
        medicationName="Lasix"
        readOnly
        readiness={uiReadiness({ name: 'Lasix' })}
        onCompletePrescription={vi.fn()}
        onIssueAction={vi.fn()}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: /^Expand prescription issues:/ })
    );
    expect(
      screen.getByText(
        'An authorized team member can complete this prescription.'
      )
    ).toBeVisible();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
  it('removes resolved floating alerts and reappears collapsed when a new issue arrives', () => {
    const { rerender } = renderWithTheme(
      <PrescriptionIssueSummary
        {...identity}
        presentation="floating"
        medicationName="Lasix"
        readiness={uiReadiness({ name: 'Lasix' })}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: /^Expand prescription issues:/ })
    );
    expect(screen.getByRole('list')).toBeVisible();
    rerender(
      <PrescriptionIssueSummary
        {...identity}
        presentation="floating"
        medicationName="SimDrug A"
        readiness={uiReadiness(completeUiPrescription)}
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Details complete')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    rerender(
      <PrescriptionIssueSummary
        {...identity}
        presentation="floating"
        medicationName="SimDrug A"
        readiness={uiReadiness({ ...completeUiPrescription, quantity: '-1' })}
      />
    );
    expect(screen.getByText('Prescription needs correction')).toBeVisible();
    expect(
      screen.getByRole('button', { name: /^Expand prescription issues:/ })
    ).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
  it.each([
    ['complete', uiReadiness(completeUiPrescription)],
    [
      'review',
      simulatedWorkflow({ review: 'pass', sign: 'pass', transmit: 'unknown' }),
    ],
    [
      'send',
      simulatedWorkflow({ review: 'pass', sign: 'pass', transmit: 'pass' }),
    ],
    [
      'sent',
      {
        ...simulatedWorkflow({
          review: 'pass',
          sign: 'pass',
          transmit: 'pass',
        }),
        delivery: 'sent' as const,
      },
    ],
  ])(
    'hides issue-free %s floating readiness while retaining inline success',
    (_, readiness) => {
      const { rerender } = renderWithTheme(
        <PrescriptionIssueSummary
          {...identity}
          presentation="floating"
          readiness={readiness}
        />
      );
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      rerender(
        <PrescriptionIssueSummary {...identity} readiness={readiness} />
      );
      expect(screen.getByRole('status')).toBeVisible();
      expect(
        screen.getByText('No unresolved prescription issues.')
      ).toBeVisible();
    }
  );
  it.each([
    ['unavailable', undefined],
    [
      'stale',
      {
        ...uiReadiness(completeUiPrescription),
        validation: {
          ...uiReadiness(completeUiPrescription).validation,
          orderRevision: 'old-revision',
        },
      },
    ],
    [
      'unknown',
      simulatedWorkflow({
        review: 'unknown',
        sign: 'unknown',
        transmit: 'unknown',
      }),
    ],
    [
      'blocked',
      simulatedWorkflow({
        review: 'fail',
        sign: 'unknown',
        transmit: 'unknown',
      }),
    ],
    [
      'sending',
      {
        ...simulatedWorkflow({
          review: 'pass',
          sign: 'pass',
          transmit: 'pass',
        }),
        delivery: 'sending' as const,
      },
    ],
    [
      'failed',
      {
        ...simulatedWorkflow({
          review: 'pass',
          sign: 'pass',
          transmit: 'pass',
        }),
        delivery: 'failed' as const,
      },
    ],
  ])(
    'retains issue-free %s floating readiness instead of implying success',
    (_, readiness) => {
      renderWithTheme(
        <PrescriptionIssueSummary
          {...identity}
          presentation="floating"
          readiness={readiness}
        />
      );
      expect(
        screen.getByRole('button', { name: /^Expand prescription issues:/ })
      ).toBeVisible();
      expect(screen.getByRole('status')).toBeVisible();
    }
  );
  it('returns focus from a disappearing toggle to its available entry control', () => {
    const content = (complete: boolean) => (
      <>
        <button type="button">Check prescription</button>
        <PrescriptionIssueSummary
          {...identity}
          presentation="floating"
          readiness={uiReadiness(
            complete ? completeUiPrescription : { name: 'Lasix' }
          )}
        />
      </>
    );
    const { rerender } = renderWithTheme(content(false));
    const entry = screen.getByRole('button', { name: 'Check prescription' });
    act(() => entry.focus());
    act(() =>
      screen
        .getByRole('button', { name: /^Expand prescription issues:/ })
        .focus()
    );
    rerender(content(true));
    expect(entry).toHaveFocus();
  });
  it('keeps focus on an input being edited when resolved floating alerts disappear', () => {
    const content = (complete: boolean) => (
      <>
        <button type="button">Check prescription</button>
        <input aria-label="Quantity" defaultValue="30" />
        <PrescriptionIssueSummary
          {...identity}
          presentation="floating"
          readiness={uiReadiness(
            complete ? completeUiPrescription : { name: 'Lasix' }
          )}
        />
      </>
    );
    const { rerender } = renderWithTheme(content(false));
    act(() =>
      screen.getByRole('button', { name: 'Check prescription' }).focus()
    );
    act(() =>
      screen
        .getByRole('button', { name: /^Expand prescription issues:/ })
        .focus()
    );
    const input = screen.getByRole('textbox', { name: 'Quantity' });
    act(() => input.focus());
    rerender(content(true));
    expect(input).toHaveFocus();
    expect(
      screen.queryByRole('button', { name: /^Expand prescription issues:/ })
    ).not.toBeInTheDocument();
  });
});

it('shares revision-scoped, deduplicated local issues while removing expired workflow issues', () => {
  const readiness = uiReadiness({ name: 'Lasix' });
  const [localIssue] = readiness.validation.issues;
  const workflow = simulatedWorkflow({
    review: 'fail',
    sign: 'unknown',
    transmit: 'unknown',
  }).workflow!;
  const externalIssue = {
    ...localIssue,
    code: 'SYNTHETIC_EXTERNAL_REVIEW',
    fieldPath: 'context.medications',
    message: 'Synthetic review is required.',
  };
  readiness.workflow = {
    ...workflow,
    expiresAt: '2026-10-03T13:00:00.000Z',
    issues: [localIssue, externalIssue],
  };
  const current = getPrescriptionIssues({
    ...identity,
    readiness,
    now: '2026-10-03T12:00:00.000Z',
  });
  expect(
    current.filter(
      (issue) =>
        issue.code === localIssue.code &&
        issue.fieldPath === localIssue.fieldPath
    )
  ).toHaveLength(1);
  expect(current).toContain(externalIssue);
  expect(
    getPrescriptionIssues({
      ...identity,
      readiness,
      now: '2026-10-03T13:00:00.000Z',
    })
  ).toEqual(readiness.validation.issues);
  expect(
    getPrescriptionIssues({
      ...identity,
      expectedOrderRevision: '2',
      readiness,
      now: '2026-10-03T12:00:00.000Z',
    })
  ).toEqual([]);
});

describe('prescription expiry and unresolved context', () => {
  it('reappears when an issue-free passing workflow expires without a server response', () => {
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
        <PrescriptionIssueSummary
          {...identity}
          presentation="floating"
          readiness={readiness}
        />
      );
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(1002);
      });
      expect(
        within(screen.getByRole('status')).getByText('Readiness not checked')
      ).toBeVisible();
      expect(
        screen.getByRole('button', { name: /^Expand prescription issues:/ })
      ).toHaveAttribute('aria-expanded', 'false');
    } finally {
      vi.useRealTimers();
    }
  });
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
