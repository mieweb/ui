import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  BusinessHoursEditor,
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
});
