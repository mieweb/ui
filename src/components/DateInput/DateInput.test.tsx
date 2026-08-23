import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { DateInput } from './DateInput';

describe('DateInput', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes the Input density slots when it renders its own markup', () => {
    renderWithTheme(
      <DateInput label="Service date" helperText="MM/DD/YYYY" showCalendar />
    );

    expect(screen.getByLabelText('Service date')).toHaveAttribute(
      'data-slot',
      'input'
    );
    expect(screen.getByText('Service date')).toHaveAttribute(
      'data-slot',
      'input-label'
    );
    expect(screen.getByText('MM/DD/YYYY')).toHaveAttribute(
      'data-slot',
      'input-helper'
    );
    expect(
      screen.getByRole('button', { name: 'Open calendar' })
    ).toHaveAttribute('data-slot', 'date-input-trigger');
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

  describe('inputType="time"', () => {
    it('displays the value in 12-hour format', () => {
      renderWithTheme(
        <DateInput
          label="Start time"
          inputType="time"
          timeFormat="12-hour"
          value="15:30"
        />
      );

      expect(screen.getByLabelText('Start time')).toHaveValue('3:30 PM');
    });

    it('displays the value in 24-hour format by default', () => {
      renderWithTheme(
        <DateInput label="Start time" inputType="time" value="15:30" />
      );

      expect(screen.getByLabelText('Start time')).toHaveValue('15:30');
    });

    it('emits HH:MM when picking a time', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      renderWithTheme(
        <DateInput
          label="Start time"
          inputType="time"
          timeFormat="12-hour"
          value="08:00"
          onChange={onChange}
        />
      );

      await user.click(
        screen.getByRole('button', { name: 'Open time picker' })
      );
      await user.selectOptions(screen.getByLabelText('Select hour'), '09');

      expect(onChange).toHaveBeenCalledWith('09:00');
    });

    it('converts to PM via the meridiem select', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      renderWithTheme(
        <DateInput
          label="Start time"
          inputType="time"
          timeFormat="12-hour"
          value="08:30"
          onChange={onChange}
        />
      );

      await user.click(
        screen.getByRole('button', { name: 'Open time picker' })
      );
      await user.selectOptions(screen.getByLabelText('Select AM or PM'), 'PM');

      expect(onChange).toHaveBeenCalledWith('20:30');
    });

    it('shows no calendar grid in the time picker dialog', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <DateInput label="Start time" inputType="time" value="08:00" />
      );

      await user.click(
        screen.getByRole('button', { name: 'Open time picker' })
      );

      const dialog = screen.getByRole('dialog', { name: 'Choose time' });
      expect(dialog).toBeInTheDocument();
      expect(screen.queryByLabelText('Select month')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
    });

    it('limits minutes to the minuteStep increment', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <DateInput
          label="Start time"
          inputType="time"
          minuteStep={15}
          value="08:00"
        />
      );

      await user.click(
        screen.getByRole('button', { name: 'Open time picker' })
      );

      const minutes = Array.from(
        screen.getByLabelText('Select minute').querySelectorAll('option')
      ).map((option) => option.value);

      expect(minutes).toEqual(['00', '15', '30', '45']);
    });

    it('keeps an off-step value selectable', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <DateInput
          label="Start time"
          inputType="time"
          minuteStep={15}
          value="08:37"
        />
      );

      await user.click(
        screen.getByRole('button', { name: 'Open time picker' })
      );

      expect(screen.getByLabelText('Select minute')).toHaveValue('37');
    });
  });
});
