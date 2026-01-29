import type { Meta, StoryObj } from '@storybook/react';
import {
  ScheduleCalendar,
  type CalendarAppointment,
} from './ScheduleCalendar';

const meta: Meta<typeof ScheduleCalendar> = {
  title: 'Provider/ScheduleCalendar',
  component: ScheduleCalendar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
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
    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0),
    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 45),
    type: 'scheduled',
    status: 'confirmed',
    services: ['DOT Physical'],
  },
  {
    id: '2',
    title: 'Drug Screen',
    patientName: 'Emily Johnson',
    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30),
    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
    type: 'walk-in',
    status: 'pending',
    services: ['Drug Screen (5 Panel)'],
  },
  {
    id: '3',
    title: 'Pre-Employment Physical',
    patientName: 'Michael Brown',
    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30),
    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30),
    type: 'scheduled',
    status: 'confirmed',
    services: ['Pre-Employment Physical', 'Drug Screen'],
  },
  {
    id: '4',
    title: 'Audiometry',
    patientName: 'Sarah Davis',
    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0),
    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 30),
    type: 'scheduled',
    status: 'completed',
    services: ['Audiometry'],
  },
  {
    id: '5',
    title: 'DOT Physical',
    patientName: 'Robert Wilson',
    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 45),
    type: 'scheduled',
    status: 'cancelled',
    services: ['DOT Physical'],
  },
  {
    id: '6',
    title: 'Vision Test',
    patientName: 'Lisa Anderson',
    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0),
    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 15),
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
    startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0),
    endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 45),
    type: 'scheduled',
    status: 'confirmed',
    services: ['DOT Physical'],
  },
  {
    id: '8',
    title: 'Drug Screen',
    patientName: 'Anna Martinez',
    startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 0),
    endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 30),
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
        startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 45),
        endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30),
        status: 'confirmed',
      },
      {
        id: '10',
        title: 'DOT Physical',
        patientName: 'David Lee',
        startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30),
        endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 15),
        status: 'confirmed',
      },
      {
        id: '11',
        title: 'Drug Screen',
        patientName: 'Jennifer Garcia',
        startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
        endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 30),
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
