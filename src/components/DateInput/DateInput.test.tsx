import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { DateInput } from './DateInput';

describe('DateInput', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows only calendar years within its date bounds', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <DateInput
        label="Service date"
        minDate="07/19/2001"
        maxDate="07/19/2025"
        showCalendar
      />
    );

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));

    const years = Array.from(
      screen.getByLabelText('Select year').querySelectorAll('option')
    ).map((option) => option.textContent);

    expect(years).toEqual(
      Array.from({ length: 25 }, (_, index) => String(2001 + index))
    );
  });

  it('does not select an out-of-range month', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithTheme(
      <DateInput
        label="Service month"
        inputType="month"
        value="2025-07"
        minDate="07/15/2025"
        maxDate="08/15/2025"
        onChange={onChange}
        showCalendar
      />
    );

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    await user.click(screen.getByRole('button', { name: 'Jun' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps Today enabled for a partially valid current month', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 27));
    const onChange = vi.fn();

    renderWithTheme(
      <DateInput
        label="Service month"
        inputType="month"
        minDate="07/28/2026"
        maxDate="08/10/2026"
        onChange={onChange}
        showCalendar
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));

    const todayButton = screen.getByRole('button', { name: 'Today' });
    expect(todayButton).toBeEnabled();

    fireEvent.click(todayButton);

    expect(onChange).toHaveBeenCalledWith('2026-07');
  });
});
