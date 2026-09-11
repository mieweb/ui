import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { DateRange, DateRangeFilter, DateRangePicker } from './DateRangePicker';

// ============================================================================
// DateRangePicker Stories
// ============================================================================

const meta: Meta<typeof DateRangePicker> = {
  id: 'date-time-daterangepicker',
  title: 'Inputs/Date & time/DateRangePicker',
  component: DateRangePicker,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

A **start/end date picker** for filtering and reporting. The trigger is a button showing the current range; clicking it opens a portaled two-month calendar with a preset sidebar. Value is \`DateRange = { start: Date | null; end: Date | null }\` through \`value\` / \`onChange(range, presetKey?)\`; \`activePreset\` highlights the chosen preset (you store it). \`presets\` replaces the list (\`getDefaultPresets(labels)\` = Today, This Week, This Month, Last Month, Last 24 Hours, Last 7 Days, Last 30 Days; \`getExtendedPresets(labels)\` adds Yesterday, Last Week, quarters, years, 90/365 days); \`calculateDateRange(key)\` resolves a key to concrete dates so you can recompute on demand. \`variant\` is \`'desktop'\` (two months + presets), \`'mobile'\` (bottom-sheet, single month, Done button) or \`'responsive'\` (switches at \`md\`); \`showPresets\`, \`align\` (\`'start'\` | \`'end'\` | \`'auto'\`) and \`placeholder\` tune it. The lighter **\`DateRangeFilter\`** is a \`Button\` + \`Dropdown\` of presets only — no calendar. Exports: \`DateRangePicker\`, \`DateRangeFilter\`, \`calculateDateRange\`, \`getDefaultPresets\`, \`getExtendedPresets\`, types \`DateRange\`, \`DateRangePreset\`, \`DateRangePresetKey\`.

### Use it when

- A list, report or dashboard is filtered by a **period** and users want both quick presets and a custom span.
- The result you need is two \`Date\`s (or a preset key you can recompute server-side).
- Toolbar space is tight and presets are enough — \`DateRangeFilter\`.

### Don't use it when

- The form needs **one** date, a time, or validation such as "must be in the past" — \`DateInput\`.
- The user must pick a bookable slot from an availability list — \`SchedulePicker\`.
- You need to *display* events across days — \`ScheduleCalendar\`.
- The range must be constrained (\`min\`/\`max\`, max span) or validated with an error message — not supported; wrap two \`DateInput\`s.

### Example

\`\`\`tsx
const [range, setRange] = useState<DateRange>(() => calculateDateRange('last-30-days'));
const [preset, setPreset] = useState<string | undefined>('last-30-days');

<DateRangePicker
  value={range}
  activePreset={preset}
  presets={getExtendedPresets()}
  variant="responsive"
  align="auto"
  onChange={(next, key) => {
    setRange(next);
    setPreset(key); // undefined when a custom span was clicked
  }}
/>

// send ISO to the API: range.start?.toISOString(), range.end?.toISOString()
\`\`\`

### Limitations

- Accessibility: trigger is \`<button aria-haspopup="dialog" aria-expanded>\`; the desktop popup is \`role="dialog" aria-label="Choose date range"\` (hard-coded English) with **no focus trap and no focus move into the panel**; the mobile sheet is \`role="dialog" aria-modal aria-labelledby\` with a focus trap (\`useFocusTrap\`) and body-scroll lock. Day cells are plain \`<button>\`s with **no \`aria-label\`, \`aria-pressed\`/\`aria-selected\` or grid role, and no arrow-key navigation** — the in-range/hover state is visual only. Escape closes and refocuses the trigger; click/tap outside closes. Nav buttons have \`aria-label="Previous month"\` / \`"Next month"\` (English).
- Not a form control: no \`name\`, \`label\`, \`error\` or \`required\`; no \`minDate\`/\`maxDate\`; any past or future day is selectable. Clicking start then a day before it swaps them.
- Dates are native local \`Date\`s (no Luxon, no time-zone prop): calendar presets span local midnight to \`23:59:59.999\`; "last-N" presets are rolling from \`new Date()\`; weeks run Sunday–Saturday. The result carries the browser's zone — convert before storing.
- i18n: preset names, \`filter\` and \`done\` are overridable via \`labels\`; the trigger formats the range with \`toLocaleDateString('en-US', …)\` ("Jan 5, 2026 - Feb 1, 2026") regardless of locale, and the subtitle "Select a start and end date from the calendar." is hard-coded. Month and weekday names in the grid *do* follow the browser locale (\`Intl.DateTimeFormat\`).
- Layout/RTL: trigger is fixed \`w-[300px] text-start\`; layout uses logical classes and the month-nav chevrons mirror (\`rtl:-scale-x-100\`). \`align="auto"\` flips using an estimated popup width (840px with presets, 640px without).
- Theming: \`border-input bg-background hover:bg-muted\`, popup \`bg-card border-border\`, active preset \`bg-primary-800 text-white\`, selected start \`bg-foreground text-background\`, \`DateRangeFilter\` active row \`bg-primary/10\`. Depends on \`lucide-react\`, \`Button\`, \`Dropdown\`, \`useAnchoredPosition\`, \`useClickOutside\`, \`useEscapeKey\`, \`useFocusTrap\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'date-time-dateinput',
          why: 'DateRangePicker captures a start/end pair or preset period as Dates; DateInput captures one date (or time/month/year) as a string with validation.',
        },
        {
          type: 'uses',
          target: 'choice-inputs-dropdown',
          why: 'DateRangeFilter is a Button trigger with a Dropdown of preset DropdownItems.',
        },
      ],
    },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the trigger button',
    },
    className: {
      control: 'text',
      description: 'Custom className',
    },
    value: {
      control: false,
      table: { disable: true },
      description: 'Current date range value',
    },
    activePreset: {
      control: false,
      table: { disable: true },
      description: 'Currently active preset key',
    },
    presets: {
      control: false,
      table: { disable: true },
      description: 'Custom presets (uses default if not provided)',
    },
    labels: {
      control: false,
      table: { disable: true },
      description: 'Labels for i18n',
    },
    onChange: { action: 'onChange' },
    showPresets: {
      control: 'boolean',
      description: 'Show the preset sidebar in the calendar popup',
    },
    variant: {
      control: 'select',
      options: ['desktop', 'mobile', 'responsive'],
      description:
        'Display variant: desktop (two-month popup), mobile (bottom sheet), or responsive (auto-adapts at md breakpoint)',
    },
  },
  args: {
    placeholder: 'Pick a date range',
  },
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

// ============================================================================
// Playground Story (for Controls)
// ============================================================================

interface PlaygroundProps {
  placeholder?: string;
  className?: string;
  showPresets?: boolean;
  variant?: 'desktop' | 'mobile' | 'responsive';
  onChange?: (range: DateRange, presetKey?: string) => void;
}

function PlaygroundDemo({
  placeholder,
  className,
  showPresets,
  variant,
  onChange,
}: PlaygroundProps) {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [preset, setPreset] = useState<string>();

  return (
    <div className="relative min-h-[500px]">
      <DateRangePicker
        value={range}
        onChange={(newRange, presetKey) => {
          setRange(newRange);
          setPreset(presetKey);
          onChange?.(newRange, presetKey);
        }}
        activePreset={preset}
        placeholder={placeholder}
        className={className}
        showPresets={showPresets}
        variant={variant}
      />
    </div>
  );
}

/**
 * Interactive playground with all controls available.
 * Click the button to open the two-month calendar and select a date range.
 */
export const Playground: Story = {
  render: (args) => <PlaygroundDemo {...args} />,
};

// ============================================================================
// Demo Stories
// ============================================================================

/**
 * Default date range picker. Click the button to open the calendar
 * and select a start and end date.
 */
export const Default: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });

    return (
      <div className="relative min-h-[500px]">
        <DateRangePicker
          value={range}
          onChange={(newRange) => setRange(newRange)}
        />
      </div>
    );
  },
};

/**
 * Date range picker with a preset already selected ("This Month").
 */
export const Preselected: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(),
    });
    const [preset, setPreset] = useState<string | undefined>('this-month');

    return (
      <div className="relative min-h-[500px]">
        <DateRangePicker
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Date range picker with "This Month" preset already selected.',
      },
    },
  },
};

/**
 * Date range picker with Spanish labels for internationalization.
 */
export const CustomLabels: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    const [preset, setPreset] = useState<string>();

    return (
      <div className="relative min-h-[500px]">
        <DateRangePicker
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
          placeholder="Seleccionar período"
          labels={{
            today: 'Hoy',
            thisWeek: 'Esta Semana',
            thisMonth: 'Este Mes',
            lastMonth: 'Mes Pasado',
            last7Days: 'Últimos 7 Días',
            last30Days: 'Últimos 30 Días',
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Date range picker with Spanish labels for internationalization.',
      },
    },
  },
};

/**
 * Mobile bottom-sheet variant with a single-month calendar and a Done button.
 * Ideal for touch devices.
 */
export const Mobile: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });

    return (
      <div
        className="relative min-h-[600px]"
        style={{ transform: 'translateZ(0)' }}
      >
        <DateRangePicker
          value={range}
          onChange={(newRange) => setRange(newRange)}
          variant="mobile"
          showPresets={false}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Mobile bottom-sheet variant with single-month calendar and Done button.',
      },
    },
  },
};

/**
 * Responsive variant that auto-adapts at the md breakpoint.
 * On small screens: hides presets, shows single calendar.
 * On larger screens: shows full two-month calendar with preset sidebar.
 */
export const Responsive: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    const [preset, setPreset] = useState<string>();

    return (
      <div className="relative min-h-[500px]">
        <DateRangePicker
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
          variant="responsive"
        />
        <p className="text-muted-foreground mt-4 text-sm">
          Resize the viewport to see the responsive behavior. Below md
          breakpoint: single calendar, no presets. Above md: full two-month
          layout with preset sidebar.
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Auto-adapts at md breakpoint. Small screens: single calendar, no presets. Large screens: full layout.',
      },
    },
  },
};

// ============================================================================
// DateRangeFilter Stories
// ============================================================================

export const FilterDropdown: StoryObj<typeof DateRangeFilter> = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    const [preset, setPreset] = useState<string>();

    return (
      <div className="space-y-4">
        <DateRangeFilter
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
        />
        {preset && (
          <p className="text-sm text-muted-foreground">
            Selected: {preset}
            {range.start &&
              ` (${range.start.toLocaleDateString()} - ${range.end?.toLocaleDateString()})`}
          </p>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Standalone filter dropdown for simpler date filtering.',
      },
    },
  },
};

export const FilterVariants: StoryObj<typeof DateRangeFilter> = {
  render: function Render() {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    const [preset, setPreset] = useState<string>();

    return (
      <div className="flex gap-4">
        <DateRangeFilter
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
          variant="primary"
        />
        <DateRangeFilter
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
          variant="outline"
        />
        <DateRangeFilter
          value={range}
          onChange={(newRange, presetKey) => {
            setRange(newRange);
            setPreset(presetKey);
          }}
          activePreset={preset}
          variant="ghost"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Filter dropdown in different button variants.',
      },
    },
  },
};
