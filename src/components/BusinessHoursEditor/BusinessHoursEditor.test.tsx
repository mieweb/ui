import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  BusinessHoursEditor,
  normalizeClosingTime,
  parseTimeInput,
  scheduleToRules,
  rulesToSchedule,
  type DaySchedule,
} from './BusinessHoursEditor';

/** M/W/F 8–11, Tu/Th 15–17, Sat 10–16, Sun unavailable */
const patientAvailability: DaySchedule[] = [
  { day: 0, hours: [] },
  { day: 1, hours: [{ id: '1', start: '08:00', end: '11:00' }] },
  { day: 2, hours: [{ id: '2', start: '15:00', end: '17:00' }] },
  { day: 3, hours: [{ id: '3', start: '08:00', end: '11:00' }] },
  { day: 4, hours: [{ id: '4', start: '15:00', end: '17:00' }] },
  { day: 5, hours: [{ id: '5', start: '08:00', end: '11:00' }] },
  { day: 6, hours: [{ id: '6', start: '10:00', end: '16:00' }] },
];

function slotsOf(schedule: DaySchedule[], day: number) {
  return (schedule.find((d) => d.day === day)?.hours ?? []).map((slot) => ({
    start: slot.start,
    end: slot.end,
  }));
}

describe('scheduleToRules / rulesToSchedule', () => {
  it('groups days with identical hours into one rule', () => {
    const rules = scheduleToRules(patientAvailability);

    expect(rules).toHaveLength(3);
    expect(rules[0]).toMatchObject({
      days: [1, 3, 5],
      start: '08:00',
      end: '11:00',
    });
    expect(rules[1]).toMatchObject({
      days: [2, 4],
      start: '15:00',
      end: '17:00',
    });
    expect(rules[2]).toMatchObject({ days: [6], start: '10:00', end: '16:00' });
  });

  it('round-trips back to an equivalent schedule', () => {
    const schedule = rulesToSchedule(scheduleToRules(patientAvailability));

    for (let day = 0; day < 7; day++) {
      expect(slotsOf(schedule, day)).toEqual(slotsOf(patientAvailability, day));
    }
  });

  it('preserves duplicate identical slots on the same day', () => {
    const withDuplicates: DaySchedule[] = [
      {
        day: 1,
        hours: [
          { start: '08:00', end: '11:00' },
          { start: '08:00', end: '11:00' },
        ],
      },
      { day: 3, hours: [{ start: '08:00', end: '11:00' }] },
    ];

    const rules = scheduleToRules(withDuplicates);
    expect(rules).toHaveLength(2);
    expect(rules[0]).toMatchObject({ days: [1, 3], start: '08:00' });
    expect(rules[1]).toMatchObject({ days: [1], start: '08:00' });

    const schedule = rulesToSchedule(rules);
    expect(slotsOf(schedule, 1)).toHaveLength(2);
    expect(slotsOf(schedule, 3)).toHaveLength(1);
  });

  it('keeps days with different descriptions in separate rules', () => {
    const rules = scheduleToRules([
      { day: 1, hours: [{ start: '08:00', end: '11:00', description: 'AM' }] },
      { day: 2, hours: [{ start: '08:00', end: '11:00' }] },
    ]);

    expect(rules).toHaveLength(2);
  });
});

describe('BusinessHoursEditor variant="rules"', () => {
  it('renders one row per rule with day toggles pressed', () => {
    renderWithTheme(
      <BusinessHoursEditor
        variant="rules"
        value={patientAvailability}
        onChange={vi.fn()}
      />
    );

    const groups = screen.getAllByRole('group');
    expect(groups).toHaveLength(3);

    // First rule: Mon, Wed, Fri pressed
    const monday = screen.getAllByRole('button', { name: 'Monday' })[0];
    const sunday = screen.getAllByRole('button', { name: 'Sunday' })[0];
    expect(monday).toHaveAttribute('aria-pressed', 'true');
    expect(sunday).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggling a day emits the expanded schedule', () => {
    const onChange = vi.fn();
    renderWithTheme(
      <BusinessHoursEditor
        variant="rules"
        value={patientAvailability}
        onChange={onChange}
      />
    );

    // Add Sunday to the Sat 10:00–16:00 rule (third rule row)
    fireEvent.click(screen.getAllByRole('button', { name: 'Sunday' })[2]);

    const emitted = onChange.mock.calls[0][0] as DaySchedule[];
    expect(slotsOf(emitted, 0)).toEqual([{ start: '10:00', end: '16:00' }]);
    // Existing days untouched
    expect(slotsOf(emitted, 1)).toEqual([{ start: '08:00', end: '11:00' }]);
  });

  it('changing a time applies to every day in the rule', () => {
    const onChange = vi.fn();
    renderWithTheme(
      <BusinessHoursEditor
        variant="rules"
        value={patientAvailability}
        onChange={onChange}
      />
    );

    // Open the time picker for the first rule's start time (08:00 AM)
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Open time picker' })[0]
    );
    fireEvent.change(screen.getByLabelText('Select hour'), {
      target: { value: '09' },
    });

    const emitted = onChange.mock.calls[0][0] as DaySchedule[];
    for (const day of [1, 3, 5]) {
      expect(slotsOf(emitted, day)).toEqual([{ start: '09:00', end: '11:00' }]);
    }
  });

  it('removing a rule clears its days', () => {
    const onChange = vi.fn();
    renderWithTheme(
      <BusinessHoursEditor
        variant="rules"
        value={patientAvailability}
        onChange={onChange}
      />
    );

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Remove availability rule' })[2]
    );

    const emitted = onChange.mock.calls[0][0] as DaySchedule[];
    expect(slotsOf(emitted, 6)).toEqual([]);
    expect(slotsOf(emitted, 1)).toEqual([{ start: '08:00', end: '11:00' }]);
  });

  it('adds a draft rule without emitting until a day is selected', () => {
    const onChange = vi.fn();
    renderWithTheme(
      <BusinessHoursEditor variant="rules" value={[]} onChange={onChange} />
    );

    fireEvent.click(screen.getByRole('button', { name: /add hours/i }));
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Tuesday' }));
    const emitted = onChange.mock.calls[0][0] as DaySchedule[];
    expect(slotsOf(emitted, 2)).toEqual([{ start: '09:00', end: '17:00' }]);
  });

  it('supports a day appearing in multiple rules', () => {
    const twoRanges: DaySchedule[] = [
      {
        day: 1,
        hours: [
          { start: '08:00', end: '11:00' },
          { start: '15:00', end: '17:00' },
        ],
      },
    ];

    renderWithTheme(
      <BusinessHoursEditor
        variant="rules"
        value={twoRanges}
        onChange={vi.fn()}
      />
    );

    const mondayToggles = screen.getAllByRole('button', { name: 'Monday' });
    expect(mondayToggles).toHaveLength(2);
    expect(mondayToggles[0]).toHaveAttribute('aria-pressed', 'true');
    expect(mondayToggles[1]).toHaveAttribute('aria-pressed', 'true');
  });

  it('treats a 00:00 close after an opening time as end of day', () => {
    const onChange = vi.fn();
    renderWithTheme(
      <BusinessHoursEditor
        variant="rules"
        timeEntry="text"
        value={patientAvailability}
        onChange={onChange}
      />
    );

    const end = screen.getAllByRole('textbox', { name: 'End time' })[0];
    fireEvent.change(end, { target: { value: '12am' } });
    fireEvent.blur(end);

    const emitted = onChange.mock.calls[0][0] as DaySchedule[];
    expect(slotsOf(emitted, 1)).toEqual([{ start: '08:00', end: '23:59' }]);
  });
});

describe('parseTimeInput', () => {
  it.each([
    ['5pm', '17:00'],
    ['5 pm', '17:00'],
    ['5:30 p.m.', '17:30'],
    ['1159pm', '23:59'],
    ['17:30', '17:30'],
    ['1730', '17:30'],
    ['9a', '09:00'],
    ['12am', '00:00'],
    ['12pm', '12:00'],
    [' 9 ', '09:00'],
  ])('parses %j as %s', (input, expected) => {
    expect(parseTimeInput(input)).toBe(expected);
  });

  it.each(['', '13pm', '0am', '24:00', '9:75', 'noon', '5:3'])(
    'rejects %j',
    (input) => {
      expect(parseTimeInput(input)).toBeNull();
    }
  );

  it('normalizes only a midnight close after a real open', () => {
    expect(normalizeClosingTime('09:00', '00:00')).toBe('23:59');
    expect(normalizeClosingTime('', '00:00')).toBe('00:00');
    expect(normalizeClosingTime('00:00', '00:00')).toBe('00:00');
    expect(normalizeClosingTime('22:00', '02:00')).toBe('02:00');
  });
});

describe('BusinessHoursEditor variant="days"', () => {
  const weekday: DaySchedule[] = [
    { day: 1, hours: [{ id: 'm', start: '09:00', end: '17:00' }] },
  ];

  it('commits a typed time on Enter, formatted for display', () => {
    const onChange = vi.fn();
    renderWithTheme(
      <BusinessHoursEditor
        timeEntry="text"
        value={weekday}
        onChange={onChange}
      />
    );

    const start = screen.getByRole('textbox', { name: 'Mon start time' });
    expect(start).toHaveValue('9:00 AM');
    fireEvent.change(start, { target: { value: '8 am' } });
    fireEvent.keyDown(start, { key: 'Enter' });

    const emitted = onChange.mock.calls[0][0] as DaySchedule[];
    expect(slotsOf(emitted, 1)).toEqual([{ start: '08:00', end: '17:00' }]);
    // Input value is not mutated in place
    expect(weekday[0].hours[0].start).toBe('09:00');
  });

  it('shows an accessible error for an unparseable time', () => {
    const onChange = vi.fn();
    renderWithTheme(
      <BusinessHoursEditor
        timeEntry="text"
        value={weekday}
        onChange={onChange}
        labels={{ invalidTime: 'Bad time' }}
      />
    );

    const end = screen.getByRole('textbox', { name: 'Mon end time' });
    fireEvent.change(end, { target: { value: '25:00' } });
    fireEvent.blur(end);

    expect(onChange).not.toHaveBeenCalled();
    expect(end).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Bad time');
  });

  it('normalizes a native 00:00 close to end of day', () => {
    const onChange = vi.fn();
    renderWithTheme(
      <BusinessHoursEditor value={weekday} onChange={onChange} />
    );

    fireEvent.change(screen.getByLabelText('Mon end time'), {
      target: { value: '00:00' },
    });

    const emitted = onChange.mock.calls[0][0] as DaySchedule[];
    expect(slotsOf(emitted, 1)).toEqual([{ start: '09:00', end: '23:59' }]);
  });

  it('copies a day to weekdays with custom labels', () => {
    const onChange = vi.fn();
    renderWithTheme(
      <BusinessHoursEditor
        value={weekday}
        onChange={onChange}
        labels={{ copy: 'Duplicate', copyToWeekdays: 'Mon–Fri' }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /duplicate/i }));
    fireEvent.click(screen.getByText('Mon–Fri'));

    const emitted = onChange.mock.calls[0][0] as DaySchedule[];
    for (const day of [1, 2, 3, 4, 5]) {
      expect(slotsOf(emitted, day)).toEqual([{ start: '09:00', end: '17:00' }]);
    }
    expect(slotsOf(emitted, 6)).toEqual([]);
  });
});
