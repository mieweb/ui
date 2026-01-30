import * as React from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Input } from '../Input';
import { Dropdown, DropdownItem } from '../Dropdown';
import { Filter, Printer, Download, Calendar, ChevronDown } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type DateRangePresetKey =
  | 'today'
  | 'this-week'
  | 'this-month'
  | 'last-month'
  | 'last-15-min'
  | 'last-30-min'
  | 'last-hour'
  | 'last-24-hours'
  | 'last-7-days'
  | 'last-30-days'
  | 'last-90-days'
  | 'year-to-date'
  | 'this-year'
  | 'last-year';

export interface DateRangePreset {
  key: DateRangePresetKey | string;
  label: string;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangePickerProps {
  /** Current date range value */
  value?: DateRange;
  /** Callback when date range changes */
  onChange: (range: DateRange, presetKey?: string) => void;
  /** Custom presets (uses default if not provided) */
  presets?: DateRangePreset[];
  /** Currently active preset key */
  activePreset?: string;
  /** Whether to show print button */
  showPrint?: boolean;
  /** Callback when print is clicked */
  onPrint?: () => void;
  /** Whether to show export button */
  showExport?: boolean;
  /** Callback when export is clicked */
  onExport?: () => void;
  /** Placeholder text for the date input */
  placeholder?: string;
  /** Date format for display */
  dateFormat?: string;
  /** Custom className */
  className?: string;
  /** Labels for i18n */
  labels?: {
    today?: string;
    thisWeek?: string;
    thisMonth?: string;
    lastMonth?: string;
    last15Min?: string;
    last30Min?: string;
    lastHour?: string;
    last24Hours?: string;
    last7Days?: string;
    last30Days?: string;
    last90Days?: string;
    yearToDate?: string;
    thisYear?: string;
    lastYear?: string;
    filter?: string;
    print?: string;
    export?: string;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getDefaultPresets(
  labels: DateRangePickerProps['labels'] = {}
): DateRangePreset[] {
  const {
    today = 'Today',
    thisWeek = 'This Week',
    thisMonth = 'This Month',
    lastMonth = 'Last Month',
    last15Min = 'Last 15 Minutes',
    last30Min = 'Last 30 Minutes',
    lastHour = 'Last Hour',
    last24Hours = 'Last 24 Hours',
    last7Days = 'Last 7 Days',
    last30Days = 'Last 30 Days',
    last90Days = 'Last 90 Days',
    yearToDate = 'Year to Date',
    thisYear = 'This Year',
    lastYear = 'Last Year',
  } = labels;

  return [
    { key: 'today', label: today },
    { key: 'this-week', label: thisWeek },
    { key: 'this-month', label: thisMonth },
    { key: 'last-month', label: lastMonth },
    { key: 'last-15-min', label: last15Min },
    { key: 'last-30-min', label: last30Min },
    { key: 'last-hour', label: lastHour },
    { key: 'last-24-hours', label: last24Hours },
    { key: 'last-7-days', label: last7Days },
    { key: 'last-30-days', label: last30Days },
    { key: 'last-90-days', label: last90Days },
    { key: 'year-to-date', label: yearToDate },
    { key: 'this-year', label: thisYear },
    { key: 'last-year', label: lastYear },
  ];
}

function calculateDateRange(presetKey: string): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (presetKey) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };

    case 'this-week': {
      const dayOfWeek = today.getDay();
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - dayOfWeek);
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);
      return { start: sunday, end: saturday };
    }

    case 'this-month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: firstDay, end: lastDay };
    }

    case 'last-month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: firstDay, end: lastDay };
    }

    case 'last-15-min':
      return {
        start: new Date(now.getTime() - 15 * 60 * 1000),
        end: now,
      };

    case 'last-30-min':
      return {
        start: new Date(now.getTime() - 30 * 60 * 1000),
        end: now,
      };

    case 'last-hour':
      return {
        start: new Date(now.getTime() - 60 * 60 * 1000),
        end: now,
      };

    case 'last-24-hours':
      return {
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        end: now,
      };

    case 'last-7-days':
      return {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now,
      };

    case 'last-30-days':
      return {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now,
      };

    case 'last-90-days':
      return {
        start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        end: now,
      };

    case 'year-to-date': {
      const firstOfYear = new Date(now.getFullYear(), 0, 1);
      return { start: firstOfYear, end: now };
    }

    case 'this-year': {
      const firstOfYear = new Date(now.getFullYear(), 0, 1);
      const lastOfYear = new Date(now.getFullYear(), 11, 31);
      return { start: firstOfYear, end: lastOfYear };
    }

    case 'last-year': {
      const firstOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
      const lastOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
      return { start: firstOfLastYear, end: lastOfLastYear };
    }

    default:
      return { start: null, end: null };
  }
}

function formatDateRange(range: DateRange, _format?: string): string {
  if (!range.start && !range.end) return '';
  const formatDate = (d: Date | null) => {
    if (!d) return '';
    return d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };
  if (range.start && range.end) {
    return `${formatDate(range.start)} - ${formatDate(range.end)}`;
  }
  return formatDate(range.start || range.end);
}

// ============================================================================
// DateRangePicker Component
// ============================================================================

/**
 * Date range picker with preset filters, print, and export buttons.
 * Commonly used for report filtering in dashboard views.
 *
 * @example
 * ```tsx
 * const [range, setRange] = useState<DateRange>({ start: null, end: null });
 * const [preset, setPreset] = useState<string>();
 *
 * <DateRangePicker
 *   value={range}
 *   onChange={(newRange, presetKey) => {
 *     setRange(newRange);
 *     setPreset(presetKey);
 *   }}
 *   activePreset={preset}
 *   showPrint
 *   showExport
 *   onPrint={() => window.print()}
 *   onExport={() => exportToCSV()}
 * />
 * ```
 */
export function DateRangePicker({
  value,
  onChange,
  presets,
  activePreset,
  showPrint = false,
  onPrint,
  showExport = false,
  onExport,
  placeholder = 'Select a time period',
  dateFormat,
  className,
  labels = {},
}: DateRangePickerProps) {
  const finalPresets = presets || getDefaultPresets(labels);

  const handlePresetSelect = (presetKey: string) => {
    const range = calculateDateRange(presetKey);
    onChange(range, presetKey);
  };

  const displayValue = value ? formatDateRange(value, dateFormat) : '';

  return (
    <div className={cn('flex items-center gap-0', className)}>
      {/* Filter Dropdown */}
      <Dropdown
        trigger={
          <Button
            variant="primary"
            size="md"
            className="rounded-r-none border-r-0"
            data-cy="btn-date-filter"
          >
            <Filter className="h-4 w-4" />
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        }
        className="max-h-[300px] overflow-auto"
      >
        <div className="grid grid-cols-2 gap-0">
          {finalPresets.map((preset) => (
            <DropdownItem
              key={preset.key}
              onClick={() => handlePresetSelect(preset.key)}
              className={cn(
                activePreset === preset.key &&
                  'bg-primary text-primary-foreground'
              )}
              data-cy="datepicker-filter-range"
            >
              {preset.label}
            </DropdownItem>
          ))}
        </div>
      </Dropdown>

      {/* Date Input */}
      <div className="relative min-w-[200px] flex-1">
        <Calendar className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          value={displayValue}
          placeholder={placeholder}
          readOnly
          className="rounded-none pl-10"
        />
      </div>

      {/* Print Button */}
      {showPrint && (
        <Button
          variant="primary"
          size="md"
          onClick={onPrint}
          className="rounded-none border-l-0"
          title={labels.print || 'Print Report'}
        >
          <Printer className="h-4 w-4" />
        </Button>
      )}

      {/* Export Button */}
      {showExport && (
        <Button
          variant="primary"
          size="md"
          onClick={onExport}
          className={cn(
            'border-l-0',
            showPrint ? 'rounded-l-none' : 'rounded-none'
          )}
          title={labels.export || 'Export Report'}
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Standalone DateRangeFilter Component (Simpler version)
// ============================================================================

export interface DateRangeFilterProps {
  /** Current date range value */
  value?: DateRange;
  /** Callback when date range changes */
  onChange: (range: DateRange, presetKey?: string) => void;
  /** Custom presets */
  presets?: DateRangePreset[];
  /** Currently active preset */
  activePreset?: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Custom className */
  className?: string;
  /** Labels for i18n */
  labels?: DateRangePickerProps['labels'];
}

/**
 * Standalone date range filter dropdown button.
 *
 * @example
 * ```tsx
 * <DateRangeFilter
 *   value={range}
 *   onChange={setRange}
 *   activePreset={preset}
 * />
 * ```
 */
export function DateRangeFilter({
  value: _value,
  onChange,
  presets,
  activePreset,
  variant = 'outline',
  className,
  labels = {},
}: DateRangeFilterProps) {
  const finalPresets = presets || getDefaultPresets(labels);
  const activeLabel = finalPresets.find((p) => p.key === activePreset)?.label;

  const handlePresetSelect = (presetKey: string) => {
    const range = calculateDateRange(presetKey);
    onChange(range, presetKey);
  };

  return (
    <Dropdown
      trigger={
        <Button variant={variant} size="md" className={className}>
          <Calendar className="mr-2 h-4 w-4" />
          {activeLabel || labels.filter || 'Filter by Date'}
          <ChevronDown className="ml-2 h-3 w-3" />
        </Button>
      }
      className="w-56"
    >
      {finalPresets.map((preset) => (
        <DropdownItem
          key={preset.key}
          onClick={() => handlePresetSelect(preset.key)}
          className={cn(
            activePreset === preset.key && 'bg-primary/10 text-primary'
          )}
        >
          {preset.label}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}

export default DateRangePicker;
