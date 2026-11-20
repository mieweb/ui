import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { DateInput } from './DateInput';

describe('DateInput', () => {
  it.each([false, true])(
    'supports regional text entry with showCalendar=%s',
    (showCalendar) => {
      const onChange = vi.fn();
      renderWithTheme(
        <DateInput
          label="Regional date"
          locale="en-GB"
          value="11/09/2026"
          onChange={onChange}
          showCalendar={showCalendar}
          validateOnBlur
        />
      );
      const input = screen.getByLabelText('Regional date');
      expect(input).toHaveValue('09/11/2026');
      expect(input).toHaveAttribute('placeholder', 'DD/MM/YYYY');
      fireEvent.change(input, { target: { value: '10/11/2026' } });
      expect(onChange).toHaveBeenLastCalledWith('11/10/2026');
      fireEvent.change(input, { target: { value: '31/02/2026' } });
      fireEvent.blur(input);
      expect(screen.getByRole('alert')).toHaveTextContent('DD/MM/YYYY');
      expect(onChange).toHaveBeenCalledTimes(1);
      fireEvent.change(input, { target: { value: '' } });
      expect(onChange).toHaveBeenLastCalledWith('');
    }
  );

  it('keeps styled calendar selection in regional order and emits the existing value format', async () => {
    const onChange = vi.fn();
    renderWithTheme(
      <DateInput
        label="Regional date"
        locale="de-DE"
        value="11/09/2026"
        onChange={onChange}
        showCalendar
      />
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Open calendar' })
    );
    await userEvent.click(screen.getByRole('button', { name: '10' }));
    expect(screen.getByLabelText('Regional date')).toHaveValue('10.11.2026');
    expect(onChange).toHaveBeenLastCalledWith('11/10/2026');
  });

  it.each([undefined, 'en-GB'])(
    'preserves controlled calendar validation errors with locale=%s',
    (locale) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 10, 9, 12));
      function ControlledDate() {
        const [value, setValue] = useState('11/09/2026');
        return (
          <>
            <DateInput
              label="Past date"
              value={value}
              onChange={setValue}
              locale={locale}
              mode="past"
              validateOnBlur
              showCalendar
            />
            <button onClick={() => setValue('11/08/2026')}>Replace date</button>
          </>
        );
      }

      renderWithTheme(<ControlledDate />);
      fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
      fireEvent.click(screen.getByRole('button', { name: '10' }));
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Date must be in the past'
      );
      expect(screen.getByLabelText('Past date')).toHaveValue(
        locale ? '10/11/2026' : '11/10/2026'
      );
      fireEvent.click(screen.getByRole('button', { name: 'Replace date' }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Past date')).toHaveValue(
        locale ? '08/11/2026' : '11/08/2026'
      );
    }
  );

  it.each([
    ['ko-KR', '2026. 11. 09.'],
    ['bg-BG', '09.11.2026 г.'],
  ])(
    'allows Backspace through generated suffixes for %s',
    async (locale, text) => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onValidityChange = vi.fn();
      renderWithTheme(
        <DateInput
          label="Regional date"
          locale={locale}
          value="11/09/2026"
          onChange={onChange}
          onValidityChange={onValidityChange}
        />
      );
      const input = screen.getByLabelText('Regional date');
      expect(input).toHaveValue(text);
      await user.click(input);
      await user.keyboard('{End}{Backspace}');
      expect(input).toHaveValue(
        locale === 'ko-KR' ? '2026. 11. 0' : '09.11.202'
      );
      expect(onValidityChange).toHaveBeenLastCalledWith(false);
      expect(onChange).not.toHaveBeenCalled();
      await user.keyboard('{Backspace>7/}');
      expect(input).toHaveValue('');
      expect(onChange).toHaveBeenLastCalledWith('');
      expect(onValidityChange).toHaveBeenLastCalledWith(true);
      await user.type(input, locale === 'ko-KR' ? '20261109' : '09112026');
      expect(input).toHaveValue(
        locale === 'ko-KR' ? text : '09.11.2026\u202fг.'
      );
      expect(onChange).toHaveBeenLastCalledWith('11/09/2026');
    }
  );

  it('adopts external value and regional setting changes', () => {
    const { rerender } = renderWithTheme(
      <DateInput label="Regional date" locale="en-GB" value="11/09/2026" />
    );
    rerender(
      <DateInput label="Regional date" locale={['sv-SE']} value="12/10/2026" />
    );
    expect(screen.getByLabelText('Regional date')).toHaveValue('2026-12-10');
  });

  it.each([
    ['en-GB', '12/10/2026', '10/12/2026', true],
    ['en-GB', '', '', true],
    ['sv-SE', '11/09/2026', '2026-11-09', true],
    ['en-GB', '01/01/1800', '01/01/1800', false],
  ])(
    'reports replacement validity for %s value %s',
    (locale, value, displayed, valid) => {
      const onValidityChange = vi.fn();
      const { rerender } = renderWithTheme(
        <DateInput
          label="Regional date"
          locale="en-GB"
          value="11/09/2026"
          onValidityChange={onValidityChange}
          validateOnBlur
        />
      );
      const input = screen.getByLabelText('Regional date');
      fireEvent.change(input, { target: { value: '09/11' } });
      fireEvent.blur(input);
      expect(onValidityChange).toHaveBeenLastCalledWith(false);
      rerender(
        <DateInput
          label="Regional date"
          locale={locale}
          value={value}
          onValidityChange={onValidityChange}
          validateOnBlur
        />
      );
      expect(input).toHaveValue(displayed);
      expect(onValidityChange).toHaveBeenLastCalledWith(valid);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    }
  );

  it('keeps an incomplete draft when only the validity callback changes', () => {
    const { rerender } = renderWithTheme(
      <DateInput
        label="Regional date"
        locale="en-GB"
        value="11/09/2026"
        onValidityChange={vi.fn()}
      />
    );
    const input = screen.getByLabelText('Regional date');
    fireEvent.change(input, { target: { value: '09/11' } });
    const onValidityChange = vi.fn();
    rerender(
      <DateInput
        label="Regional date"
        locale="en-GB"
        value="11/09/2026"
        onValidityChange={onValidityChange}
      />
    );
    expect(input).toHaveValue('09/11');
    fireEvent.change(input, { target: { value: '09/11/2026' } });
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
  });

  it('preserves regional drafts with inline locale arrays across parent renders', () => {
    function RegionalForm() {
      const [valid, setValid] = useState(true);
      const [updates, setUpdates] = useState(0);
      return (
        <>
          <DateInput
            label="Regional date"
            locale={['en-GB']}
            value="11/09/2026"
            onValidityChange={setValid}
          />
          <button onClick={() => setUpdates(updates + 1)}>
            Update {updates}
          </button>
          <button disabled={!valid}>Save</button>
        </>
      );
    }

    renderWithTheme(<RegionalForm />);
    const input = screen.getByLabelText('Regional date');
    fireEvent.change(input, { target: { value: '0' } });
    expect(input).toHaveValue('0');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Update 0' }));
    expect(input).toHaveValue('0');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.change(input, { target: { value: '09112026' } });
    expect(input).toHaveValue('09/11/2026');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it.each(['01/01/1800', '01/01/2101'])(
    'retains but does not publish an unsupported regional date: %s',
    (value) => {
      const onChange = vi.fn();
      const onValidityChange = vi.fn();
      renderWithTheme(
        <DateInput
          label="Regional date"
          locale="en-GB"
          value="11/09/2026"
          onChange={onChange}
          onValidityChange={onValidityChange}
          validateOnBlur
        />
      );
      const input = screen.getByLabelText('Regional date');
      fireEvent.change(input, { target: { value } });
      expect(input).toHaveValue(value);
      expect(onValidityChange).toHaveBeenLastCalledWith(false);
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.blur(input);
      expect(screen.getByRole('alert')).toHaveTextContent('DD/MM/YYYY');
      fireEvent.change(input, { target: { value: '09/11/2026' } });
      expect(onChange).toHaveBeenLastCalledWith('11/09/2026');
      expect(onValidityChange).toHaveBeenLastCalledWith(true);
    }
  );

  it('formats date bounds in regional validation messages', () => {
    renderWithTheme(
      <DateInput
        label="Regional date"
        locale="en-GB"
        value="11/09/2026"
        minDate="11/10/2026"
        validateOnBlur
      />
    );
    fireEvent.blur(screen.getByLabelText('Regional date'));
    expect(screen.getByRole('alert')).toHaveTextContent('10/11/2026');
  });

  it('accepts digits-only regional typing on numeric keyboards', async () => {
    const onChange = vi.fn();
    renderWithTheme(
      <DateInput label="Regional date" locale="en-GB" onChange={onChange} />
    );
    await userEvent.type(screen.getByLabelText('Regional date'), '09112026');
    expect(screen.getByLabelText('Regional date')).toHaveValue('09/11/2026');
    expect(onChange).toHaveBeenLastCalledWith('11/09/2026');
  });

  it('localizes a datetime display without changing its wall-clock value', () => {
    renderWithTheme(
      <DateInput
        label="Regional datetime"
        locale="en-GB"
        inputType="datetime-local"
        value="2026-11-09T14:30"
        showCalendar
      />
    );
    expect(screen.getByLabelText('Regional datetime')).toHaveValue(
      '09/11/2026 14:30'
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // #319: formatted date values are LTR islands so MM/DD/YYYY keeps its
  // order under RTL bidi — all three input paths carry dir="ltr".
  it('marks the input dir="ltr" on every render path', () => {
    renderWithTheme(<DateInput label="Plain" />);
    expect(screen.getByLabelText('Plain')).toHaveAttribute('dir', 'ltr');

    renderWithTheme(<DateInput label="Picker" showCalendar />);
    expect(screen.getByLabelText('Picker')).toHaveAttribute('dir', 'ltr');

    renderWithTheme(<DateInput label="Year" inputType="year" />);
    expect(screen.getByLabelText('Year')).toHaveAttribute('dir', 'ltr');
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

  describe('floating label', () => {
    it('floats through the plain Input path', () => {
      renderWithTheme(
        <DateInput label="Date of Birth" labelVariant="floating" />
      );
      const input = screen.getByLabelText('Date of Birth');
      expect(input).toHaveClass('peer');
      expect(input).toHaveAttribute('placeholder', ' ');
    });

    it('floats through the calendar picker path', () => {
      renderWithTheme(
        <DateInput label="Select Date" labelVariant="floating" showCalendar />
      );
      const input = screen.getByLabelText('Select Date');
      expect(input).toHaveClass('peer');
      expect(input).toHaveAttribute('placeholder', ' ');
      expect(
        screen.getByRole('button', { name: 'Open calendar' })
      ).toBeInTheDocument();
    });

    it('keeps the stacked label by default', () => {
      renderWithTheme(<DateInput label="Service date" showCalendar />);
      expect(screen.getByLabelText('Service date')).not.toHaveClass('peer');
    });

    it('overrides a consumer placeholder while floating', () => {
      renderWithTheme(
        <DateInput
          label="Select Date"
          labelVariant="floating"
          showCalendar
          placeholder="MM/DD/YYYY"
        />
      );
      expect(screen.getByLabelText('Select Date')).toHaveAttribute(
        'placeholder',
        ' '
      );
    });

    it('honors a consumer placeholder when stacked', () => {
      renderWithTheme(
        <DateInput label="Select Date" showCalendar placeholder="Pick a day" />
      );
      expect(screen.getByLabelText('Select Date')).toHaveAttribute(
        'placeholder',
        'Pick a day'
      );
    });
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
