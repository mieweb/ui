import type { Meta, StoryObj } from '@storybook/react';
import { ScheduleCalendar, type CalendarAppointment } from './ScheduleCalendar';

const meta: Meta<typeof ScheduleCalendar> = {
  id: 'date-time-schedulecalendar',
  title: 'Inputs/Date & time/ScheduleCalendar',
  component: ScheduleCalendar,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

A **day / week appointment timeline** for staff. Pass \`appointments: CalendarAppointment[]\` (\`{ id, title, patientName?, startTime: Date | string, endTime?, status?, type?, services? }\`) and it lays them out as blocks against an hourly grid from \`startHour\` (default 7) to \`endHour\` (default 18), colour-coded by \`status\` (\`confirmed\` blue, \`pending\` yellow, \`completed\` green, \`cancelled\` grey, \`no-show\` red). \`view\` is \`'day'\` or \`'week'\` (Sunday–Saturday columns). Header buttons move by one day/week and fire \`onDateSelect(date)\`; \`selectedDate\` seeds the initial date. \`onAppointmentClick(appointment)\` makes blocks interactive; providing \`onAddAppointment(date, time?)\` adds an "Add Appointment" header button and makes each empty hour cell clickable. \`isLoading\` shows a skeleton. Exports: \`ScheduleCalendar\`, \`ScheduleCalendarProps\`, \`CalendarAppointment\`.

### Use it when

- Front-desk or provider screens need to **see** the day's or week's bookings at a glance and open one.
- Staff should create an appointment by clicking an empty hour (\`onAddAppointment\`).

### Don't use it when

- A patient must **choose** a free slot — \`SchedulePicker\` (host supplies the open dates/times).
- You need recurring weekly *opening hours* rather than dated events — \`BusinessHours\` (display) / \`BusinessHoursEditor\` (edit).
- You need month view, drag-to-reschedule, resizing, overlapping-event layout, resource columns or time-zone conversion — none are implemented; use a dedicated calendar library.

### Example

\`\`\`tsx
const [date, setDate] = useState(new Date());
const { data: appointments = [], isLoading } = useAppointments(date, 'week');

<ScheduleCalendar
  view="week"
  selectedDate={date}
  appointments={appointments}
  isLoading={isLoading}
  startHour={8}
  endHour={17}
  onDateSelect={setDate}
  onAppointmentClick={(appt) => openDetails(appt.id)}
  onAddAppointment={(start) => openNewAppointment({ start })}
/>
\`\`\`

### Limitations

- Accessibility: appointment blocks are \`<div role="button" tabIndex={0} aria-label="{patientName ?? title}, {start time}">\` with Enter/Space; empty hour cells become \`role="button"\` with \`aria-label="Add appointment at 9 AM"\` only when \`onAddAppointment\` is set. Nav buttons are \`aria-label="Previous"\` / \`"Next"\` (English); there are **no grid/table semantics, no arrow-key navigation between cells, and status is conveyed by colour only** (the legend is text but blocks carry no status text). The legend omits \`no-show\`.
- State: \`selectedDate\` is read once into internal state — changing the prop later does **not** move the calendar; only the built-in Prev/Next/Today buttons do (and they call \`onDateSelect\`).
- Layout: 4rem per hour, blocks positioned absolutely from \`startTime\`; **overlapping appointments overlay each other**, an appointment before \`startHour\` renders above the grid, and a missing \`endTime\` is drawn as 30 minutes. \`type\` and \`services\` are accepted but never rendered. Grid has \`min-w-[600px]\` and scrolls horizontally.
- Time zones / i18n: everything is formatted with \`toLocaleDateString('en-US', …)\` / \`toLocaleTimeString('en-US', …)\` in the browser's local zone; string \`startTime\`s are parsed with \`new Date()\`. Header text ("Today", "Add Appointment", "Week of …") and legend labels are hard-coded English. Weeks start on Sunday.
- RTL: physical classes throughout — blocks \`right-1 left-1\`, time labels \`pr-2 text-right\`, columns \`border-l\`.
- Theming: hard-coded \`gray-*\`, \`white\`, \`blue-*\` (today highlight) and status colours with \`dark:\` variants — brand tokens are not used. Depends on \`Button\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'date-time-schedulepicker',
          why: 'In a booking flow ScheduleCalendar shows what is already booked while SchedulePicker offers the remaining open slots.',
        },
        {
          type: 'alternative to',
          target: 'date-time-businesshours',
          why: 'ScheduleCalendar shows dated appointments on an hourly timeline; BusinessHours shows the recurring weekly opening hours.',
        },
      ],
    },
  },
  argTypes: {
    onDateSelect: { action: 'date selected' },
    onAppointmentClick: { action: 'appointment clicked' },
    onAddAppointment: { action: 'add appointment' },
  },
};

export default meta;
type Story = StoryObj<typeof ScheduleCalendar>;

const today = new Date();
const mockAppointments: CalendarAppointment[] = [
  {
    id: '1',
    title: 'DOT Physical',
    patientName: 'John Smith',
    startTime: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      8,
      0
    ),
    endTime: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      8,
      45
    ),
    type: 'scheduled',
    status: 'confirmed',
    services: ['DOT Physical'],
  },
  {
    id: '2',
    title: 'Drug Screen',
    patientName: 'Emily Johnson',
    startTime: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      9,
      30
    ),
    endTime: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      10,
      0
    ),
    type: 'walk-in',
    status: 'pending',
    services: ['Drug Screen (5 Panel)'],
  },
  {
    id: '3',
    title: 'Pre-Employment Physical',
    patientName: 'Michael Brown',
    startTime: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      10,
      30
    ),
    endTime: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      11,
      30
    ),
    type: 'scheduled',
    status: 'confirmed',
    services: ['Pre-Employment Physical', 'Drug Screen'],
  },
  {
    id: '4',
    title: 'Audiometry',
    patientName: 'Sarah Davis',
    startTime: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      13,
      0
    ),
    endTime: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      13,
      30
    ),
    type: 'scheduled',
    status: 'completed',
    services: ['Audiometry'],
  },
  {
    id: '5',
    title: 'DOT Physical',
    patientName: 'Robert Wilson',
    startTime: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      14,
      0
    ),
    endTime: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      14,
      45
    ),
    type: 'scheduled',
    status: 'cancelled',
    services: ['DOT Physical'],
  },
  {
    id: '6',
    title: 'Vision Test',
    patientName: 'Lisa Anderson',
    startTime: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      15,
      0
    ),
    endTime: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      15,
      15
    ),
    type: 'walk-in',
    status: 'no-show',
    services: ['Vision Test'],
  },
];

// Add some appointments for other days in the week
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const weekAppointments: CalendarAppointment[] = [
  ...mockAppointments,
  {
    id: '7',
    title: 'DOT Physical',
    patientName: 'James Taylor',
    startTime: new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate(),
      9,
      0
    ),
    endTime: new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate(),
      9,
      45
    ),
    type: 'scheduled',
    status: 'confirmed',
    services: ['DOT Physical'],
  },
  {
    id: '8',
    title: 'Drug Screen',
    patientName: 'Anna Martinez',
    startTime: new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate(),
      11,
      0
    ),
    endTime: new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate(),
      11,
      30
    ),
    type: 'scheduled',
    status: 'pending',
    services: ['Drug Screen (10 Panel)'],
  },
];

export const DayView: Story = {
  args: {
    appointments: mockAppointments,
    view: 'day',
    selectedDate: today,
  },
};

export const WeekView: Story = {
  args: {
    appointments: weekAppointments,
    view: 'week',
    selectedDate: today,
  },
};

export const Empty: Story = {
  args: {
    appointments: [],
    view: 'day',
  },
};

export const Loading: Story = {
  args: {
    appointments: [],
    isLoading: true,
  },
};

export const ExtendedHours: Story = {
  args: {
    appointments: mockAppointments,
    view: 'day',
    startHour: 6,
    endHour: 20,
  },
};

export const ShortDay: Story = {
  args: {
    appointments: mockAppointments,
    view: 'day',
    startHour: 9,
    endHour: 15,
  },
};

export const BusyDay: Story = {
  args: {
    appointments: [
      ...mockAppointments,
      {
        id: '9',
        title: 'Respirator Fit Test',
        patientName: 'Chris White',
        startTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          8,
          45
        ),
        endTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          9,
          30
        ),
        status: 'confirmed',
      },
      {
        id: '10',
        title: 'DOT Physical',
        patientName: 'David Lee',
        startTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          11,
          30
        ),
        endTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          12,
          15
        ),
        status: 'confirmed',
      },
      {
        id: '11',
        title: 'Drug Screen',
        patientName: 'Jennifer Garcia',
        startTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          16,
          0
        ),
        endTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          16,
          30
        ),
        status: 'pending',
      },
    ],
    view: 'day',
  },
};

export const AllStatuses: Story = {
  args: {
    appointments: mockAppointments,
    view: 'day',
  },
};

export const NoAddButton: Story = {
  args: {
    appointments: mockAppointments,
    view: 'day',
    onAddAppointment: undefined,
  },
};

export const Mobile: Story = {
  args: {
    appointments: mockAppointments,
    view: 'day',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
