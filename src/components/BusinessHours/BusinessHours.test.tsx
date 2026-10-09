import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { CompactHours, OpenStatusBadge } from './BusinessHours';

afterEach(() => vi.useRealTimers());

// Wednesday 2026-09-30, 22:30 local time
const lateEvening = new Date(2026, 8, 30, 22, 30);

describe('BusinessHours open status', () => {
  it.each(['00:00', '23:59'])(
    'treats a %s close after an opening time as end of day',
    (end) => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(lateEvening);
      renderWithTheme(
        <CompactHours
          schedule={{
            officeHours: [{ day: 3, hours: [{ start: '09:00', end }] }],
          }}
        />
      );
      expect(screen.getByText('Open Now')).toBeInTheDocument();
    }
  );

  it('is closed after a normal closing time', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(lateEvening);
    renderWithTheme(
      <CompactHours
        schedule={{
          officeHours: [{ day: 3, hours: [{ start: '09:00', end: '17:00' }] }],
        }}
      />
    );
    expect(screen.queryByText('Open Now')).not.toBeInTheDocument();
  });

  it('OpenStatusBadge renders both states', () => {
    const { rerender } = renderWithTheme(<OpenStatusBadge isOpen />);
    expect(screen.getByText('Open Now')).toBeInTheDocument();
    rerender(<OpenStatusBadge isOpen={false} />);
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });
});
