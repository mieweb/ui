import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateInput } from './DateInput';

const meta: Meta<typeof DateInput> = {
  id: 'date-time-dateinput',
  title: 'Inputs/Date & time/DateInput',
  component: DateInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A **single date (or time) field** built on \`Input\`. The user types digits and the field auto-formats to \`MM/DD/YYYY\`; \`showCalendar\` adds a calendar button that opens a portaled picker. \`inputType\` switches the value shape and picker: \`'date'\` (\`MM/DD/YYYY\`, typed or picked), \`'datetime-local'\` (\`YYYY-MM-DDTHH:mm\`, read-only field + calendar with hour/minute selects), \`'time'\` (\`HH:mm\`, read-only field + hour/minute/AM-PM selects, \`minuteStep\`), \`'month'\` (\`YYYY-MM\`, month grid) and \`'year'\` (4-digit text). \`value\` / \`onChange(value: string)\` are strings, never \`Date\`. \`mode\` (\`'dob'\` with \`minAge\` / \`maxAge\`, \`'expiration'\`, \`'past'\`, \`'future'\`) plus \`minDate\` / \`maxDate\` (also \`MM/DD/YYYY\`) drive the built-in validation when \`validateOnBlur\` is set; \`timeFormat\` (\`'12-hour'\` | \`'24-hour'\`) and \`width\` (\`'full'\` | \`'fit'\` | \`'fixed'\`) shape the display. All \`Input\` field props (\`label\`, \`labelVariant\`, \`helperText\`, \`error\`, \`required\`, \`size\`) apply. Exports: \`DateInput\`, \`DateInputProps\`, \`DateInputMode\`, \`DateInputType\`.

### Use it when

- A form needs **one** date — date of birth, expiration, appointment date, effective date — and the user may type it or pick it.
- You need a wall-clock time or a month/year without a full date (\`inputType="time"\` / \`"month"\` / \`"year"\`).
- The date must satisfy a simple rule (past, future, age band, min/max) and you want the English error text for free (\`validateOnBlur\`).

### Don't use it when

- The value is a **start and end** pair or a preset period ("Last 30 days") — \`DateRangePicker\`.
- The user should pick from a **supplied list of available dates and slots** rather than any date — \`SchedulePicker\`.
- You want to *show* appointments on a timeline — \`ScheduleCalendar\`; recurring weekly opening hours — \`BusinessHours\` / \`BusinessHoursEditor\`.
- You are tempted to write \`<input type="date">\` — don't; this component is the library's date field.

### Example

\`\`\`tsx
const [dob, setDob] = useState('');          // 'MM/DD/YYYY' string
const [visit, setVisit] = useState('');      // 'YYYY-MM-DDTHH:mm'

<DateInput label="Date of birth" mode="dob" minAge={18} validateOnBlur required value={dob} onChange={setDob} />

<DateInput
  label="Visit"
  inputType="datetime-local"
  timeFormat="12-hour"
  minuteStep={15}
  value={visit}
  onChange={setVisit}
/>

// Convert for transport: DateTime.fromFormat(dob, 'MM/dd/yyyy', { zone: 'America/New_York' }).toISODate()
\`\`\`

### Limitations

- Accessibility: the field is an \`<input type="text" inputMode="numeric">\` (never a native date input) with \`<label htmlFor>\`, \`aria-invalid\`, \`aria-describedby\` → error/helper, and \`role="alert"\` on the error. The picker trigger is a \`<button aria-haspopup="dialog" aria-expanded aria-label="Open calendar" | "Open time picker">\`; the panel is \`role="dialog"\` with an English \`aria-label\` (\`"Choose date"\`, \`"Choose month"\`, \`"Choose time"\`, \`"Choose date and time"\`). Month/year/hour/minute are native \`<select>\`s with \`aria-label\`s. **Day cells are plain \`<button>\`s with no \`aria-label\`, \`aria-pressed\` or grid semantics and no arrow-key navigation** — Tab moves through every day. Escape closes and returns focus to the trigger; click-outside closes without restoring focus. No focus trap.
- Value formats are fixed: \`MM/DD/YYYY\` for dates (US order only, no locale formats), \`minDate\` / \`maxDate\` likewise. Nothing is ISO-8601 except \`datetime-local\` / \`month\`; convert before sending to an API. Non-\`date\` types are \`readOnly\` — the value can only be set through the picker.
- Time zones: parsing goes through Luxon \`DateTime.fromFormat(..., { zone: 'local' })\`; \`datetime-local\` and \`time\` are naive wall-clock strings with no offset. Years outside 1900–2100 are rejected as invalid.
- i18n: every string is hard-coded English — validation messages ("Please enter a valid date (MM/DD/YYYY)", "Must be at least N years old", …), month names, \`Su Mo Tu We Th Fr Sa\` headers, "Today", "Done", placeholders ("Select month", "Select time", …). Week starts on Sunday. \`error\` lets you supply your own message but the built-in checks still emit English.
- Validation runs only on blur (\`validateOnBlur\`) or on calendar selection for \`inputType="date"\`; it does not block typing or submission. \`mode="dob"\` sets \`autoComplete="bday"\`, \`"expiration"\` sets \`cc-exp\`.
- RTL: physical classes — trigger is \`absolute right-3\`, input padding \`pr-10\`; the popup places itself \`bottom-end\`. Theming: \`bg-background border-border\`, selected/today \`bg-primary-800\` / \`border-primary-800\`; the calendar-variant error text uses an inline \`color: #ef4444\`. Depends on \`luxon\`, \`lucide-react\` (Calendar / Clock icons), \`useAnchoredPosition\` and \`Input\`'s \`inputVariants\` / \`RequiredMark\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'date-time-daterangepicker',
          why: 'DateInput captures one date (or time/month/year) as a string; DateRangePicker captures a start/end pair or preset period as Dates.',
        },
        {
          type: 'alternative to',
          target: 'date-time-schedulepicker',
          why: 'DateInput lets the user type any date; SchedulePicker lets them choose from host-supplied available dates and time slots.',
        },
        {
          type: 'uses',
          target: 'text-inputs-input',
          why: 'Renders Input for the plain and year variants and reuses inputVariants / floatingLabelVariants / RequiredMark for the picker variants.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    inputType: {
      control: 'select',
      options: ['date', 'datetime-local', 'time', 'month', 'year'],
      description: 'Date value format and picker control',
    },
    timeFormat: {
      control: 'select',
      options: ['12-hour', '24-hour'],
      description: 'Time picker display format for datetime values',
    },
    mode: {
      control: 'select',
      options: ['default', 'dob', 'expiration', 'past', 'future'],
    },
    width: {
      control: 'select',
      options: ['full', 'fit', 'fixed'],
      description: 'Width behavior of the input',
    },
    showCalendar: {
      control: 'boolean',
      description: 'Show calendar picker button',
    },
    validateOnBlur: {
      control: 'boolean',
    },
    minDate: {
      control: 'text',
      description: 'Earliest allowed date in MM/DD/YYYY format',
    },
    maxDate: {
      control: 'text',
      description: 'Latest allowed date in MM/DD/YYYY format',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Date',
  },
};

export const WithCalendar: Story = {
  args: {
    label: 'Select Date',
    showCalendar: true,
    width: 'fixed',
  },
};

export const WithCalendarPreFilled: Story = {
  args: {
    label: 'Appointment Date',
    showCalendar: true,
    width: 'fixed',
    value: '06/15/2026',
  },
};

export const WithDateBounds: Story = {
  args: {
    label: 'Service Date',
    minDate: '07/27/2024',
    maxDate: '07/27/2028',
    validateOnBlur: true,
    showCalendar: true,
  },
};

export const DateTime: Story = {
  args: {
    label: 'Appointment Time',
    inputType: 'datetime-local',
    value: '2026-07-21T09:30',
  },
};

export const DateTimeTwelveHour: Story = {
  args: {
    label: 'Appointment Time',
    inputType: 'datetime-local',
    timeFormat: '12-hour',
    value: '2026-07-21T21:30',
  },
};

export const Time: Story = {
  args: {
    label: 'Start Time',
    inputType: 'time',
    value: '09:30',
  },
};

export const TimeTwelveHour: Story = {
  args: {
    label: 'Start Time',
    inputType: 'time',
    timeFormat: '12-hour',
    value: '15:30',
  },
};

export const Month: Story = {
  args: {
    label: 'Billing Month',
    inputType: 'month',
    value: '2026-07',
  },
};

export const Year: Story = {
  args: {
    label: 'Graduation Year',
    inputType: 'year',
    value: '2026',
  },
};

export const DateOfBirth: Story = {
  args: {
    label: 'Date of Birth',
    mode: 'dob',
    validateOnBlur: true,
    minAge: 18,
    helperText: 'Must be 18 years or older',
  },
};

export const DateOfBirthWithCalendar: Story = {
  args: {
    label: 'Date of Birth',
    mode: 'dob',
    showCalendar: true,
    validateOnBlur: true,
    minAge: 18,
    helperText: 'Must be 18 years or older',
  },
};

export const ExpirationDate: Story = {
  args: {
    label: 'License Expiration',
    mode: 'expiration',
    validateOnBlur: true,
    helperText: 'Must be a future date',
  },
};

export const ExpirationWithCalendar: Story = {
  args: {
    label: 'License Expiration',
    mode: 'expiration',
    showCalendar: true,
    validateOnBlur: true,
    helperText: 'Must be a future date',
  },
};

export const Controlled: Story = {
  render: function ControlledExample() {
    const [date, setDate] = useState('');
    return (
      <div className="space-y-4">
        <DateInput
          label="Select Date"
          value={date}
          onChange={setDate}
          validateOnBlur
        />
        <p className="text-muted-foreground text-sm">
          Value: {date || '(empty)'}
        </p>
      </div>
    );
  },
};

export const PreFilled: Story = {
  args: {
    label: 'Date',
    value: '01/15/1990',
  },
};

export const WithError: Story = {
  args: {
    label: 'Expiration Date',
    mode: 'expiration',
    value: '01/01/2020',
    error: 'Expiration date must be in the future',
    hasError: true,
  },
};

export const AllModes: Story = {
  render: () => (
    <div className="space-y-4">
      <DateInput label="Default Mode" mode="default" />
      <DateInput label="Date of Birth" mode="dob" validateOnBlur minAge={18} />
      <DateInput label="Expiration" mode="expiration" validateOnBlur />
      <DateInput label="Past Date" mode="past" validateOnBlur />
      <DateInput label="Future Date" mode="future" validateOnBlur />
    </div>
  ),
};

export const FloatingLabel: Story = {
  args: {
    label: 'Date of Birth',
    labelVariant: 'floating',
  },
};

export const FloatingLabelWithValue: Story = {
  args: {
    label: 'Date of Birth',
    labelVariant: 'floating',
    value: '01/15/1990',
  },
};

export const FloatingLabelWithCalendar: Story = {
  args: {
    label: 'Select Date',
    labelVariant: 'floating',
    showCalendar: true,
  },
};

export const FloatingLabelDateTime: Story = {
  args: {
    label: 'Appointment',
    labelVariant: 'floating',
    inputType: 'datetime-local',
  },
};
