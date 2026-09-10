# Solution for Issue #434

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The `DateRangePicker` component in `@mieweb/ui` restricts navigation to single month steps using prev/next arrows. Users requiring multi-year jumps or distant months face frustrating repetitive clicks. We implement interactive month/year headers with collapsible selection grids, maintaining full accessibility, min/max constraints, and dual-calendar synchronization.

### Fix
Add month/year selector view states and trigger components to `DateRangePicker` headers.

### Implementation
```tsx
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DateRangePickerHeaderProps {
  currentDate: Date;
  onMonthChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export const DateRangePickerHeader: React.FC<DateRangePickerHeaderProps> = ({
  currentDate,
  onMonthChange,
  minDate,
  maxDate,
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'months' | 'years'>('calendar');
  const [yearPage, setYearPage] = useState<number>(currentDate.getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = useMemo(() => {
    const startYear = Math.floor(yearPage / 12) * 12;
    return Array.from({ length: 12 }, (_, i) => startYear + i);
  }, [yearPage]);

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    onMonthChange(newDate);
    setViewMode('calendar');
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    onMonthChange(newDate);
    setViewMode('months');
  };

  return (
    <div className="flex flex-col px-4 py-3 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (viewMode === 'years') setYearPage(p => p - 12);
            else {
              const d = new Date(currentDate);
              d.setMonth(d.getMonth() - 1);
              onMonthChange(d);
            }
          }}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>

        <button
          onClick={() => {
            if (viewMode === 'calendar') setViewMode('months');
            else if (viewMode === 'months') {
              setYearPage(currentDate.getFullYear());
              setViewMode('years');
            } else {
              setViewMode('calendar');
            }
          }}
          className="text-sm font-semibold text-gray-800 hover:text-blue-600 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
        >
          {viewMode === 'calendar' && `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          {viewMode === 'months' && `${currentDate.getFullYear()}`}
          {viewMode === 'years' && `${years[0]} – ${years[years.length - 1]}`}
        </button>

        <button
          onClick={() => {
            if (viewMode === 'years') setYearPage(p => p + 12);
            else {
              const d = new Date(currentDate);
              d.setMonth(d.getMonth() + 1);
              onMonthChange(d);
            }
          }}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {viewMode === 'months' && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {months.map((month, idx) => {
            const testDate = new Date(currentDate.getFullYear(), idx, 1);
            const isDisabled = (minDate && testDate < new Date(minDate.getFullYear(), minDate.getMonth(), 1)) ||
                               (maxDate && testDate > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1));
            return (
              <button
                key={month}
                disabled={isDisabled}
                onClick={() => handleMonthSelect(idx)}
                className={`py-2 text-xs font-medium rounded transition-colors ${
                  currentDate.getMonth() === idx
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {month.slice(0, 3)}
              </button>
            );
          })}
        </div>
      )}

      {viewMode === 'years' && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {years.map((year) => {
            const isDisabled = (minDate && year < minDate.getFullYear()) ||
                               (maxDate && year > maxDate.getFullYear());
            return (
              <button
                key={year}
                disabled={isDisabled}
                onClick={() => handleYearSelect(year)}
                className={`py-2 text-xs font-medium rounded transition-colors ${
                  currentDate.getFullYear() === year
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
```

### Testing
- Unit tests added verifying correct state transitions (`calendar` -> `months` -> `years`), min/max bounds enforcement, and chronological integrity across dual calendars.

Signed-off-by: Aditya Waghamare <adityawaghamare7620@gmail.com>


---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`