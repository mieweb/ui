import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  SchedulePicker,
  DatePicker,
  TimePicker,
  DateButton,
  TimeButton,
  RadioOption,
} from './SchedulePicker';

// Generate sample dates for the next N days
const generateDates = (count: number): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// Sample time slots
const sampleTimes = [
  '8:00 AM',
  '8:30 AM',
  '9:00 AM',
  '9:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
  '3:30 PM',
  '4:00 PM',
  '4:30 PM',
];

// Wrapper for SchedulePicker with internal state
function SchedulePickerWithState(
  props: Omit<
    React.ComponentProps<typeof SchedulePicker>,
    | 'dates'
    | 'times'
    | 'selectedDate'
    | 'selectedTime'
    | 'onDateSelect'
    | 'onTimeSelect'
  > & {
    dateCount?: number;
    times?: string[];
  }
) {
  const { dateCount = 14, times = sampleTimes, ...rest } = props;
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);

  const dates = React.useMemo(() => generateDates(dateCount), [dateCount]);

  return (
    <div className="max-w-2xl space-y-4">
      <SchedulePicker
        {...rest}
        dates={dates}
        times={times}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onDateSelect={setSelectedDate}
        onTimeSelect={setSelectedTime}
      />
      <div className="mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
        <p className="text-muted-foreground text-sm">
          Selected:{' '}
          {selectedDate
            ? selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })
            : 'No date selected'}
          {selectedTime && ` at ${selectedTime}`}
        </p>
      </div>
    </div>
  );
}

// Extended args type
type SchedulePickerStoryArgs = Omit<
  React.ComponentProps<typeof SchedulePicker>,
  | 'dates'
  | 'times'
  | 'selectedDate'
  | 'selectedTime'
  | 'onDateSelect'
  | 'onTimeSelect'
> & {
  dateCount?: number;
};

const meta = {
  id: 'date-time-schedulepicker',
  title: 'Inputs/Date & time/SchedulePicker',
  component: SchedulePicker,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

An **appointment-slot chooser**: a horizontally scrolling strip of available dates, then a grid of available times for the chosen date. The host supplies availability — \`dates: Date[]\` and \`times: string[]\` (opaque display strings such as \`"8:30 AM"\`) — and owns the selection through \`selectedDate\` / \`onDateSelect(date)\` and \`selectedTime\` / \`onTimeSelect(time)\`. \`showTimePicker\` (default \`true\`) reveals the time grid only once a date is selected; \`timeColumns\` is \`4\` | \`6\`; \`dateLabel\` / \`timeLabel\` caption the two sections. The folder also exports the building blocks so you can lay out your own flow: \`DatePicker\` (the date strip), \`TimePicker\` (the time grid), \`DateButton\`, \`TimeButton\`, \`RadioOption\` (a selectable card with title/description, used for e.g. provider or visit-type choice), and their \`cva\` variants (\`dateButtonVariants\`, \`timeButtonVariants\`, \`radioOptionVariants\`).

### Use it when

- The user books from a **finite set of open slots** you already computed (clinic scheduling, DOT physicals, drug-screen appointments).
- You want a touch-friendly "pick a day, then pick a time" step inside a booking wizard, possibly with \`RadioOption\` cards for the preceding choice.

### Don't use it when

- Any date may be typed and validated — \`DateInput\`.
- The user picks a **period** for filtering — \`DateRangePicker\`.
- You need to *show* booked appointments on a timeline, or let staff click an empty hour — \`ScheduleCalendar\` (\`onAddAppointment\`).
- Times are values you must parse or compare — this component treats \`times\` as labels; keep a parallel array of real slots in the host.

### Example

\`\`\`tsx
const [date, setDate] = useState<Date | null>(null);
const [time, setTime] = useState<string | null>(null);
const slots = useMemo(() => (date ? availability.get(date.toDateString()) ?? [] : []), [date]);

<SchedulePicker
  dates={openDays}                 // Date[] from your availability API
  times={slots.map((s) => s.label)}
  selectedDate={date}
  selectedTime={time}
  onDateSelect={(d) => { setDate(d); setTime(null); }}
  onTimeSelect={setTime}
  dateLabel="Pick a day"
  timeLabel="Available times"
/>
\`\`\`

### Limitations

- Accessibility: \`DateButton\` / \`TimeButton\` are \`<button type="button">\`s whose **selected state is visual only** — no \`aria-pressed\`, no \`role="radiogroup"\`/\`radio\`, no \`aria-selected\`; the \`dateLabel\` / \`timeLabel\` \`<label>\`s have no \`htmlFor\` and are not associated with the groups. Keyboard is Tab through every button (no arrow keys, no roving focus); Enter/Space activate natively. \`RadioOption\` is a \`<div role="button" tabIndex={0}>\` handling Enter/Space — it does not expose radio semantics or \`aria-checked\` despite the name.
- State: fully controlled; nothing is stored or submitted (\`no name\`). Date equality uses \`toDateString()\`, so two \`Date\`s on the same local calendar day match regardless of time.
- i18n / time zones: date buttons print weekday and month with \`toLocaleDateString('en-US', …)\` (English abbreviations); \`times\` are whatever strings you pass — no parsing, formatting or zone conversion happens here. Defaults \`"Select Date"\` / \`"Select Time"\` are English.
- Layout/RTL: the date strip scrolls horizontally (\`overflow-x-auto\`, no scroll buttons); no physical \`left/right\` offsets. Time grid is 4 columns below \`sm\` even when \`timeColumns={6}\`.
- Theming: hard-coded \`border-neutral-200/700\`, \`text-neutral-900 dark:text-white\`; selected uses \`border-primary-500 bg-primary-50 dark:bg-primary-900/20\`; \`RadioOption\` indicator \`bg-primary-800\`. Only dependency is \`class-variance-authority\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'date-time-dateinput',
          why: 'SchedulePicker lets the user choose from host-supplied available dates and time slots; DateInput lets them type any date.',
        },
        {
          type: 'composes with',
          target: 'date-time-schedulecalendar',
          why: 'In a booking flow ScheduleCalendar shows what is already booked while SchedulePicker offers the remaining open slots.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    dateLabel: {
      control: 'text',
      description: 'Label for the date picker section',
    },
    timeLabel: {
      control: 'text',
      description: 'Label for the time picker section',
    },
    timeColumns: {
      control: 'select',
      options: [4, 6],
      description: 'Number of columns in the time grid',
    },
    showTimePicker: {
      control: 'boolean',
      description: 'Whether to show time picker (shows after date is selected)',
    },
    // Hide internal props
    dates: { table: { disable: true } },
    times: { table: { disable: true } },
    selectedDate: { table: { disable: true } },
    selectedTime: { table: { disable: true } },
    onDateSelect: { table: { disable: true } },
    onTimeSelect: { table: { disable: true } },
  },
  render: (args: SchedulePickerStoryArgs) => (
    <SchedulePickerWithState {...args} />
  ),
} satisfies Meta<typeof SchedulePicker>;

export default meta;
type Story = StoryObj<SchedulePickerStoryArgs>;

export const Default: Story = {
  args: {
    dateLabel: 'Select Date',
    timeLabel: 'Select Time',
    timeColumns: 6,
    showTimePicker: true,
    dateCount: 14,
  },
};

export const FourColumnTimes: Story = {
  args: {
    ...Default.args,
    timeColumns: 4,
  },
};

export const CustomLabels: Story = {
  args: {
    ...Default.args,
    dateLabel: 'Choose your preferred date',
    timeLabel: 'Choose your preferred time',
  },
};

export const MoreDates: Story = {
  args: {
    ...Default.args,
    dateCount: 21,
  },
};

// DatePicker standalone with wrapper
function DatePickerWithState(
  props: Omit<
    React.ComponentProps<typeof DatePicker>,
    'dates' | 'selectedDate' | 'onDateSelect'
  > & {
    dateCount?: number;
  }
) {
  const { dateCount = 10, ...rest } = props;
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const dates = React.useMemo(() => generateDates(dateCount), [dateCount]);

  return (
    <DatePicker
      {...rest}
      dates={dates}
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
    />
  );
}

export const DatePickerOnly: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <DatePickerWithState dateCount={10} label="Select Date" />,
};

// TimePicker standalone with wrapper
function TimePickerWithState(
  props: Omit<
    React.ComponentProps<typeof TimePicker>,
    'times' | 'selectedTime' | 'onTimeSelect'
  > & {
    times?: string[];
  }
) {
  const { times = sampleTimes, ...rest } = props;
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);

  return (
    <div className="max-w-md">
      <TimePicker
        {...rest}
        times={times}
        selectedTime={selectedTime}
        onTimeSelect={setSelectedTime}
      />
    </div>
  );
}

export const TimePickerOnly: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <TimePickerWithState label="Select Time" columns={6} />,
};

export const TimePickerFourCol: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <TimePickerWithState label="Select Time" columns={4} />,
};

export const LimitedTimeSlots: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <TimePickerWithState
      times={['9:00 AM', '11:00 AM', '2:00 PM']}
      label="Available Time Slots"
      columns={4}
    />
  ),
};

// DateButton showcase
export const DateButtons: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return (
      <div className="flex gap-4">
        <DateButton date={today} />
        <DateButton date={tomorrow} selected />
      </div>
    );
  },
};

// TimeButton showcase
export const TimeButtons: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex gap-4">
      <TimeButton time="9:00 AM" />
      <TimeButton time="10:00 AM" selected />
      <TimeButton time="11:00 AM" />
    </div>
  ),
};

// RadioOption showcase
export const RadioOptions: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="max-w-md space-y-2">
      <RadioOption
        title="Walk-in (No appointment needed)"
        description="Visit anytime during business hours"
        selected={false}
      />
      <RadioOption
        title="Schedule an appointment"
        description="Reserve a specific date and time"
        selected
      >
        <div className="mt-4 rounded bg-neutral-100 p-2 dark:bg-neutral-800">
          <p className="text-muted-foreground text-sm">
            Additional content shown when selected
          </p>
        </div>
      </RadioOption>
    </div>
  ),
};

// Complete Flow Demo
function CompleteFlowDemo() {
  const [mode, setMode] = React.useState<'walk-in' | 'scheduled'>('walk-in');
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);

  const dates = React.useMemo(() => generateDates(14), []);

  return (
    <div className="max-w-2xl space-y-4">
      <RadioOption
        title="Walk-in (No appointment needed)"
        description="Visit anytime during business hours"
        selected={mode === 'walk-in'}
        onClick={() => setMode('walk-in')}
      />
      <RadioOption
        title="Schedule an appointment"
        description="Reserve a specific date and time"
        selected={mode === 'scheduled'}
        onClick={() => setMode('scheduled')}
      >
        {mode === 'scheduled' && (
          <div className="mt-4">
            <SchedulePicker
              dates={dates}
              times={sampleTimes}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onDateSelect={setSelectedDate}
              onTimeSelect={setSelectedTime}
            />
          </div>
        )}
      </RadioOption>

      <div className="mt-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
        <h4 className="font-medium text-neutral-900 dark:text-white">
          Selection Summary
        </h4>
        <p className="text-muted-foreground mt-1 text-sm">
          {mode === 'walk-in'
            ? 'Walk-in appointment - no reservation needed'
            : selectedDate
              ? `Scheduled: ${selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}${selectedTime ? ` at ${selectedTime}` : ' - select a time'}`
              : 'Select a date to continue'}
        </p>
      </div>
    </div>
  );
}

export const CompleteFlow: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <CompleteFlowDemo />,
};
