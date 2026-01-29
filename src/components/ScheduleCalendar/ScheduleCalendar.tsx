'use client';

import * as React from 'react';
import { Button } from '../Button/Button';

export interface CalendarAppointment {
  id: string;
  title: string;
  patientName?: string;
  startTime: Date | string;
  endTime?: Date | string;
  type?: 'scheduled' | 'walk-in' | 'blocked';
  status?: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no-show';
  services?: string[];
}

export interface ScheduleCalendarProps {
  /** Appointments to display */
  appointments: CalendarAppointment[];
  /** Currently selected date */
  selectedDate?: Date;
  /** Handler for date selection */
  onDateSelect?: (date: Date) => void;
  /** Handler for appointment click */
  onAppointmentClick?: (appointment: CalendarAppointment) => void;
  /** Handler for adding new appointment */
  onAddAppointment?: (date: Date, time?: string) => void;
  /** View mode */
  view?: 'day' | 'week';
  /** Start hour for day view (0-23) */
  startHour?: number;
  /** End hour for day view (0-23) */
  endHour?: number;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ScheduleCalendar displays appointments in a daily or weekly calendar view.
 */
export function ScheduleCalendar({
  appointments,
  selectedDate = new Date(),
  onDateSelect,
  onAppointmentClick,
  onAddAppointment,
  view = 'day',
  startHour = 7,
  endHour = 18,
  isLoading = false,
  className = '',
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(selectedDate);

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const getStatusColor = (status?: CalendarAppointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500 border-blue-600';
      case 'pending':
        return 'bg-yellow-500 border-yellow-600';
      case 'completed':
        return 'bg-green-500 border-green-600';
      case 'cancelled':
        return 'bg-gray-400 border-gray-500';
      case 'no-show':
        return 'bg-red-500 border-red-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  const hours = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => startHour + i
  );

  const getWeekDates = (date: Date) => {
    const day = date.getDay();
    const start = new Date(date);
    start.setDate(date.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
    onDateSelect?.(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateSelect?.(today);
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = typeof apt.startTime === 'string' ? new Date(apt.startTime) : apt.startTime;
      return isSameDay(aptDate, date);
    });
  };

  const getAppointmentPosition = (appointment: CalendarAppointment) => {
    const start = typeof appointment.startTime === 'string' 
      ? new Date(appointment.startTime) 
      : appointment.startTime;
    const end = appointment.endTime 
      ? (typeof appointment.endTime === 'string' ? new Date(appointment.endTime) : appointment.endTime)
      : new Date(start.getTime() + 30 * 60 * 1000); // Default 30 min

    const startMinutes = (start.getHours() - startHour) * 60 + start.getMinutes();
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);

    return {
      top: `${(startMinutes / 60) * 4}rem`,
      height: `${(duration / 60) * 4}rem`,
    };
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-t-lg animate-pulse" />
        <div className="p-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const weekDates = view === 'week' ? getWeekDates(currentDate) : [currentDate];

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {view === 'day'
            ? currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
            : `Week of ${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
        </h2>

        <div className="flex items-center gap-2">
          {onAddAppointment && (
            <Button size="sm" onClick={() => onAddAppointment(currentDate)}>
              Add Appointment
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-auto">
        <div className="min-w-[600px]">
          {/* Day Headers for Week View */}
          {view === 'week' && (
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <div className="w-16 flex-shrink-0" />
              {weekDates.map((date, i) => (
                <div
                  key={i}
                  className={`flex-1 p-2 text-center border-l border-gray-200 dark:border-gray-700 ${
                    isSameDay(date, new Date())
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }`}
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p
                    className={`text-lg font-semibold ${
                      isSameDay(date, new Date())
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {date.getDate()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Time Grid */}
          <div className="flex">
            {/* Time Labels */}
            <div className="w-16 flex-shrink-0">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-16 pr-2 text-right text-xs text-gray-500 dark:text-gray-400"
                >
                  {new Date(2000, 0, 1, hour).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    hour12: true,
                  })}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDates.map((date, dayIndex) => {
              const dayAppointments = getAppointmentsForDate(date);

              return (
                <div
                  key={dayIndex}
                  className={`flex-1 relative border-l border-gray-200 dark:border-gray-700 ${
                    view === 'week' && isSameDay(date, new Date())
                      ? 'bg-blue-50/50 dark:bg-blue-900/10'
                      : ''
                  }`}
                >
                  {/* Hour Lines */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      role={onAddAppointment ? 'button' : undefined}
                      tabIndex={onAddAppointment ? 0 : undefined}
                      className="h-16 border-b border-gray-100 dark:border-gray-800"
                      onClick={() => {
                        if (onAddAppointment) {
                          const clickDate = new Date(date);
                          clickDate.setHours(hour, 0, 0, 0);
                          onAddAppointment(clickDate, `${hour}:00`);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && onAddAppointment) {
                          const clickDate = new Date(date);
                          clickDate.setHours(hour, 0, 0, 0);
                          onAddAppointment(clickDate, `${hour}:00`);
                        }
                      }}
                    />
                  ))}

                  {/* Appointments */}
                  {dayAppointments.map((appointment) => {
                    const position = getAppointmentPosition(appointment);
                    return (
                      <div
                        key={appointment.id}
                        role="button"
                        tabIndex={0}
                        className={`absolute left-1 right-1 px-2 py-1 rounded text-white text-xs cursor-pointer overflow-hidden border-l-4 ${getStatusColor(appointment.status)}`}
                        style={{
                          top: position.top,
                          height: position.height,
                          minHeight: '1.5rem',
                        }}
                        onClick={() => onAppointmentClick?.(appointment)}
                        onKeyDown={(e) => e.key === 'Enter' && onAppointmentClick?.(appointment)}
                      >
                        <p className="font-medium truncate">
                          {appointment.patientName || appointment.title}
                        </p>
                        <p className="opacity-80 truncate">
                          {formatTime(appointment.startTime)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-4 border-t border-gray-200 dark:border-gray-700 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Confirmed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-gray-600 dark:text-gray-400">Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">Cancelled</span>
        </div>
      </div>
    </div>
  );
}

export default ScheduleCalendar;
