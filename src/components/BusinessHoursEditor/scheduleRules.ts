// ============================================================================
// Pure schedule <-> rules logic shared by BusinessHoursEditor (rules variant)
// and BusinessHours (groupDays display). Kept free of React/component imports
// so display-only consumers don't pull in the editor bundle.
// ============================================================================

export interface TimeSlot {
  id?: string;
  start: string;
  end: string;
  description?: string;
}

export interface DaySchedule {
  day: number; // 0-6 (Sunday to Saturday)
  hours: TimeSlot[];
}

export interface HoursRule {
  id: string;
  days: number[];
  start: string;
  end: string;
  description?: string;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function ruleSignature(slot: TimeSlot): string {
  return `${slot.start}\u0000${slot.end}\u0000${slot.description ?? ''}`;
}

/** Collapse a schedule into rules: days sharing an identical time range group into one row. */
export function scheduleToRules(schedule: DaySchedule[]): HoursRule[] {
  const rulesBySignature = new Map<string, HoursRule[]>();
  const orderedRules: HoursRule[] = [];

  for (const day of schedule) {
    for (const slot of day.hours) {
      const signature = ruleSignature(slot);
      const candidates = rulesBySignature.get(signature) ?? [];
      // Duplicate identical slots on the same day each get their own rule so
      // the schedule round-trips without dropping slots.
      let rule = candidates.find((r) => !r.days.includes(day.day));
      if (!rule) {
        rule = {
          id: generateId(),
          days: [],
          start: slot.start,
          end: slot.end,
          description: slot.description,
        };
        candidates.push(rule);
        rulesBySignature.set(signature, candidates);
        orderedRules.push(rule);
      }
      rule.days.push(day.day);
    }
  }

  return orderedRules;
}

/** Expand rules into the canonical DaySchedule[] shape (all 7 days present). */
export function rulesToSchedule(rules: HoursRule[]): DaySchedule[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    hours: rules
      .filter((rule) => rule.days.includes(day))
      .map((rule) => ({
        id: generateId(),
        start: rule.start,
        end: rule.end,
        ...(rule.description ? { description: rule.description } : {}),
      })),
  }));
}
